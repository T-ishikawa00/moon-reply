import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const sourceRoot = "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3";
const taskRoot =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r2";
const expectedBranch =
  "review/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r2-product-owner-packet";
const evidenceCommitB = "9e9bf7d90740c1d00bfc4e282c85906744cd736c";
const packageCommitA = "6eea601c99f18cbde62659140502d0456b0b505b";
const mainBaseline = "61e33a10e195fad17e253a6b9719217e1992f273";
const documentationMarker = "M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R2";

const paths = {
  contract: taskRoot + "/adjudication-contract-v1.json",
  adjudication: taskRoot + "/chatgpt-evidence-adjudication-v1.json",
  summary: taskRoot + "/adjudication-summary-v1.md",
  packet: taskRoot + "/product-owner-review-packet-v1.md",
  ownerReview: taskRoot + "/product-owner-review-v1.json",
  capabilities: taskRoot + "/capabilities-v1.json",
  verifier:
    "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r2-evidence-adjudication.mjs",
  taskReview:
    "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R2_REVIEW.md",
  currentFocus: "docs/CURRENT_FOCUS.md",
  wbs: "docs/WBS.md",
  handoff: "docs/CODEX_HANDOFF.md",
  sourceContract: sourceRoot + "/diagnostic-contract-v1.json",
  sourceCases: sourceRoot + "/diagnostic-cases-v1.json",
  sourceQuality: sourceRoot + "/quality-contract-v1.json",
  sourceAuthorization: sourceRoot + "/authorization-v1.json",
  sourceResults: sourceRoot + "/diagnostic-results-v1.json",
  sourceSummary: sourceRoot + "/diagnostic-summary-v1.md",
  sourceProductReview: sourceRoot + "/product-review-v1.md",
  sourceOwnerReview: sourceRoot + "/product-owner-review-v1.json",
  sourceCapabilities: sourceRoot + "/capabilities-v1.json",
  sourceEvaluator:
    "scripts/lib/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-evaluator-v1.mjs",
  sourceAuditor:
    "scripts/lib/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-evidence-auditor-v1.mjs",
  sourceRunner:
    "scripts/run-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-v11-provider-diagnostic.mjs",
  sourceVerifier:
    "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-v11-provider-package.mjs",
  migration0004:
    "supabase/migrations/0004_m2_p4_candidate_source_isolation.sql",
  migration0005:
    "supabase/migrations/0005_m2_p4_directional_guidance_runtime.sql",
  service: "lib/assessment/runtime/service.ts",
};

const exactScope = [
  paths.contract,
  paths.adjudication,
  paths.summary,
  paths.packet,
  paths.ownerReview,
  paths.capabilities,
  paths.verifier,
  paths.taskReview,
  paths.currentFocus,
  paths.wbs,
  paths.handoff,
];
const newPaths = exactScope.slice(0, 8);
const updatedPaths = exactScope.slice(8);
const frozenPackagePaths = [
  paths.sourceContract,
  paths.sourceCases,
  paths.sourceQuality,
  paths.sourceEvaluator,
  paths.sourceAuditor,
  paths.sourceRunner,
  paths.sourceVerifier,
];
const frozenEvidencePaths = [
  paths.sourceResults,
  paths.sourceSummary,
  paths.sourceProductReview,
  paths.sourceOwnerReview,
  paths.sourceAuthorization,
  paths.sourceCapabilities,
  paths.sourceCases,
  paths.sourceQuality,
  paths.sourceEvaluator,
  paths.sourceAuditor,
];
const jsonPaths = [
  paths.contract,
  paths.adjudication,
  paths.ownerReview,
  paths.capabilities,
];

if (path.resolve(process.cwd()) !== repositoryRoot) {
  throw new Error("Run from repository root: " + repositoryRoot);
}

function run(command, args) {
  return spawnSync(command, args, {
    cwd: repositoryRoot,
    encoding: "utf8",
    maxBuffer: 128 * 1024 * 1024,
    windowsHide: true,
  });
}

function gitBuffer(...args) {
  return execFileSync(
    "git.exe",
    ["-c", "safe.directory=C:/projects/moon-reply", ...args],
    {
      cwd: repositoryRoot,
      maxBuffer: 128 * 1024 * 1024,
      windowsHide: true,
    },
  );
}

function git(...args) {
  return gitBuffer(...args).toString("utf8").trim();
}

function gitSucceeds(...args) {
  const completed = run("git.exe", [
    "-c",
    "safe.directory=C:/projects/moon-reply",
    ...args,
  ]);
  return !completed.error && completed.status === 0;
}

function strictDecode(buffer, label) {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch (error) {
    throw new Error(label + " is not strict UTF-8", { cause: error });
  }
}

function readBuffer(relativePath) {
  return readFileSync(path.join(repositoryRoot, relativePath));
}

function readText(relativePath) {
  return strictDecode(readBuffer(relativePath), relativePath);
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function blobAt(ref, relativePath) {
  return git("rev-parse", ref + ":" + relativePath);
}

function rawAt(ref, relativePath) {
  return gitBuffer("cat-file", "blob", blobAt(ref, relativePath));
}

function worktreeBlob(relativePath) {
  return git("hash-object", relativePath);
}

function nulEntries(buffer) {
  return buffer
    .toString("utf8")
    .split("\0")
    .filter(Boolean);
}

function sorted(values) {
  return [...values].sort((left, right) => left.localeCompare(right, "en"));
}

function changedPathsFromBaseline() {
  const tracked = git(
    "diff",
    "--name-only",
    "--no-renames",
    evidenceCommitB,
    "--",
  )
    .split(/\r?\n/u)
    .filter(Boolean);
  const untracked = nulEntries(
    gitBuffer("ls-files", "--others", "--exclude-standard", "-z"),
  );
  return sorted(new Set([...tracked, ...untracked]));
}

function sectionBetween(text, startMarker, endMarker) {
  const start = text.indexOf(startMarker);
  const end = text.indexOf(endMarker);
  if (start < 0 || end < 0 || end <= start) {
    return null;
  }
  return text.slice(start + startMarker.length, end);
}

function stringLeaves(value, currentKey = "") {
  if (typeof value === "string") {
    if (currentKey === "schema_version" || currentKey === "schemaVersion") {
      return [];
    }
    return [value];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item) => stringLeaves(item, currentKey));
  }
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, item]) =>
      stringLeaves(item, key),
    );
  }
  return [];
}

function uniqueLongStrings(value, minimumLength = 20) {
  return new Set(
    stringLeaves(value).filter((item) => item.length >= minimumLength),
  );
}

const failures = [];
let checkCount = 0;

function check(label, condition) {
  checkCount += 1;
  if (condition) {
    console.log("PASS " + label);
    return;
  }
  failures.push(label);
  console.error("FAIL " + label);
}

const contract = readJson(paths.contract);
const adjudication = readJson(paths.adjudication);
const ownerReview = readJson(paths.ownerReview);
const capabilities = readJson(paths.capabilities);
const sourceContract = readJson(paths.sourceContract);
const sourceCases = readJson(paths.sourceCases);
const sourceAuthorization = readJson(paths.sourceAuthorization);
const sourceResults = readJson(paths.sourceResults);
const sourceOwnerReview = readJson(paths.sourceOwnerReview);
const packet = readText(paths.packet);

const commitsAfterBaseline = Number(
  git("rev-list", "--count", evidenceCommitB + "..HEAD"),
);
const exactDirectBaseline =
  git("merge-base", evidenceCommitB, "HEAD") === evidenceCommitB &&
  (commitsAfterBaseline === 0 ||
    (commitsAfterBaseline === 1 &&
      git("rev-parse", "HEAD^") === evidenceCommitB));
check("exact baseline is Evidence Commit B", exactDirectBaseline);
check("expected review branch", git("branch", "--show-current") === expectedBranch);
check(
  "Evidence Commit B is exactly one commit after Package Commit A",
  git("rev-parse", evidenceCommitB + "^") === packageCommitA &&
    git("rev-list", "--count", packageCommitA + ".." + evidenceCommitB) ===
      "1",
);
check(
  "main and origin/main unchanged",
  git("rev-parse", "main") === mainBaseline &&
    git("rev-parse", "origin/main") === mainBaseline,
);

check(
  "exact scope 11/11",
  isDeepStrictEqual(changedPathsFromBaseline(), sorted(exactScope)) &&
    contract.exact_scope_count === 11 &&
    isDeepStrictEqual(contract.exact_scope, exactScope),
);
check(
  "new paths 8/8 and updated paths 3/3",
  newPaths.every(
    (relativePath) =>
      !gitSucceeds("cat-file", "-e", evidenceCommitB + ":" + relativePath) &&
      existsSync(path.join(repositoryRoot, relativePath)),
  ) &&
    updatedPaths.every(
      (relativePath) =>
        gitSucceeds("cat-file", "-e", evidenceCommitB + ":" + relativePath) &&
        existsSync(path.join(repositoryRoot, relativePath)),
    ) &&
    contract.new_path_count === 8 &&
    contract.updated_path_count === 3,
);

check(
  "frozen seven package paths unchanged",
  isDeepStrictEqual(contract.frozen_package_paths, frozenPackagePaths) &&
    isDeepStrictEqual(
      sourceContract.frozen_after_package_commit_paths,
      frozenPackagePaths,
    ) &&
    frozenPackagePaths.every(
      (relativePath) =>
        blobAt(packageCommitA, relativePath) ===
          blobAt(evidenceCommitB, relativePath) &&
        worktreeBlob(relativePath) === blobAt(packageCommitA, relativePath),
    ),
);
check(
  "frozen ten evidence paths unchanged",
  isDeepStrictEqual(contract.frozen_evidence_paths, frozenEvidencePaths) &&
    frozenEvidencePaths.every(
      (relativePath) =>
        worktreeBlob(relativePath) === blobAt(evidenceCommitB, relativePath),
    ),
);

const manifestPaths = contract.source_manifest.map((item) => item.path);
check(
  "all source hashes match Evidence Commit B",
  contract.source_manifest.length === 10 &&
    isDeepStrictEqual(manifestPaths, frozenEvidencePaths) &&
    contract.source_manifest.every((item) => {
      const raw = rawAt(evidenceCommitB, item.path);
      strictDecode(raw, evidenceCommitB + ":" + item.path);
      return (
        item.git_blob_sha === blobAt(evidenceCommitB, item.path) &&
        item.raw_sha256 === sha256(raw) &&
        item.bytes === raw.length
      );
    }),
);

const allStrictUtf8Paths = new Set([
  ...exactScope,
  ...frozenPackagePaths,
  ...frozenEvidencePaths,
]);
let strictUtf8Passed = true;
try {
  for (const relativePath of allStrictUtf8Paths) {
    readText(relativePath);
  }
} catch {
  strictUtf8Passed = false;
}
check("strict UTF-8", strictUtf8Passed);
check(
  "JSON valid",
  jsonPaths.every((relativePath) => {
    try {
      readJson(relativePath);
      return true;
    } catch {
      return false;
    }
  }),
);
const scopeText = exactScope.map((relativePath) => readText(relativePath));
const replacementCharacterCount = scopeText.reduce(
  (total, text) => total + (text.match(/\uFFFD/gu)?.length ?? 0),
  0,
);
check("U+FFFD count 0", replacementCharacterCount === 0);

const secretPatterns = [
  new RegExp(
    "\\b" + ["s", "k"].join("") + "-(?:proj-)?[A-Za-z0-9_-]{20,}\\b",
    "gu",
  ),
  /\bBearer\s+[A-Za-z0-9._~-]{20,}\b/gu,
  /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\b/gu,
  /postgres(?:ql)?:\/\/[^\s`"']+/gu,
  /https:\/\/[a-z0-9]{20,}\.supabase\.co\b/gu,
];
const secretCount = scopeText.reduce(
  (total, text) =>
    total +
    secretPatterns.reduce(
      (patternTotal, pattern) =>
        patternTotal + (text.match(pattern)?.length ?? 0),
      0,
    ),
  0,
);
check("secret count 0", secretCount === 0);

const frozenRatingFields = ["良い", "気になる", "商品として厳しい", "コメント"];
const frozenRatingValues = [
  ...frozenRatingFields.map((field) => sourceOwnerReview.ratings[field]),
  ...sourceOwnerReview.cases.flatMap((item) =>
    frozenRatingFields.map((field) => item[field]),
  ),
];
check(
  "frozen Product Owner ratings remain 28/28 null",
  frozenRatingValues.length === 28 &&
    frozenRatingValues.every((value) => value === null),
);
check(
  "marker unchanged and authorization unchanged",
  existsSync(path.join(repositoryRoot, contract.marker.path)) &&
    sha256(readBuffer(contract.marker.path)) === contract.marker.raw_sha256 &&
    worktreeBlob(paths.sourceAuthorization) ===
      blobAt(evidenceCommitB, paths.sourceAuthorization) &&
    sourceAuthorization.consumed === true &&
    sourceAuthorization.rerun_authorized === false,
);

check(
  "machine and Protocol verdicts unchanged",
  sourceResults.machine_verdict === "FAIL" &&
    sourceResults.evaluation.protocol_verdict === "PASS" &&
    sourceResults.evaluation.hard_gate_verdict === "FAIL" &&
    sourceResults.evaluation.product_outcome_verdict === "FAIL" &&
    sourceResults.provider_attempts === 37 &&
    sourceResults.completed_calls === 37 &&
    sourceResults.technical_failure === null &&
    sourceResults.evidence_audit.verdict === "PASS" &&
    isDeepStrictEqual(contract.frozen_historical_result, {
      machine_verdict: "FAIL",
      protocol_verdict: "PASS",
      hard_verdict: "FAIL",
      product_verdict: "FAIL",
      provider_attempts: 37,
      completed_calls: 37,
      technical_failure: null,
      evidence_audit: "PASS",
    }) &&
    adjudication.frozen_machine_result.rewritten === false,
);

const expectedFindings = [
  {
    case_id: "E-R3-01",
    finding: "UNSUPPORTED_CERTAINTY",
    machine_origin: "deterministic evaluator",
    classification: "evaluator_false_positive",
    confidence: "high",
    reason:
      "The matched literal was 確実に in user-owned schedule confirmation wording. It did not assert the other person’s hidden state, future reply, relationship result, or guaranteed external event.",
    product_impact: "none_material",
    machine_verdict_changed: false,
  },
  {
    case_id: "E-R3-05",
    finding: "FACT_FIDELITY",
    machine_origin: "PB-06",
    classification: "pb06_false_positive",
    confidence: "medium",
    reason:
      "The phrase 今夜は返事や謝罪を重ねるより is editorially ambiguous but does not state that a reply or apology was already sent. Base explicitly records not_replied.",
    product_impact: "minor_editorial_ambiguity",
    machine_verdict_changed: false,
  },
  {
    case_id: "E-R3-06",
    finding: "ASSUMPTION_AS_FACT",
    machine_origin: "PB-06",
    classification: "genuine_product_defect",
    confidence: "high",
    reason:
      "The Report asserted that the user had not replied because the exact time was undecided. Base supports both facts separately but does not support that causal relationship.",
    product_impact: "materially_misleading_causal_attribution",
    machine_verdict_changed: false,
  },
  {
    case_id: "E-R3-06",
    finding: "ACTION_CONSISTENCY",
    machine_origin: "PB-06 plus Application disposition",
    classification: "evaluator_contract_defect",
    underlying_branch_classification: "acceptable_future_reassessment",
    confidence: "high",
    reason:
      "The current decision was reply_now. The future wait_and_reassess branch applied after the first reply when no new information arrived. The current-state Policy allowed set must not be frozen onto that future state. A paired DECISION_ALLOWED finding for the same branch was already treated as an accepted temporal false positive.",
    product_impact: "no_independent_material_direction_conflict",
    machine_verdict_changed: false,
  },
];
check(
  "exact adjudication matrix",
  isDeepStrictEqual(adjudication.adjudication_findings, expectedFindings) &&
    isDeepStrictEqual(adjudication.counts, {
      true_provider_product_defects: 1,
      pb06_false_positives: 1,
      deterministic_evaluator_false_positives: 1,
      evaluator_contract_defects: 1,
    }) &&
    isDeepStrictEqual(adjudication.derived_final_result_failures, [
      "E-R3-05",
      "E-R3-06",
    ]) &&
    adjudication.provider_quality_established === false &&
    adjudication.provider_rerun_required_now === false &&
    adjudication.provider_rerun_authorized === false &&
    expectedFindings.every((item) => item.machine_verdict_changed === false),
);

const expectedEffectiveCases = [
  {
    case_id: "E-R3-01",
    frozen_machine_product_passed: false,
    chatgpt_adjudicated_finding: "false_positive",
    accepted_final_result_present: true,
    product_owner_review_ready: true,
  },
  {
    case_id: "E-R3-02",
    frozen_machine_product_passed: true,
    accepted_final_result_present: true,
    product_owner_review_ready: true,
  },
  {
    case_id: "E-R3-03",
    frozen_machine_product_passed: true,
    accepted_final_result_present: true,
    product_owner_review_ready: true,
  },
  {
    case_id: "E-R3-04",
    frozen_machine_product_passed: true,
    accepted_final_result_present: true,
    product_owner_review_ready: true,
  },
  {
    case_id: "E-R3-05",
    frozen_machine_product_passed: false,
    accepted_final_result_present: false,
    product_owner_review_ready: false,
    rejected_intermediate_label: "棄却された中間生成物",
  },
  {
    case_id: "E-R3-06",
    frozen_machine_product_passed: false,
    accepted_final_result_present: false,
    genuine_product_defect_present: true,
    product_owner_review_ready: false,
    rejected_intermediate_label: "棄却された中間生成物",
  },
];
check(
  "exact effective case assessment",
  isDeepStrictEqual(
    adjudication.effective_case_assessment,
    expectedEffectiveCases,
  ),
);

const reviewReadyCaseIds = ["E-R3-01", "E-R3-02", "E-R3-03", "E-R3-04"];
const excludedCaseIds = ["E-R3-05", "E-R3-06"];
const sourceCaseById = new Map(sourceCases.map((item) => [item.case_id, item]));
const resultCaseById = new Map(
  sourceResults.cases.map((item) => [item.case_id, item]),
);
const evaluationCaseById = new Map(
  sourceResults.evaluation.cases.map((item) => [item.case_id, item]),
);

let packetOrderPassed = true;
let finalContentPassed = true;
let noIntermediateContentPassed = true;
for (const caseId of reviewReadyCaseIds) {
  const startMarker = "<!-- ACCEPTED_FINAL_RESULT:" + caseId + ":BEGIN -->";
  const endMarker = "<!-- ACCEPTED_FINAL_RESULT:" + caseId + ":END -->";
  const section = sectionBetween(packet, startMarker, endMarker);
  const definition = sourceCaseById.get(caseId);
  const resultCase = resultCaseById.get(caseId);
  if (!section || !definition || !resultCase?.final_result) {
    finalContentPassed = false;
    packetOrderPassed = false;
    continue;
  }
  const orderedLabels = [
    "#### 1. ケース概要",
    "#### 2. ユーザー入力",
    "#### 3. 候補文",
    "#### 4. 最終eligibility",
    "#### 5. 最終recommended direction",
    "#### 6. 最終送信文案",
    "#### 7. 実際の顧客向け鑑定ノート",
    "#### 8. 今すぐ行うこと",
    "#### 9. 再判断条件",
    "#### 10. 固定limitation",
    "#### 11. Product Owner評価欄",
  ];
  const labelIndexes = orderedLabels.map((label) => section.indexOf(label));
  packetOrderPassed &&=
    labelIndexes.every((index) => index >= 0) &&
    labelIndexes.every((index, position) =>
      position === 0 ? true : index > labelIndexes[position - 1],
    );
  const input = definition.synthetic_input;
  const inputStrings = [
    definition.title,
    definition.purpose,
    input.relationship,
    ...input.requested_topics,
    ...input.current_situation.split("\n").filter(Boolean),
    ...(typeof input.optional_message === "string"
      ? input.optional_message.split("\n").filter(Boolean)
      : []),
  ];
  finalContentPassed &&= inputStrings.every((value) => section.includes(value));
  finalContentPassed &&= section.includes(resultCase.final_result.eligibility);
  if (resultCase.final_result.report) {
    const finalResult = resultCase.final_result;
    const decisionPlan = finalResult.report.decisionPlan;
    const requiredFinalStrings = [
      finalResult.decision,
      ...stringLeaves(finalResult.report.content),
      ...decisionPlan.actions_to_take,
      ...decisionPlan.change_conditions.flatMap((item) => [
        item.condition,
        item.resulting_direction,
      ]),
      finalResult.report.fixedLimitation,
      ...(decisionPlan.recommended_message_draft
        ? [decisionPlan.recommended_message_draft.text]
        : []),
    ];
    finalContentPassed &&= requiredFinalStrings.every((value) =>
      section.includes(value),
    );
    const finalStrings = new Set(stringLeaves(finalResult));
    const intermediateOnlyStrings = new Set([
      ...uniqueLongStrings(resultCase.evidence.raw_stage_outputs["PB-04"]),
      ...uniqueLongStrings(resultCase.evidence.raw_stage_outputs["PB-05"]),
    ]);
    for (const value of intermediateOnlyStrings) {
      if (!finalStrings.has(value) && section.includes(value)) {
        noIntermediateContentPassed = false;
      }
    }
  } else {
    finalContentPassed &&=
      caseId === "E-R3-03" &&
      resultCase.final_result.eligibility === "safety_blocked" &&
      !("decision" in resultCase.final_result) &&
      !("report" in resultCase.final_result) &&
      section.includes("Decision Planなし") &&
      section.includes("draftなし") &&
      section.includes("Reportなし") &&
      section.includes("workaroundも返されていません");
  }
}
check("Product Owner packet field order", packetOrderPassed);
check(
  "accepted final content comes only from final_result",
  finalContentPassed &&
    reviewReadyCaseIds.every((caseId) => {
      const item = resultCaseById.get(caseId);
      return isDeepStrictEqual(item.final_result, item.evidence.final_result);
    }),
);
check("no intermediate content labelled final", noIntermediateContentPassed);

const ratingIndexE01 = packet.indexOf(
  "#### 11. Product Owner評価欄",
  packet.indexOf("<!-- ACCEPTED_FINAL_RESULT:E-R3-01:BEGIN -->"),
);
const appendixIndexE01 = packet.indexOf(
  "#### 技術付録（Product Owner評価欄の後）",
  packet.indexOf("<!-- ACCEPTED_FINAL_RESULT:E-R3-01:BEGIN -->"),
);
check(
  "E-R3-01 diagnostic appendix follows rating fields",
  ratingIndexE01 >= 0 && appendixIndexE01 > ratingIndexE01,
);

let excludedCasesPassed = true;
for (const caseId of excludedCaseIds) {
  const section = sectionBetween(
    packet,
    "<!-- NON_REVIEWABLE:" + caseId + ":BEGIN -->",
    "<!-- NON_REVIEWABLE:" + caseId + ":END -->",
  );
  const resultCase = resultCaseById.get(caseId);
  const evaluationCase = evaluationCaseById.get(caseId);
  const findingNames = evaluationCase.root_blocking_findings.map(
    (item) => item.finding_code,
  );
  excludedCasesPassed &&=
    Boolean(section) &&
    resultCase.final_result === null &&
    section.includes("final_result: なし") &&
    section.includes("status: 棄却された中間生成物") &&
    section.includes(resultCase.safe_error_code) &&
    findingNames.every((finding) => section.includes(finding)) &&
    section.includes("accepted_final_result_absent") &&
    (section.match(/^- /gmu)?.length ?? 0) === 5;
  const excludedIntermediateStrings = new Set([
    ...uniqueLongStrings(resultCase.evidence.raw_stage_outputs["PB-04"]),
    ...uniqueLongStrings(resultCase.evidence.raw_stage_outputs["PB-05"]),
  ]);
  for (const value of excludedIntermediateStrings) {
    if (section.includes(value)) {
      excludedCasesPassed = false;
    }
  }
}
check("E-R3-05 and E-R3-06 excluded", excludedCasesPassed);

const ownerRatingValues = ownerReview.cases.flatMap((item) =>
  frozenRatingFields.map((field) => item[field]),
);
check(
  "Product Owner rating values 16/16 null",
  ownerReview.status === "pending_product_owner_review" &&
    isDeepStrictEqual(
      ownerReview.cases.map((item) => item.case_id),
      reviewReadyCaseIds,
    ) &&
    ownerRatingValues.length === 16 &&
    ownerRatingValues.every((value) => value === null) &&
    isDeepStrictEqual(ownerReview.excluded_case_ids, excludedCaseIds) &&
    ownerReview.exclusion_reason === "accepted_final_result_absent" &&
    ownerReview.machine_pass_does_not_complete_product_owner_review === true &&
    ownerReview.chatgpt_adjudication_does_not_complete_product_owner_review ===
      true,
);

check(
  "capabilities exact pending Product Owner state",
  capabilities.status ===
    "chatgpt_evidence_adjudication_complete_product_owner_review_pending" &&
    capabilities.evidence_commit_b === evidenceCommitB &&
    capabilities.frozen_machine_verdict === "FAIL" &&
    capabilities.frozen_protocol_verdict === "PASS" &&
    capabilities.frozen_evidence_unchanged === true &&
    capabilities.chatgpt_adjudication_complete === true &&
    capabilities.product_owner_review_ready === true &&
    isDeepStrictEqual(
      capabilities.product_owner_review_ready_cases,
      reviewReadyCaseIds,
    ) &&
    isDeepStrictEqual(
      capabilities.product_owner_review_excluded_cases,
      excludedCaseIds,
    ) &&
    capabilities.product_owner_review_complete === false &&
    capabilities.true_provider_product_defect_count === 1 &&
    capabilities.provider_quality_established === false &&
    capabilities.provider_rerun_ready === false &&
    capabilities.provider_rerun_authorized === false &&
    capabilities.successor_remediation_planning_ready === true &&
    capabilities.successor_remediation_authorized === false &&
    capabilities.active_runtime_activated === false &&
    capabilities.r4_ready === false &&
    capabilities.r4_authorized === false &&
    capabilities.c2_authorized === false &&
    capabilities.main_changed === false &&
    capabilities.next_action ===
      "product_owner_review_of_accepted_final_results",
);

check(
  "Provider DB Supabase remain 0 / 0 / 0",
  [contract.operations, adjudication.operations].every(
    (operations) =>
      operations.provider_calls === 0 &&
      operations.db_operations === 0 &&
      operations.supabase_operations === 0,
  ),
);
check(
  "runner and package-check were not rerun",
  contract.operations.runner_rerun === false &&
    contract.operations.package_check_rerun === false,
);
check(
  "migrations unchanged",
  worktreeBlob(paths.migration0004) ===
    contract.protected_authorities.migration_0004_blob &&
    worktreeBlob(paths.migration0005) ===
      contract.protected_authorities.migration_0005_blob &&
    gitSucceeds("diff", "--quiet", evidenceCommitB, "--", "supabase/migrations"),
);
check(
  "Active Service unchanged and Active Runtime not activated",
  worktreeBlob(paths.service) === contract.protected_authorities.active_service_blob &&
    readText(paths.service).includes(
      "loadM2P4ProductQualityRuntimeStageCatalog",
    ) &&
    contract.protected_authorities.active_runtime_catalog ===
      "runtime-stage-catalog-v4.0.0" &&
    contract.operations.active_service_changes === false &&
    contract.operations.active_runtime_activated === false &&
    adjudication.operations.active_service_changed === false &&
    adjudication.operations.active_runtime_activated === false &&
    capabilities.active_runtime_activated === false,
);
check(
  "R4 and C2 remain unauthorized",
  contract.operations.r4_authorized === false &&
    contract.operations.c2_authorized === false &&
    adjudication.operations.r4_authorized === false &&
    adjudication.operations.c2_authorized === false &&
    capabilities.r4_ready === false &&
    capabilities.r4_authorized === false &&
    capabilities.c2_authorized === false,
);

check(
  "rolling documentation synchronized",
  [paths.taskReview, paths.currentFocus, paths.wbs, paths.handoff].every(
    (relativePath) => {
      const text = readText(relativePath);
      return (
        text.includes(documentationMarker) &&
        text.includes(
          "chatgpt_evidence_adjudication_complete_product_owner_review_pending",
        ) &&
        text.includes(evidenceCommitB)
      );
    },
  ),
);

const noTrailingWhitespace = exactScope.every((relativePath) =>
  readText(relativePath)
    .split(/\r?\n/u)
    .every((line) => !/[ \t]+$/u.test(line)),
);
const diffCheck = run("git.exe", [
  "-c",
  "safe.directory=C:/projects/moon-reply",
  "diff",
  "--check",
  evidenceCommitB,
  "--",
]);
check(
  "git diff --check PASS",
  noTrailingWhitespace &&
    !diffCheck.error &&
    diffCheck.status === 0 &&
    diffCheck.stdout.trim() === "",
);

console.log(
  "Evidence adjudication verifier: " +
    (failures.length === 0 ? "PASS" : "FAIL") +
    " " +
    (checkCount - failures.length) +
    "/" +
    checkCount,
);
console.log("Provider / DB / Supabase: 0 / 0 / 0");
console.log("U+FFFD count: " + replacementCharacterCount);
console.log("Secret count: " + secretCount);

if (failures.length > 0) {
  console.error("Failed checks: " + failures.join("; "));
  process.exitCode = 1;
}
