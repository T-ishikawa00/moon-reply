import {
  aggregateUsage,
  buildProductOwnerReview,
  canonicalJson,
  decisionPolicyDiverges,
  evaluateCase as evaluateCaseV1,
  renderDiagnosticSummary,
  renderDocumentationStatusBlock,
  renderProductReview,
  renderReviewDocument,
  shaDiagnosticJson,
} from "./m2-p4-i3-r1-c1-r3-r2-e-r3-r3-evaluator-v1.mjs";

export {
  aggregateUsage,
  buildProductOwnerReview,
  canonicalJson,
  decisionPolicyDiverges,
  renderDiagnosticSummary,
  renderDocumentationStatusBlock,
  renderProductReview,
  renderReviewDocument,
  shaDiagnosticJson,
};

export const DETERMINISTIC_EVALUATOR_V2_VERSION =
  "m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-evaluator-v2";

export const EVALUATOR_V2_SUPERSEDED_RULES = Object.freeze([
  "context_free_recursive_certainty_substring_matching",
  "code_only_or_current_policy_only_semantic_blocking",
]);

const certaintyPatterns = Object.freeze([
  {
    assertionKind: "guaranteed_reply",
    pattern:
      /(?:相手|先方|彼|彼女)(?:は|が|も)?.{0,16}(?:必ず|確実に|間違いなく|きっと).{0,16}(?:返信|返事|連絡)(?:する|します|がある|があります)?|(?:返信|返事|連絡)(?:は|が|も)?.{0,10}(?:必ず|確実に|間違いなく|きっと).{0,12}(?:来る|来ます|くる|きます|届く|届きます|返ってくる|返ってきます|あります)|(?:必ず|確実に|間違いなく|きっと).{0,12}(?:返信|返事|連絡)(?:が)?(?:ある|あります|来る|来ます|くる|きます)/u,
  },
  {
    assertionKind: "guaranteed_relationship_outcome",
    pattern:
      /(?:必ず|確実に|間違いなく|きっと).{0,16}(?:復縁|交際|関係修復|結婚).{0,10}(?:できる|できます|する|します|成功する|成功します|叶う|叶います)|(?:復縁|交際|関係修復|結婚).{0,10}(?:できる|できます|する|します|成功する|成功します|叶う|叶います).{0,8}(?:に違いない|はずです)/u,
  },
  {
    assertionKind: "asserted_hidden_state",
    pattern:
      /(?:相手|先方|彼|彼女)(?:の)?(?:本心|本音|気持ち|内心)(?:は|が).{1,30}(?:です|だ|である|に違いない|はず|確実|間違いない)/u,
  },
  {
    assertionKind: "guaranteed_external_event",
    pattern:
      /(?:相手|先方|彼|彼女)(?:は|が|も)?.{0,16}(?:必ず|確実に|間違いなく|きっと).{0,20}(?:来る|くる|戻る|会う|参加する|応じる|受け入れる|許す)/u,
  },
]);

const certaintyDenialContinuation =
  /^(?:(?:という)?こと)?(?:とは(?:限らない|限りません|言えない|言えません|断定できない|断定できません|分からない|分かりません|わからない|わかりません|決まっていない|決まっていません)|を保証(?:することは)?でき(?:ない|ません))/u;

const futureDirectionPath =
  /^(?:\$\.)?decision_plan\.change_conditions\[(0|[1-9]\d*)\]\.resulting_direction$/u;
const futureCommentaryPath =
  /^(?:\$\.)?report_content\.change_condition_commentary\[(0|[1-9]\d*)\]$/u;
const temporalCodes = new Set([
  "DECISION_ALLOWED",
  "ACTION_CONSISTENCY",
  "MESSAGE_POLICY_CONSISTENCY",
]);
const temporalComparisonLanguage =
  /(?:current|currently|current direction|allowed set|disallowed|decision[_ ]policy|現在|現行|現在の方向|現在方針|許可された決定|決定集合|方針と整合しない)/iu;
const enduringConstraintLanguage =
  /(?:safety|no[_ -]?followup|business[_ -]?only|contact[_ -]?constraint|boundary|安全|境界|連絡禁止|追加連絡|業務のみ|私的な連絡)/iu;

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizePath(value) {
  if (typeof value !== "string") return "";
  return value.startsWith("$.") ? value : `$.${value}`;
}

function pathIndex(value, pattern) {
  const match = pattern.exec(normalizePath(value));
  if (!match) return null;
  const index = Number(match[1]);
  return Number.isSafeInteger(index) ? index : null;
}

function appendPath(parent, segment) {
  return typeof segment === "number"
    ? `${parent}[${segment}]`
    : `${parent}.${segment}`;
}

function collectStrings(value, path, entries) {
  if (typeof value === "string") {
    entries.push({ json_path: path, text: value });
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      collectStrings(item, appendPath(path, index), entries),
    );
    return;
  }
  if (isObject(value)) {
    Object.entries(value).forEach(([key, item]) =>
      collectStrings(item, appendPath(path, key), entries),
    );
  }
}

export function customerFacingAssertionEntries(evidence) {
  const plan = evidence?.decision_plan;
  const report = evidence?.grounded_report_content;
  const roots = [
    ["$.decision_plan.pre_action_check", plan?.pre_action_check],
    ["$.decision_plan.actions_to_take", plan?.actions_to_take],
    ["$.decision_plan.actions_to_avoid", plan?.actions_to_avoid],
    [
      "$.decision_plan.recommended_message_draft",
      plan?.recommended_message_draft,
    ],
    ["$.decision_plan.aftercare_plan", plan?.aftercare_plan],
    ["$.decision_plan.change_conditions", plan?.change_conditions],
    ["$.decision_plan.review_timing", plan?.review_timing],
    ["$.decision_plan.material_unknowns", plan?.material_unknowns],
    [
      "$.decision_plan.model_generated_limitations",
      plan?.model_generated_limitations,
    ],
    ["$.report_content", report],
  ];
  const entries = [];
  for (const [path, value] of roots) {
    if (value !== undefined && value !== null) {
      collectStrings(value, path, entries);
    }
  }
  return entries;
}

export function classifyUnsupportedCertaintyProposition(text) {
  if (typeof text !== "string" || text.length === 0) return null;
  for (const rule of certaintyPatterns) {
    const pattern = new RegExp(rule.pattern.source, `${rule.pattern.flags}g`);
    for (const match of text.matchAll(pattern)) {
      const continuation = text.slice(match.index + match[0].length);
      if (certaintyDenialContinuation.test(continuation)) continue;
      return {
        assertion_kind: rule.assertionKind,
        matched_proposition: match[0],
        authority_absent_reason:
          "The assertion guarantees another person's state, action, or an external outcome without supplied authority.",
      };
    }
  }
  return null;
}

export function findUnsupportedCertaintyAssertions(evidence) {
  const findings = [];
  const seen = new Set();
  for (const entry of customerFacingAssertionEntries(evidence)) {
    const classification = classifyUnsupportedCertaintyProposition(entry.text);
    if (!classification) continue;
    const key = `${entry.json_path}|${classification.assertion_kind}|${classification.matched_proposition}`;
    if (seen.has(key)) continue;
    seen.add(key);
    findings.push({
      finding_code: "UNSUPPORTED_CERTAINTY",
      severity: "major",
      json_path: entry.json_path,
      material_asserted_proposition: classification.matched_proposition,
      authority_absent_reason: classification.authority_absent_reason,
      assertion_kind: classification.assertion_kind,
      detail:
        `Unsupported ${classification.assertion_kind} at ${entry.json_path}: ` +
        `${classification.matched_proposition}. ${classification.authority_absent_reason}`,
    });
  }
  return findings;
}

function evidenceReferences(finding) {
  return Array.isArray(finding?.evidence_refs)
    ? finding.evidence_refs.filter((item) => typeof item === "string")
    : [];
}

function citesEnduringConstraint(finding) {
  return (
    evidenceReferences(finding).some(
      (reference) =>
        reference === "policy:contact_constraint_policy" ||
        reference === "policy:aggregate_safety_result",
    ) || enduringConstraintLanguage.test(finding?.detail ?? "")
  );
}

function normalizedCondition(value) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  const withoutPunctuation = trimmed.replace(/[。．.!！?？]+$/u, "");
  return withoutPunctuation.length > 0 ? withoutPunctuation : trimmed;
}

const directionCommentary = Object.freeze({
  reply_now: "短く返信する方向へ見直します。",
  send_now: "必要な連絡を送る方向へ見直します。",
  wait_and_reassess: "送信を急がず、いったん見直す方向へ切り替えます。",
  pause_additional_contact: "追加連絡を止める方向へ切り替えます。",
});

function expectedFutureCommentary(changeCondition) {
  const direction = directionCommentary[changeCondition?.resulting_direction];
  if (!direction) return null;
  return `「${normalizedCondition(changeCondition.condition)}」という条件が確認された場合は、その時点では${direction}`;
}

function isTemporalFalsePositive(finding, evidence) {
  if (
    !temporalCodes.has(finding?.finding_code) ||
    citesEnduringConstraint(finding)
  ) {
    return false;
  }
  const plan = evidence?.decision_plan;
  const directionIndex = pathIndex(finding?.json_path, futureDirectionPath);
  if (
    directionIndex !== null &&
    plan?.change_conditions?.[directionIndex] !== undefined
  ) {
    return (
      evidenceReferences(finding).includes("policy:decision_policy_result") ||
      temporalComparisonLanguage.test(finding?.detail ?? "")
    );
  }

  const commentaryIndex = pathIndex(finding?.json_path, futureCommentaryPath);
  if (commentaryIndex === null) return false;
  const expected = expectedFutureCommentary(
    plan?.change_conditions?.[commentaryIndex],
  );
  return (
    expected !== null &&
    evidence?.grounded_report_content?.change_condition_commentary?.[
      commentaryIndex
    ] === expected
  );
}

export function classifySuccessorSemanticFinding(finding, evidence) {
  if (isTemporalFalsePositive(finding, evidence)) {
    return { disposition: "ignored", reason: "accepted_temporal_false_positive" };
  }
  const severity = finding?.severity;
  const major = severity === "major" || severity === "critical";
  if (finding?.finding_code === "FACT_FIDELITY" && !major) {
    return { disposition: "nonblocking", reason: "minor_fact_fidelity" };
  }
  return { disposition: "blocking", reason: "preserved_legacy_root" };
}

function semanticFindingForRoot(rootFinding, evidence) {
  const dispositions = evidence?.semantic_disposition?.findingDispositions;
  const findings = Array.isArray(dispositions)
    ? dispositions.map((item) => item?.finding).filter(isObject)
    : Array.isArray(evidence?.semantic_disposition?.blockingFindings)
      ? evidence.semantic_disposition.blockingFindings.filter(isObject)
      : [];
  return findings.find(
    (finding) =>
      finding.finding_code === rootFinding.finding_code &&
      normalizePath(finding.json_path) === normalizePath(rootFinding.json_path),
  );
}

function isLegacyRecursiveCertaintyFinding(finding) {
  return (
    finding?.finding_code === "UNSUPPORTED_CERTAINTY" &&
    finding?.originating_stage === "PB-05" &&
    normalizePath(finding?.json_path) === "$.report_content"
  );
}

function toRootFinding(caseResult, finding) {
  return {
    case_id: caseResult.case_id,
    layer: "B",
    finding_code: finding.finding_code,
    originating_stage: "DETERMINISTIC_EVALUATOR_V2",
    json_path: finding.json_path,
    evidence_identity: shaDiagnosticJson({
      json_path: finding.json_path,
      assertion_kind: finding.assertion_kind,
      proposition: finding.material_asserted_proposition,
    }),
    materiality: "blocking",
    detail: finding.detail,
  };
}

function dedupeFindings(findings) {
  const seen = new Set();
  return findings.filter((finding) => {
    const key = [
      finding.case_id,
      finding.originating_stage,
      finding.finding_code,
      finding.json_path,
      finding.evidence_identity,
    ].join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function evaluateCase(caseResult, expectation, contract, auditRow) {
  const legacy = evaluateCaseV1(caseResult, expectation, contract, auditRow);
  const evidence = caseResult.evidence ?? {};
  const retainedRoots = [];
  const supersededRoots = [];
  const successorFlexible = [...legacy.flexible_findings];
  const ignoredTemporalFalsePositives = [];

  for (const rootFinding of legacy.root_blocking_findings) {
    if (isLegacyRecursiveCertaintyFinding(rootFinding)) {
      supersededRoots.push({
        finding: rootFinding,
        reason: "superseded_context_free_certainty_scan",
      });
      continue;
    }
    const semanticFinding = semanticFindingForRoot(rootFinding, evidence);
    if (semanticFinding) {
      const classification = classifySuccessorSemanticFinding(
        semanticFinding,
        evidence,
      );
      if (classification.disposition !== "blocking") {
        supersededRoots.push({
          finding: rootFinding,
          reason: classification.reason,
        });
        if (classification.disposition === "ignored") {
          ignoredTemporalFalsePositives.push(semanticFinding);
        } else {
          successorFlexible.push({
            ...rootFinding,
            materiality: "nonblocking",
            successor_reason: classification.reason,
          });
        }
        continue;
      }
    }
    retainedRoots.push(rootFinding);
  }

  const pathAwareCertaintyFindings =
    caseResult.final_result === null || caseResult.final_result === undefined
      ? []
      : findUnsupportedCertaintyAssertions(evidence);
  const rootBlockingFindings = dedupeFindings([
    ...retainedRoots,
    ...pathAwareCertaintyFindings.map((finding) =>
      toRootFinding(caseResult, finding),
    ),
  ]);
  const expectedEligibility = expectation?.expected_eligibility;
  const finalEligibility = caseResult.final_result?.eligibility;

  return {
    ...legacy,
    root_blocking_findings: rootBlockingFindings,
    flexible_findings: dedupeFindings(successorFlexible),
    product_passed:
      rootBlockingFindings.length === 0 &&
      legacy.derived_product_outcome_failures.length === 0 &&
      caseResult.final_result !== null &&
      caseResult.final_result !== undefined &&
      (expectedEligibility === undefined || finalEligibility === expectedEligibility),
    superseded_legacy_findings: supersededRoots,
    path_aware_certainty_findings: pathAwareCertaintyFindings,
    ignored_temporal_false_positives: ignoredTemporalFalsePositives,
  };
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
    if (!expectation) throw new Error("M2_EVALUATOR_V2_QUALITY_CASE_MISSING");
    return evaluateCase(
      caseResult,
      expectation,
      contract,
      audits.get(caseResult.case_id),
    );
  });
  const globalTechnicalFailure = result.technical_failure !== null;
  const allCaseRecordsPresent =
    cases.length === qualityContract.cases.length &&
    qualityContract.cases.every(
      (expectation, index) => expectation.case_id === cases[index]?.case_id,
    );
  const protocolPassed =
    evidenceAudit?.verdict === "PASS" &&
    cases.every((item) => item.protocol_passed);
  const hardPassed =
    !globalTechnicalFailure &&
    cases.every((item) => item.root_blocking_findings.length === 0);
  const productPassed =
    !globalTechnicalFailure &&
    allCaseRecordsPresent &&
    cases.every((item) => item.product_passed);
  const verdict =
    protocolPassed &&
    !globalTechnicalFailure &&
    allCaseRecordsPresent &&
    hardPassed &&
    productPassed
      ? "PASS"
      : "FAIL";

  return {
    evaluator_version: DETERMINISTIC_EVALUATOR_V2_VERSION,
    predecessor_evaluator_version: qualityContract.evaluator_version,
    prior_machine_result_reused: false,
    prior_evaluator_verdict_reused: false,
    protocol_verdict: protocolPassed ? "PASS" : "FAIL",
    hard_gate_verdict: hardPassed ? "PASS" : "FAIL",
    product_outcome_verdict: productPassed ? "PASS" : "FAIL",
    product_owner_review_complete: false,
    global_technical_failure: result.technical_failure,
    all_case_records_present: allCaseRecordsPresent,
    verdict,
    cases,
    counts: {
      cases_passed: cases.filter((item) => item.product_passed).length,
      cases_evaluated: cases.length,
      cases_total: qualityContract.cases.length,
      root_blocking_findings: cases.reduce(
        (total, item) => total + item.root_blocking_findings.length,
        0,
      ),
      derived_product_outcome_failures: cases.reduce(
        (total, item) =>
          total + item.derived_product_outcome_failures.length,
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
      superseded_legacy_findings: cases.reduce(
        (total, item) => total + item.superseded_legacy_findings.length,
        0,
      ),
      path_aware_certainty_findings: cases.reduce(
        (total, item) => total + item.path_aware_certainty_findings.length,
        0,
      ),
      ignored_temporal_false_positives: cases.reduce(
        (total, item) =>
          total + item.ignored_temporal_false_positives.length,
        0,
      ),
    },
  };
}

export function runEvaluatorV2SelfTests() {
  const tests = [
    {
      name: "user-owned verification is not unsupported certainty",
      passed:
        classifyUnsupportedCertaintyProposition(
          "木曜15時に確実に参加できるか確認する",
        ) === null,
    },
    {
      name: "guaranteed reply is blocked",
      passed:
        classifyUnsupportedCertaintyProposition("相手は必ず返信します。")
          ?.assertion_kind === "guaranteed_reply",
    },
    {
      name: "guaranteed relationship outcome is blocked",
      passed:
        classifyUnsupportedCertaintyProposition("間違いなく復縁できる。")
          ?.assertion_kind === "guaranteed_relationship_outcome",
    },
    {
      name: "hidden state assertion is blocked",
      passed:
        classifyUnsupportedCertaintyProposition("相手の本心は復縁したいのです。")
          ?.assertion_kind === "asserted_hidden_state",
    },
    {
      name: "actual matched path is retained",
      passed:
        findUnsupportedCertaintyAssertions({
          grounded_report_content: {
            short_letter: ["相手は必ず返信します。"],
          },
        })[0]?.json_path === "$.report_content.short_letter[0]",
    },
    {
      name: "non-customer Base text is outside certainty scan",
      passed:
        findUnsupportedCertaintyAssertions({
          grounded_base: { observed_facts: ["相手は必ず返信します。"] },
        }).length === 0,
    },
    {
      name: "negated_b必ずしも_reply_not_blocked",
      passed:
        classifyUnsupportedCertaintyProposition(
          "相手は必ずしも返信するとは限りません。",
        ) === null,
    },
    {
      name: "certainty_denied_by_tohaienai_not_blocked",
      passed:
        classifyUnsupportedCertaintyProposition(
          "相手が確実に返信するとは言えません。",
        ) === null,
    },
    {
      name: "certainty_denied_by_danteidekinai_not_blocked",
      passed:
        classifyUnsupportedCertaintyProposition(
          "返信が確実に来るとは断定できません。",
        ) === null,
    },
    {
      name: "certainty_denied_by_wakaranai_not_blocked",
      passed:
        classifyUnsupportedCertaintyProposition(
          "必ず返信があるとは分かりません。",
        ) === null,
    },
    {
      name: "clear_guaranteed_reply_still_blocked",
      passed:
        classifyUnsupportedCertaintyProposition("返信は確実に来ます。")
          ?.assertion_kind === "guaranteed_reply",
    },
    {
      name: "future_parent_path_not_ignored",
      passed:
        classifySuccessorSemanticFinding(
          {
            finding_code: "ACTION_CONSISTENCY",
            severity: "major",
            json_path: "$.decision_plan.change_conditions[0]",
            evidence_refs: ["policy:decision_policy_result"],
            detail:
              "The whole future change condition has a material inconsistency with the current policy.",
          },
          {
            decision_plan: {
              change_conditions: [
                {
                  condition: "相手から具体的な質問が届いた場合",
                  resulting_direction: "reply_now",
                },
              ],
            },
          },
        ).disposition === "blocking",
    },
  ];
  return {
    passed: tests.filter((test) => test.passed).length,
    total: tests.length,
    results: tests,
  };
}
