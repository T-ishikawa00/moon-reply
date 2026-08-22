import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  buildPublicClarificationAnswerV1,
  classifyClarificationContinuationV1,
  PUBLIC_CLARIFICATION_CONTROLS_V1,
  PUBLIC_CLARIFICATION_TARGETS_V1,
} from "../lib/assessment/production/public-clarification-contract-v1.ts";
import {
  CLARIFICATION_TARGETS_V1,
  validateClarificationAnswerV1,
  validateOpaqueClarificationIdV1,
} from "../lib/assessment/runtime/clarification-evidence-v1.ts";
import { M2RuntimeError } from "../lib/assessment/runtime/errors.ts";

const resumeStartedAt = "2026-08-22T12:00:00.000Z";
let passed = 0;

function check(name, callback) {
  callback();
  passed += 1;
  console.log(`PASS ${String(passed).padStart(2, "0")} ${name}`);
}

function safeCode(error) {
  return error instanceof M2RuntimeError ? error.safeCode : null;
}

function validate(target, answer) {
  return validateClarificationAnswerV1({
    target,
    answer,
    resumeStartedAt,
  });
}

check("representative coarse timing answer crosses the public/backend boundary", () => {
  assert.deepEqual(
    PUBLIC_CLARIFICATION_CONTROLS_V1.latest_contact_timing.choices.find(
      (choice) => choice.value === "six_to_24_hours",
    ),
    { value: "six_to_24_hours", label: "6〜24時間" },
  );
  const answer = buildPublicClarificationAnswerV1("latest_contact_timing", {
    value: "six_to_24_hours",
    detail: "",
  });
  assert.deepEqual(answer, {
    kind: "elapsed_bucket",
    value: "six_to_24_hours",
  });
  const validated = validate("latest_contact_timing", answer);
  assert.equal(validated.resolvesTarget, true);
  assert.equal(
    validated.groundedNormalizedRepresentation.elapsedMinutesLowerBound,
    360,
  );
});

check("empty public and direct API answers remain rejected", () => {
  assert.equal(
    buildPublicClarificationAnswerV1("latest_contact_timing", {
      value: "",
      detail: "",
    }),
    null,
  );
  assert.throws(
    () => validate("latest_contact_timing", ""),
    (error) => safeCode(error) === "M2_CLARIFICATION_ANSWER_INVALID",
  );
});

check("malformed or tampered answer shapes fail closed server-side", () => {
  for (const answer of [
    "six_to_24_hours",
    { kind: "elapsed_bucket", value: "yesterday_evening" },
    { kind: "elapsed_bucket", value: "six_to_24_hours", injected: true },
    { kind: "unknown", value: "six_to_24_hours" },
  ]) {
    assert.throws(
      () => validate("latest_contact_timing", answer),
      (error) => safeCode(error) === "M2_CLARIFICATION_ANSWER_INVALID",
    );
  }
});

check("every public target and every rendered choice builds a backend-accepted answer", () => {
  assert.deepEqual(PUBLIC_CLARIFICATION_TARGETS_V1, CLARIFICATION_TARGETS_V1);
  assert.deepEqual(
    Object.keys(PUBLIC_CLARIFICATION_CONTROLS_V1),
    CLARIFICATION_TARGETS_V1,
  );
  for (const target of CLARIFICATION_TARGETS_V1) {
    const control = PUBLIC_CLARIFICATION_CONTROLS_V1[target];
    assert.ok(control.choices.length > 0, target);
    for (const choice of control.choices) {
      const detail = control.detail?.requiredFor.includes(choice.value)
        ? "回答に必要な短い補足"
        : "";
      const answer = buildPublicClarificationAnswerV1(target, {
        value: choice.value,
        detail,
      });
      assert.notEqual(answer, null, `${target}:${choice.value}`);
      assert.doesNotThrow(() => validate(target, answer));
    }
  }
  assert.equal(
    buildPublicClarificationAnswerV1("requested_message_tone", {
      value: "custom",
      detail: "",
    }),
    null,
  );
  assert.equal(
    buildPublicClarificationAnswerV1("central_fear_or_decision_concern", {
      value: "concern",
      detail: "",
    }),
    null,
  );
});

check("capability, fingerprint, replay, and conflict protections remain in the application boundary", () => {
  const capability = Buffer.alloc(32, 7).toString("base64url");
  assert.equal(validateOpaqueClarificationIdV1(capability), capability);
  assert.throws(
    () => validateOpaqueClarificationIdV1("short"),
    (error) => safeCode(error) === "M2_CLARIFICATION_CAPABILITY_INVALID",
  );
  const first = validate("latest_contact_timing", {
    kind: "elapsed_bucket",
    value: "six_to_24_hours",
  });
  const duplicate = validate("latest_contact_timing", {
    value: "six_to_24_hours",
    kind: "elapsed_bucket",
  });
  const conflict = validate("latest_contact_timing", {
    kind: "elapsed_bucket",
    value: "more_than_three_days",
  });
  assert.equal(first.answerFingerprint, duplicate.answerFingerprint);
  assert.notEqual(first.answerFingerprint, conflict.answerFingerprint);

  const application = readFileSync(
    new URL("../lib/assessment/production/application.ts", import.meta.url),
    "utf8",
  );
  assert.match(
    application,
    /getPreparationByClarificationCapability\(\s*capabilityHash/u,
  );
  assert.match(application, /preparation\.clarificationAnswerFingerprint/u);
  assert.match(application, /PRODUCTION_CLARIFICATION_CONFLICT/u);
  assert.match(application, /acceptClarificationAndCreateResumeRun/u);
  assert.match(application, /buildClarificationEvidenceV1/u);
});

check("server-owned target reaches Production UI without client target selection", () => {
  const application = readFileSync(
    new URL("../lib/assessment/production/application.ts", import.meta.url),
    "utf8",
  );
  const requestForm = readFileSync(
    new URL("../components/request/RequestForm.tsx", import.meta.url),
    "utf8",
  );
  const route = readFileSync(
    new URL(
      "../app/api/consultations/clarifications/route.ts",
      import.meta.url,
    ),
    "utf8",
  );
  assert.match(application, /target: result\.clarification\.target/u);
  assert.match(application, /target: persisted\.target/u);
  assert.match(requestForm, /isPublicClarificationTargetV1\(data\.target\)/u);
  assert.match(requestForm, /buildPublicClarificationAnswerV1/u);
  assert.doesNotMatch(requestForm, /answer: answer\.trim\(\)/u);
  assert.match(
    route,
    /answerProductionClarification\(\s*body\.clarificationCapability,\s*body\.answer/u,
  );
});

check("technical failures are not classified as Product rejection", () => {
  assert.equal(
    classifyClarificationContinuationV1("purchase_ready"),
    "purchase_ready",
  );
  assert.equal(
    classifyClarificationContinuationV1("not_full_product_candidate"),
    "not_full_product_candidate",
  );
  assert.equal(
    classifyClarificationContinuationV1("safety_blocked"),
    "safety_blocked",
  );
  for (const status of [
    undefined,
    "needs_one_clarifying_answer",
    "M2_CLARIFICATION_ANSWER_INVALID",
    400,
    503,
  ]) {
    assert.equal(
      classifyClarificationContinuationV1(status),
      "technical_failure",
    );
  }
  const requestForm = readFileSync(
    new URL("../components/request/RequestForm.tsx", import.meta.url),
    "utf8",
  );
  const clarificationSubmission = requestForm.slice(
    requestForm.indexOf("async function submitProductClarification"),
    requestForm.indexOf("async function submitEmailVerificationCode"),
  );
  assert.match(
    clarificationSubmission,
    /if \(!response\.ok\) throw new Error\("PRODUCT_CLARIFICATION_FAILED"\)/u,
  );
  assert.match(
    clarificationSubmission,
    /catch \{\s*setProductionFlow\(\{\s*status: "error",\s*reason: "technical_failure",\s*message: productionFlowMessage\("unavailable"\)/u,
  );
  assert.match(
    clarificationSubmission,
    /reason: disposition,\s*message: productionFlowMessage\("notEligible"\)/u,
  );
});

console.log(`M1-4 CLARIFICATION CONTRACT PASS ${passed}/${passed}`);
console.log("PROVIDER_CALLS=0 EXTERNAL_OPERATIONS=0 MIGRATIONS=0");
