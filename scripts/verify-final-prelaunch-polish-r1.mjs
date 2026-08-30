import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  CANDIDATE_MESSAGE_REQUIRED_ERROR,
  MESSAGE_IMPACT_TOPIC_LABEL,
  candidateMessageRequired,
  validateCandidateMessage,
} from "../components/request/request-form-candidate-message.ts";
import { evaluatePrepaymentSafetyV1 } from "../lib/purchase/prepayment-safety-gate-v1.ts";

process.removeAllListeners("warning");
process.on("warning", () => {});

function source(relativePath) {
  return readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");
}

const requestForm = source("components/request/RequestForm.tsx");
const continuation = source(
  "components/request/AuthenticatedPreparationContinuation.tsx",
);
const safetyStop = source("components/request/PrePaymentSafetyStop.tsx");
const candidateMessage = source(
  "components/request/request-form-candidate-message.ts",
);
const styles = source("app/globals.css");
const stopCopy = JSON.parse(
  source(
    "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p6-p0/stop-copy-v1.json",
  ),
);

assert.equal(candidateMessageRequired([MESSAGE_IMPACT_TOPIC_LABEL]), true);
assert.equal(candidateMessageRequired(["送るか待つか決めたい"]), false);
assert.equal(
  validateCandidateMessage([MESSAGE_IMPACT_TOPIC_LABEL], ""),
  CANDIDATE_MESSAGE_REQUIRED_ERROR,
);
assert.equal(
  validateCandidateMessage([MESSAGE_IMPACT_TOPIC_LABEL], "   \n "),
  CANDIDATE_MESSAGE_REQUIRED_ERROR,
);
assert.equal(
  validateCandidateMessage(
    [MESSAGE_IMPACT_TOPIC_LABEL],
    "今日はありがとう。また話せたらうれしいです。",
  ),
  null,
);
assert.equal(validateCandidateMessage(["不安を整理したい"], ""), null);

assert.match(requestForm, /errors\.draftMessage\s*=\s*candidateMessageError/u);
assert.match(
  requestForm,
  /if \(candidateMessageRequired\(nextTopics\)\) setMessageDetailsOpen\(true\)/u,
);
assert.match(requestForm, /required=\{isCandidateMessageRequired\}/u);
assert.match(requestForm, /aria-required=\{isCandidateMessageRequired\}/u);
assert.match(requestForm, /aria-invalid=\{Boolean\(errors\.draftMessage\)\}/u);
assert.match(requestForm, /id="draftMessage-error"/u);
assert.match(
  candidateMessage,
  /確認したい、送ろうとしている文面を入力してください。/u,
);
const continueFromSheet = requestForm.slice(
  requestForm.indexOf("function continueFromSheet"),
  requestForm.indexOf("async function classifyCurrentInput"),
);
assert.ok(
  continueFromSheet.indexOf("validateSheet(form)") <
    continueFromSheet.indexOf("moveToPhase(2)"),
  "phase transition must remain behind local candidate-message validation",
);
const classifyCurrentInput = requestForm.slice(
  requestForm.indexOf("async function classifyCurrentInput"),
  requestForm.indexOf("function clarificationAnswerMissing"),
);
assert.ok(
  classifyCurrentInput.indexOf("validateSheet(form)") <
    classifyCurrentInput.indexOf("requestServerEvaluation"),
  "prepare eligibility request must remain behind local validation",
);

const case24 = evaluatePrepaymentSafetyV1({
  schemaVersion: "prepayment-safety-input-v1",
  adultConfirmed: true,
  currentSituation:
    "彼氏が今家の前にいて、出てこないならただじゃ済まないと言っています。",
  latestInboundMessage: null,
  optionalMessage: null,
  relationship: "in_relationship",
  requestedTopics: ["organize_emotions"],
  contactBoundaryState: "urgent_safety",
  requestedAssistanceGoal: "urgent_safety_help",
  clarificationAnswers: {
    submissionCount: 0,
    clarifiedContactBoundaryState: null,
    practicalPermissionExplicit: null,
    currentRequestPracticalScopeOnly: null,
    replyExplicitlyInvited: null,
    replyLimitedToExactSubject: null,
    professionalScopeLimitedToNonprofessionalOrganization: null,
    unsafeExecutionIntent: null,
    currentSafetyStatus: null,
  },
  scopeAcknowledgements: {
    pauseAssessmentDisclosureAcknowledged: false,
    boundarySupportOnlyDisclosureAcknowledged: false,
    scopedReplyScopeAcknowledged: false,
    businessOnlyScopeAcknowledged: false,
  },
  attestationConfirmed: false,
  safetyPolicyVersion: "prepayment-safety-policy-v1",
});
assert.equal(case24.classification, "urgent_safety_redirect");
assert.equal(case24.purchaseGateSatisfied, false);
assert.match(
  safetyStop,
  /このサービスの回答を待たず、\\n地域の警察・救急などへ直ちに連絡してください。/u,
);
assert.match(safetyStop, /この画面では決済は発生しません。/u);
assert.match(
  stopCopy.messages.urgent_safety_redirect.body,
  /地域の警察・救急などへ直ちに連絡してください。/u,
);
assert.equal(
  stopCopy.messages.urgent_safety_redirect.payment_session_created,
  false,
);
assert.equal(stopCopy.messages.urgent_safety_redirect.provider_called, false);

assert.match(continuation, /className="authenticated-clarification__choices"/u);
assert.match(continuation, /className="authenticated-clarification__choice"/u);
assert.match(continuation, /type="radio"/u);
assert.match(continuation, /data-selected=/u);
assert.match(
  continuation,
  /className="button button--primary authenticated-clarification__submit"/u,
);
assert.ok(
  continuation.indexOf('className="authenticated-clarification__choices"') <
    continuation.indexOf("authenticated-clarification__submit"),
  "answer choices must precede the primary CTA",
);
assert.match(
  styles,
  /\.authenticated-clarification__choices\s*\{[^}]*grid-template-columns:\s*1fr;/su,
);
assert.match(
  styles,
  /\.authenticated-clarification__choice\s*\{[^}]*min-height:\s*4\.25rem;/su,
);
assert.match(
  styles,
  /\.authenticated-clarification__choice:has\(input:focus-visible\)/u,
);
assert.match(
  styles,
  /\.authenticated-clarification__choice\[data-selected="true"\]/u,
);
assert.match(
  styles,
  /\.authenticated-clarification__submit\s*\{[^}]*width:\s*100%;/su,
);
assert.match(
  styles,
  /@media \(max-width:\s*520px\)[^{]*\{[^}]*\.request-local-complete \.authenticated-clarification__question/su,
);
assert.match(
  continuation,
  /next\.status === "authentication_required"[\s\S]*next\.status === "needs_one_clarifying_answer"/u,
);
assert.equal(
  (continuation.match(/fetch\("\/api\/consultations\/clarifications"/gu) ?? [])
    .length,
  1,
);

console.log("FINAL PRE-LAUNCH POLISH R1: PASS");
