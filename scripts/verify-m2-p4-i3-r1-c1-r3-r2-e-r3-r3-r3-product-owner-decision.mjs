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
const taskRoot =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3";
const previousRoot =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r2";
const evidenceRoot =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3";
const expectedBranch =
  "review/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-product-owner-decision";
const baseline = "f0b5dff36b63a9deaf5f87f8825911b0510ac0b1";
const evidenceCommitB = "9e9bf7d90740c1d00bfc4e282c85906744cd736c";
const packageCommitA = "6eea601c99f18cbde62659140502d0456b0b505b";
const mainBaseline = "61e33a10e195fad17e253a6b9719217e1992f273";
const documentationMarker = "M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3";
const previousDocumentationMarker =
  "M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R2";

const paths = {
  contract: taskRoot + "/source-contract-v1.json",
  decision: taskRoot + "/product-owner-review-decision-v1.json",
  summary: taskRoot + "/product-owner-review-summary-v1.md",
  charter: taskRoot + "/v12-remediation-charter-v1.json",
  charterMarkdown: taskRoot + "/v12-remediation-charter-v1.md",
  capabilities: taskRoot + "/capabilities-v1.json",
  verifier:
    "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-product-owner-decision.mjs",
  taskReview:
    "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R3_REVIEW.md",
  currentFocus: "docs/CURRENT_FOCUS.md",
  wbs: "docs/WBS.md",
  handoff: "docs/CODEX_HANDOFF.md",
  previousContract: previousRoot + "/adjudication-contract-v1.json",
  previousAdjudication:
    previousRoot + "/chatgpt-evidence-adjudication-v1.json",
  previousSummary: previousRoot + "/adjudication-summary-v1.md",
  previousPacket: previousRoot + "/product-owner-review-packet-v1.md",
  previousOwnerReview: previousRoot + "/product-owner-review-v1.json",
  previousCapabilities: previousRoot + "/capabilities-v1.json",
  previousVerifier:
    "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r2-evidence-adjudication.mjs",
  previousTaskReview:
    "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R2_REVIEW.md",
  sourceDiagnosticContract: evidenceRoot + "/diagnostic-contract-v1.json",
  sourceCases: evidenceRoot + "/diagnostic-cases-v1.json",
  sourceQuality: evidenceRoot + "/quality-contract-v1.json",
  sourceAuthorization: evidenceRoot + "/authorization-v1.json",
  sourceResults: evidenceRoot + "/diagnostic-results-v1.json",
  sourceSummary: evidenceRoot + "/diagnostic-summary-v1.md",
  sourceProductReview: evidenceRoot + "/product-review-v1.md",
  sourceOwnerReview: evidenceRoot + "/product-owner-review-v1.json",
  sourceCapabilities: evidenceRoot + "/capabilities-v1.json",
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
  activeService: "lib/assessment/runtime/service.ts",
};

const exactScope = [
  paths.contract,
  paths.decision,
  paths.summary,
  paths.charter,
  paths.charterMarkdown,
  paths.capabilities,
  paths.verifier,
  paths.taskReview,
  paths.currentFocus,
  paths.wbs,
  paths.handoff,
];
const newPaths = exactScope.slice(0, 8);
const updatedPaths = exactScope.slice(8);
const previousReviewPacketScope = [
  paths.previousContract,
  paths.previousAdjudication,
  paths.previousSummary,
  paths.previousPacket,
  paths.previousOwnerReview,
  paths.previousCapabilities,
  paths.previousVerifier,
  paths.previousTaskReview,
  paths.currentFocus,
  paths.wbs,
  paths.handoff,
];
const previousImmutablePaths = previousReviewPacketScope.slice(0, 8);
const previousRollingPaths = previousReviewPacketScope.slice(8);
const frozenPackagePaths = [
  paths.sourceDiagnosticContract,
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
  paths.decision,
  paths.charter,
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
    baseline,
    "--",
  )
    .split(/\r?\n/u)
    .filter(Boolean);
  const untracked = nulEntries(
    gitBuffer("ls-files", "--others", "--exclude-standard", "-z"),
  );
  return sorted(new Set([...tracked, ...untracked]));
}

function markedBlock(text, marker) {
  const startMarker = "<!-- " + marker + ":BEGIN -->";
  const endMarker = "<!-- " + marker + ":END -->";
  const start = text.indexOf(startMarker);
  const end = text.indexOf(endMarker);
  if (start < 0 || end < 0 || end < start) {
    return null;
  }
  return text
    .slice(start, end + endMarker.length)
    .replace(/\r\n/gu, "\n");
}

const secretPatterns = [
  new RegExp(
    "\\b" + ["s", "k"].join("") + "-(?:proj-)?[A-Za-z0-9_-]{20,}\\b",
    "gu",
  ),
  /\bBearer\s+[A-Za-z0-9._~-]{20,}\b/gu,
  /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\b/gu,
  /postgres(?:ql)?:\/\/[^\s"']+/gu,
  /https:\/\/[a-z0-9]{20,}\.supabase\.co\b/gu,
];

function countSecrets(text) {
  return secretPatterns.reduce(
    (total, pattern) => total + (text.match(pattern)?.length ?? 0),
    0,
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
const decision = readJson(paths.decision);
const charter = readJson(paths.charter);
const capabilities = readJson(paths.capabilities);
const previousAdjudication = readJson(paths.previousAdjudication);
const previousOwnerReview = readJson(paths.previousOwnerReview);
const sourceDiagnosticContract = readJson(paths.sourceDiagnosticContract);
const sourceAuthorization = readJson(paths.sourceAuthorization);
const sourceResults = readJson(paths.sourceResults);
const sourceOwnerReview = readJson(paths.sourceOwnerReview);

const commitsAfterBaseline = Number(
  git("rev-list", "--count", baseline + "..HEAD"),
);
const exactDirectBaseline =
  git("merge-base", baseline, "HEAD") === baseline &&
  (commitsAfterBaseline === 0 ||
    (commitsAfterBaseline === 1 &&
      git("rev-parse", "HEAD^") === baseline));
check("exact baseline Commit", exactDirectBaseline);
check("expected Product Owner decision branch", git("branch", "--show-current") === expectedBranch);
check(
  "Evidence Commit B and Package Commit A ancestry",
  gitSucceeds("merge-base", "--is-ancestor", packageCommitA, evidenceCommitB) &&
    gitSucceeds("merge-base", "--is-ancestor", evidenceCommitB, baseline),
);
check(
  "main and origin/main unchanged",
  git("rev-parse", "main") === mainBaseline &&
    git("rev-parse", "origin/main") === mainBaseline,
);

check(
  "exact scope 11/11",
  isDeepStrictEqual(changedPathsFromBaseline(), sorted(exactScope)) &&
    isDeepStrictEqual(contract.exact_scope, exactScope) &&
    contract.exact_scope_count === 11 &&
    contract.new_path_count === 8 &&
    contract.updated_path_count === 3 &&
    newPaths.every(
      (relativePath) =>
        existsSync(path.join(repositoryRoot, relativePath)) &&
        !gitSucceeds("cat-file", "-e", baseline + ":" + relativePath),
    ) &&
    updatedPaths.every(
      (relativePath) =>
        existsSync(path.join(repositoryRoot, relativePath)) &&
        gitSucceeds("cat-file", "-e", baseline + ":" + relativePath),
    ),
);

const expectedSourceManifest = [
  {
    path: paths.previousPacket,
    git_blob_sha: "e7b9753361ebb45bf14a5615149fd01ca6ba3b77",
    raw_sha256:
      "74cd5931d3eba4260b69cd6bf8a9df7c5738c2baa14b145ebd9a73c81d3e9442",
    bytes: 26005,
    strict_utf8_result: "PASS",
    replacement_character_count: 0,
    json_validity: "not_applicable",
    secret_scan_result: "PASS",
    secret_count: 0,
  },
  {
    path: paths.previousAdjudication,
    git_blob_sha: "096827af38115a2ebdea27af907ef1234ab3da40",
    raw_sha256:
      "82b40b19dff3927ee0ee9803610821ce9239234e5f104e5ddf248832d823caa1",
    bytes: 6246,
    strict_utf8_result: "PASS",
    replacement_character_count: 0,
    json_validity: "PASS",
    secret_scan_result: "PASS",
    secret_count: 0,
  },
  {
    path: paths.previousOwnerReview,
    git_blob_sha: "68ff9d00e3c95eae9786e5321bac8801ee1fe77e",
    raw_sha256:
      "45147b76ce5ce1ced2229a1a1bef4d106bd1aea7f5c21f9514d67ee9d5c905e4",
    bytes: 1070,
    strict_utf8_result: "PASS",
    replacement_character_count: 0,
    json_validity: "PASS",
    secret_scan_result: "PASS",
    secret_count: 0,
  },
];
check(
  "source contract identities",
  contract.schema_version ===
    "m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-source-contract-v1" &&
    contract.task_id === documentationMarker &&
    contract.status ===
      "product_owner_review_complete_remediation_required" &&
    contract.mode === "offline_planning_only" &&
    contract.branch === expectedBranch &&
    contract.baseline === baseline &&
    contract.evidence_commit_b === evidenceCommitB &&
    contract.package_commit_a === packageCommitA &&
    contract.main_baseline === mainBaseline &&
    contract.source_authority_commit === baseline &&
    contract.source_encoding === "UTF-8" &&
    contract.source_manifest_count === 3 &&
    isDeepStrictEqual(contract.source_manifest, expectedSourceManifest),
);

let sourceHashesValid = true;
for (const item of contract.source_manifest) {
  try {
    const raw = rawAt(baseline, item.path);
    const text = strictDecode(raw, baseline + ":" + item.path);
    let jsonValidity = "not_applicable";
    if (item.path.endsWith(".json")) {
      JSON.parse(text);
      jsonValidity = "PASS";
    }
    sourceHashesValid =
      sourceHashesValid &&
      item.git_blob_sha === blobAt(baseline, item.path) &&
      item.raw_sha256 === sha256(raw) &&
      item.bytes === raw.length &&
      item.strict_utf8_result === "PASS" &&
      item.replacement_character_count ===
        (text.match(/\uFFFD/gu)?.length ?? 0) &&
      item.json_validity === jsonValidity &&
      item.secret_scan_result === "PASS" &&
      item.secret_count === countSecrets(text) &&
      item.secret_count === 0 &&
      worktreeBlob(item.path) === blobAt(baseline, item.path);
  } catch {
    sourceHashesValid = false;
  }
}
check("source blob and raw hashes", sourceHashesValid);

const allStrictUtf8Paths = new Set([
  ...exactScope,
  ...previousReviewPacketScope,
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
  "JSON validity",
  [...jsonPaths, paths.previousAdjudication, paths.previousOwnerReview].every(
    (relativePath) => {
      try {
        readJson(relativePath);
        return true;
      } catch {
        return false;
      }
    },
  ),
);
const scannedTexts = [...new Set([
  ...exactScope,
  ...contract.source_manifest.map((item) => item.path),
])].map((relativePath) => readText(relativePath));
const replacementCharacterCount = scannedTexts.reduce(
  (total, text) => total + (text.match(/\uFFFD/gu)?.length ?? 0),
  0,
);
const secretCount = scannedTexts.reduce(
  (total, text) => total + countSecrets(text),
  0,
);
check("U+FFFD count 0", replacementCharacterCount === 0);
check("secret count 0", secretCount === 0);

const previousImmutableUnchanged = previousImmutablePaths.every(
  (relativePath) =>
    worktreeBlob(relativePath) === blobAt(baseline, relativePath),
);
const previousRollingBlocksUnchanged = previousRollingPaths.every(
  (relativePath) =>
    markedBlock(readText(relativePath), previousDocumentationMarker) ===
    markedBlock(
      strictDecode(rawAt(baseline, relativePath), baseline + ":" + relativePath),
      previousDocumentationMarker,
    ),
);
check(
  "existing Review Packet 11/11 unchanged",
  contract.frozen_review_packet.commit === baseline &&
    contract.frozen_review_packet.scope_count === 11 &&
    contract.frozen_review_packet.immutable_path_count === 8 &&
    contract.frozen_review_packet.rolling_document_path_count === 3 &&
    contract.frozen_review_packet.rolling_document_integrity ===
      "prior_marked_block_unchanged" &&
    isDeepStrictEqual(
      contract.frozen_review_packet.scope,
      previousReviewPacketScope,
    ) &&
    previousReviewPacketScope.every((relativePath) =>
      existsSync(path.join(repositoryRoot, relativePath)),
    ) &&
    previousImmutableUnchanged &&
    previousRollingBlocksUnchanged,
);
check(
  "frozen Evidence 10/10 unchanged",
  isDeepStrictEqual(contract.frozen_evidence_paths, frozenEvidencePaths) &&
    frozenEvidencePaths.every(
      (relativePath) =>
        worktreeBlob(relativePath) === blobAt(evidenceCommitB, relativePath),
    ),
);
check(
  "frozen Package paths 7/7 unchanged",
  isDeepStrictEqual(contract.frozen_package_paths, frozenPackagePaths) &&
    isDeepStrictEqual(
      sourceDiagnosticContract.frozen_after_package_commit_paths,
      frozenPackagePaths,
    ) &&
    frozenPackagePaths.every(
      (relativePath) =>
        blobAt(packageCommitA, relativePath) ===
          blobAt(evidenceCommitB, relativePath) &&
        worktreeBlob(relativePath) === blobAt(packageCommitA, relativePath),
    ),
);

const ratingFields = ["良い", "気になる", "商品として厳しい", "コメント"];
const pendingRatingValues = previousOwnerReview.cases.flatMap((item) =>
  ratingFields.map((field) => item[field]),
);
check(
  "pending Product Owner Artifact remains 16/16 null",
  worktreeBlob(paths.previousOwnerReview) ===
    blobAt(baseline, paths.previousOwnerReview) &&
    contract.pending_product_owner_artifact.path ===
      paths.previousOwnerReview &&
    contract.pending_product_owner_artifact.required_null_count === 16 &&
    contract.pending_product_owner_artifact.must_remain_unchanged === true &&
    pendingRatingValues.length === 16 &&
    pendingRatingValues.every((value) => value === null),
);
const frozenOriginalRatingValues = [
  ...ratingFields.map((field) => sourceOwnerReview.ratings[field]),
  ...sourceOwnerReview.cases.flatMap((item) =>
    ratingFields.map((field) => item[field]),
  ),
];
check(
  "frozen original Product Owner Artifact remains 28/28 null",
  worktreeBlob(paths.sourceOwnerReview) ===
    blobAt(evidenceCommitB, paths.sourceOwnerReview) &&
    contract.frozen_original_product_owner_artifact.path ===
      paths.sourceOwnerReview &&
    contract.frozen_original_product_owner_artifact.required_null_count ===
      28 &&
    contract.frozen_original_product_owner_artifact.must_remain_unchanged ===
      true &&
    frozenOriginalRatingValues.length === 28 &&
    frozenOriginalRatingValues.every((value) => value === null),
);

check(
  "Machine and Protocol verdicts unchanged",
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
    sourceResults.machine_verdict === "FAIL" &&
    sourceResults.evaluation.protocol_verdict === "PASS" &&
    sourceResults.evaluation.hard_gate_verdict === "FAIL" &&
    sourceResults.evaluation.product_outcome_verdict === "FAIL" &&
    sourceResults.provider_attempts === 37 &&
    sourceResults.completed_calls === 37 &&
    sourceResults.technical_failure === null &&
    sourceResults.evidence_audit.verdict === "PASS",
);
check(
  "ChatGPT adjudication unchanged",
  worktreeBlob(paths.previousAdjudication) ===
    blobAt(baseline, paths.previousAdjudication) &&
    previousAdjudication.status ===
      "chatgpt_evidence_adjudication_complete" &&
    previousAdjudication.provider_quality_established === false &&
    previousAdjudication.provider_rerun_authorized === false,
);
check(
  "marker unchanged",
  existsSync(path.join(repositoryRoot, contract.marker.path)) &&
    contract.marker.must_remain_present === true &&
    contract.marker.must_remain_unchanged === true &&
    sha256(readBuffer(contract.marker.path)) === contract.marker.raw_sha256,
);
check(
  "authorization consumed unchanged and rerun_authorized false",
  contract.authorization.path === paths.sourceAuthorization &&
    contract.authorization.git_blob_sha ===
      blobAt(evidenceCommitB, paths.sourceAuthorization) &&
    contract.authorization.raw_sha256 ===
      sha256(rawAt(evidenceCommitB, paths.sourceAuthorization)) &&
    contract.authorization.consumed === true &&
    contract.authorization.rerun_authorized === false &&
    contract.authorization.must_remain_unchanged === true &&
    worktreeBlob(paths.sourceAuthorization) ===
      blobAt(evidenceCommitB, paths.sourceAuthorization) &&
    sourceAuthorization.consumed === true &&
    sourceAuthorization.rerun_authorized === false,
);

const expectedCaseDecisions = [
  {
    case_id: "E-R3-01",
    case_disposition:
      "content_correct_product_presentation_revision_required",
    良い:
      "最終判断と送信文案は明確で正確です。候補文の誤字だけを直し、木曜15時、丁寧語、業務のみという条件を守っています。",
    気になる:
      "鑑定ノートが単純な相談に対して長く、木曜15時で返す、業務だけにする、一通送ったら追加連絡しないという説明が複数セクションで反復されています。AIが項目を埋めた業務レポート感が残ります。",
    商品として厳しい:
      "この相談の複雑さに対して現在の出力量は過剰で、980円の価値より水増し感が先に立ちます。",
    コメント:
      "内容の正確性は高いです。短い相談では、判断、理由、送信文案、見直し条件へ圧縮し、相談の複雑さに応じて出力量を変える必要があります。",
  },
  {
    case_id: "E-R3-02",
    case_disposition:
      "product_content_near_acceptance_presentation_revision_required",
    良い:
      "事実と不安を正しく分離し、追いLINEをしないという本人の希望を最後まで守っています。現在の方向、今夜の行動、不安への寄り添いが自然です。",
    気になる:
      "同じ判断理由が複数セクションで反復されています。通常の返信間隔内である段階で「返信しない可能性」を明示することは、不安を余計に広げる可能性があります。内部判断構造を顧客向け表現へ十分に変換できているか、実UIで確認が必要です。",
    商品として厳しい:
      "内容自体は厳しくありません。ただし、現在の長さと項目数のままではAI生成レポート感が強く残ります。",
    コメント:
      "内容は合格に近いです。判断、理由、今夜の行動、見直すタイミングの少数ブロックへ圧縮すれば、980円の商品価値に近づきます。",
  },
  {
    case_id: "E-R3-03",
    case_disposition:
      "safety_logic_accepted_pre_payment_ux_review_required",
    良い:
      "明示的なno-contact境界をHard Gateとして正しく扱い、「最後に一言だけ」という例外を認めていません。送信文、後日の連絡、再判断条件、workaroundを一切返していません。",
    気になる:
      "accepted final_resultにはユーザー向けの停止理由や落ち着いた説明がありません。実際の決済前Safety画面の体験はこの証拠では評価できません。",
    商品として厳しい:
      "Safety判定自体は必須品質であり問題ありません。ただし、決済後に料金を受け取って空結果を返す設計なら重大な商品欠陥です。決済前に説明付きで停止する必要があります。",
    コメント:
      "Pipeline Safetyは合格です。最終受入には、相手の境界を弱めず、ユーザーを責めず、決済前に静かに停止するUIの確認が必要です。",
  },
  {
    case_id: "E-R3-04",
    case_disposition: "draft_accepted_report_revision_required",
    良い:
      "最終送信文案は自然で、そのまま使用できます。敬語、感謝、自分も楽しかったという感想を保ち、恋愛的な好意、誘い、将来の約束を加えていません。",
    気になる:
      "入力から確定できない「初対面の翌日」という時系列を作っています。明示された感謝と感想にまで「可能性」を付けており、事実と推測の分離が不自然です。反復と定型的なaftercareも多くあります。",
    商品として厳しい:
      "送信文案は合格です。ただし鑑定ノート全体は、単純な相談に対して長すぎ、980円の価値よりAIレポート感が先に立ちます。",
    コメント:
      "文案品質は合格、鑑定ノートは要圧縮です。明示された事実は明確に言い、相手の内心や将来だけを断定しない書き分けが必要です。",
  },
];
check(
  "exact four Product Owner case decisions",
  decision.status ===
    "product_owner_review_complete_remediation_required" &&
    decision.product_owner_review_complete === true &&
    isDeepStrictEqual(decision.reviewed_case_ids, [
      "E-R3-01",
      "E-R3-02",
      "E-R3-03",
      "E-R3-04",
    ]) &&
    isDeepStrictEqual(decision.excluded_case_ids, ["E-R3-05", "E-R3-06"]) &&
    decision.excluded_reason === "accepted_final_result_absent" &&
    isDeepStrictEqual(decision.case_decisions, expectedCaseDecisions),
);

const expectedOverallReason =
  "The accepted outputs demonstrate materially improved decision accuracy, candidate preservation, uncertainty handling, and Safety behavior. However, the customer-facing assessment remains too repetitive and report-like for simple consultations, contains at least one unsupported chronology claim, sometimes over-hedges explicit facts, and does not yet establish the final pre-payment Safety stop UX. One rejected case also contains a genuine unsupported causal attribution.";
check(
  "exact overall Product judgment",
  decision.overall_product_judgment ===
    "not_ready_for_jpy_980_runtime_activation" &&
    decision.overall_reason === expectedOverallReason &&
    decision.provider_quality_established === false &&
    decision.active_runtime_activation_approved === false &&
    decision.r4_approved === false &&
    decision.c2_approved === false &&
    decision.main_integration_approved === false &&
    decision.provider_rerun_required_now === false &&
    decision.provider_rerun_authorized === false &&
    decision.successor_remediation_planning_approved === true &&
    decision.successor_remediation_implementation_approved === false,
);

const productFindingIds = [
  ...decision.cross_case_product_findings.P0,
  ...decision.cross_case_product_findings.P1,
].map((item) => item.finding_id);
const allProductFindingText = JSON.stringify(
  decision.cross_case_product_findings,
);
check(
  "exact P0 and P1 Product findings",
  isDeepStrictEqual(productFindingIds, [
    "P0-1",
    "P0-2",
    "P0-3",
    "P1-4",
    "P1-5",
    "P1-6",
    "P1-7",
    "P1-8",
    "P1-9",
    "P1-10",
  ]) &&
    allProductFindingText.includes(
      "Separate facts must not be converted into a causal explanation without Base support.",
    ) &&
    allProductFindingText.includes(
      "No draft, later-contact branch, time-only exception, apology workaround, or reply request may be generated.",
    ) &&
    allProductFindingText.includes(
      "Safety stop must occur before payment and must have a separate, nonjudgmental user-facing UX.",
    ) &&
    allProductFindingText.includes(
      "Compression must be based on semantic necessity.",
    ) &&
    allProductFindingText.includes(
      "Each customer-facing idea should have one primary location.",
    ) &&
    allProductFindingText.includes(
      "Use it only when directly relevant to the user’s stated anxiety or compulsive checking behavior.",
    ) &&
    allProductFindingText.includes(
      "Only romantic intent or future meaning remains uncertain.",
    ) &&
    allProductFindingText.includes("Use exact timing only when the Base supplies it.") &&
    allProductFindingText.includes("理由はまだ分かりません") &&
    allProductFindingText.includes(
      "The final message draft must remain visually prominent and easy to copy when the user requested a draft.",
    ),
);

const expectedWorkstreams = [
  {
    workstream_id: "A",
    name: "Product presentation density",
    goal:
      "Preserve structured internal evidence while making the customer-facing delivery concise, proportional, and non-repetitive.",
    requirements: [
      "Determine whether compression belongs in PB-05 generation, deterministic presentation composition, UI rendering, or a bounded combination.",
      "Do not destroy structured facts needed for audit.",
      "Do not present every internal structured field merely because it exists.",
      "Define a customer-facing hierarchy such as: current conclusion, reason, draft when applicable, immediate action, observable reassessment condition.",
      "Do not impose one fixed word count on all consultations.",
      "Do not create case-ID-specific branches.",
      "Prove semantic coverage without paragraph repetition.",
    ],
  },
  {
    workstream_id: "B",
    name: "Factual precision",
    requirements: [
      "Block unsupported causal attribution.",
      "Block unsupported chronology.",
      "Preserve explicit observed facts as facts.",
      "Preserve interpretations as possibilities.",
      "Never infer why the user waited, did not reply, delayed, or stayed silent unless Base explicitly supplies that reason.",
      "Add offline fixtures for: separate facts incorrectly joined by because, same-day versus next-day ambiguity, explicit quoted emotion versus inferred romantic intent.",
    ],
  },
  {
    workstream_id: "C",
    name: "Anxiety-safe writing",
    requirements: [
      "Do not amplify anxiety by unnecessarily enumerating rejection, abandonment, or no-reply possibilities.",
      "Uncertainty must not become a list of every adverse possibility.",
      "Acknowledge emotion, identify the current evidence boundary, give one action, and identify one observable review trigger.",
      "Generic reassurance must not replace case-specific evidence.",
    ],
  },
  {
    workstream_id: "D",
    name: "Safety UX",
    requirements: [
      "Preserve the existing no-contact Hard Gate.",
      "Confirm Safety evaluation occurs before payment.",
      "Define a nonjudgmental stop message.",
      "Do not generate a draft, workaround, later-contact plan, or hidden exception.",
      "Do not charge JPY980 when a Product report will not be produced.",
      "Add visual/Product review of the actual stop screen.",
    ],
  },
  {
    workstream_id: "E",
    name: "Deterministic evaluator successor",
    requirements: [
      "Replace context-free recursive substring matching for certainty.",
      "Limit certainty detection to assertions about: other-person inner state, future reply, external outcome, relationship result, unsupported guaranteed event.",
      "User-owned schedule confirmation such as 「木曜15時で確実に都合がつくことを確認」 must not independently fail.",
      "Preserve true unsupported certainty failures.",
      "Report the real matched path instead of always attributing to PB-05 report_content.",
    ],
  },
  {
    workstream_id: "F",
    name: "Semantic disposition successor",
    requirements: [
      "Severity and downstream meaning must matter.",
      "A minor FACT_FIDELITY finding must not become blocking solely because of the code name.",
      "Distinguish already-sent factual claims from future action instructions.",
      "Pair temporal DECISION_ALLOWED and ACTION_CONSISTENCY findings by the same change-condition index and semantic meaning.",
      "A future reassessment direction must not be treated as a current-state Policy violation merely because the current allowed set differs.",
      "Preserve blocking for real current-direction contradictions.",
    ],
  },
  {
    workstream_id: "G",
    name: "Verification",
    requirements: [
      "Existing Evidence Commit B remains immutable.",
      "No Provider rerun is authorized by this charter.",
      "Build offline regression fixtures from the frozen evidence.",
      "Preserve E-R3-02 and E-R3-03 behavior.",
      "Preserve E-R3-01 draft correction.",
      "Preserve E-R3-04 final draft.",
      "Fix the E-R3-06 causal defect.",
      "Remove false blocking for E-R3-01 and E-R3-05.",
      "Remove the temporal contract defect for E-R3-06.",
      "Product Owner review must be repeated on actual successor final output before Runtime activation.",
    ],
  },
];
check(
  "exact Product workstreams A through G",
  charter.status === "v12_remediation_charter_ready_planning_only" &&
    charter.planning_approved === true &&
    charter.implementation_authorized === false &&
    charter.provider_rerun_authorized === false &&
    isDeepStrictEqual(charter.workstreams, expectedWorkstreams) &&
    isDeepStrictEqual(charter.non_goals, [
      "v12 implementation",
      "Prompt edits",
      "Runtime edits",
      "Evaluator edits",
      "UI edits",
      "Provider rerun",
      "migration",
      "Runtime activation",
      "R4",
      "C2",
      "PR",
      "main merge",
    ]) &&
    charter.activation_gate ===
      "Product Owner review must be repeated on actual successor final output before Runtime activation.",
);

const expectedCapabilities = {
  schema_version:
    "m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-capabilities-v1",
  task_id: documentationMarker,
  branch: expectedBranch,
  status: "product_owner_review_complete_remediation_charter_ready",
  baseline,
  product_owner_review_complete: true,
  reviewed_case_count: 4,
  excluded_case_count: 2,
  overall_product_judgment: "not_ready_for_jpy_980_runtime_activation",
  draft_quality_accepted_cases: ["E-R3-01", "E-R3-04"],
  product_content_near_acceptance_cases: ["E-R3-02"],
  safety_logic_accepted_cases: ["E-R3-03"],
  product_report_revision_required_cases: [
    "E-R3-01",
    "E-R3-02",
    "E-R3-04",
  ],
  safety_ux_review_required_cases: ["E-R3-03"],
  genuine_product_defect_case_ids: ["E-R3-06"],
  provider_quality_established: false,
  provider_rerun_ready: false,
  provider_rerun_authorized: false,
  v12_remediation_charter_ready: true,
  v12_remediation_implementation_authorized: false,
  active_runtime_activated: false,
  r4_ready: false,
  r4_authorized: false,
  c2_authorized: false,
  main_changed: false,
  next_action: "human_chatgpt_review_of_v12_remediation_charter",
};
check(
  "capabilities exact Product Owner decision state",
  isDeepStrictEqual(capabilities, expectedCapabilities),
);

check(
  "no remediation implementation authorization",
  contract.operations.successor_remediation_implementation_authorized ===
    false &&
    decision.successor_remediation_implementation_approved === false &&
    charter.implementation_authorized === false &&
    charter.operations.implementation_started === false &&
    capabilities.v12_remediation_implementation_authorized === false,
);
check(
  "no Provider rerun authorization",
  contract.operations.provider_rerun_authorized === false &&
    decision.provider_rerun_required_now === false &&
    decision.provider_rerun_authorized === false &&
    charter.provider_rerun_authorized === false &&
    charter.operations.provider_rerun === false &&
    capabilities.provider_rerun_ready === false &&
    capabilities.provider_rerun_authorized === false,
);
check(
  "Provider DB Supabase remain 0 / 0 / 0",
  [contract.operations, decision.operations, charter.operations].every(
    (operations) =>
      operations.provider_calls === 0 &&
      operations.db_operations === 0 &&
      operations.supabase_operations === 0,
  ),
);
check(
  "runner package-check retry repair fallback remain unused",
  contract.operations.runner_rerun === false &&
    contract.operations.package_check_rerun === false &&
    contract.operations.retry === false &&
    contract.operations.repair === false &&
    contract.operations.fallback === false,
);

const runtimeTreeUnchanged = gitSucceeds(
  "diff",
  "--quiet",
  baseline,
  "--",
  "lib/assessment/runtime",
);
check(
  "Runtime unchanged",
  runtimeTreeUnchanged &&
    contract.operations.runtime_changes === false &&
    decision.operations.runtime_changed === false &&
    charter.operations.runtime_changed === false,
);
check(
  "Prompt Catalog Schema unchanged",
  runtimeTreeUnchanged &&
    contract.operations.prompt_changes === false &&
    contract.operations.catalog_changes === false &&
    contract.operations.schema_changes === false &&
    decision.operations.prompt_changed === false &&
    decision.operations.catalog_changed === false &&
    decision.operations.schema_changed === false &&
    charter.operations.prompt_changed === false,
);
check(
  "Evaluator and semantic disposition unchanged",
  runtimeTreeUnchanged &&
    contract.operations.evaluator_changes === false &&
    contract.operations.semantic_disposition_changes === false &&
    decision.operations.evaluator_changed === false &&
    decision.operations.semantic_disposition_changed === false &&
    charter.operations.evaluator_changed === false,
);
check(
  "migration unchanged",
  worktreeBlob(paths.migration0004) ===
    contract.protected_authorities.migration_0004_blob &&
    worktreeBlob(paths.migration0005) ===
      contract.protected_authorities.migration_0005_blob &&
    gitSucceeds("diff", "--quiet", baseline, "--", "supabase/migrations") &&
    contract.operations.migration_changes === false &&
    decision.operations.migration_changed === false &&
    charter.operations.migration_changed === false,
);
check(
  "Active Service unchanged",
  worktreeBlob(paths.activeService) ===
    contract.protected_authorities.active_service_blob &&
    gitSucceeds("diff", "--quiet", baseline, "--", paths.activeService) &&
    contract.operations.active_service_changes === false &&
    decision.operations.active_service_changed === false,
);
check(
  "Active Runtime not activated",
  contract.protected_authorities.active_runtime_catalog ===
    "runtime-stage-catalog-v4.0.0" &&
    contract.protected_authorities.active_runtime_activated === false &&
    contract.operations.active_runtime_activated === false &&
    decision.operations.active_runtime_activated === false &&
    charter.operations.active_runtime_activated === false &&
    capabilities.active_runtime_activated === false &&
    readText(paths.activeService).includes(
      "loadM2P4ProductQualityRuntimeStageCatalog",
    ),
);
check(
  "R4 and C2 unauthorized",
  contract.operations.r4_authorized === false &&
    contract.operations.c2_authorized === false &&
    decision.operations.r4_authorized === false &&
    decision.operations.c2_authorized === false &&
    charter.operations.r4_authorized === false &&
    charter.operations.c2_authorized === false &&
    capabilities.r4_ready === false &&
    capabilities.r4_authorized === false &&
    capabilities.c2_authorized === false,
);
check(
  "PR main merge and force push unauthorized",
  contract.operations.pull_request_authorized === false &&
    contract.operations.main_merge_authorized === false &&
    contract.operations.force_push_authorized === false &&
    charter.operations.pull_request_authorized === false &&
    charter.operations.main_merge_authorized === false &&
    decision.main_integration_approved === false &&
    capabilities.main_changed === false,
);

const synchronizedDocumentation = [
  paths.summary,
  paths.charterMarkdown,
  paths.taskReview,
  paths.currentFocus,
  paths.wbs,
  paths.handoff,
].every((relativePath) => {
  const text = readText(relativePath);
  return (
    text.includes(documentationMarker) &&
    text.includes("not_ready_for_jpy_980_runtime_activation") &&
    text.includes("product_owner_review_complete") &&
    text.includes(baseline)
  );
});
check("rolling documentation synchronized", synchronizedDocumentation);

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
  baseline,
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
  "Product Owner decision verifier: " +
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
