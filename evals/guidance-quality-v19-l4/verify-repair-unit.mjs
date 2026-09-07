import assert from "node:assert/strict";
import {
  REPORT_FACT_REPAIR_CHECKS_V1,
  ReportFactRepairRequiredSignalV1,
  applyReportFactRepairPatchV1,
  assertReportFactRepairVerifiedV1,
  buildReportFactRepairContextV1,
  buildReportFactRepairInputV1,
  hasMaterialReportFactFindingV1,
  isReportFactRepairRequiredSignalV1,
} from "../../lib/assessment/runtime/report-fact-repair-v1.ts";
import { hashJson } from "../../lib/assessment/runtime/hash.ts";

// Pure hand-authored fixtures. No Provider output, no old evidence mutation,
// no real semantic verdict, and no network entrypoint is exercised here.
globalThis.fetch = () => { throw new Error("NETWORK_FORBIDDEN"); };
let passed = 0;
function check(name, test) {
  try { test(); passed += 1; }
  catch (error) { throw new Error(`FAIL ${name}`, { cause: error }); }
}
const clone = structuredClone;
const plan = {
  schema_version: "pipeline-schema-v2.0.0", selected_decision: "wait",
  decision_reason: { supporting_fact_ids: ["F001", "F002"] },
  actions_to_take: [{ action: "自分の予定を進める。", supporting_fact_ids: ["F002"] }],
  actions_to_avoid: [{ action: "返答を求めて重ねて送らない。", supporting_fact_ids: ["F002"] }],
  aftercare_plan: [], change_conditions: [], recommended_message_draft: null,
};
const base = {
  observed_facts: [
    { fact_id: "F001", statement: "週末の予定を尋ねる質問を送った。", source_refs: ["input:current_situation"], support: "explicit" },
    { fact_id: "F002", statement: "返事はまだない。", source_refs: ["input:current_situation"], support: "explicit" },
  ],
  material_unknowns: [{ unknown_code: "MESSAGE_READ_STATUS", summary: "既読は不明。" }],
};
const raw = {
  schema_version: "pipeline-schema-v2.0.0", cover_line: "いま決めなくてもよいこと",
  short_letter: ["気になる気持ちを抱えながら、待っているのですね。\nその気遣いは残せます。🌙", "質問は一度送っており、今は自分の予定を進めてよい時です。"],
  decision_reason_summary: "質問を送って返答を待っているため、今は重ねて送らず過ごせます。",
  relationship_summary: null,
  observed_fact_commentary: [{ fact_id: "F001", commentary: "質問は一度届いており、同じ問いを繰り返す理由はまだありません。" }],
  possible_interpretations: ["未返信の理由は分かりません。"], anxiety_reframe: ["今日の生活まで止めなくてもよいでしょう。"],
  message_temperature: null, action_rationales: ["自分の予定に戻ることで、いま実際にできることが決まります。"],
  message_draft_context: null, aftercare_commentary: ["返信が来たら、その内容に応じて返せます。"],
  change_condition_commentary: [], closing_lines: ["相手の気持ちを、今日すべて答えにしなくても大丈夫です。"],
};
// These two fields are Application-owned; each has its own frozen preimage.
const grounded = { ...clone(raw), relationship_summary: "質問を送信し、返信を待っている状況です。", change_condition_commentary: ["返信が来た場合は、その時点で状況を見直します。"] };
function finding(overrides = {}) {
  return {
    finding_code: "FACT_FIDELITY", severity: "major",
    json_path: "report_content.observed_fact_commentary[0].commentary", evidence_refs: ["F001"],
    detail: "F001は質問を送った事実だけを示します。到達が確認されたという説明は入力より強くなっています。",
    ...overrides,
  };
}
function item(overrides = {}, disposition = "blocking") { return { finding: finding(overrides), disposition }; }
function input(overrides = {}) {
  return { decisionPlan: clone(plan), reportContent: clone(raw), groundedReportContent: clone(grounded),
    baseStructuredIntake: clone(base), findingDispositions: [item()], localDefects: [], ...overrides };
}
function context(overrides = {}) {
  const result = buildReportFactRepairContextV1(input(overrides));
  assert.ok(result);
  return result;
}
function letterOverrides(path = "report_content.short_letter[1]") {
  const reportContent = clone(raw);
  reportContent.short_letter[1] = "質問は一度届いており、今は自分の予定を進めてよい時です。";
  reportContent.observed_fact_commentary[0].commentary = "質問は一度送っており、同じ問いを繰り返す理由はまだありません。";
  const groundedReportContent = { ...clone(reportContent), relationship_summary: grounded.relationship_summary,
    change_condition_commentary: clone(grounded.change_condition_commentary) };
  return { reportContent, groundedReportContent, findingDispositions: [item({ json_path: path })] };
}
function patch(bound, overrides = {}) {
  return { schema_version: "report-fact-repair-v1", source_report_hash: bound.sourceReportHash,
    target_path: bound.targetPath, original_text: bound.originalText,
    replacement_text: "質問は一度送っており、同じ問いを繰り返す理由はまだありません。", ...overrides };
}
function apply(bound, proposal = patch(bound), overrides = {}) {
  return applyReportFactRepairPatchV1({ context: bound, patch: proposal, decisionPlan: clone(plan), baseStructuredIntake: clone(base), ...overrides });
}
function verificationInput(bound = context()) {
  const repairedReport = apply(bound);
  const groundedRepairedReport = { ...clone(repairedReport), relationship_summary: grounded.relationship_summary,
    change_condition_commentary: clone(grounded.change_condition_commentary) };
  const repairInput = buildReportFactRepairInputV1(bound, groundedRepairedReport);
  return { context: bound, repairedReport, groundedRepairedReport, decisionPlan: clone(plan), baseStructuredIntake: clone(base),
    validationOutput: { schema_version: "validation-result-v19-l4-v1", semantic_checks: [], report_fact_repair_verification: {
      report_hash: repairInput.report_hash, target_path: bound.targetPath, verified_text: repairInput.verified_text,
      evidence_fact_ids: [...bound.evidenceFactIds], checks: Object.fromEntries(REPORT_FACT_REPAIR_CHECKS_V1.map((key) => [key, "pass"])),
    } }, findingDispositions: [], localDefects: [] };
}
function rejects(test, code = "M2_REPORT_FACT_REPAIR_VERIFICATION_FAILED") {
  assert.throws(test, (error) => error.safeCode === code);
}

check("one Report fact leaf is eligible and immutable", () => {
  const bound = context();
  assert.equal(bound.targetPath, "report_content.observed_fact_commentary[0].commentary");
  assert.ok(Object.isFrozen(bound));
  assert.ok(Object.isFrozen(bound.sourceReportContent.short_letter));
  assert.ok(Object.isFrozen(bound.sourceDecisionPlan.actions_to_take[0]));
  assert.ok(Object.isFrozen(bound.sourceBaseStructuredIntake.observed_facts[0]));
  assert.deepEqual(bound.evidenceFactIds, ["F001"]);
});
check("dollar-prefix path normalizes only the path", () => {
  assert.equal(context(letterOverrides("$.report_content.short_letter[1]")).targetPath, "report_content.short_letter[1]");
});
check("known fact refs bind and sort without inventing IDs", () => {
  assert.deepEqual(context({ findingDispositions: [item({ evidence_refs: ["F002", "F001"] })] }).evidenceFactIds, ["F001", "F002"]);
});
for (const path of ["report_content", "report_content.short_letter", "report_content.short_letter[2]", "report_content.short_letter[-1]", "report_content.short_letter[01]", "report_content.short_letter[9007199254740992]", "report_content.observed_fact_commentary[0]", "report_content.observed_fact_commentary[0].fact_id", "report_content.decision_reason_summary", "report_content.relationship_summary", "report_content.change_condition_commentary[0]", "decision_plan.selected_decision", "report_content.__proto__.polluted"]) {
  check(`unsupported target: ${path}`, () => assert.equal(buildReportFactRepairContextV1(input({ findingDispositions: [item({ json_path: path })] })), null));
}
for (const refs of [[], ["F999"], ["F001", "F001"], ["policy:decision_policy_result"], ["F001", "input:current_situation"], ["F002"]]) {
  check(`unbound commentary evidence: ${JSON.stringify(refs)}`, () => assert.equal(buildReportFactRepairContextV1(input({ findingDispositions: [item({ evidence_refs: refs })] })), null));
}
check("empty explanation rejects eligibility", () => assert.equal(buildReportFactRepairContextV1(input({ findingDispositions: [item({ detail: " \n" })] })), null));
check("multiple material facts cannot repair one and hide the other", () => assert.equal(buildReportFactRepairContextV1(input({ findingDispositions: [item(), item({ json_path: "report_content.short_letter[1]" })] })), null));
check("Application local defect excludes patch route", () => assert.equal(buildReportFactRepairContextV1(input({ localDefects: [{ findingCode: "DRAFT_SOURCE_INTEGRITY" }] })), null));
for (const finding_code of ["ACTION_CONSISTENCY", "SAFETY_REGRESSION", "MESSAGE_POLICY_CONSISTENCY", "DECISION_ALLOWED", "REQUIRED_SECTION_MEANING", "THREE_DAY_PLAN_CONSISTENCY"]) {
  check(`mixed material ${finding_code} is not a local fact repair`, () => assert.equal(buildReportFactRepairContextV1(input({ findingDispositions: [item(), item({ finding_code, json_path: "decision_plan.actions_to_take[0]" })] })), null));
}
check("minor factual issue is not an editorial waiver", () => assert.equal(buildReportFactRepairContextV1(input({ findingDispositions: [item(), item({ severity: "minor", json_path: "report_content.short_letter[1]" }, "nonblocking")] })), null));
check("bad disposition cannot enter patch route", () => assert.equal(buildReportFactRepairContextV1(input({ findingDispositions: [item({}, "unknown")] })), null));
check("raw and grounded target mismatch excludes repair", () => {
  const changed = clone(grounded); changed.observed_fact_commentary[0].commentary += "変更";
  assert.equal(buildReportFactRepairContextV1(input({ groundedReportContent: changed })), null);
});
for (const mutate of [
  (value) => { value.observed_facts[0].source_refs = []; },
  (value) => { value.observed_facts[0].source_refs = ["policy:instructions"]; },
  (value) => { value.observed_facts.push(clone(value.observed_facts[0])); },
  (value) => { value.observed_facts[0].statement = ""; },
]) {
  check("Base fact source binding rejects malformed facts", () => {
    const changed = clone(base); mutate(changed);
    assert.equal(buildReportFactRepairContextV1(input({ baseStructuredIntake: changed })), null);
  });
}
check("routing detection does not deliver or broadly accept fact-code", () => {
  assert.equal(hasMaterialReportFactFindingV1([item()]), true);
  assert.equal(hasMaterialReportFactFindingV1([item({ json_path: "report_content.decision_reason_summary" })]), true);
  assert.equal(hasMaterialReportFactFindingV1([item({ json_path: "decision_plan.selected_decision" })]), false);
  assert.equal(hasMaterialReportFactFindingV1([item({}, "ignored")]), false);
  assert.equal(hasMaterialReportFactFindingV1([item({ severity: "minor" })]), false);
});
check("patch preserves every other raw value and grounded authority", () => {
  const bound = context(); const result = apply(bound);
  const expected = clone(raw); expected.observed_fact_commentary[0].commentary = patch(bound).replacement_text;
  assert.deepEqual(result, expected);
  assert.equal(result.short_letter[0], raw.short_letter[0]);
  assert.equal(result.relationship_summary, null);
  assert.equal(hashJson(bound.sourceReportContent), hashJson(raw));
  assert.equal(hashJson(bound.sourceGroundedReportContent), hashJson(grounded));
  assert.notEqual(result, bound.sourceReportContent);
});
check("short-letter patch preserves all other fields literally", () => {
  const bound = context(letterOverrides());
  const result = apply(bound, patch(bound, { replacement_text: "質問は一度送っており、今は自分の予定を進めてよい時です。" }));
  assert.equal(result.short_letter[0], raw.short_letter[0]);
  assert.deepEqual(result.observed_fact_commentary, bound.sourceReportContent.observed_fact_commentary);
});
for (const overrides of [
  { schema_version: "wrong" }, { source_report_hash: "0".repeat(64) },
  { target_path: "report_content.short_letter[0]" }, { original_text: "別の文" },
  { replacement_text: " \n" }, { replacement_text: "あ".repeat(701) },
  { extra: "ignored field" },
]) {
  check(`invalid patch binding ${JSON.stringify(overrides).slice(0, 90)}`, () => {
    const bound = context(); rejects(() => apply(bound, patch(bound, overrides)), "M2_REPORT_FACT_REPAIR_INVALID");
  });
}
check("unchanged proposal means unsuccessful repair", () => {
  const bound = context(); rejects(() => apply(bound, patch(bound, { replacement_text: bound.originalText })), "M2_REPORT_FACT_REPAIR_INVALID");
});
check("whitespace-only change is not a fact repair", () => {
  const bound = context();
  rejects(() => apply(bound, patch(bound, { replacement_text: ` \n${bound.originalText} \n` })), "M2_REPORT_FACT_REPAIR_INVALID");
});
check("genuine correction preserves exact surrounding whitespace", () => {
  const bound = context(); const replacement = ` ${patch(bound).replacement_text}\n`;
  assert.equal(apply(bound, patch(bound, { replacement_text: replacement })).observed_fact_commentary[0].commentary, replacement);
});
check("Plan cannot change during patch", () => {
  const changed = clone(plan); changed.selected_decision = "send_now";
  const bound = context(); rejects(() => apply(bound, patch(bound), { decisionPlan: changed }), "M2_REPORT_FACT_REPAIR_SOURCE_MISMATCH");
});
check("Base cannot change during patch", () => {
  const changed = clone(base); changed.observed_facts[0].statement = "質問は到達済み。";
  const bound = context(); rejects(() => apply(bound, patch(bound), { baseStructuredIntake: changed }), "M2_REPORT_FACT_REPAIR_SOURCE_MISMATCH");
});
check("input supplies editing source without mutating it and computes grounded hash", () => {
  const bound = context(); const before = buildReportFactRepairInputV1(bound);
  assert.equal(before.report_hash, undefined); assert.deepEqual(before.source_report, raw);
  before.source_report.short_letter[0] = "external mutation";
  assert.equal(bound.sourceReportContent.short_letter[0], raw.short_letter[0]);
  const ready = verificationInput(bound); const after = buildReportFactRepairInputV1(bound, ready.groundedRepairedReport);
  assert.equal(after.report_hash, hashJson(ready.groundedRepairedReport));
  assert.notEqual(after.report_hash, hashJson(ready.repairedReport));
});
check("selected finding is an exact independent copy, not factual authority", () => {
  const bound = context(); const repairInput = buildReportFactRepairInputV1(bound);
  assert.deepEqual(repairInput.selected_finding, bound.finding);
  assert.deepEqual(repairInput.selected_finding, finding());
  repairInput.selected_finding.detail = "この修復指摘は事実の証明ではありません。";
  repairInput.selected_finding.evidence_refs.push("F999");
  assert.deepEqual(bound.finding, finding());
  assert.deepEqual(bound.sourceBaseStructuredIntake, base);
  assert.deepEqual(bound.evidenceFactIds, ["F001"]);
});
check("six independent passing checks and unchanged surrounding content pass", () => assertReportFactRepairVerifiedV1(verificationInput()));
check("same bound evidence IDs in another order remain valid", () => {
  const bound = context({ findingDispositions: [item({ evidence_refs: ["F002", "F001"] })] });
  const value = verificationInput(bound);
  value.validationOutput.report_fact_repair_verification.evidence_fact_ids = ["F002", "F001"];
  assertReportFactRepairVerifiedV1(value);
});
for (const key of REPORT_FACT_REPAIR_CHECKS_V1) {
  for (const status of ["fail", "unknown", null]) {
    check(`${key} ${status} fails closed despite the other five passes`, () => {
      const value = verificationInput(); value.validationOutput.report_fact_repair_verification.checks[key] = status;
      rejects(() => assertReportFactRepairVerifiedV1(value));
    });
  }
}
for (const mutate of [
  (value) => { value.validationOutput.report_fact_repair_verification = null; },
  (value) => { delete value.validationOutput.report_fact_repair_verification; },
  (value) => { value.validationOutput.schema_version = "pipeline-schema-v1.0.0"; },
  (value) => { value.validationOutput.report_fact_repair_verification.report_hash = hashJson(value.repairedReport); },
  (value) => { value.validationOutput.report_fact_repair_verification.target_path = "report_content.short_letter[1]"; },
  (value) => { value.validationOutput.report_fact_repair_verification.verified_text += " "; },
  (value) => { value.validationOutput.report_fact_repair_verification.evidence_fact_ids = ["F002"]; },
  (value) => { value.validationOutput.report_fact_repair_verification.evidence_fact_ids = ["F001", "F001"]; },
  (value) => { value.validationOutput.report_fact_repair_verification.extra = "pass"; },
  (value) => { value.validationOutput.report_fact_repair_verification.checks.extra = "pass"; },
  (value) => { delete value.validationOutput.report_fact_repair_verification.checks.safety; },
  (value) => { value.repairedReport.short_letter[0] = value.repairedReport.short_letter[0].replace("\n", " "); },
  (value) => { value.groundedRepairedReport.relationship_summary += "到達済み"; },
  (value) => { value.groundedRepairedReport.observed_fact_commentary[0].commentary += " "; },
  (value) => { value.localDefects = [{ findingCode: "CUSTOMER_SURFACE_INTEGRITY" }]; },
  (value) => { value.validationOutput.semantic_checks = [finding()]; },
]) {
  check("postrepair exact binding and full-result guards fail closed", () => {
    const value = verificationInput(); mutate(value); rejects(() => assertReportFactRepairVerifiedV1(value));
  });
}
for (const finding_code of ["FACT_FIDELITY", "ASSUMPTION_AS_FACT", "UNSUPPORTED_CERTAINTY", "ACTION_CONSISTENCY", "SAFETY_REGRESSION", "MESSAGE_POLICY_CONSISTENCY", "REQUIRED_SECTION_MEANING"]) {
  check(`six pass labels cannot erase remaining/new ${finding_code}`, () => {
    const value = verificationInput(); const remaining = item({ finding_code });
    value.findingDispositions = [remaining]; value.validationOutput.semantic_checks = [remaining.finding];
    rejects(() => assertReportFactRepairVerifiedV1(value));
  });
}
check("minor editorial finding may remain only with six checks and known text", () => {
  const minor = item({ finding_code: "BRAND_TONE", severity: "minor", json_path: "report_content.short_letter[0]", detail: "この一語には表現上の改善余地があるが、相談の意味や機能は成立している。" }, "nonblocking");
  assert.ok(buildReportFactRepairContextV1(input({ findingDispositions: [item(), minor] })));
  const value = verificationInput(); value.findingDispositions = [minor]; value.validationOutput.semantic_checks = [minor.finding];
  assertReportFactRepairVerifiedV1(value);
  minor.finding.severity = "major";
  rejects(() => assertReportFactRepairVerifiedV1(value));
});
check("narrow signal preserves immutable context and existing attempt bookkeeping code", () => {
  const bound = context(); const signal = new ReportFactRepairRequiredSignalV1(bound);
  assert.equal(signal.safeCode, "M2_PRODUCT_QUALITY_REASSESSMENT_REQUIRED");
  assert.equal(signal.context, bound); assert.equal(isReportFactRepairRequiredSignalV1(signal), true);
  assert.equal(isReportFactRepairRequiredSignalV1(new Error()), false);
});

console.log(JSON.stringify({ status: "PASS", checks: passed, realApiCalls: 0,
  evidenceKind: "pure deterministic contract and integrity fixtures; no real-model quality evidence" }, null, 2));
