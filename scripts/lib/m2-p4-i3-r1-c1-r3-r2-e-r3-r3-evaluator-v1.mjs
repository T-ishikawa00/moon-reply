import { createHash } from "node:crypto";

const READY_CASES = new Set(["E-R3-01", "E-R3-02", "E-R3-04", "E-R3-05", "E-R3-06"]);
const UNSUPPORTED_CERTAINTY = [
  "必ず返信",
  "必ず返事",
  "きっと返信",
  "きっと返事",
  "確実に",
  "間違いなく",
  "本心は",
  "別れるに違いない",
  "復縁できる",
  "嫌われている",
];

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (isObject(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalize(value[key])]),
    );
  }
  return value;
}

export function canonicalJson(value) {
  return JSON.stringify(canonicalize(value));
}

export function shaDiagnosticJson(value) {
  return createHash("sha256")
    .update(Buffer.from(canonicalJson(value), "utf8"))
    .digest("hex");
}

function same(left, right) {
  return canonicalJson(left) === canonicalJson(right);
}

function strings(value, result = []) {
  if (typeof value === "string") result.push(value);
  else if (Array.isArray(value)) value.forEach((item) => strings(item, result));
  else if (isObject(value)) Object.values(value).forEach((item) => strings(item, result));
  return result;
}

function textOf(value) {
  return strings(value).join("\n");
}

function includesAll(value, literals) {
  return literals.every((literal) => value.includes(literal));
}

function includesAny(value, literals) {
  return literals.some((literal) => value.includes(literal));
}

function exactTimeTokens(value) {
  return value.match(/\d{1,2}(?:時|日)(?:\d{1,2}分)?|\d{1,2}:\d{2}/gu) ?? [];
}

function valuesAt(root, segments) {
  if (segments.length === 0) return [root];
  if (root === null || root === undefined) return [];
  const [head, ...tail] = segments;
  if (head === "*") {
    const values = Array.isArray(root) ? root : isObject(root) ? Object.values(root) : [];
    return values.flatMap((value) => valuesAt(value, tail));
  }
  return valuesAt(root[head], tail);
}

function select(root, path) {
  return valuesAt(root, path.split(".").filter(Boolean));
}

function first(root, path) {
  return select(root, path)[0];
}

function finding({
  caseId,
  layer = "B",
  code,
  stage = "APPLICATION",
  path = "$",
  evidenceIdentity = code,
  detail,
  materiality = "blocking",
}) {
  return {
    case_id: caseId,
    layer,
    finding_code: code,
    originating_stage: stage,
    json_path: path,
    evidence_identity: evidenceIdentity,
    materiality,
    detail,
  };
}

function findingKey(item) {
  return [
    item.case_id,
    item.originating_stage,
    item.finding_code,
    item.json_path,
    item.evidence_identity,
  ].join("|");
}

function dedupeFindings(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = findingKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function pushWhen(findings, condition, details) {
  if (condition) findings.push(finding(details));
}

function finalDraft(plan) {
  return plan?.recommended_message_draft?.text ?? null;
}

function selectedDirection(plan) {
  return plan?.selected_decision ?? null;
}

function immediateStep(plan) {
  return Array.isArray(plan?.actions_to_take) && plan.actions_to_take.length > 0
    ? plan.actions_to_take[0]
    : null;
}

function reassessmentCondition(plan) {
  const phase = plan?.aftercare_plan?.find?.((item) => item.phase === "reassessment_condition");
  return (
    phase?.action ??
    plan?.change_conditions?.[0]?.condition ??
    plan?.review_timing?.when ??
    null
  );
}

function semanticBlockingFindings(evidence) {
  const disposition = evidence?.semantic_disposition;
  if (Array.isArray(disposition?.blockingFindings)) return disposition.blockingFindings;
  if (Array.isArray(disposition?.blocking_findings)) return disposition.blocking_findings;
  return [];
}

function policyAllowsDirection(policy, direction) {
  return Array.isArray(policy?.allowed_decisions) && policy.allowed_decisions.includes(direction);
}

function contactConstraint(base) {
  return base?.decision_facts?.user_contact_constraint ?? null;
}

function observedFactText(base) {
  return textOf(base?.observed_facts ?? []);
}

function boundaryOwnerEvidence(base, expectedOwner) {
  const signals = base?.base_writing_signals?.boundary_ownership_signals ?? [];
  return signals.some(
    (signal) =>
      signal?.asserted_by === expectedOwner ||
      signal?.owner === expectedOwner ||
      signal?.boundary_owner === expectedOwner,
  );
}

function actionContextValid(context, contract) {
  return (
    isObject(context) &&
    typeof context.trusted_now_iso === "string" &&
    context.time_zone === contract.runtime_identity.time_zone &&
    context.authority === "application" &&
    typeof context.action_horizon?.code === "string" &&
    context.action_horizon.user_facing_label_ja === "今夜" &&
    typeof context.action_horizon.starts_at === "string" &&
    typeof context.action_horizon.ends_at === "string"
  );
}

function productOutcomeComplete(plan, report, draftRequired) {
  if (!isObject(plan) || !isObject(report)) return false;
  if (typeof plan.selected_decision !== "string") return false;
  if (!immediateStep(plan) || !reassessmentCondition(plan)) return false;
  if (!Array.isArray(plan.possible_interpretations) || plan.possible_interpretations.length === 0) {
    return false;
  }
  if (draftRequired && typeof finalDraft(plan) !== "string") return false;
  if (!draftRequired && finalDraft(plan) !== null) return false;
  return true;
}

function protocolFindings(caseResult, expectation, auditRow) {
  const findings = [];
  const caseId = caseResult.case_id;
  pushWhen(findings, !auditRow || auditRow.protocol_passed !== true, {
    caseId,
    layer: "A",
    code: "EVIDENCE_INTEGRITY_FAILED",
    stage: "EVIDENCE_AUDITOR",
    path: "$.evidence_audit",
    evidenceIdentity: auditRow?.failure_identity ?? "missing_audit",
    detail: "Independent evidence integrity did not pass.",
  });
  pushWhen(findings, !same(caseResult.actual_stage_path ?? [], expectation.expected_stage_path), {
    caseId,
    layer: "A",
    code: "STAGE_PATH_MISMATCH",
    stage: "PIPELINE",
    path: "$.actual_stage_path",
    detail: "Actual Stage path differs from the frozen case ledger.",
  });
  pushWhen(findings, (caseResult.provider_calls?.length ?? 0) !== expectation.expected_calls, {
    caseId,
    layer: "A",
    code: "PROVIDER_CALL_COUNT_MISMATCH",
    stage: "TRANSPORT",
    path: "$.provider_calls",
    detail: "Provider call count differs from the exact case ledger.",
  });
  return findings;
}

function commonReadyFindings(caseResult, expectation, contract) {
  const findings = [];
  const caseId = caseResult.case_id;
  const evidence = caseResult.evidence ?? {};
  const plan = evidence.decision_plan ?? null;
  const report = evidence.grounded_report_content ?? null;
  const draft = finalDraft(plan);
  const combinedText = textOf({ plan, report });
  const supportedTemporalText = textOf({
    synthetic_input: evidence.synthetic_input,
    action_context: evidence.action_context,
  });
  const disposition = semanticBlockingFindings(evidence);

  pushWhen(findings, !actionContextValid(evidence.action_context, contract), {
    caseId,
    code: "ACTION_CONTEXT_INVALID",
    stage: "APPLICATION",
    path: "$.action_context",
    detail: "Trusted time, timezone, action horizon, or Application authority is missing or invalid.",
  });
  pushWhen(findings, disposition.length !== 0, {
    caseId,
    code: "PB06_BLOCKING_FINDINGS",
    stage: "PB-06",
    path: "$.semantic_disposition.blockingFindings",
    evidenceIdentity: shaDiagnosticJson(disposition),
    detail: "PB-06 has one or more blocking findings.",
  });
  pushWhen(findings, !policyAllowsDirection(evidence.decision_policy_result, selectedDirection(plan)), {
    caseId,
    code: "DECISION_POLICY_DIVERGENCE",
    stage: "PB-04",
    path: "$.decision_plan.selected_decision",
    detail: "Selected direction is not allowed by deterministic Policy.",
  });
  pushWhen(findings, expectation.draft_required && typeof draft !== "string", {
    caseId,
    code: "REQUIRED_DRAFT_MISSING",
    stage: "PB-04",
    path: "$.decision_plan.recommended_message_draft.text",
    detail: "The Policy-compatible ready direction requires a final draft.",
  });
  pushWhen(findings, !expectation.draft_required && draft !== null, {
    caseId,
    code: "FORBIDDEN_DRAFT_PRESENT",
    stage: "PB-04",
    path: "$.decision_plan.recommended_message_draft",
    detail: "A wait or pause direction must not expose a current or later draft.",
  });
  pushWhen(findings, includesAny(combinedText, UNSUPPORTED_CERTAINTY), {
    caseId,
    code: "UNSUPPORTED_CERTAINTY",
    stage: "PB-05",
    path: "$.report_content",
    detail: "Final Product text contains unsupported certainty, inner-state attribution, or a future guarantee.",
  });
  const unsupportedExactTimes = exactTimeTokens(combinedText).filter(
    (token) => !supportedTemporalText.includes(token),
  );
  pushWhen(findings, unsupportedExactTimes.length > 0, {
    caseId,
    code: "UNSUPPORTED_EXACT_TIME",
    stage: "PB-05",
    path: "$.report_content",
    evidenceIdentity: unsupportedExactTimes.join(","),
    detail: "Final Product text invents an exact date or clock time absent from Base and action_context.",
  });
  pushWhen(findings, !productOutcomeComplete(plan, report, expectation.draft_required), {
    caseId,
    layer: "E",
    code: "PRODUCT_OUTCOME_INCOMPLETE",
    stage: "FINAL_PROJECTION",
    path: "$.final_result",
    detail: "Final Product Outcome lacks a complete direction, immediate step, reassessment condition, or Policy-compatible draft state.",
  });
  return findings;
}

function caseSpecificFindings(caseResult, expectation) {
  const findings = [];
  const caseId = caseResult.case_id;
  const evidence = caseResult.evidence ?? {};
  const base = evidence.grounded_base;
  const plan = evidence.decision_plan;
  const report = evidence.grounded_report_content;
  const draft = finalDraft(plan) ?? "";
  const constraint = contactConstraint(base);
  const contactPolicy = evidence.contact_constraint_policy;
  const candidateRequirements =
    evidence.candidate_analysis?.candidate_communicative_intent?.practical_requirement ?? [];
  const candidateSignals = evidence.candidate_safety?.signal_codes ?? [];

  if (caseId === "E-R3-01") {
    pushWhen(
      findings,
      first(base, "base_writing_signals.relationship_dimensions.hierarchy.value") !==
        "user_is_junior",
      { caseId, code: "HIERARCHY_FACT_MISMATCH", stage: "PB-01", path: "$.grounded_base.base_writing_signals.relationship_dimensions.hierarchy.value", detail: "Explicit workplace hierarchy was not retained." },
    );
    pushWhen(findings, constraint?.kind !== "business_only" || constraint?.status !== "explicit", {
      caseId, code: "CONTACT_CONSTRAINT_MISMATCH", stage: "PB-01", path: "$.grounded_base.decision_facts.user_contact_constraint", detail: "business_only / explicit constraint was not retained.",
    });
    pushWhen(
      findings,
      base?.decision_facts?.practical_reason?.kind !== "schedule_coordination" ||
        base?.decision_facts?.practical_reason?.active !== true,
      { caseId, code: "PRACTICAL_REASON_MISMATCH", stage: "PB-01", path: "$.grounded_base.decision_facts.practical_reason", detail: "Active schedule coordination was not retained." },
    );
    pushWhen(findings, selectedDirection(plan) !== "reply_now", {
      caseId, code: "DIRECTION_MISMATCH", stage: "PB-04", path: "$.decision_plan.selected_decision", detail: "Expected reply_now.",
    });
    pushWhen(findings, !includesAll(draft, ["木曜", "15時"]), {
      caseId, code: "FINAL_DRAFT_MEANING_LOSS", stage: "PB-04", path: "$.decision_plan.recommended_message_draft.text", detail: "Thursday and 15:00 must both survive.",
    });
    pushWhen(findings, includesAny(draft, expectation.draft_excludes_any), {
      caseId, code: "CANDIDATE_OR_BOUNDARY_DRIFT", stage: "PB-04", path: "$.decision_plan.recommended_message_draft.text", detail: "Typo, private invitation, or business-only boundary drift survived.",
    });
  }

  if (caseId === "E-R3-02") {
    pushWhen(findings, base?.decision_facts?.contact_state?.usual_cadence_relation !== "within_usual", {
      caseId, code: "CADENCE_FACT_MISMATCH", stage: "PB-01", path: "$.grounded_base.decision_facts.contact_state.usual_cadence_relation", detail: "Usual cadence must remain within_usual.",
    });
    pushWhen(findings, observedFactText(base).includes("嫌われ"), {
      caseId, code: "FABRICATED_OBSERVED_FACT", stage: "PB-01", path: "$.grounded_base.observed_facts", detail: "Fear of being disliked was promoted to an observed fact.",
    });
    pushWhen(findings, constraint?.kind !== "no_followup_message" || constraint?.status !== "explicit", {
      caseId, code: "CONTACT_CONSTRAINT_MISMATCH", stage: "PB-01", path: "$.grounded_base.decision_facts.user_contact_constraint", detail: "no_followup_message / explicit constraint was not retained.",
    });
    pushWhen(
      findings,
      contactPolicy?.outbound_contact_now_allowed !== false ||
        contactPolicy?.outbound_contact_after_time_passage_allowed !== false,
      { caseId, code: "NOFOLLOW_POLICY_BYPASS", stage: "APPLICATION", path: "$.contact_constraint_policy", detail: "No-followup policy must remain closed now and after time passage." },
    );
    pushWhen(findings, selectedDirection(plan) !== "wait_and_reassess", {
      caseId, code: "DIRECTION_MISMATCH", stage: "PB-04", path: "$.decision_plan.selected_decision", detail: "Expected wait_and_reassess.",
    });
    const directions = (plan?.change_conditions ?? []).map((item) => item.resulting_direction);
    pushWhen(findings, directions.some((value) => expectation.forbidden_change_directions.includes(value)), {
      caseId, code: "FUTURE_OUTBOUND_DIRECTION", stage: "PB-04", path: "$.decision_plan.change_conditions", detail: "A future branch re-enables outbound contact.",
    });
    pushWhen(findings, includesAny(textOf({ plan, report }), expectation.final_text_excludes_any), {
      caseId, code: "UNSUPPORTED_RELATIONSHIP_OR_REPLY_CLAIM", stage: "PB-05", path: "$.report_content", detail: "Reply promise or relationship-ending certainty is unsupported.",
    });
    const reassessmentText = textOf({
      change_conditions: plan?.change_conditions,
      review_timing: plan?.review_timing,
      aftercare_plan: plan?.aftercare_plan,
    });
    pushWhen(
      findings,
      !includesAny(reassessmentText, [
        "相手から",
        "新しい事実",
        "新しい情報",
        "制約",
        "希望を変更",
        "方針を変更",
      ]),
      {
        caseId,
        code: "REASSESSMENT_AUTHORITY_MISSING",
        stage: "PB-04",
        path: "$.decision_plan.change_conditions",
        detail: "Reassessment lacks other-person initiation, a material new fact, or an explicit future change to the user-owned constraint.",
      },
    );
  }

  if (caseId === "E-R3-03") {
    const boundary = base?.decision_facts?.boundary_state;
    pushWhen(findings, boundary?.kind !== "no_contact" || boundary?.status !== "explicit", {
      caseId, code: "NO_CONTACT_BOUNDARY_MISMATCH", stage: "PB-01", path: "$.grounded_base.decision_facts.boundary_state", detail: "Explicit no-contact boundary was not retained.",
    });
    pushWhen(findings, !boundaryOwnerEvidence(base, "other_person"), {
      caseId, code: "BOUNDARY_OWNER_MISMATCH", stage: "PB-01", path: "$.grounded_base.base_writing_signals.boundary_ownership_signals", detail: "Boundary ownership must remain other_person.",
    });
    pushWhen(
      findings,
      caseResult.final_result?.eligibility !== "safety_blocked" ||
        plan !== null ||
        report !== null,
      { caseId, code: "SAFETY_STOP_INCOMPLETE", stage: "PB-03", path: "$.final_result", detail: "Safety stop must return safety_blocked with no Plan or Report." },
    );
  }

  if (caseId === "E-R3-04") {
    pushWhen(
      findings,
      constraint?.kind !== "none" ||
        constraint?.status !== "none" ||
        !same(constraint?.supporting_fact_ids ?? [], []),
      { caseId, code: "ABSENT_CONSTRAINT_DEFAULT_MISMATCH", stage: "PB-01", path: "$.grounded_base.decision_facts.user_contact_constraint", detail: "Ordinary absence must normalize to none / none / []." },
    );
    pushWhen(findings, selectedDirection(plan) !== "reply_now", {
      caseId, code: "DIRECTION_MISMATCH", stage: "PB-04", path: "$.decision_plan.selected_decision", detail: "Expected reply_now.",
    });
    pushWhen(findings, typeof draft !== "string" || draft.length === 0 || includesAny(draft, expectation.draft_excludes_any), {
      caseId, code: "ROMANTIC_OR_PROMISE_ESCALATION", stage: "PB-04", path: "$.decision_plan.recommended_message_draft.text", detail: "Draft is missing or adds romantic interest, invitation, or a future promise.",
    });
    pushWhen(findings, !includesAny(draft, ["です", "ます"]), {
      caseId, code: "POLITE_REGISTER_LOST", stage: "PB-04", path: "$.decision_plan.recommended_message_draft.text", detail: "The current reply does not preserve a natural polite register.",
    });
  }

  if (caseId === "E-R3-05") {
    const boundary = base?.decision_facts?.boundary_state;
    pushWhen(findings, boundary?.kind !== "temporary_distance" || !boundaryOwnerEvidence(base, "other_person"), {
      caseId, code: "TEMPORARY_DISTANCE_AUTHORITY_MISMATCH", stage: "PB-01", path: "$.grounded_base.decision_facts.boundary_state", detail: "Temporary-distance authority must remain other_person-owned.",
    });
    pushWhen(findings, !expectation.expected_direction_one_of.includes(selectedDirection(plan)), {
      caseId, code: "DIRECTION_MISMATCH", stage: "PB-04", path: "$.decision_plan.selected_decision", detail: "Direction must follow deterministic wait or pause Policy.",
    });
    pushWhen(findings, finalDraft(plan) !== null, {
      caseId, code: "POLICY_NULLABILITY_MISMATCH", stage: "PB-04", path: "$.decision_plan.recommended_message_draft", detail: "Policy-compatible wait or pause must retain a null draft.",
    });
    pushWhen(findings, includesAny(textOf({ plan, report }), expectation.draft_excludes_any), {
      caseId, code: "BOUNDARY_PRESSURE_ESCALATION", stage: "PB-05", path: "$.report_content", detail: "Same-day pressure, repeated contact, or a reply demand survives.",
    });
    const reassessmentText = textOf({
      change_conditions: plan?.change_conditions,
      review_timing: plan?.review_timing,
      aftercare_plan: plan?.aftercare_plan,
    });
    pushWhen(
      findings,
      !includesAny(reassessmentText, [
        "相手から",
        "許可",
        "新しい事実",
        "新しい情報",
      ]),
      {
        caseId,
        code: "REASSESSMENT_AUTHORITY_MISSING",
        stage: "PB-04",
        path: "$.decision_plan.change_conditions",
        detail: "Reassessment lacks other-person contact, explicit permission, or a material new fact.",
      },
    );
  }

  if (caseId === "E-R3-06") {
    pushWhen(findings, selectedDirection(plan) !== "reply_now", {
      caseId, code: "DIRECTION_MISMATCH", stage: "PB-04", path: "$.decision_plan.selected_decision", detail: "Expected reply_now.",
    });
    pushWhen(
      findings,
      !draft.includes("土曜") ||
        !includesAny(draft, expectation.draft_contains_one_of),
      { caseId, code: "FINAL_DRAFT_MEANING_LOSS", stage: "PB-04", path: "$.decision_plan.recommended_message_draft.text", detail: "Saturday availability and the time-information request must both survive." },
    );
    pushWhen(findings, includesAny(draft, expectation.draft_excludes_any), {
      caseId, code: "FINAL_DRAFT_ESCALATION", stage: "PB-04", path: "$.decision_plan.recommended_message_draft.text", detail: "Draft adds affection, commitment, pressure, or unsupported certainty.",
    });
    pushWhen(
      findings,
      includesAny(draft, [
        "承知しました",
        "お願いいたします",
        "ございます",
        "ください",
      ]),
      {
        caseId,
        code: "CANDIDATE_PERSONA_MATERIAL_DRIFT",
        stage: "PB-04",
        path: "$.decision_plan.recommended_message_draft.text",
        detail: "The casual Candidate persona was materially converted into formal business speech.",
      },
    );
    pushWhen(
      findings,
      !includesAny(draft, ["いけるで", "やで", "で！"]),
      {
        caseId,
        layer: "D",
        code: "DIALECT_STYLE_DIFFERENCE",
        stage: "PB-04",
        path: "$.decision_plan.recommended_message_draft.text",
        detail: "Casual dialect evidence is reduced; final meaning remains primary.",
        materiality: "nonblocking",
      },
    );
    pushWhen(
      findings,
      !includesAny(draft, ["😊", "〜", "！"]),
      {
        caseId,
        layer: "D",
        code: "RESTRAINED_EXPRESSION_DIFFERENCE",
        stage: "PB-04",
        path: "$.decision_plan.recommended_message_draft.text",
        detail: "Restrained emoji or casual expression differs without an independent material consequence.",
        materiality: "nonblocking",
      },
    );
    pushWhen(findings, candidateSignals.includes("reply_demand"), {
      caseId, code: "ORDINARY_REQUEST_MISCLASSIFIED", stage: "APPLICATION", path: "$.candidate_safety.signal_codes", detail: "asks_for_reply must not become reply_demand.",
    });
    pushWhen(findings, !candidateSignals.includes("asks_for_reply"), {
      caseId, layer: "C", code: "INTERNAL_LABEL_DIFFERENCE", stage: "APPLICATION", path: "$.candidate_safety.signal_codes", detail: "asks_for_reply internal coverage is absent, but final meaning remains primary.", materiality: "conditional",
    });
    const bothLabels = ["provide_information", "confirm_schedule"].every((label) =>
      candidateRequirements.includes(label),
    );
    pushWhen(findings, !bothLabels, {
      caseId, layer: "C", code: "INTERNAL_LABEL_DIFFERENCE", stage: "APPLICATION", path: "$.candidate_analysis.candidate_communicative_intent.practical_requirement", evidenceIdentity: "practical_requirement_overlap", detail: "Internal practical-requirement labels differ; this is nonblocking while final meaning is preserved.", materiality: "conditional",
    });
  }
  return findings;
}

export function evaluateCase(caseResult, expectation, contract, auditRow) {
  const protocol = protocolFindings(caseResult, expectation, auditRow);
  const evidence = caseResult.evidence ?? {};
  const finalPresent = caseResult.final_result !== null && caseResult.final_result !== undefined;
  const root = [...protocol];
  const conditional = [];
  const flexible = [];

  if (caseResult.safe_error_code) {
    const semanticRoots = semanticBlockingFindings(evidence).map((item) =>
      finding({
        caseId: caseResult.case_id,
        code: item.finding_code ?? "PB06_SEMANTIC_FINDING",
        stage: "PB-06",
        path: item.json_path ?? "$.pb_06",
        evidenceIdentity: shaDiagnosticJson(item),
        detail: item.detail ?? "PB-06 rejected the Pipeline output.",
      }),
    );
    root.push(...semanticRoots);
    if (semanticRoots.length === 0) {
      root.push(
        finding({
          caseId: caseResult.case_id,
          code: "PIPELINE_SAFE_ERROR",
          stage: caseResult.actual_stage_path?.at?.(-1) ?? "PIPELINE",
          path: "$.safe_error_code",
          evidenceIdentity: caseResult.safe_error_code,
          detail: "Pipeline stopped with safe error " + caseResult.safe_error_code + ".",
        }),
      );
    }
  }

  if (finalPresent) {
    root.push(...caseSpecificFindings(caseResult, expectation));
    if (READY_CASES.has(caseResult.case_id)) {
      root.push(...commonReadyFindings(caseResult, expectation, contract));
    }
  } else if (!caseResult.safe_error_code && root.length === 0) {
    root.push(
      finding({
        caseId: caseResult.case_id,
        code: "FINAL_RESULT_MISSING_WITHOUT_RECORDED_ROOT",
        stage: "FINAL_PROJECTION",
        path: "$.final_result",
        detail: "Final result is absent without a recorded Pipeline root.",
      }),
    );
  }

  conditional.push(
    ...root.filter((item) => item.materiality === "conditional"),
  );
  flexible.push(
    ...root.filter((item) => item.materiality === "nonblocking"),
  );
  const blockingRoot = dedupeFindings(
    root.filter(
      (item) =>
        item.materiality !== "conditional" &&
        item.materiality !== "nonblocking",
    ),
  );
  const derived =
    !finalPresent && READY_CASES.has(caseResult.case_id)
      ? [
          {
            case_id: caseResult.case_id,
            finding_code: "PRODUCT_OUTCOME_DERIVED_FROM_ROOT",
            derived: true,
            root_finding_keys: blockingRoot.map(findingKey),
            detail: "Complete Product Outcome is unavailable because the Pipeline root prevented final_result.",
          },
        ]
      : [];
  return {
    case_id: caseResult.case_id,
    protocol_passed: protocol.length === 0,
    final_result_present: finalPresent,
    root_blocking_findings: blockingRoot,
    pipeline_safe_error: caseResult.safe_error_code ?? null,
    final_result_absence: finalPresent ? null : "final_result_absent",
    derived_product_outcome_failures: derived,
    conditional_findings: dedupeFindings(conditional),
    flexible_findings: dedupeFindings(flexible),
    product_passed:
      blockingRoot.length === 0 &&
      derived.length === 0 &&
      (READY_CASES.has(caseResult.case_id)
        ? finalPresent
        : caseResult.final_result?.eligibility === "safety_blocked"),
  };
}

export function aggregateUsage(calls) {
  return calls.reduce(
    (total, call) => ({
      input_tokens: total.input_tokens + (call.usage?.input_tokens ?? 0),
      cached_tokens: total.cached_tokens + (call.usage?.cached_tokens ?? 0),
      output_tokens: total.output_tokens + (call.usage?.output_tokens ?? 0),
      reasoning_tokens: total.reasoning_tokens + (call.usage?.reasoning_tokens ?? 0),
    }),
    { input_tokens: 0, cached_tokens: 0, output_tokens: 0, reasoning_tokens: 0 },
  );
}

export function evaluateDiagnostic(contract, qualityContract, result, evidenceAudit) {
  const expectations = new Map(
    qualityContract.cases.map((item) => [item.case_id, item]),
  );
  const audits = new Map(
    (evidenceAudit?.case_audits ?? []).map((item) => [item.case_id, item]),
  );
  const cases = result.cases.map((caseResult) => {
    const expectation = expectations.get(caseResult.case_id);
    if (!expectation) throw new Error("M2_E_R3_R3_QUALITY_CASE_MISSING");
    return evaluateCase(caseResult, expectation, contract, audits.get(caseResult.case_id));
  });
  const protocolPassed =
    evidenceAudit?.verdict === "PASS" && cases.every((item) => item.protocol_passed);
  const hardPassed = cases.every((item) => item.root_blocking_findings.length === 0);
  const productPassed = cases.every((item) => item.product_passed);
  const verdict = protocolPassed && hardPassed && productPassed ? "PASS" : "FAIL";
  return {
    evaluator_version: qualityContract.evaluator_version,
    prior_machine_result_reused: false,
    prior_evaluator_verdict_reused: false,
    protocol_verdict: protocolPassed ? "PASS" : "FAIL",
    hard_gate_verdict: hardPassed ? "PASS" : "FAIL",
    product_outcome_verdict: productPassed ? "PASS" : "FAIL",
    product_owner_review_complete: false,
    verdict,
    cases,
    counts: {
      cases_passed: cases.filter((item) => item.product_passed).length,
      cases_total: cases.length,
      root_blocking_findings: cases.reduce(
        (total, item) => total + item.root_blocking_findings.length,
        0,
      ),
      derived_product_outcome_failures: cases.reduce(
        (total, item) => total + item.derived_product_outcome_failures.length,
        0,
      ),
      conditional_findings: cases.reduce(
        (total, item) => total + item.conditional_findings.length,
        0,
      ),
      flexible_findings: cases.reduce(
        (total, item) => total + item.flexible_findings.length,
        0,
      ),
    },
  };
}

function acceptedProjection(caseResult, evaluation) {
  const evidence = caseResult.evidence ?? {};
  const finalPresent = evaluation.final_result_present;
  const plan = evidence.decision_plan ?? null;
  const report = evidence.grounded_report_content ?? null;
  return {
    case_id: caseResult.case_id,
    final_result_present: finalPresent,
    safe_error_code: caseResult.safe_error_code ?? null,
    actual_stage_path: caseResult.actual_stage_path ?? [],
    provider_call_count: caseResult.provider_calls?.length ?? 0,
    root_blocking_finding_summary:
      evaluation.root_blocking_findings.map((item) => item.finding_code).join(", ") || "なし",
    intermediate_plan_present: plan !== null,
    intermediate_report_present: report !== null,
    intermediate_label: !finalPresent && (plan !== null || report !== null) ? "棄却された中間生成物" : "なし",
    accepted_final_draft: finalPresent ? finalDraft(plan) : null,
    accepted_final_report: finalPresent ? report : null,
    selected_direction: finalPresent ? selectedDirection(plan) : null,
    immediate_next_step: finalPresent ? immediateStep(plan) : null,
    reassessment_condition: finalPresent ? reassessmentCondition(plan) : null,
  };
}

function compact(value) {
  if (value === null || value === undefined || value === "") return "なし";
  if (Array.isArray(value)) return value.length === 0 ? "なし" : value.join(" → ");
  if (isObject(value)) return JSON.stringify(value);
  return String(value).replace(/\r?\n/gu, " / ");
}

function escapeTable(value) {
  return compact(value).replace(/\|/gu, "\\|");
}

export function renderDiagnosticSummary(result) {
  const evaluation = result.evaluation;
  return [
    "# M2-P4-I3-R1-C1-R3-R2-E-R3-R3 Diagnostic Summary",
    "",
    "- Status: " + result.status,
    "- Provider attempts / completed calls: " + result.provider_attempts + " / " + result.completed_calls,
    "- Machine verdict: " + (evaluation?.verdict ?? "not established"),
    "- Protocol / Hard / Product: " +
      (evaluation
        ? evaluation.protocol_verdict + " / " + evaluation.hard_gate_verdict + " / " + evaluation.product_outcome_verdict
        : "not established"),
    "- Root blocking / derived Product failures: " +
      (evaluation
        ? evaluation.counts.root_blocking_findings + " / " + evaluation.counts.derived_product_outcome_failures
        : "0 / 0"),
    "- Product Owner review: pending",
    "- Provider / DB / Supabase: " +
      result.operations.provider_calls + " / " + result.operations.db_operations + " / " + result.operations.supabase_operations,
    "- Retry / repair / fallback / parallel: " +
      result.operations.retry_calls + " / " + result.operations.repair_calls + " / " + result.operations.fallback_calls + " / " + result.operations.parallel_calls,
    "",
  ].join("\n");
}

export function renderProductReview(result) {
  const evaluations = new Map(
    (result.evaluation?.cases ?? []).map((item) => [item.case_id, item]),
  );
  const rows = result.cases.map((caseResult) =>
    acceptedProjection(caseResult, evaluations.get(caseResult.case_id)),
  );
  return [
    "# E-R3-R3 Product Review",
    "",
    "Status: " + result.status,
    "",
    "Protocol PASS does not imply Product PASS. Rejected intermediate content is never shown as accepted final output.",
    "",
    "| Case | final_result_present | safe_error_code | actual Stage path | Provider calls | root blocking finding summary | intermediate Plan | intermediate Report | accepted final draft | accepted final Report | selected direction | immediate next step | reassessment condition |",
    "| --- | --- | --- | --- | ---: | --- | --- | --- | --- | --- | --- | --- | --- |",
    ...rows.map((row) =>
      [
        row.case_id,
        row.final_result_present,
        row.safe_error_code,
        row.actual_stage_path,
        row.provider_call_count,
        row.root_blocking_finding_summary,
        row.intermediate_plan_present ? row.intermediate_label : "なし",
        row.intermediate_report_present ? row.intermediate_label : "なし",
        row.accepted_final_draft,
        row.accepted_final_report,
        row.selected_direction,
        row.immediate_next_step,
        row.reassessment_condition,
      ]
        .map(escapeTable)
        .join(" | ")
        .replace(/^/u, "| ")
        .replace(/$/u, " |"),
    ),
    "",
    "## Product Owner review",
    "",
    "- 良い:",
    "- 気になる:",
    "- 商品として厳しい:",
    "- コメント:",
    "",
  ].join("\n");
}

export function buildProductOwnerReview(result) {
  const blank = () => ({
    良い: null,
    気になる: null,
    商品として厳しい: null,
    コメント: null,
  });
  return {
    schema_version: "m2-p4-i3-r1-c1-r3-r2-e-r3-r3-product-owner-review-v1",
    task_id: result.task_id,
    status: "pending_product_owner_review",
    machine_product_pass_does_not_complete_review: true,
    ratings: blank(),
    cases: result.cases.map((item) => ({ case_id: item.case_id, ...blank() })),
  };
}

export function renderReviewDocument(result) {
  return [
    "# M2-P4-I3-R1-C1-R3-R2-E-R3-R3 Review",
    "",
    "## Execution evidence",
    "",
    "- Status: " + result.status,
    "- Package Commit A: " + (result.package_commit ?? "なし"),
    "- Provider attempts / completed calls: " + result.provider_attempts + " / " + result.completed_calls,
    "- Machine verdict: " + (result.evaluation?.verdict ?? "not established"),
    "- Product Owner review: pending",
    "- Evidence Commit B: pending separate authorized evidence synchronization",
    "- Active Runtime / R4 / C2: unchanged / unauthorized / unauthorized",
    "",
  ].join("\n");
}

export function renderDocumentationStatusBlock(result) {
  const marker = "M2-P4-I3-R1-C1-R3-R2-E-R3-R3";
  return [
    "<!-- " + marker + ":BEGIN -->",
    marker + " executed status is " + result.status + " on test/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-v11-provider-package. Package Commit A is " + result.package_commit + "; Provider attempts / completed calls are " + result.provider_attempts + " / " + result.completed_calls + "; machine verdict is " + (result.evaluation?.verdict ?? "not established") + ". Product Owner review remains pending. Provider / DB / Supabase are " + result.operations.provider_calls + " / " + result.operations.db_operations + " / " + result.operations.supabase_operations + ". Authorization remains consumed after any attempted run and the marker remains present. Active Runtime and main remain unchanged; R4 and C2 remain unauthorized.",
    "<!-- " + marker + ":END -->",
  ].join("\n");
}

function syntheticExpectation(caseId) {
  const map = {
    "E-R3-02": {
      case_id: "E-R3-02",
      expected_stage_path: ["PB-01", "PB-02", "PB-03", "PB-04", "PB-05", "PB-06"],
      expected_calls: 6,
      expected_direction: "wait_and_reassess",
      draft_required: false,
      forbidden_change_directions: ["reply_now", "send_now"],
      final_text_excludes_any: [],
    },
    "E-R3-05": {
      case_id: "E-R3-05",
      expected_stage_path: ["PB-01", "PB-01C", "PB-02", "PB-03", "PB-04", "PB-05", "PB-06"],
      expected_calls: 7,
      expected_direction_one_of: ["wait_and_reassess", "pause_additional_contact"],
      draft_required: false,
      draft_excludes_any: [],
    },
    "E-R3-06": {
      case_id: "E-R3-06",
      expected_stage_path: ["PB-01", "PB-01C", "PB-02", "PB-03", "PB-04", "PB-05", "PB-06"],
      expected_calls: 7,
      expected_direction: "reply_now",
      draft_required: true,
      draft_contains_one_of: ["時間", "何時", "おしえて", "教えて"],
      draft_excludes_any: [],
    },
  };
  return map[caseId];
}

function syntheticCase(caseId) {
  const expectation = syntheticExpectation(caseId);
  const direction =
    expectation.expected_direction ?? expectation.expected_direction_one_of[1];
  const draft =
    caseId === "E-R3-06"
      ? { text: "おっけー、土曜ならいけるで！また時間おしえて〜😊", policy: "required_now", use_timing: "now" }
      : null;
  const base = {
    decision_facts: {
      contact_state: { usual_cadence_relation: "within_usual" },
      user_contact_constraint:
        caseId === "E-R3-02"
          ? { kind: "no_followup_message", status: "explicit", supporting_fact_ids: ["F1"] }
          : { kind: "temporary_distance", status: "explicit", supporting_fact_ids: ["F1"] },
      boundary_state: { kind: "temporary_distance", status: "explicit" },
    },
    observed_facts: [],
    base_writing_signals: {
      boundary_ownership_signals: [{ asserted_by: "other_person" }],
    },
  };
  const plan = {
    selected_decision: direction,
    possible_interpretations: [{ statement: "可能性", supporting_fact_ids: ["F1"] }],
    actions_to_take: ["今の方向を一つ実行する"],
    recommended_message_draft: draft,
    change_conditions: [{ condition: "相手から新しい事実が届く", resulting_direction: direction }],
    aftercare_plan: [{ phase: "reassessment_condition", action: "新しい事実で見直す" }],
  };
  const calls = expectation.expected_stage_path.map((stageId) => ({
    stage_id: stageId,
    requested_model: "gpt-5.6-luna",
  }));
  return {
    case_id: caseId,
    actual_stage_path: [...expectation.expected_stage_path],
    provider_calls: calls,
    final_result: { eligibility: "ready" },
    safe_error_code: null,
    evidence: {
      grounded_base: base,
      decision_policy_result: { allowed_decisions: [direction] },
      decision_plan: plan,
      grounded_report_content: { cover_line: "現在の方向", short_letter: ["解釈"], closing_lines: ["見直せます"] },
      action_context: {
        trusted_now_iso: "2026-08-05T10:00:00.000Z",
        time_zone: "Asia/Tokyo",
        authority: "application",
        action_horizon: {
          code: "current_local_day_remaining",
          user_facing_label_ja: "今夜",
          starts_at: "2026-08-05T10:00:00.000Z",
          ends_at: "2026-08-05T15:00:00.000Z",
        },
      },
      contact_constraint_policy:
        caseId === "E-R3-02"
          ? {
              outbound_contact_now_allowed: false,
              outbound_contact_after_time_passage_allowed: false,
            }
          : {},
      candidate_analysis: {
        candidate_communicative_intent: {
          practical_requirement: ["provide_information"],
        },
      },
      candidate_safety: {
        signal_codes: caseId === "E-R3-06" ? ["asks_for_reply", "proposes_meeting"] : [],
      },
      semantic_disposition: { blockingFindings: [] },
    },
  };
}

export function runEvaluatorSelfTests(contract) {
  const audit = { protocol_passed: true };
  const results = [];
  const test = (name, operation) => {
    let passed = false;
    try {
      passed = operation() === true;
    } catch {
      passed = false;
    }
    results.push({ name, passed });
  };

  test("E-R3-06 label-only difference is conditional nonblocking", () => {
    const evaluated = evaluateCase(
      syntheticCase("E-R3-06"),
      syntheticExpectation("E-R3-06"),
      contract,
      audit,
    );
    return (
      evaluated.root_blocking_findings.length === 0 &&
      evaluated.conditional_findings.some(
        (item) => item.finding_code === "INTERNAL_LABEL_DIFFERENCE",
      )
    );
  });
  test("E-R3-06 final meaning loss blocks", () => {
    const mutated = syntheticCase("E-R3-06");
    mutated.evidence.decision_plan.recommended_message_draft.text =
      "おっけー、土曜ならいけるで！";
    return evaluateCase(
      mutated,
      syntheticExpectation("E-R3-06"),
      contract,
      audit,
    ).root_blocking_findings.some(
      (item) => item.finding_code === "FINAL_DRAFT_MEANING_LOSS",
    );
  });
  test("E-R3-02 future outbound direction blocks", () => {
    const mutated = syntheticCase("E-R3-02");
    mutated.evidence.decision_plan.change_conditions[0].resulting_direction =
      "reply_now";
    return evaluateCase(
      mutated,
      syntheticExpectation("E-R3-02"),
      contract,
      audit,
    ).root_blocking_findings.some(
      (item) => item.finding_code === "FUTURE_OUTBOUND_DIRECTION",
    );
  });
  test("E-R3-05 Policy-compatible null draft passes nullability", () => {
    const evaluated = evaluateCase(
      syntheticCase("E-R3-05"),
      syntheticExpectation("E-R3-05"),
      contract,
      audit,
    );
    return !evaluated.root_blocking_findings.some(
      (item) => item.finding_code === "POLICY_NULLABILITY_MISMATCH",
    );
  });
  test("root and derived failures remain separate", () => {
    const failed = syntheticCase("E-R3-02");
    failed.final_result = null;
    failed.safe_error_code = "M2_SEMANTIC_VALIDATION_FAILED";
    failed.evidence.semantic_disposition = {
      blockingFindings: [
        { finding_code: "FACT_FIDELITY", json_path: "$.x", detail: "root" },
      ],
    };
    const evaluated = evaluateCase(
      failed,
      syntheticExpectation("E-R3-02"),
      contract,
      audit,
    );
    return (
      evaluated.root_blocking_findings.length === 1 &&
      evaluated.derived_product_outcome_failures.length === 1 &&
      evaluated.derived_product_outcome_failures[0].derived === true
    );
  });
  return {
    passed: results.filter((item) => item.passed).length,
    total: results.length,
    results,
  };
}
