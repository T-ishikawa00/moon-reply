import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);
const taskId = "M2-P4-I3-R1-C1-R3-R2-E-R3-R2";
const runnerVersion =
  "m2-p4-i3-r1-c1-r3-r2-e-r3-r2-offline-runner-v1";
const taskRoot = "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r2";
const fixtureRelativePath = `${taskRoot}/remediation-fixtures-v1.json`;
const contractRelativePath = `${taskRoot}/remediation-contract-v1.json`;
const resultRelativePath = `${taskRoot}/offline-results-v1.json`;
const auditRelativePath = `${taskRoot}/evidence-audit-v1.json`;
const reviewRelativePath = `${taskRoot}/product-review-corrected-v1.md`;
const frozenRelativePath =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3/diagnostic-results-v1.json";
const frozenContractRelativePath =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3/diagnostic-contract-v1.json";
const catalogV11RelativePath =
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v11.json";

const [
  { AssessmentPipeline },
  { FakeAiStageTransport, FakeAssessmentRepository },
  {
    loadM2P4AuthorityIntegrityRuntimeStageCatalog,
    loadM2P4CandidateSourceIsolationRuntimeStageCatalog,
    loadM2P4DirectionalGuidanceRuntimeStageCatalog,
  },
  { groundCandidateAnalysisV2 },
  { validateDecisionPlanConstraintIntegrityV1 },
  { createActionContextV1, createContactConstraintPolicyV1 },
  { evaluateSemanticFindingsV4 },
  { runDirectionalGuidanceOffline },
] = await Promise.all([
  import("../../lib/assessment/runtime/pipeline.ts"),
  import("../../lib/assessment/runtime/fakes.ts"),
  import("../../lib/assessment/runtime/schema-catalog.ts"),
  import("../../lib/assessment/runtime/candidate-analysis-grounding-v2.ts"),
  import(
    "../../lib/assessment/runtime/decision-plan-constraint-integrity-v1.ts"
  ),
  import("../../lib/assessment/runtime/runtime-authority-v1.ts"),
  import("../../lib/assessment/runtime/semantic-disposition-v4.ts"),
  import("./m2-p4-i3-r1-c1-r3-r2-e-r2-offline-runner-v1.mjs"),
]);

const clone = (value) => structuredClone(value);
const readText = (relativePath) =>
  readFileSync(path.join(repositoryRoot, relativePath), "utf8");
const readJson = (relativePath) => JSON.parse(readText(relativePath));
const canonicalText = (value) => value.replace(/\r\n/gu, "\n");
const sha256 = (value) =>
  createHash("sha256").update(Buffer.from(value, "utf8")).digest("hex");
const fileSha256 = (relativePath) => sha256(canonicalText(readText(relativePath)));

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalize(value[key])]),
    );
  }
  return value;
}

const canonicalJson = (value) => JSON.stringify(canonicalize(value));
const canonicalPrettyJson = (value) =>
  `${JSON.stringify(canonicalize(value), null, 2)}\n`;
const jsonSha256 = (value) => sha256(canonicalJson(value));
const same = (left, right) => canonicalJson(left) === canonicalJson(right);

function safeError(error) {
  return error?.safeCode ?? error?.message ?? null;
}

function deterministicUuidFactory(prefix) {
  let sequence = 0;
  return () => `${prefix}-${String(++sequence).padStart(4, "0")}`;
}

function validationResult(findings = []) {
  return {
    schema_version: "pipeline-schema-v1.0.0",
    validation_mode: "semantic_findings_only",
    deterministic_checks: [],
    semantic_checks: clone(findings),
    final_disposition: null,
    repair_strategy: null,
    failed_codes: [],
  };
}

function finding({ code = "FACT_FIDELITY", path: jsonPath, detail }) {
  return {
    finding_code: code,
    severity: "major",
    json_path: jsonPath,
    evidence_refs: ["policy:action_context"],
    detail,
  };
}

function frozenCase(frozen, caseId) {
  const selected = frozen.cases.find(({ case_id: id }) => id === caseId);
  if (!selected) throw new Error(`Frozen case missing: ${caseId}`);
  return selected;
}

function stageOutputs(caseResult) {
  return Object.fromEntries(
    caseResult.provider_calls.map((call) => [call.stage_id, clone(call.raw_output)]),
  );
}

function ensureConstraintSignal(base, kind, boundedSummary) {
  const constraints = base.base_writing_signals.explicit_user_constraints;
  if (!constraints.some((constraint) => constraint.kind === kind)) {
    constraints.push({ kind, bounded_summary: boundedSummary });
  }
}

function asBaseV2(rawBase, constraint) {
  const base = clone(rawBase);
  base.schema_version = "pipeline-schema-base-v2.0.0";
  base.decision_facts.schema_version = "m2-p4-base-decision-facts-v2";
  if (constraint.kind === "no_followup_message") {
    if (!base.observed_facts.some(({ fact_id: factId }) => factId === "F906")) {
      base.observed_facts.push({
        fact_id: "F906",
        statement: "ユーザーは追いメッセージを送らない方針を明示している。",
        source_refs: ["input:current_situation"],
        support: "explicit",
      });
    }
    ensureConstraintSignal(
      base,
      "no_followup_message",
      "追いメッセージを送らない。",
    );
    base.decision_facts.user_contact_constraint = {
      kind: "no_followup_message",
      status: "explicit",
      supporting_fact_ids: ["F906"],
    };
  } else if (constraint.kind === "business_only") {
    if (!base.observed_facts.some(({ fact_id: factId }) => factId === "F905")) {
      base.observed_facts.push({
        fact_id: "F905",
        statement: "ユーザーは連絡内容を業務上の用件だけに限定している。",
        source_refs: ["input:current_situation"],
        support: "explicit",
      });
    }
    ensureConstraintSignal(
      base,
      "no_private_contact_at_work",
      "業務上の用件だけに限定する。",
    );
    base.decision_facts.user_contact_constraint = {
      kind: "business_only",
      status: "explicit",
      supporting_fact_ids: ["F905"],
    };
  } else {
    base.decision_facts.user_contact_constraint = {
      kind: constraint.kind,
      status: constraint.kind === "none" ? "none" : "unknown",
      supporting_fact_ids: [],
    };
  }
  return base;
}

function readyOutputs(frozen) {
  const outputs = stageOutputs(frozenCase(frozen, "E-R3-01"));
  outputs["PB-01"] = asBaseV2(outputs["PB-01"], {
    kind: "business_only",
  });
  outputs["PB-06"] = validationResult();
  return outputs;
}

function nofollowOutputs(frozen, violation = false) {
  const outputs = stageOutputs(frozenCase(frozen, "E-R3-02"));
  outputs["PB-01"] = asBaseV2(outputs["PB-01"], {
    kind: "no_followup_message",
  });
  outputs["PB-04"].recommended_message_draft = null;
  outputs["PB-04"].message_draft_edit_metadata = null;
  outputs["PB-04"].change_conditions = outputs[
    "PB-04"
  ].change_conditions.map((condition, index) => ({
    ...condition,
    resulting_direction:
      violation && index === 0 ? "send_now" : "wait_and_reassess",
  }));
  outputs["PB-06"] = validationResult();
  return outputs;
}

function noContactOutputs(frozen) {
  const outputs = stageOutputs(frozenCase(frozen, "E-R3-03"));
  outputs["PB-01"] = asBaseV2(outputs["PB-01"], { kind: "none" });
  return outputs;
}

async function executePipeline({
  catalog,
  outputs,
  input,
  fixedStartedAt,
  timeZone,
  idPrefix,
}) {
  const repository = new FakeAssessmentRepository();
  const transport = new FakeAiStageTransport({ outputs });
  const uuid = deterministicUuidFactory(idPrefix);
  const requestId = uuid();
  const runId = uuid();
  await repository.createRequest({
    id: requestId,
    idempotencyKey: `${idPrefix}-key`,
    source: "internal_review_runtime",
    ...input,
    now: fixedStartedAt,
  });
  const pipeline = new AssessmentPipeline({
    repository,
    transport,
    definitions: catalog.definitions,
    now: () => fixedStartedAt,
    uuid,
    ...(timeZone === undefined ? {} : { timeZone }),
  });
  try {
    const result = await pipeline.execute(input, {
      requestId,
      runId,
      model: "gpt-5.6-luna",
      promptBundleVersion: catalog.promptBundleVersion,
      schemaSetVersion: catalog.schemaSetVersion,
      startedAt: fixedStartedAt,
    });
    return { repository, transport, result, error: null };
  } catch (error) {
    return { repository, transport, result: null, error };
  }
}

function inputFromFrozen(caseResult) {
  return {
    currentSituation: caseResult.synthetic_input.current_situation,
    optionalMessage: caseResult.synthetic_input.optional_message,
    relationship: caseResult.synthetic_input.relationship,
    requestedTopics: clone(caseResult.synthetic_input.requested_topics),
    privacyAcknowledged: true,
  };
}

function stageInput(run, stageId) {
  return run.transport.requests.find(({ stageId: id }) => id === stageId)?.input;
}

function constraintOutcome(decisionPlan, contactConstraintPolicy, actionContext) {
  try {
    validateDecisionPlanConstraintIntegrityV1({
      decisionPlan,
      contactConstraintPolicy,
      actionContext,
    });
    return "PASS";
  } catch (error) {
    return safeError(error);
  }
}

function semanticOutcome(plan, report, semanticFinding) {
  const evaluated = evaluateSemanticFindingsV4({
    validationOutput: validationResult(
      semanticFinding ? [semanticFinding] : [],
    ),
    decisionPlan: plan,
    groundedReportContent: report,
  });
  return evaluated.blockingFindings.length > 0 ? "BLOCKING" : "PASS";
}

function candidateFixtureValues(rawCandidate) {
  const concreteNone = clone(rawCandidate);
  concreteNone.candidate_communicative_intent.practical_requirement = [
    "confirm_schedule",
    "none",
  ];
  concreteNone.candidate_safety_signals.signal_codes = [];
  const concreteUnknown = clone(rawCandidate);
  concreteUnknown.candidate_communicative_intent.practical_requirement = [
    "answer_question",
    "unknown",
  ];
  concreteUnknown.candidate_communicative_intent.invitation_presence = false;
  concreteUnknown.candidate_safety_signals.signal_codes = ["asks_for_reply"];
  const rawHashBefore = jsonSha256(concreteNone);
  const groundedNone = groundCandidateAnalysisV2(concreteNone);
  const rawHashAfter = jsonSha256(concreteNone);
  const groundedUnknown = groundCandidateAnalysisV2(concreteUnknown);
  return {
    concrete_none: groundedNone.candidate_analysis.candidate_communicative_intent
      .practical_requirement,
    concrete_unknown:
      groundedUnknown.candidate_analysis.candidate_communicative_intent
        .practical_requirement,
    confirm_adds_asks:
      groundedNone.candidate_safety_result.signal_codes.includes(
        "asks_for_reply",
      ),
    confirm_adds_meeting:
      groundedNone.candidate_safety_result.signal_codes.includes(
        "proposes_meeting",
      ),
    asks_independent_from_demand:
      groundedUnknown.candidate_safety_result.signal_codes.includes(
        "asks_for_reply",
      ) &&
      !groundedUnknown.candidate_safety_result.signal_codes.includes(
        "reply_demand",
      ),
    raw_output_immutable: rawHashBefore === rawHashAfter,
    input_nonmutation: rawHashBefore === jsonSha256(concreteNone),
  };
}

function collectForbiddenKeyHits(value, forbidden, pathPrefix = "$") {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      collectForbiddenKeyHits(item, forbidden, `${pathPrefix}[${index}]`),
    );
  }
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, child]) => [
    ...(forbidden.has(key) ? [`${pathPrefix}.${key}`] : []),
    ...collectForbiddenKeyHits(child, forbidden, `${pathPrefix}.${key}`),
  ]);
}

function buildEvidenceAudit(frozen, frozenContract) {
  const calls = frozen.cases.flatMap((caseResult) => caseResult.provider_calls);
  const forbidden = new Set(frozenContract.provider_oracle_forbidden_keys);
  const hashChecks = calls.map((call) => {
    const requestRecomputed = jsonSha256(call.provider_request);
    const rawRecomputed = jsonSha256(call.raw_output);
    return {
      case_id: call.case_id,
      call_index: call.call_index,
      stage_id: call.stage_id,
      request_sha256_stored: call.request_sha256,
      request_sha256_recomputed: requestRecomputed,
      request_hash_matches: requestRecomputed === call.request_sha256,
      raw_output_sha256_stored: call.raw_output_sha256,
      raw_output_sha256_recomputed: rawRecomputed,
      raw_output_hash_matches:
        rawRecomputed === call.raw_output_sha256 &&
        rawRecomputed === call.raw_output_sha256_after_processing,
    };
  });
  const forbiddenHits = calls.flatMap((call) =>
    collectForbiddenKeyHits(
      call.provider_request.input,
      forbidden,
      `${call.case_id}.${call.stage_id}.input`,
    ),
  );
  const responseIds = calls.map(({ response_id: responseId }) => responseId);
  const caseReviews = frozen.cases.map((caseResult) => {
    const evidence = caseResult.evidence;
    const blocking = evidence.semantic_disposition?.blockingFindings ?? [];
    const finalResultPresent = evidence.final_result !== null;
    return {
      case_id: caseResult.case_id,
      title: caseResult.title,
      expected_stage_count: caseResult.expected_stage_path.length,
      actual_stage_count: caseResult.actual_stage_path.length,
      stage_count_matches:
        caseResult.expected_stage_path.length ===
          caseResult.actual_stage_path.length &&
        same(caseResult.expected_stage_path, caseResult.actual_stage_path),
      final_result_present: finalResultPresent,
      safe_error_code: caseResult.safe_error_code,
      pb_06_blocking_findings: blocking.map((item) => ({
        finding_code: item.finding_code,
        severity: item.severity,
        json_path: item.json_path,
      })),
      intermediate_plan_present: evidence.decision_plan !== null,
      intermediate_report_present: evidence.grounded_report_content !== null,
      intermediate_artifact_label:
        !finalResultPresent &&
        (evidence.decision_plan !== null || evidence.grounded_report_content !== null)
          ? "棄却された中間生成物"
          : null,
      accepted_final_draft_present:
        finalResultPresent &&
        typeof evidence.final_decision_card?.messageDraft === "string",
      accepted_final_report_present:
        finalResultPresent && evidence.final_result?.report !== undefined,
      final_eligibility: finalResultPresent
        ? evidence.final_result.eligibility
        : null,
    };
  });
  const requestMatches = hashChecks.filter(
    ({ request_hash_matches: matches }) => matches,
  ).length;
  const rawMatches = hashChecks.filter(
    ({ raw_output_hash_matches: matches }) => matches,
  ).length;
  return {
    schema_version:
      "m2-p4-i3-r1-c1-r3-r2-e-r3-r2-evidence-audit-v1",
    task_id: taskId,
    auditor_version: runnerVersion,
    authority: "independent_offline_recomputation",
    frozen_source: {
      path: frozenRelativePath,
      file_sha256: fileSha256(frozenRelativePath),
      commit_b: "e8db575adc9636032997c8e3d43f8a56e38fae15",
      original_machine_verdict: frozen.evaluation.verdict,
      original_exact_operational_pass: frozen.evaluation.exact_operational_pass,
    },
    call_count: calls.length,
    request_hashes: {
      matched: requestMatches,
      total: calls.length,
    },
    raw_output_hashes: {
      matched: rawMatches,
      total: calls.length,
      after_processing_matched: rawMatches,
    },
    hash_checks: hashChecks,
    response_ids: {
      present: responseIds.filter(
        (responseId) => typeof responseId === "string" && responseId !== "",
      ).length,
      unique: new Set(responseIds).size,
      total: responseIds.length,
    },
    forbidden_provider_input_keys: {
      checked_keys: [...forbidden],
      hit_count: forbiddenHits.length,
      hits: forbiddenHits,
    },
    stage_counts: Object.fromEntries(
      caseReviews.map((row) => [
        row.case_id,
        {
          expected: row.expected_stage_count,
          actual: row.actual_stage_count,
          matches: row.stage_count_matches,
        },
      ]),
    ),
    case_reviews: caseReviews,
    provider_calls: 0,
    db_operations: 0,
    supabase_operations: 0,
    overall_verdict:
      calls.length === 37 &&
      requestMatches === 37 &&
      rawMatches === 37 &&
      new Set(responseIds).size === 37 &&
      forbiddenHits.length === 0 &&
      caseReviews.every(({ stage_count_matches: matches }) => matches)
        ? "PASS"
        : "FAIL",
  };
}

function buildCorrectedReview(audit) {
  const lines = [
    "# M2-P4-I3-R1-C1-R3-R2-E-R3-R2 Corrected Product Review Projection",
    "",
    "Status: offline_projection_corrected_from_frozen_e_r3_evidence",
    "",
    "この文書は E-R3 Commit B の凍結済み evidence を再実行せずに投影し直したものです。元の Product Review と machine verdict（FAIL / 1 of 6）は変更していません。`final_result=null` の Plan / Report は採用品ではなく、棄却された中間生成物として扱います。",
    "",
  ];
  for (const row of audit.case_reviews) {
    const findingSummary =
      row.pb_06_blocking_findings.length === 0
        ? "なし"
        : row.pb_06_blocking_findings
            .map(
              ({ finding_code: code, severity, json_path: jsonPath }) =>
                `${code}/${severity} @ ${jsonPath}`,
            )
            .join("; ");
    lines.push(
      `## ${row.case_id} — ${row.title}`,
      "",
      `- actual final_result present: ${row.final_result_present ? "yes" : "no"}`,
      `- safe_error_code: ${row.safe_error_code ?? "null"}`,
      `- PB-06 blocking finding summary: ${findingSummary}`,
      `- intermediate Plan present: ${row.intermediate_plan_present ? "yes" : "no"}`,
      `- intermediate Report present: ${row.intermediate_report_present ? "yes" : "no"}`,
      `- 中間生成物の扱い: ${row.intermediate_artifact_label ?? "該当なし"}`,
      `- 採用済み返信文: ${row.accepted_final_draft_present ? "あり" : "なし"}`,
      `- 採用済み鑑定レポート: ${row.accepted_final_report_present ? "あり" : "なし"}`,
      `- 確定した Runtime eligibility: ${row.final_eligibility ?? "なし"}`,
      "",
    );
  }
  return `${lines.join("\n").trimEnd()}\n`;
}

function fixtureStatus(expected, actual) {
  return same(expected, actual) ? "PASS" : "FAIL";
}

function summaryFor(results, category) {
  const selected = results.filter((result) => result.category === category);
  return `${selected.filter(({ status }) => status === "PASS").length}/${selected.length}`;
}

export async function runAuthorityIntegrityOffline() {
  if (path.resolve(process.cwd()) !== repositoryRoot) {
    throw new Error(`Run from repository root: ${repositoryRoot}`);
  }
  const fixtures = readJson(fixtureRelativePath);
  const contract = readJson(contractRelativePath);
  const frozen = readJson(frozenRelativePath);
  const frozenContract = readJson(frozenContractRelativePath);
  const [v9Catalog, v10Catalog, v11Catalog, predecessorOffline] =
    await Promise.all([
      loadM2P4CandidateSourceIsolationRuntimeStageCatalog(),
      loadM2P4DirectionalGuidanceRuntimeStageCatalog(),
      loadM2P4AuthorityIntegrityRuntimeStageCatalog(),
      runDirectionalGuidanceOffline(),
    ]);
  const fixedStartedAt = fixtures.fixed_started_at;
  const timeZone = fixtures.time_zone;
  const readyCase = frozenCase(frozen, "E-R3-01");
  const nofollowCase = frozenCase(frozen, "E-R3-02");
  const noContactCase = frozenCase(frozen, "E-R3-03");
  const readyRun = await executePipeline({
    catalog: v11Catalog,
    outputs: readyOutputs(frozen),
    input: inputFromFrozen(readyCase),
    fixedStartedAt,
    timeZone,
    idPrefix: "er3r2-ready",
  });
  const nofollowRun = await executePipeline({
    catalog: v11Catalog,
    outputs: nofollowOutputs(frozen),
    input: inputFromFrozen(nofollowCase),
    fixedStartedAt,
    timeZone,
    idPrefix: "er3r2-nofollow",
  });
  const noContactRun = await executePipeline({
    catalog: v11Catalog,
    outputs: noContactOutputs(frozen),
    input: inputFromFrozen(noContactCase),
    fixedStartedAt,
    timeZone,
    idPrefix: "er3r2-stop",
  });
  const violationRun = await executePipeline({
    catalog: v11Catalog,
    outputs: nofollowOutputs(frozen, true),
    input: inputFromFrozen(nofollowCase),
    fixedStartedAt,
    timeZone,
    idPrefix: "er3r2-violation",
  });
  const missingTimeZoneRun = await executePipeline({
    catalog: v11Catalog,
    outputs: readyOutputs(frozen),
    input: inputFromFrozen(readyCase),
    fixedStartedAt,
    timeZone: undefined,
    idPrefix: "er3r2-no-timezone",
  });

  const actionContext = createActionContextV1({
    trustedNowIso: fixedStartedAt,
    timeZone,
  });
  const nofollowBase = nofollowOutputs(frozen)["PB-01"];
  const nofollowPolicy = createContactConstraintPolicyV1({
    baseStructuredIntake: nofollowBase,
    followUpException: "none",
  });
  const exceptionPolicy = createContactConstraintPolicyV1({
    baseStructuredIntake: nofollowBase,
    followUpException: "material_factual_correction",
  });
  const businessPolicy = createContactConstraintPolicyV1({
    baseStructuredIntake: readyOutputs(frozen)["PB-01"],
    followUpException: "none",
  });
  const waitingPlan = nofollowOutputs(frozen)["PB-04"];
  const laterDraftPlan = clone(waitingPlan);
  const readyPlan = readyOutputs(frozen)["PB-04"];
  laterDraftPlan.recommended_message_draft = clone(
    readyPlan.recommended_message_draft,
  );
  laterDraftPlan.message_draft_edit_metadata = clone(
    readyPlan.message_draft_edit_metadata,
  );
  const contactBranchPlan = clone(waitingPlan);
  contactBranchPlan.change_conditions[0].resulting_direction = "send_now";
  const businessEscalationPlan = clone(readyPlan);
  businessEscalationPlan.message_draft_edit_metadata.communicative_intent_delta.invitation_presence_delta =
    "added";
  businessEscalationPlan.message_draft_edit_metadata.communicative_intent_delta.affection_strength_delta =
    "increased";

  const candidateValues = candidateFixtureValues(
    readyOutputs(frozen)["PB-01C"],
  );
  const evidenceAudit = buildEvidenceAudit(frozen, frozenContract);
  const correctedReview = buildCorrectedReview(evidenceAudit);
  const rejectedRows = evidenceAudit.case_reviews.filter(
    ({ final_result_present: present }) => !present,
  );
  const acceptedProjectionTruthful = evidenceAudit.case_reviews.every(
    (row) =>
      row.final_result_present ||
      (!row.accepted_final_draft_present && !row.accepted_final_report_present),
  );
  const actionContexts = ["PB-04", "PB-05", "PB-06"].map(
    (stageId) => stageInput(readyRun, stageId)?.action_context,
  );
  const providerInputKeys = Object.fromEntries(
    contract.runtime_identity.stage_order.map((stageId) => [
      stageId,
      Object.keys(stageInput(readyRun, stageId) ?? {}).sort(),
    ]),
  );
  const providerInputKeysExact = Object.entries(
    contract.provider_input_keys,
  ).every(([stageId, expectedKeys]) =>
    same(providerInputKeys[stageId], [...expectedKeys].sort()),
  );
  const promptPb06 = v11Catalog.definitions.find(
    ({ stageId }) => stageId === "PB-06",
  )?.developerPrompt;
  const temporalPlan = readyOutputs(frozen)["PB-04"];
  const temporalReport = readyOutputs(frozen)["PB-05"];
  const temporalValues = {
    authorized:
      actionContext.authority === "application" &&
      actionContext.action_horizon.user_facing_label_ja === "今夜" &&
      promptPb06?.includes(
        "action_context.action_horizon.user_facing_label_ja",
      ) &&
      semanticOutcome(temporalPlan, temporalReport, null) === "PASS",
    exact_time: semanticOutcome(
      temporalPlan,
      temporalReport,
      finding({
        path: "$.decision_plan.actions_to_take[0]",
        detail: "An exact clock time was invented outside Base and action_context.",
      }),
    ),
    reply_deadline: semanticOutcome(
      temporalPlan,
      temporalReport,
      finding({
        code: "UNSUPPORTED_CERTAINTY",
        path: "$.report_content.cover_line",
        detail: "The other person's future reply deadline was predicted.",
      }),
    ),
    identical_context:
      actionContexts.every((value) => value !== undefined) &&
      actionContexts.every((value) => same(value, actionContexts[0])),
  };

  const v9Parity =
    predecessorOffline.v9_parity.results.every(
      ({ status }) => status === "PASS",
    ) && predecessorOffline.operations.external_provider_calls === 0;
  const v10Parity =
    predecessorOffline.v10_fake_flows.results.every(
      ({ status }) => status === "PASS",
    ) && predecessorOffline.operations.external_provider_calls === 0;

  const actualByOperation = {
    authorized_action_horizon_label: temporalValues.authorized ? "PASS" : "FAIL",
    invented_exact_clock_time: temporalValues.exact_time,
    predicted_reply_deadline: temporalValues.reply_deadline,
    identical_stage_action_context: temporalValues.identical_context
      ? "PASS"
      : "FAIL",
    missing_timezone: safeError(missingTimeZoneRun.error),
    v10_unaffected: v10Parity ? "PASS" : "FAIL",
    nofollow_rejects_later_draft: constraintOutcome(
      laterDraftPlan,
      nofollowPolicy,
      actionContext,
    ),
    nofollow_rejects_time_only_contact_branch: constraintOutcome(
      contactBranchPlan,
      nofollowPolicy,
      actionContext,
    ),
    nofollow_permits_continued_waiting: constraintOutcome(
      waitingPlan,
      nofollowPolicy,
      actionContext,
    ),
    explicit_permitted_exception: constraintOutcome(
      readyPlan,
      exceptionPolicy,
      actionContext,
    ),
    business_only_rejects_personal_invitation_escalation: constraintOutcome(
      businessEscalationPlan,
      businessPolicy,
      actionContext,
    ),
    concrete_plus_none: candidateValues.concrete_none,
    concrete_plus_unknown: candidateValues.concrete_unknown,
    confirm_schedule_adds_asks_for_reply: candidateValues.confirm_adds_asks,
    confirm_schedule_adds_proposes_meeting: candidateValues.confirm_adds_meeting,
    asks_for_reply_does_not_add_reply_demand:
      candidateValues.asks_independent_from_demand,
    raw_output_immutable: candidateValues.raw_output_immutable,
    input_nonmutation: candidateValues.input_nonmutation,
    v11_ready_flow:
      !readyRun.error && readyRun.result?.eligibility === "ready"
        ? "PASS"
        : safeError(readyRun.error) ?? "FAIL",
    v11_no_contact_pb03_stop:
      !noContactRun.error &&
      noContactRun.result?.eligibility === "safety_blocked" &&
      same(noContactRun.transport.calls, ["PB-01", "PB-01C", "PB-02", "PB-03"])
        ? "PASS"
        : safeError(noContactRun.error) ?? "FAIL",
    v11_nofollow_constraint_violation: safeError(violationRun.error),
    v9_parity: v9Parity ? "PASS" : "FAIL",
    v10_parity: v10Parity ? "PASS" : "FAIL",
    null_final_not_labelled_final:
      rejectedRows.length === 5 &&
      rejectedRows.every(
        ({ intermediate_artifact_label: label }) =>
          label === "棄却された中間生成物",
      ) &&
      !correctedReview.includes("最終返信案") &&
      !correctedReview.includes("最終鑑定文"),
    accepted_output_only_when_present: acceptedProjectionTruthful,
    frozen_hashes_37: `${Math.min(
      evidenceAudit.request_hashes.matched,
      evidenceAudit.raw_output_hashes.matched,
    )}/${evidenceAudit.call_count}`,
    forbidden_key_count:
      evidenceAudit.forbidden_provider_input_keys.hit_count,
    response_ids_unique: `${evidenceAudit.response_ids.unique}/${evidenceAudit.response_ids.total}`,
  };
  const fixtureResults = fixtures.fixtures.map((fixture) => {
    const actual = actualByOperation[fixture.operation];
    return {
      fixture_id: fixture.fixture_id,
      category: fixture.category,
      operation: fixture.operation,
      expected: fixture.expected,
      actual,
      status: fixtureStatus(fixture.expected, actual),
    };
  });
  const fakeInvocations =
    readyRun.transport.calls.length +
    nofollowRun.transport.calls.length +
    noContactRun.transport.calls.length +
    violationRun.transport.calls.length +
    missingTimeZoneRun.transport.calls.length;
  const externalProviderCalls =
    readyRun.transport.actualProviderCalls +
    nofollowRun.transport.actualProviderCalls +
    noContactRun.transport.actualProviderCalls +
    violationRun.transport.actualProviderCalls +
    missingTimeZoneRun.transport.actualProviderCalls +
    predecessorOffline.operations.external_provider_calls;
  const supabaseOperations =
    readyRun.repository.actualSupabaseCalls +
    nofollowRun.repository.actualSupabaseCalls +
    noContactRun.repository.actualSupabaseCalls +
    violationRun.repository.actualSupabaseCalls +
    missingTimeZoneRun.repository.actualSupabaseCalls +
    predecessorOffline.operations.supabase_operations;
  const allFixturesPass = fixtureResults.every(
    ({ status }) => status === "PASS",
  );
  const catalogIdentityPass =
    v11Catalog.catalogVersion === contract.runtime_identity.catalog_version &&
    v11Catalog.promptBundleVersion ===
      contract.runtime_identity.prompt_bundle_version &&
    v11Catalog.schemaSetVersion ===
      contract.runtime_identity.schema_set_version &&
    v11Catalog.stageTopologyVersion ===
      contract.runtime_identity.stage_topology_version &&
    same(
      v11Catalog.definitions.map(({ stageId }) => stageId),
      contract.runtime_identity.stage_order,
    );

  const result = {
    schema_version:
      "m2-p4-i3-r1-c1-r3-r2-e-r3-r2-offline-results-v1",
    task_id: taskId,
    runner_version: runnerVersion,
    baseline: contract.baseline,
    fixed_started_at: fixedStartedAt,
    time_zone: timeZone,
    identities: {
      v9: {
        catalog_version: v9Catalog.catalogVersion,
        prompt_bundle_version: v9Catalog.promptBundleVersion,
        schema_set_version: v9Catalog.schemaSetVersion,
      },
      v10: {
        catalog_version: v10Catalog.catalogVersion,
        prompt_bundle_version: v10Catalog.promptBundleVersion,
        schema_set_version: v10Catalog.schemaSetVersion,
      },
      v11: {
        catalog_version: v11Catalog.catalogVersion,
        prompt_bundle_version: v11Catalog.promptBundleVersion,
        schema_set_version: v11Catalog.schemaSetVersion,
        stage_topology_version: v11Catalog.stageTopologyVersion,
        stage_order: v11Catalog.definitions.map(({ stageId }) => stageId),
      },
    },
    catalog_identity_passed: catalogIdentityPass,
    provider_input_keys: providerInputKeys,
    provider_input_keys_exact: providerInputKeysExact,
    hashes: {
      catalog_v11_sha256: fileSha256(catalogV11RelativePath),
      frozen_e_r3_sha256: evidenceAudit.frozen_source.file_sha256,
      request_hashes: `${evidenceAudit.request_hashes.matched}/${evidenceAudit.request_hashes.total}`,
      raw_output_hashes: `${evidenceAudit.raw_output_hashes.matched}/${evidenceAudit.raw_output_hashes.total}`,
    },
    fixture_results: fixtureResults,
    fixture_summary: {
      overall: `${fixtureResults.filter(({ status }) => status === "PASS").length}/${fixtureResults.length}`,
      temporal_authority: summaryFor(fixtureResults, "temporal_authority"),
      contact_constraint: summaryFor(fixtureResults, "contact_constraint"),
      candidate_grounding: summaryFor(fixtureResults, "candidate_grounding"),
      runtime: summaryFor(fixtureResults, "runtime"),
      evidence_review: summaryFor(fixtureResults, "evidence_review"),
    },
    runtime_flows: {
      ready: {
        outcome: readyRun.result?.eligibility ?? safeError(readyRun.error),
        fake_stage_path: readyRun.transport.calls,
      },
      nofollow_waiting: {
        outcome:
          nofollowRun.result?.eligibility ?? safeError(nofollowRun.error),
        fake_stage_path: nofollowRun.transport.calls,
      },
      no_contact_stop: {
        outcome:
          noContactRun.result?.eligibility ?? safeError(noContactRun.error),
        fake_stage_path: noContactRun.transport.calls,
      },
      nofollow_violation: {
        outcome: safeError(violationRun.error),
        fake_stage_path: violationRun.transport.calls,
      },
      missing_timezone: {
        outcome: safeError(missingTimeZoneRun.error),
        fake_stage_path: missingTimeZoneRun.transport.calls,
      },
    },
    action_context: actionContext,
    contact_constraint_policies: {
      nofollow_no_exception: nofollowPolicy,
      nofollow_explicit_exception: exceptionPolicy,
      business_only: businessPolicy,
    },
    decision_plan_v2_limitations_recorded:
      contract.decision_plan_v2_enforcement.recorded_limitations,
    evidence_audit: {
      overall_verdict: evidenceAudit.overall_verdict,
      call_count: evidenceAudit.call_count,
      request_hashes: evidenceAudit.request_hashes,
      raw_output_hashes: evidenceAudit.raw_output_hashes,
      response_ids: evidenceAudit.response_ids,
      forbidden_provider_input_keys:
        evidenceAudit.forbidden_provider_input_keys.hit_count,
    },
    parity: {
      v9: v9Parity ? "PASS" : "FAIL",
      v10: v10Parity ? "PASS" : "FAIL",
    },
    operations: {
      external_provider_calls: externalProviderCalls,
      fake_stage_invocations: fakeInvocations,
      db_operations: 0,
      supabase_operations: supabaseOperations,
      retry_calls: 0,
      repair_calls: 0,
      fallback_calls: 0,
      migration_applied: false,
      active_service_changed: false,
      active_runtime_activated: false,
    },
    frozen_e_r3_machine_verdict: frozen.evaluation.verdict,
    frozen_e_r3_evidence_unchanged: true,
    provider_quality_established: false,
    provider_rerun_ready: false,
    provider_rerun_authorized: false,
    r4_ready: false,
    r4_authorized: false,
    c2_authorized: false,
    overall_verdict:
      allFixturesPass &&
      catalogIdentityPass &&
      providerInputKeysExact &&
      evidenceAudit.overall_verdict === "PASS" &&
      externalProviderCalls === 0 &&
      supabaseOperations === 0
        ? "PASS"
        : "FAIL",
  };
  return { result, evidenceAudit, correctedReview };
}

function printSummary(result, mode) {
  console.log(`${taskId} ${runnerVersion}: ${result.overall_verdict}`);
  console.log(`mode: ${mode}`);
  console.log(`fixtures: ${result.fixture_summary.overall}`);
  console.log(
    `timing / constraint / candidate: ${result.fixture_summary.temporal_authority} / ${result.fixture_summary.contact_constraint} / ${result.fixture_summary.candidate_grounding}`,
  );
  console.log(`runtime / evidence: ${result.fixture_summary.runtime} / ${result.fixture_summary.evidence_review}`);
  console.log(`v9 / v10 parity: ${result.parity.v9} / ${result.parity.v10}`);
  console.log(
    `Provider / DB / Supabase: ${result.operations.external_provider_calls} / ${result.operations.db_operations} / ${result.operations.supabase_operations}`,
  );
}

const isCli =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isCli) {
  const checkMode = process.argv.includes("--check");
  const { result, evidenceAudit, correctedReview } =
    await runAuthorityIntegrityOffline();
  if (checkMode) {
    const matches =
      same(readJson(resultRelativePath), result) &&
      same(readJson(auditRelativePath), evidenceAudit) &&
      canonicalText(readText(reviewRelativePath)) === correctedReview;
    printSummary(result, "check-no-write");
    console.log(`committed deterministic artifacts: ${matches ? "PASS" : "FAIL"}`);
    process.exitCode =
      result.overall_verdict === "PASS" && matches ? 0 : 1;
  } else {
    writeFileSync(
      path.join(repositoryRoot, resultRelativePath),
      canonicalPrettyJson(result),
      "utf8",
    );
    writeFileSync(
      path.join(repositoryRoot, auditRelativePath),
      canonicalPrettyJson(evidenceAudit),
      "utf8",
    );
    writeFileSync(
      path.join(repositoryRoot, reviewRelativePath),
      correctedReview,
      "utf8",
    );
    printSummary(result, "write-authorized-artifacts");
    console.log(`wrote: ${resultRelativePath}`);
    console.log(`wrote: ${auditRelativePath}`);
    console.log(`wrote: ${reviewRelativePath}`);
    process.exitCode = result.overall_verdict === "PASS" ? 0 : 1;
  }
}
