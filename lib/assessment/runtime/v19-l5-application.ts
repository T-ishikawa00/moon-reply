import { randomUUID } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import { loadV19L5StageCatalog } from "./v19-l5-stage-catalog.ts";
import { loadV19L4StageCatalog } from "./v19-l4-stage-catalog.ts";
import { validateStageOutput, validateGroundedStageOutput } from "./validation.ts";
import { M2RuntimeError, asM2RuntimeError } from "./errors.ts";
import { hashJson } from "./hash.ts";
import { addUsage, emptyUsageTotals } from "./cost.ts";
import { projectBaseProviderInputV1 } from "./base-structured-intake-grounding-v1.ts";
import { groundBaseStructuredIntakeV3 } from "./base-structured-intake-grounding-v3.ts";
import { validateBaseSourceIntegrityV1 } from "./base-source-integrity-v1.ts";
import { validateContextualIntakeIntegrityV3 } from "./contextual-integrity-v3.ts";
import { projectCandidateProviderInputV1 } from "./candidate-analysis-grounding-v1.ts";
import { groundCandidateAnalysisV2 } from "./candidate-analysis-grounding-v2.ts";
import { validateCandidateSourceIntegrityV1 } from "./candidate-source-integrity-v1.ts";
import { buildAbsentCandidateLaneV1, buildAvailableCandidateLaneV1 } from "./split-analysis-envelope-v1.ts";
import { projectCandidateSafetyDispositionV1, evaluateCandidateBoundaryContactV1 } from "./candidate-safety-routing-v1.ts";
import { deterministicSafetyResult } from "./policy.ts";
import { aggregateSafetyV3 } from "./safety-aggregation-v3.ts";
import { deriveRuntimeEligibilityV3, validateEligibilityProjectionV3 } from "./eligibility-v3.ts";
import { buildEffectiveAssessmentAuthorityV1 } from "./effective-assessment-authority-v1.ts";
import { validateEffectiveAssessmentAuthorityIntegrityV1 } from "./effective-assessment-authority-integrity-v1.ts";
import { validateV19L5Intent, classifyV19L5Route, evaluateV19L5Sufficiency, buildV19L5EffectiveDecisionPolicy } from "./v19-l5-intent-policy.ts";
import { projectSplitDecisionFacts, validateSplitDecisionPlan } from "./v19-l5-plan-validation.ts";
import { createActionContextV1, createContactConstraintPolicyV1 } from "./runtime-authority-v1.ts";
import { validateDecisionPlanConstraintIntegrityV1 } from "./decision-plan-constraint-integrity-v1.ts";
import { canonicalizeDecisionPlanFactReferencesV1 } from "./decision-plan-fact-reference-canonicalization-v1.ts";
import { groundReportContentV3 } from "./report-grounding-v3.ts";
import { groundChangeConditionCommentaryV4 } from "./change-condition-grounding-v4.ts";
import { validateProductSemanticShapeV1 } from "./product-semantic-shape-v1.ts";
import { evaluateV19L5SelectedRequestProductCompleteness } from "./v19-l5-request-completeness.ts";
import { evaluateDraftSourceIntegrityV2 } from "./draft-source-integrity-v2.ts";
import { evaluateCustomerSurfaceIntegrityV1 } from "./customer-surface-integrity-v1.ts";
import { evaluateSemanticFindingsV7 } from "./semantic-disposition-v7.ts";
import { hasMaterialReportFactFindingV1, buildReportFactRepairContextV1, buildReportFactRepairInputV1, applyReportFactRepairPatchV1, assertReportFactRepairVerifiedV1 } from "./report-fact-repair-v1.ts";
import { validateJpy980ProductScopeV1 } from "./jpy980-product-scope-validation-v1.ts";
import type { V19L5BaseIntentEnvelope, V19L5PlanEnvelope, V19L5ReportEnvelope, V19L5MessagePlan, V19L5MessageContent } from "./v19-l5-types.ts";
import type { AiStageTransport, AssessmentInput, JsonObject, M2StageId, StageDefinition, StageRequest, StageResponse, UsageTotals, SplitCompletedAssessment, SplitReportContentV2, ReportContent, DecisionPlan } from "./types.ts";

type Catalog = Awaited<ReturnType<typeof loadV19L5StageCatalog>>;
const json = (value: unknown) => value as JsonObject;
function check(ok: unknown, code: string): asserts ok { if (!ok) throw new M2RuntimeError(code); }
export type V19L5StageEvidence = { stageId: M2StageId; attempt: 1 | 2; request: StageRequest; response: StageResponse | null; error: string | null };
export type V19L5Result = {
  schemaVersion: "v19-l5-local-result-v1";
  finalState: "completed" | "clarification" | "stopped" | "purchase_ready";
  answerMode: "message_only" | "decision_guidance" | null;
  decisionResult: SplitCompletedAssessment | null;
  messageResult: { plan: V19L5MessagePlan; content: V19L5MessageContent } | null;
  clarification: { target: string; question: string } | null;
  stopFinding: string | null;
  usage: UsageTotals;
  evidence: {
    identity: { catalogVersion: string; promptBundleVersion: string; schemaSetVersion: string };
    inputHash: string; input: AssessmentInput; stages: V19L5StageEvidence[];
    baseIntake: JsonObject | null; requestIntent: JsonObject | null; inputSufficiency: JsonObject | null;
    repair: { eligible: boolean; executed: boolean; reason: string; context: JsonObject | null; verified: boolean };
    finalPlan: JsonObject | null; finalReport: JsonObject | null; findings: JsonObject[];
    originalProvenance: { source: "initial_optional_message" | "original_message_clarification"; hash: string } | null;
  };
};

/** Explicit local successor. No database, Paid snapshot, Production factory or
 * default Provider exists here. Callers supply a bounded transport and persist
 * the returned evidence in their local evaluation store. Old runtimes are intact. */
export class V19L5LocalApplication {
  private readonly options: { catalog: Catalog; transport: AiStageTransport; now: () => string; timeZone: string };
  private used = false;
  private pendingOriginal: { input: AssessmentInput; base: V19L5BaseIntentEnvelope } | null = null;
  constructor(options: { catalog: Catalog; transport: AiStageTransport; now: () => string; timeZone: string }) {
    this.options = { ...options, catalog: structuredClone(options.catalog) };
  }
  async submit(input: AssessmentInput): Promise<V19L5Result> {
    check(!this.used, "V19_L5_SESSION_ALREADY_USED"); this.used = true;
    return this.execute(structuredClone(input));
  }
  /** Explicit candidate preparation: stop before paid PB-04, retain validated
   * upstream requests/outputs. Production selection remains outside this class. */
  async prepare(input: AssessmentInput): Promise<V19L5Result> {
    check(!this.used, "V19_L5_SESSION_ALREADY_USED"); this.used = true;
    return this.execute(structuredClone(input), undefined, true);
  }
  /** Revalidate and reuse the immutable purchase-ready checkpoint. Replayed
   * stages are compared byte-for-byte to their reconstructed contract/input;
   * only PB-04 onward may invoke the supplied paid transport. */
  async fulfillPrepared(checkpoint: V19L5Result): Promise<V19L5Result> {
    check(!this.used, "V19_L5_SESSION_ALREADY_USED"); this.used = true;
    check(checkpoint.finalState === "purchase_ready" && checkpoint.stopFinding === null &&
      checkpoint.evidence.inputHash === hashJson(checkpoint.evidence.input), "V19_L5_CHECKPOINT_INVALID");
    return this.execute(structuredClone(checkpoint.evidence.input), undefined, false, checkpoint);
  }
  /** One original-message answer, bound to this instance's retained Base.
   * Re-analyzes the supplied original and Safety; never rewrites Base facts. */
  async provideOriginalMessage(original: string): Promise<V19L5Result> {
    const pending = this.pendingOriginal; this.pendingOriginal = null;
    check(pending && typeof original === "string" && original.trim().length > 0, "V19_L5_ORIGINAL_ANSWER_INVALID");
    return this.execute({ ...pending.input, optionalMessage: original }, pending.base);
  }
  private async execute(request: AssessmentInput, retainedBase?: V19L5BaseIntentEnvelope, prepareOnly = false, checkpoint?: V19L5Result): Promise<V19L5Result> {
    // Full contract equality, including prompt text and subsidiary repair contract,
    // is checked before every session, not just a caller-supplied version label.
    const expected = await loadV19L5StageCatalog();
    check(isDeepStrictEqual(this.options.catalog, expected), "V19_L5_RUNTIME_IDENTITY_MISMATCH");
    validateJpy980ProductScopeV1(request);
    const old = await loadV19L4StageCatalog();
    const def = (stageId: M2StageId) => expected.definitions.find(d => d.stageId === stageId)!;
    const oldDef = (stageId: M2StageId) => old.definitions.find(d => d.stageId === stageId)!;
    const stages: V19L5StageEvidence[] = [];
    const requestId = randomUUID(), runId = randomUUID();
    const result: V19L5Result = {
      schemaVersion: "v19-l5-local-result-v1", finalState: "stopped", answerMode: null,
      decisionResult: null, messageResult: null, clarification: null, stopFinding: null, usage: emptyUsageTotals(),
      evidence: { identity: { catalogVersion: expected.catalogVersion, promptBundleVersion: expected.promptBundleVersion, schemaSetVersion: expected.schemaSetVersion },
        inputHash: hashJson(request), input: structuredClone(request), stages, baseIntake: null, requestIntent: null, inputSufficiency: null,
        repair: { eligible: false, executed: false, reason: "not_requested", context: null, verified: false }, finalPlan: null, finalReport: null, findings: [],
        originalProvenance: request.optionalMessage ? { source: retainedBase ? "original_message_clarification" : "initial_optional_message", hash: hashJson(request.optionalMessage) } : null },
    };
    const invoke = async (stageId: M2StageId, input: JsonObject, attempt: 1 | 2 = 1, patch = false): Promise<JsonObject> => {
      check(stages.filter(s => s.stageId === stageId).length === attempt - 1, "V19_L5_STAGE_SEQUENCE_INVALID");
      check(attempt === 1 || (stageId === "PB-05" || stageId === "PB-06") && result.evidence.repair.executed, "V19_L5_ATTEMPT_NOT_AUTHORIZED");
      const normal = def(stageId), definition: StageDefinition = patch ? { ...normal, ...normal.reportFactRepair! } : normal;
      check(!patch || stageId === "PB-05" && attempt === 2 && normal.reportFactRepair, "V19_L5_PATCH_NOT_AUTHORIZED");
      const q: StageRequest = { stageId, model: "gpt-5.6-luna", developerPrompt: definition.developerPrompt, promptVersion: definition.promptVersion,
        promptHash: definition.promptHash, schemaName: definition.schemaName, schemaVersion: definition.schemaVersion, schemaHash: definition.schemaHash, outputSchema: definition.outputSchema, input: structuredClone(input) };
      const evidence: V19L5StageEvidence = { stageId, attempt, request: structuredClone(q), response: null, error: null }; stages.push(evidence);
      try {
        const upstream = ["PB-01", "PB-01C", "PB-02", "PB-03"].includes(stageId);
        const saved = checkpoint && upstream ? checkpoint.evidence.stages.filter(s => s.stageId === stageId) : null;
        if (saved) check(saved.length === 1 && saved[0].attempt === 1 && saved[0].error === null &&
          saved[0].response && isDeepStrictEqual(saved[0].request, q), "V19_L5_CHECKPOINT_CONTRACT_MISMATCH");
        const response = saved ? saved[0].response! : await this.options.transport.invoke(q); evidence.response = structuredClone(response);
        if (!saved) result.usage = addUsage(result.usage, response.usage);
        check(response.returnedModel === q.model, "M2_STAGE_MODEL_MISMATCH");
        const output = structuredClone(response.output);
        if (stageId === "PB-04" && output.decision_plan) output.decision_plan = canonicalizeDecisionPlanFactReferencesV1(json(output.decision_plan));
        validateStageOutput(definition, output); return output;
      } catch (error) { evidence.error = asM2RuntimeError(error).safeCode; throw error; }
    };
    try {
      const providerInput = projectBaseProviderInputV1(request);
      const envelope = retainedBase ?? await invoke("PB-01", json({ run_mode: "initial_base", base_provider_input: providerInput })) as unknown as V19L5BaseIntentEnvelope;
      validateStageOutput(def("PB-01"), json(envelope));
      validateBaseSourceIntegrityV1({ input: providerInput, baseProviderRequest: providerInput, rawBaseOutput: envelope.base_intake });
      const base = groundBaseStructuredIntakeV3(providerInput, envelope.base_intake);
      validateGroundedStageOutput(oldDef("PB-01"), base);
      validateBaseSourceIntegrityV1({ input: providerInput, groundedBaseOutput: base }); validateContextualIntakeIntegrityV3(base);
      const intent = validateV19L5Intent({ intent: envelope.request_intent, baseStructuredIntake: base, currentSituation: request.currentSituation });
      result.evidence.baseIntake = base; result.evidence.requestIntent = json(intent);
      let lane = buildAbsentCandidateLaneV1();
      if (request.optionalMessage?.trim()) {
        const output = await invoke("PB-01C", json(projectCandidateProviderInputV1(request.optionalMessage)));
        validateCandidateSourceIntegrityV1({ rawCandidateProviderOutput: output });
        const grounded = groundCandidateAnalysisV2(output);
        lane = buildAvailableCandidateLaneV1(grounded.candidate_analysis, grounded.candidate_safety_result);
      }
      const candidate = lane.candidate_envelope, deterministic = deterministicSafetyResult(request);
      const modelSafety = await invoke("PB-02", json({ base_structured_intake: base, deterministic_rule_result: deterministic, candidate_safety_result: lane.candidate_safety_result }));
      const candidateSafety = lane.candidate_safety_result ? projectCandidateSafetyDispositionV1(lane.candidate_safety_result) : { classification: "normal_allowed" as const, reason_codes: [], response_mode: "none" as const };
      const aggregate = aggregateSafetyV3(aggregateSafetyV3(deterministic, modelSafety, candidateSafety), json(evaluateCandidateBoundaryContactV1(base, lane.candidate_safety_result)));
      const eligibility = deriveRuntimeEligibilityV3(aggregate);
      const projection = await invoke("PB-03", json({ base_structured_intake: base, aggregate_safety_result: aggregate, application_eligibility_expectation: eligibility }));
      validateEligibilityProjectionV3(projection, eligibility);
      check(aggregate.classification === "normal_allowed", "SAFETY_CLASSIFICATION_NOT_NORMAL");
      const authority = buildEffectiveAssessmentAuthorityV1({ baseStructuredIntake: base, candidateEnvelope: candidate, clarificationGrounding: null });
      validateEffectiveAssessmentAuthorityIntegrityV1({ authority, baseStructuredIntake: base, candidateEnvelope: json(candidate), clarificationGrounding: null });
      const sufficiency = evaluateV19L5Sufficiency({ intent, candidateEnvelope: candidate, originalMessageClarificationAlreadyUsed: Boolean(retainedBase), basePolicyInput: { aggregateSafety: { classification: aggregate.classification }, baseStructuredIntake: base, decisionFacts: json(base.decision_facts), baseWritingSignals: json(base.base_writing_signals) }, clarificationGrounding: null, effectiveAssessmentAuthority: authority });
      result.evidence.inputSufficiency = json(sufficiency);
      if (sufficiency.state === "needs_one_clarifying_answer") {
        check(!retainedBase, "V19_L5_CLARIFICATION_BUDGET_EXHAUSTED");
        const clarification = sufficiency.clarification!;
        result.finalState = "clarification"; result.clarification = { target: clarification.target, question: clarification.question };
        if (clarification.target === "original_message") this.pendingOriginal = { input: structuredClone(request), base: structuredClone(envelope) };
        return result;
      }
      check(sufficiency.state === "full_paid_ready_candidate", "V19_L5_INPUT_NOT_SUFFICIENT");
      const route = classifyV19L5Route({ intent, candidateEnvelope: candidate });
      check(route !== "original_message_clarification", "V19_L5_ORIGINAL_MISSING");
      result.answerMode = route;
      if (prepareOnly) { result.finalState = "purchase_ready"; return result; }
      const effectivePolicy = route === "decision_guidance" ? buildV19L5EffectiveDecisionPolicy({ authority, candidateEnvelope: candidate, intent }) : null;
      const actionContext = createActionContextV1({ trustedNowIso: this.options.now(), timeZone: this.options.timeZone });
      const contactPolicy = createContactConstraintPolicyV1({ baseStructuredIntake: base, followUpException: effectivePolicy?.policy.follow_up_exception ?? "none" });
      const common = { base_structured_intake: base, candidate_envelope: candidate, user_supplied_optional_message: request.optionalMessage,
        request_intent: intent, answer_mode: route, aggregate_safety_result: aggregate, effective_assessment_authority: authority,
        decision_policy_result: effectivePolicy?.policy ?? null, effective_decision_policy_result: effectivePolicy,
        contact_constraint_policy: contactPolicy, action_context: actionContext, requested_topics: request.requestedTopics,
        clarification_consumption_contract: { consumed_effective_paths: [] }, quality_reassessment_directive: null };
      const planEnvelope = await invoke("PB-04", json(common)) as unknown as V19L5PlanEnvelope;
      check(planEnvelope.answer_mode === route, "V19_L5_ANSWER_MODE_MISMATCH");
      result.evidence.finalPlan = json(planEnvelope);
      if (route === "message_only") {
        // The new draft surface inherits the existing deterministic prohibition
        // on drafts when explicit no-followup/unknown contact authority permits
        // neither current nor later contact. Editing is not a bypass.
        check(contactPolicy.outbound_contact_now_allowed || contactPolicy.outbound_contact_after_time_passage_allowed,
          "M2_PLAN_CONSTRAINT_INTEGRITY_FAILED");
        const plan = planEnvelope.message_plan;
        check(plan && planEnvelope.decision_plan === null, "V19_L5_MESSAGE_PLAN_INVALID");
        const edit = intent.message_task === "EDIT_EXISTING_MESSAGE";
        check(edit ? plan.original_text === request.optionalMessage && plan.meaning_preserved === true : plan.original_text === "" && plan.meaning_preserved === false, "V19_L5_EDIT_SOURCE_INVALID");
        const facts = new Set((base.observed_facts as JsonObject[]).map(f => f.fact_id));
        check(plan.supporting_fact_ids.every(id => facts.has(id)), "V19_L5_EDIT_EVIDENCE_INVALID");
        const report = await invoke("PB-05", json({ ...common, decision_plan: null, message_plan: plan })) as unknown as V19L5ReportEnvelope;
        check(report.answer_mode === route && report.report_content === null && report.message_content, "V19_L5_ANSWER_MODE_MISMATCH");
        result.evidence.finalReport = json(report);
        const validation = await invoke("PB-06", json({ ...common, decision_plan: null, message_plan: plan, report_content: null, message_content: report.message_content, report_fact_repair_context: null }));
        check(validation.validation_mode === "semantic_findings_only" && validation.report_fact_repair_verification === null, "M2_SEMANTIC_VALIDATION_FAILED");
        result.evidence.findings = validation.semantic_checks as JsonObject[];
        // Retain only minor editorial observations about an existing explanation
        // leaf. No material finding, draft/meaning/Safety issue or unknown path is
        // waived, and Decision-only temporal exceptions cannot apply here.
        check(result.evidence.findings.every(finding => {
          const match = /^message_content\.(opening|edit_reason|closing)$/u.exec(String(finding.json_path).replace(/^\$\./u, ""));
          return finding.severity === "minor" && ["BRAND_TONE", "TEMPLATE_GENERICITY", "REPETITION"].includes(String(finding.finding_code)) &&
            match !== null && typeof json(report.message_content)[match[1]] === "string";
        }), "V19_L5_MESSAGE_VALIDATION_FAILED");
        result.evidence.repair.reason = "message_only_outside_l4_report_scope";
        result.messageResult = { plan, content: report.message_content }; result.finalState = "completed"; return result;
      }
      const plan = planEnvelope.decision_plan;
      check(plan && planEnvelope.message_plan === null && effectivePolicy, "V19_L5_DECISION_PLAN_INVALID");
      validateStageOutput(oldDef("PB-04"), json(plan));
      const knownPlanFacts = new Set((base.observed_facts as JsonObject[]).map(fact => fact.fact_id));
      check(plan.decision_reason_fact_ids.every(id => knownPlanFacts.has(id)), "MATERIAL_REASON_SOURCE_INTEGRITY");
      validateSplitDecisionPlan(plan, effectivePolicy.policy, candidate, { deferDraftSourceIntegrity: true });
      validateDecisionPlanConstraintIntegrityV1({ decisionPlan: plan, contactConstraintPolicy: contactPolicy, actionContext });
      if (intent.message_task === "EDIT_EXISTING_MESSAGE") check(plan.recommended_message_draft && plan.message_draft_edit_metadata?.preserved_meaning, "V19_L5_MIXED_EDIT_DROPPED");
      const reportEnvelope = await invoke("PB-05", json({ ...common, decision_plan: plan, message_plan: null })) as unknown as V19L5ReportEnvelope;
      check(reportEnvelope.answer_mode === route && reportEnvelope.report_content && reportEnvelope.message_content === null, "V19_L5_ANSWER_MODE_MISMATCH");
      let rawReport = reportEnvelope.report_content;
      const facts = projectSplitDecisionFacts(base, candidate);
      const ground = (raw: SplitReportContentV2) => groundChangeConditionCommentaryV4(plan as unknown as DecisionPlan, groundReportContentV3(facts, raw as unknown as ReportContent)) as unknown as SplitReportContentV2;
      let report = ground(rawReport);
      const localDefects = (content: SplitReportContentV2) => {
        validateStageOutput(oldDef("PB-05"), json(content));
        validateProductSemanticShapeV1({ decisionPlan: plan, reportContent: content });
        return [ ...evaluateV19L5SelectedRequestProductCompleteness({ requestedTopics: request.requestedTopics, candidateEnvelope: candidate, effectiveDecisionPolicy: effectivePolicy, decisionPlan: plan, reportContent: content }).defects,
          ...evaluateDraftSourceIntegrityV2({ candidateEnvelope: candidate, optionalMessage: request.optionalMessage, requestedTopics: request.requestedTopics, decisionPolicy: effectivePolicy.policy, decisionPlan: plan }),
          ...evaluateCustomerSurfaceIntegrityV1({ decisionPlan: plan, reportContent: content }) ];
      };
      const defects = localDefects(report);
      const validation = await invoke("PB-06", json({ ...common, decision_plan: plan, message_plan: null, message_content: null, report_content: report, report_fact_repair_context: null }));
      check(validation.validation_mode === "semantic_findings_only" && validation.report_fact_repair_verification === null, "M2_SEMANTIC_VALIDATION_FAILED");
      const disposition = evaluateSemanticFindingsV7({ validationOutput: validation, decisionPlan: plan, groundedReportContent: report, decisionFacts: facts });
      result.evidence.findings = validation.semantic_checks as JsonObject[];
      result.evidence.finalReport = json(report);
      if (hasMaterialReportFactFindingV1(disposition.findingDispositions)) {
        const context = buildReportFactRepairContextV1({ decisionPlan: plan, reportContent: rawReport, groundedReportContent: report, baseStructuredIntake: base, findingDispositions: disposition.findingDispositions, localDefects: defects });
        result.evidence.repair.reason = context ? "eligible_single_report_fact" : "l4_eligibility_not_met";
        check(context, "M2_REPORT_FACT_REPAIR_INELIGIBLE");
        result.evidence.repair = { eligible: true, executed: true, reason: "eligible_single_report_fact", context: json(context), verified: false };
        const patch = await invoke("PB-05", json({ ...common, decision_plan: plan, report_fact_repair_context: buildReportFactRepairInputV1(context) }), 2, true);
        rawReport = applyReportFactRepairPatchV1({ context, patch, decisionPlan: plan, baseStructuredIntake: base }); report = ground(rawReport);
        const postDefects = localDefects(report);
        const post = await invoke("PB-06", json({ ...common, decision_plan: plan, message_plan: null, message_content: null, report_content: report, report_fact_repair_context: buildReportFactRepairInputV1(context, report) }), 2);
        check(post.validation_mode === "semantic_findings_only", "M2_SEMANTIC_VALIDATION_FAILED");
        const postDisposition = evaluateSemanticFindingsV7({ validationOutput: post, decisionPlan: plan, groundedReportContent: report, decisionFacts: facts });
        assertReportFactRepairVerifiedV1({ context, repairedReport: rawReport, groundedRepairedReport: report, decisionPlan: plan, baseStructuredIntake: base, validationOutput: post, findingDispositions: postDisposition.findingDispositions, localDefects: postDefects });
        result.evidence.repair.verified = true; result.evidence.findings = post.semantic_checks as JsonObject[];
      } else {
        // No broad F007 recovery or exhaustion allowance in this local candidate.
        check(defects.length === 0 && disposition.blockingFindings.length === 0 && disposition.findingDispositions.every(f => f.disposition === "ignored" || f.finding.severity === "minor"), "V19_L5_MATERIAL_DELIVERY_BLOCKED");
        result.evidence.repair.reason = "no_eligible_material_report_fact";
      }
      result.evidence.finalReport = json(report);
      const fixedLimitation = "このノートは入力された情報を整理した判断材料です。相手の本心や将来を断定・保証せず、医療・心理・法律上の助言を代替しません。";
      result.decisionResult = { requestId, runId, eligibility: "ready", decision: plan.selected_decision, usage: result.usage,
        report: { schemaVersion: "m2-p4-split-runtime-report-v1", decisionPlan: plan, content: report, fixedLimitation },
        decisionCard: { schemaVersion: "m2-p3-decision-card-v1", decision: plan.selected_decision, reason: report.decision_reason_summary, actionsToTake: plan.actions_to_take, actionsToAvoid: plan.actions_to_avoid, messageDraft: plan.recommended_message_draft?.text ?? null, reviewTiming: plan.review_timing.when } };
      result.finalState = "completed"; return result;
    } catch (error) {
      result.stopFinding = asM2RuntimeError(error).safeCode;
      result.finalState = "stopped"; result.decisionResult = null; result.messageResult = null;
      return result;
    }
  }
}
