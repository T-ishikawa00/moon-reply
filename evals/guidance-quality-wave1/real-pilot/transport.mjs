import { writeFileSync, openSync, fsyncSync, closeSync } from "node:fs";
import { performance } from "node:perf_hooks";
import path from "node:path";
import { PilotStop, accountUsage, hash } from "./budget.mjs";
import { evaluationOutputSchema } from "../../paid-delivery-step1c/adapter.mjs";
import { validateStageOutput } from "../../../lib/assessment/runtime/validation.ts";
import { canonicalizeDecisionPlanFactReferencesV1 } from "../../../lib/assessment/runtime/decision-plan-fact-reference-canonicalization-v1.ts";
import { evaluateDraftSourceIntegrityV2 } from "../../../lib/assessment/runtime/draft-source-integrity-v2.ts";
import { evaluateSemanticFindingsV7 } from "../../../lib/assessment/runtime/semantic-disposition-v7.ts";

export function durableJson(file, value) {
  writeFileSync(file, JSON.stringify(value, null, 2) + "\n", { encoding: "utf8", flag: "wx" });
  const fd = openSync(file, "r+"); try { fsyncSync(fd); } finally { closeSync(fd); }
}
export function buildBody(q, cap) {
  const schema = evaluationOutputSchema(q.outputSchema);
  return { model: "gpt-5.6-luna", store: false, tools: [], stream: false, background: false, service_tier: "default", truncation: "disabled", reasoning: { effort: "low" }, max_output_tokens: cap.outputIncludingReasoning,
    input: [{ role: "developer", content: [{ type: "input_text", text: q.developerPrompt }] }, { role: "user", content: [{ type: "input_text", text: JSON.stringify(q.input) }] }],
    text: { format: { type: "json_schema", name: q.schemaName, strict: true, schema } } };
}
export function reviewStage(q, rawOutput, definition, originalInput) {
  const output = q.stageId === "PB-04" ? canonicalizeDecisionPlanFactReferencesV1(rawOutput) : rawOutput;
  validateStageOutput(definition, output);
  if (q.stageId === "PB-04") {
    const defects = evaluateDraftSourceIntegrityV2({ candidateEnvelope: q.input.candidate_envelope, optionalMessage: originalInput.optionalMessage,
      requestedTopics: originalInput.requestedTopics, decisionPolicy: q.input.decision_policy_result, decisionPlan: output });
    if (defects.length) return { stopReason: "MATERIAL_DRAFT_SOURCE_INTEGRITY", findings: defects };
    // Fact IDs reference actual Base observations, not a model-created source.
    const known = new Set(q.input.base_structured_intake.observed_facts.map(f => f.fact_id));
    if (output.decision_reason_fact_ids.some(id => !known.has(id))) return { stopReason: "MATERIAL_REASON_SOURCE_INTEGRITY", findings: [{ path: "decision_reason_fact_ids", issue: "Reference to a nonexistent Base observation" }] };
  }
  if (q.stageId === "PB-06") {
    // Match the existing pipeline's projection; do not turn an ignored temporal
    // false positive into a new runtime quality rule.
    const facts = structuredClone(q.input.base_structured_intake.decision_facts);
    delete facts.user_contact_constraint; facts.schema_version = "m2-p4-decision-facts-v2";
    facts.contact_state.proposed_message_present = q.input.candidate_envelope.presence;
    const disposition = evaluateSemanticFindingsV7({ validationOutput: output, decisionPlan: q.input.decision_plan, groundedReportContent: q.input.report_content, decisionFacts: facts });
    // These describe material errors in facts, ownership, certainty, present
    // actions or contact boundaries. Style/completeness findings use the
    // existing single repair. This is pilot termination, not a classifier edit.
    const material = new Set(["FACT_FIDELITY", "ASSUMPTION_AS_FACT", "UNSUPPORTED_CERTAINTY", "SAFETY_REGRESSION", "MESSAGE_POLICY_CONSISTENCY", "ACTION_CONSISTENCY", "DECISION_ALLOWED"]);
    const findings = disposition.blockingFindings.filter(f => material.has(f.finding_code) && ["major", "critical"].includes(f.severity));
    return { stopReason: findings.length ? "MATERIAL_SAFETY_OR_INTEGRITY_FINDING" : null, findings, disposition };
  }
  return { stopReason: null, findings: [] };
}

export class EvaluationTransport {
  constructor({ session, ledger, repository, definitions, originalInput, directory, send, reviewReceipt }) {
    Object.assign(this, { session, ledger, repository, definitions, originalInput, directory, send, reviewReceipt });
    this.requests = []; this.responses = []; this.findings = []; this.httpCalls = 0;
  }
  async invoke(q) {
    let reservation = null, settled = false;
    try {
      if (this.ledger.stopReason) throw new PilotStop(this.ledger.stopReason);
      const def = this.definitions.find(d => d.stageId === q.stageId);
      if (q.model !== "gpt-5.6-luna" || !def || ["promptHash", "promptVersion", "schemaHash", "schemaVersion", "schemaName", "developerPrompt"].some(k => def[k] !== q[k]) || hash(def.outputSchema) !== hash(q.outputSchema)) throw new PilotStop("RUNTIME_CONTRACT_IDENTITY_MISMATCH");
      const processing = [...this.repository.stageRuns.values()].filter(s => s.status === "processing" && s.stageId === q.stageId);
      if (processing.length !== 1) throw new PilotStop("BUDGET_STAGE_ACCOUNTING_MISMATCH");
      const attempt = processing[0].attemptNumber ?? 1;
      const cap = this.ledger.manifest.caps.find(c => c.stage === q.stageId);
      if (!cap || !cap.invocationsPerSession) throw new PilotStop("UNAUTHORIZED_STAGE");
      const body = buildBody(q, cap), inputCeiling = Buffer.byteLength(JSON.stringify(body), "utf8") + 4096;
      reservation = this.ledger.reserve(this.session.sessionId, q.stageId, attempt, inputCeiling, hash(body));
      const prefix = path.join(this.directory, `call-${String(reservation.sequence).padStart(3, "0")}`);
      this.requests.push({ stageId: q.stageId, attempt, input: q.input, requestHash: hash(body), promptHash: q.promptHash, schemaHash: q.schemaHash });
      durableJson(prefix + "-request.json", { stageId: q.stageId, attempt, inputCeiling, reservationNanos: reservation.reservedNanos, requestHash: hash(body), promptHash: q.promptHash, schemaHash: q.schemaHash, input: q.input });
      const start = performance.now();
      const response = await this.send(body, () => { this.ledger.dispatch(reservation); this.httpCalls++; });
      const latencyMs = Math.round(performance.now() - start);
      // Persist received product text and usage BEFORE validation/throwing. No
      // headers, credentials, or hidden reasoning blocks are copied.
      const received = { stageId: q.stageId, attempt, responseId: response.id ?? null, requestId: response._request_id ?? null, returnedModel: response.model ?? null,
        status: response.status ?? null, incompleteReason: response.incomplete_details?.reason ?? null, serviceTier: response.service_tier ?? null, usage: response.usage ?? null, outputText: response.output_text ?? null, latencyMs };
      durableJson(prefix + "-response.json", received); this.responses.push(received);
      let accounting;
      try { accounting = accountUsage(response.usage, cap, inputCeiling); }
      catch (error) { this.ledger.settle(reservation, { status: "usage_invalid", stopReason: error.safeCode }); settled = true; throw error; }
      this.ledger.settle(reservation, { status: "received", accounting, requestId: received.requestId }); settled = true;
      if (response.model !== "gpt-5.6-luna") throw new PilotStop("MODEL_IDENTITY_MISMATCH");
      if (response.service_tier !== "default") throw new PilotStop("SERVICE_TIER_MISMATCH");
      if (response.status !== "completed") throw new PilotStop("INCOMPLETE_RESPONSE");
      if (!response.output_text) throw new PilotStop("PROVIDER_OUTPUT_MISSING_OR_REFUSAL");
      let output; try { output = JSON.parse(response.output_text); } catch { throw new PilotStop("SCHEMA_INVALID_JSON"); }
      const review = reviewStage(q, output, def, this.originalInput);
      durableJson(prefix + "-review.json", review);
      this.findings.push({ stageId: q.stageId, attempt, ...review });
      if (review.stopReason) throw new PilotStop(review.stopReason);
      // Optional evaluation-only semantic checkpoint. Usage is already durable;
      // no next stage/repair can dispatch until this check returns successfully.
      try { await this.reviewReceipt?.({ session: this.session, stageId: q.stageId, attempt, prefix, received, review }); }
      catch (error) {
        if (error.safeCode === "MATERIAL_MANUAL_INTEGRITY_OR_SAFETY") this.findings.push({ stageId: q.stageId, attempt,
          stopReason: error.safeCode, findings: [{ source: "evaluation_receipt_inspection", detail: error.inspectionReason ?? "Material integrity or Safety issue in the saved receipt." }] });
        throw error;
      }
      return { responseId: response.id, returnedModel: response.model, output, usage: { inputTokens: accounting.inputTokens, outputTokens: accounting.outputTokens, cachedTokens: accounting.cachedTokens, reasoningTokens: accounting.reasoningTokens }, latencyMs };
    } catch (error) {
      let reason = error.safeCode ?? (error.name === "APIConnectionTimeoutError" || error.name === "AbortError" ? "HTTP_TIMEOUT" : typeof error.status === "number" ? `HTTP_FAILURE_${error.status}` : "HTTP_OR_EVALUATION_FAILURE");
      try { if (reservation && !settled) this.ledger.settle(reservation, { status: "unknown_or_failed", stopReason: reason }); }
      catch { reason = "BUDGET_LEDGER_IO_FAILURE"; }
      this.ledger.stop(reason);
      throw new PilotStop(reason);
    }
  }
}
