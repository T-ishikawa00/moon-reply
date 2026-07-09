import { CONTRADICTORY_SELECTION_MESSAGE, SAFETY_MESSAGES } from "./messages";
import {
  FREE_TEXT_RISK_RULES,
  NONE_SAFETY_FLAG,
  SELECTED_FLAG_RULES,
} from "./rules";
import type {
  SafetyInput,
  SafetyReasonCode,
  SafetyResult,
  SafetySelectedFlag,
  SafetySeverity,
} from "./types";

const FREE_TEXT_FIELDS: Array<keyof Omit<SafetyInput, "selectedFlags">> = [
  "draftMessage",
  "recentFlow",
  "mainConcern",
  "desiredAction",
  "mainQuestion",
];

function uniqueReasonCodes(reasonCodes: SafetyReasonCode[]) {
  return Array.from(new Set(reasonCodes));
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s+/g, "");
}

function isKnownSafetyFlag(flag: string): flag is SafetySelectedFlag {
  return flag in SELECTED_FLAG_RULES;
}

function scanFreeText(input: SafetyInput) {
  const normalizedText = normalizeText(
    FREE_TEXT_FIELDS.map((field) => input[field] ?? "").join("\n"),
  );

  if (!normalizedText) {
    return {
      hasRejectRisk: false,
      hasReviewRisk: false,
      reasonCodes: [] as SafetyReasonCode[],
    };
  }

  const reasonCodes: SafetyReasonCode[] = [];
  let hasRejectRisk = false;
  let hasReviewRisk = false;

  for (const rule of FREE_TEXT_RISK_RULES) {
    const hasKeyword = rule.keywords.some((keyword) =>
      normalizedText.includes(normalizeText(keyword)),
    );

    if (!hasKeyword) {
      continue;
    }

    reasonCodes.push("free_text_high_risk", rule.reasonCode);
    if (rule.classification === "rejected") {
      hasRejectRisk = true;
    } else {
      hasReviewRisk = true;
    }
  }

  return {
    hasRejectRisk,
    hasReviewRisk,
    reasonCodes: uniqueReasonCodes(reasonCodes),
  };
}

function buildResult(
  severity: SafetySeverity,
  reasonCodes: SafetyReasonCode[],
  message = SAFETY_MESSAGES[
    severity === "reject"
      ? "rejected"
      : severity === "review"
        ? "needs_review"
        : "normal_allowed"
  ],
): SafetyResult {
  const classification =
    severity === "reject"
      ? "rejected"
      : severity === "review"
        ? "needs_review"
        : "normal_allowed";

  return {
    classification,
    severity,
    reasonCodes: uniqueReasonCodes(reasonCodes),
    shouldBlockNormalConfirmation: severity === "reject",
    userTitle: message.userTitle,
    userMessage: message.userMessage,
  };
}

export function classifySafetyInput(input: SafetyInput): SafetyResult {
  const selectedFlags = input.selectedFlags.filter(isKnownSafetyFlag);
  const selectedRules = selectedFlags.map((flag) => SELECTED_FLAG_RULES[flag]);
  const hasNoneSelected = selectedFlags.includes(NONE_SAFETY_FLAG);
  const selectedDangerReasonCodes = selectedRules
    .filter((rule) => rule.severity !== "normal")
    .map((rule) => rule.reasonCode);
  const hasContradictorySelection =
    hasNoneSelected && selectedDangerReasonCodes.length > 0;
  const freeTextScan = scanFreeText(input);

  if (hasContradictorySelection) {
    return buildResult(
      "reject",
      [
        "contradictory_selection",
        ...selectedDangerReasonCodes,
        ...freeTextScan.reasonCodes,
      ],
      CONTRADICTORY_SELECTION_MESSAGE,
    );
  }

  const selectedRejectReasonCodes = selectedRules
    .filter((rule) => rule.severity === "reject")
    .map((rule) => rule.reasonCode);
  if (selectedRejectReasonCodes.length > 0 || freeTextScan.hasRejectRisk) {
    return buildResult("reject", [
      ...selectedRejectReasonCodes,
      ...freeTextScan.reasonCodes,
    ]);
  }

  const selectedReviewReasonCodes = selectedRules
    .filter((rule) => rule.severity === "review")
    .map((rule) => rule.reasonCode);
  if (selectedReviewReasonCodes.length > 0 || freeTextScan.hasReviewRisk) {
    return buildResult("review", [
      ...selectedReviewReasonCodes,
      ...freeTextScan.reasonCodes,
    ]);
  }

  if (hasNoneSelected) {
    return buildResult("normal", ["normal"]);
  }

  return buildResult("review", ["none_selected"]);
}
