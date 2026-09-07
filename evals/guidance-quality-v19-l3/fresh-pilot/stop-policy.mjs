// Evaluation-only stop routing. All reservations and usage stay in ONE shared
// ledger. A session stop cannot be resumed, retried, repaired or refunded.
import { isDeepStrictEqual } from "node:util";
import { PilotStop, hash } from "../../guidance-quality-wave1/real-pilot/budget.mjs";
import { buildBody } from "../../guidance-quality-wave1/real-pilot/transport.mjs";
import { validateStageOutput } from "../../../lib/assessment/runtime/validation.ts";
import { canonicalizeDecisionPlanFactReferencesV1 } from "../../../lib/assessment/runtime/decision-plan-fact-reference-canonicalization-v1.ts";

const materialCodes = new Set([
  "MATERIAL_DRAFT_SOURCE_INTEGRITY", "MATERIAL_REASON_SOURCE_INTEGRITY",
  "MATERIAL_SAFETY_OR_INTEGRITY_FINDING", "MATERIAL_MANUAL_INTEGRITY_OR_SAFETY",
  "SAFETY_BLOCKED",
]);
const stageMaterialCodes = new Map([
  ["M2_BASE_SOURCE_INTEGRITY_FAILED", new Set(["PB-01"])],
  ["M2_CANDIDATE_SOURCE_INTEGRITY_FAILED", new Set(["PB-01C", "PB-04"])],
  ["M2_PLAN_POLICY_VIOLATION", new Set(["PB-04"])],
]);
const checkedModelResponse = p => p?.requestIdentityVerified === true &&
  p.model === "gpt-5.6-luna" && p.serviceTier === "default" &&
  p.accounted === true && p.settlementStatus === "received";

/** No substring or severity-based broad routing. Unknown errors stop the batch. */
export function classifyStop(reason, provenance = null) {
  if (materialCodes.has(reason)) return { scope: "session", category: "material_quality_or_safety" };
  const stages = stageMaterialCodes.get(reason);
  if (stages?.has(provenance?.stageId) && checkedModelResponse(provenance) && provenance.status === "completed" && provenance.outputValidation === "valid") {
    return { scope: "session", category: "stage_output_integrity" };
  }
  if (checkedModelResponse(provenance)) {
    if (reason === "INCOMPLETE_RESPONSE" && provenance.status === "incomplete") {
      return { scope: "session", category: "model_output_incomplete" };
    }
    if (provenance.status === "completed") {
      if (reason === "PROVIDER_OUTPUT_MISSING_OR_REFUSAL" && provenance.outputValidation === "missing") {
        return { scope: "session", category: "model_output_missing_or_refusal" };
      }
      if (reason === "SCHEMA_INVALID_JSON" && provenance.outputValidation === "invalid_json") {
        return { scope: "session", category: "model_output_invalid_json" };
      }
      if (reason === "M2_STAGE_SCHEMA_INVALID" && provenance.outputValidation === "schema_invalid") {
        return { scope: "session", category: "model_output_schema_invalid" };
      }
    }
  }
  return { scope: "global", category: "infrastructure_authority_or_unclassified" };
}

export function rawActionConsistencyFindings(output) {
  return Array.isArray(output?.semantic_checks)
    ? output.semantic_checks.filter(f => f?.finding_code === "ACTION_CONSISTENCY" && ["major", "critical"].includes(f.severity))
    : [];
}

/** Run before the ordinary receipt inspector; never alter the runtime finding. */
export function assertNoRawActionConsistency(receipt) {
  if (receipt.stageId !== "PB-06") return;
  const findings = rawActionConsistencyFindings(JSON.parse(receipt.received.outputText));
  if (findings.length) {
    const error = new PilotStop("MATERIAL_MANUAL_INTEGRITY_OR_SAFETY");
    error.inspectionReason = "Fresh pilot session STOP: raw PB06 ACTION_CONSISTENCY major/critical, including an ignored temporal finding. No repair or retry.";
    error.materialFindings = findings;
    throw error;
  }
}

export class SessionLedger {
  constructor(shared, { sessionId, definitions }) {
    this.shared = shared;
    this.sessionId = sessionId;
    this.definitions = new Map(definitions.map(d => [d.stageId, d]));
    this.sessionStopReason = null;
    this.stopRecords = [];
    this.pendingReservation = null;
    this.provenance = null;
  }
  get manifest() { return this.shared.manifest; }
  get calls() { return this.shared.calls; }
  get stopReason() { return this.shared.stopReason ?? this.sessionStopReason; }
  get globalStopReason() { return this.shared.stopReason; }

  failGlobal(reason) {
    this.shared.stop(reason);
    throw new PilotStop(reason);
  }
  requireOwnSession(sessionId) {
    if (sessionId !== this.sessionId) this.failGlobal("BUDGET_SESSION_IDENTITY_MISMATCH");
  }
  requireRunning() {
    if (this.stopReason) throw new PilotStop(this.stopReason);
  }
  start(sessionId) {
    this.requireOwnSession(sessionId); this.requireRunning();
    return this.shared.start(sessionId);
  }
  reserve(sessionId, stageId, attempt, inputCeiling, requestHash) {
    this.requireOwnSession(sessionId); this.requireRunning();
    if (![1, 2].includes(attempt)) this.failGlobal("UNAUTHORIZED_STAGE_ATTEMPT");
    const reservation = this.shared.reserve(sessionId, stageId, attempt, inputCeiling, requestHash);
    this.pendingReservation = reservation;
    // Never let a previous successful response explain a later failure.
    this.provenance = null;
    return reservation;
  }
  dispatch(reservation) {
    this.requireRunning();
    if (reservation.sequence !== this.pendingReservation?.sequence) this.failGlobal("BUDGET_DISPATCH_PROVENANCE_MISMATCH");
    return this.shared.dispatch(reservation);
  }
  settle(reservation, settlement) {
    if (reservation.sequence !== this.pendingReservation?.sequence) this.failGlobal("BUDGET_SETTLEMENT_PROVENANCE_MISMATCH");
    const result = this.shared.settle(reservation, settlement);
    if (this.provenance?.reservationSequence === reservation.sequence) {
      this.provenance.accounted = settlement.accounting !== null && settlement.accounting !== undefined;
      this.provenance.settlementStatus = settlement.status;
    }
    return result;
  }
  finish(sessionId, status) {
    this.requireOwnSession(sessionId);
    return this.shared.finish(sessionId, status);
  }
  stop(reason) {
    const classification = classifyStop(reason, this.provenance);
    if (classification.scope === "session") {
      if (!this.sessionStopReason) {
        this.sessionStopReason = reason;
        this.stopRecords.push({ reason, ...classification, provenance: this.provenance ? structuredClone(this.provenance) : null });
      }
    } else {
      this.stopRecords.push({ reason, ...classification, provenance: this.provenance ? structuredClone(this.provenance) : null });
      this.shared.stop(reason);
    }
  }

  /**
   * The caller's send wrapper invokes this once after a real/fake response is
   * received and before returning it to unchanged EvaluationTransport. It does
   * not stop or validate usage; transport still records the receipt and settles
   * usage before stop(). Only hashes/validation provenance are retained here.
   */
  noteResponse(body, response) {
    const reservation = this.pendingReservation;
    if (!reservation || this.provenance) this.failGlobal("RESPONSE_PROVENANCE_CONFLICT");
    const call = this.shared.calls.find(c => c.sequence === reservation.sequence);
    if (!call?.dispatched || call.status !== "reserved" || hash(body) !== reservation.requestHash) this.failGlobal("RESPONSE_REQUEST_PROVENANCE_MISMATCH");
    const definition = this.definitions.get(reservation.stageId);
    const cap = this.manifest.caps.find(c => c.stage === reservation.stageId);
    if (!definition || !cap) this.failGlobal("RESPONSE_STAGE_DEFINITION_MISSING");
    // Rebuild from the exact authorized definition and actual serialized user
    // input, so malformed prompt/schema configuration cannot become a session
    // schema failure. buildBody errors deliberately retain GLOBAL provenance.
    let input, expected;
    try {
      input = JSON.parse(body.input[1].content[0].text);
      expected = buildBody({ ...definition, input }, cap);
    } catch { this.failGlobal("RESPONSE_REQUEST_CONFIGURATION_INVALID"); }
    if (!isDeepStrictEqual(body, expected)) this.failGlobal("RESPONSE_REQUEST_IDENTITY_MISMATCH");
    const p = {
      reservationSequence: reservation.sequence, stageId: reservation.stageId,
      attempt: reservation.attempt, requestHash: reservation.requestHash,
      promptHash: definition.promptHash, schemaHash: definition.schemaHash,
      requestIdentityVerified: true, model: response?.model ?? null,
      serviceTier: response?.service_tier ?? null, status: response?.status ?? null,
      outputHash: typeof response?.output_text === "string" ? hash(response.output_text) : null,
      outputValidation: "not_checked", accounted: false, settlementStatus: null,
    };
    if (!response?.output_text) p.outputValidation = "missing";
    else {
      let output;
      try { output = JSON.parse(response.output_text); }
      catch { p.outputValidation = "invalid_json"; }
      if (p.outputValidation !== "invalid_json") {
        try {
          const canonical = reservation.stageId === "PB-04" ? canonicalizeDecisionPlanFactReferencesV1(output) : output;
          validateStageOutput(definition, canonical);
          p.outputValidation = "valid";
        } catch (error) {
          // A compile/config error, canonicalizer error or other Application
          // failure is not proven malformed model output.
          p.outputValidation = error?.safeCode === "M2_STAGE_SCHEMA_INVALID" ? "schema_invalid" : "validation_configuration_or_application_error";
        }
      }
    }
    this.provenance = p;
    return structuredClone(p);
  }
}
