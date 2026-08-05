import {
  type CandidateAnalysisV1,
  type CandidateSafetySignalCodeV1,
  type CandidateSafetySignalsV1,
} from "./contracts/split-stage-contracts-v1.ts";
import { groundCandidateAnalysisV1 } from "./candidate-analysis-grounding-v1.ts";
import { validateCandidateSourceIntegrityV1 } from "./candidate-source-integrity-v1.ts";
import { M2RuntimeError } from "./errors.ts";
import type { JsonObject } from "./types.ts";

export const CANDIDATE_ANALYSIS_GROUNDING_V2_VERSION =
  "m2-p4-candidate-analysis-grounding-v2" as const;

export type CandidateAnalysisGroundingResultV2 = Readonly<{
  candidate_analysis: CandidateAnalysisV1;
  candidate_safety_result: CandidateSafetySignalsV1;
}>;

const sentinelRequirements = new Set(["none", "unknown"]);

function invalid(): never {
  throw new M2RuntimeError("M2_CANDIDATE_SOURCE_INTEGRITY_FAILED");
}

function normalizePracticalRequirements(
  values: readonly CandidateAnalysisV1["candidate_communicative_intent"]["practical_requirement"][number][],
) {
  const concrete = values.filter((value) => !sentinelRequirements.has(value));
  if (concrete.length > 0) return [...concrete];
  const sentinel = values.find((value) => sentinelRequirements.has(value));
  return [sentinel ?? "unknown"];
}

function normalizedSafetySignals(
  existingSignals: readonly CandidateSafetySignalCodeV1[],
  practicalRequirements: readonly string[],
  invitationPresence: boolean,
): CandidateSafetySignalCodeV1[] {
  const signals = [...existingSignals];
  const ensure = (signal: CandidateSafetySignalCodeV1) => {
    if (!signals.includes(signal)) signals.push(signal);
  };
  if (
    practicalRequirements.includes("confirm_schedule") ||
    practicalRequirements.includes("answer_question")
  ) {
    ensure("asks_for_reply");
  }
  if (
    practicalRequirements.includes("confirm_schedule") ||
    invitationPresence
  ) {
    ensure("proposes_meeting");
  }
  return signals;
}

function validateNormalizedResult(result: CandidateAnalysisGroundingResultV2) {
  const requirements =
    result.candidate_analysis.candidate_communicative_intent
      .practical_requirement;
  const concrete = requirements.filter(
    (value) => !sentinelRequirements.has(value),
  );
  if (
    (concrete.length > 0 &&
      requirements.some((value) => sentinelRequirements.has(value))) ||
    (concrete.length === 0 &&
      (requirements.length !== 1 ||
        !sentinelRequirements.has(requirements[0] ?? ""))) ||
    new Set(requirements).size !== requirements.length ||
    new Set(result.candidate_safety_result.signal_codes).size !==
      result.candidate_safety_result.signal_codes.length
  ) {
    invalid();
  }
}

export function groundCandidateAnalysisV2(
  rawCandidateProviderOutput: JsonObject,
): CandidateAnalysisGroundingResultV2 {
  const groundedV1 = groundCandidateAnalysisV1(rawCandidateProviderOutput);
  const groundedClone = structuredClone(groundedV1);
  const intent =
    groundedClone.candidate_analysis.candidate_communicative_intent;
  const practicalRequirements = normalizePracticalRequirements(
    intent.practical_requirement,
  );
  const grounded: CandidateAnalysisGroundingResultV2 = {
    ...groundedClone,
    candidate_analysis: {
      ...groundedClone.candidate_analysis,
      candidate_communicative_intent: {
        ...intent,
        practical_requirement: practicalRequirements,
      },
    },
    candidate_safety_result: {
      ...groundedClone.candidate_safety_result,
      signal_codes: normalizedSafetySignals(
        groundedClone.candidate_safety_result.signal_codes,
        practicalRequirements,
        intent.invitation_presence,
      ),
    },
  };
  validateNormalizedResult(grounded);
  validateCandidateSourceIntegrityV1({
    candidateAnalysis: grounded.candidate_analysis,
    candidateSafetyResult: grounded.candidate_safety_result,
  });
  return grounded;
}
