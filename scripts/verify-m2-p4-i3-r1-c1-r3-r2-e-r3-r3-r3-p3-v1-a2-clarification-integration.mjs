import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  createOpaqueClarificationIdV1,
  clarificationSourceIdentityV1,
  validateClarificationAnswerV1,
  validateOpaqueClarificationIdV1,
} from "../lib/assessment/runtime/clarification-evidence-v1.ts";
import { AssessmentApplication } from "../lib/assessment/runtime/application.ts";
import {
  buildEffectiveAssessmentAuthorityV1,
} from "../lib/assessment/runtime/effective-assessment-authority-v1.ts";
import {
  requireReadyMakingClarificationDownstreamV1,
  validateEffectiveAssessmentAuthorityIntegrityV1,
} from "../lib/assessment/runtime/effective-assessment-authority-integrity-v1.ts";
import {
  buildEffectiveDecisionPolicyV1,
  clarificationConsumptionPathsForStageV1,
} from "../lib/assessment/runtime/effective-decision-policy-v1.ts";
import { M2RuntimeError } from "../lib/assessment/runtime/errors.ts";
import {
  FakeAiStageTransport,
  FakeAssessmentRepository,
} from "../lib/assessment/runtime/fakes.ts";
import {
  evaluateJpy980InputSufficiencyV1,
} from "../lib/assessment/runtime/jpy980-input-sufficiency-policy-v1.ts";
import {
  evaluateJpy980InputSufficiencyV2,
} from "../lib/assessment/runtime/jpy980-input-sufficiency-policy-v2.ts";
import {
  validateJpy980ProductScopeV1,
} from "../lib/assessment/runtime/jpy980-product-scope-validation-v1.ts";
import {
  loadM2P4ClarificationIntegrationRuntimeStageCatalog,
} from "../lib/assessment/runtime/schema-catalog.ts";

const root = process.cwd();
const taskId = "M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P3-V1-A2-R1";
const baseline = "3195c278d688bc866d2e0825df88cdf62b149547";
const acceptedPlan = "9f397ed41f3f284e7a984ad139768af16373a747";
const predecessor = "ab99f003901475199fcb316264ecd02c4f2baef8";
const acceptedV1A1 = "8db5c6386ed0b9b16f0d1586f47d384262cc502b";
const expectedMain = "61e33a10e195fad17e253a6b9719217e1992f273";
const expectedBranch =
  "fix/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-a2-r1-runtime-integrity";
const expectedSubject = "fix: harden V1-A2 runtime integrity";
const originalImplementationBranch =
  "feat/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-a2-clarification-integration";
const packageRoot =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-a2";

const updatedPaths = [
  "docs/CODEX_HANDOFF.md",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R3_P3_V1_A2_REVIEW.md",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-c-r1/implementation-work-packages-v1.json",
  packageRoot + "/capabilities-v1.json",
  packageRoot + "/integration-fixtures-v1.json",
  packageRoot + "/offline-results-v1.json",
  "lib/assessment/runtime/application.ts",
  "lib/assessment/runtime/pipeline.ts",
  "lib/assessment/runtime/supabase-repository.ts",
  "lib/assessment/runtime/fakes.ts",
  "lib/assessment/runtime/clarification-evidence-v1.ts",
  "lib/assessment/runtime/effective-assessment-authority-v1.ts",
  "lib/assessment/runtime/effective-assessment-authority-integrity-v1.ts",
  "lib/assessment/runtime/effective-decision-policy-v1.ts",
  "lib/assessment/runtime/contracts/pb-01-clarification-aware-v1.developer.md",
  "lib/assessment/runtime/contracts/pb-04-clarification-aware-v1.developer.md",
  "lib/assessment/runtime/contracts/pb-05-clarification-aware-v1.developer.md",
  "lib/assessment/runtime/contracts/pb-06-clarification-aware-v1.developer.md",
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v12.json",
  "components/runtime/RuntimeAssessmentForm.tsx",
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-a2-clarification-integration.mjs",
];
const newPaths = [];
const exactScope = [...updatedPaths, ...newPaths];

function git(args, options = {}) {
  return execFileSync(
    "git.exe",
    ["-c", "safe.directory=C:/projects/moon-reply", ...args],
    {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 256 * 1024 * 1024,
      ...options,
    },
  ).trim();
}

function readText(relativePath) {
  return new TextDecoder("utf-8", { fatal: true }).decode(
    readFileSync(path.join(root, relativePath)),
  );
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function sorted(values) {
  return [...values].sort((left, right) => left.localeCompare(right));
}

function remoteHead(branch) {
  const output = git(["ls-remote", "--heads", "origin", "refs/heads/" + branch]);
  const rows = output.split(/\r?\n/u).filter(Boolean);
  return rows.length === 0 ? null : rows[0].split(/\s+/u)[0];
}

function blob(revision, relativePath) {
  return git(["rev-parse", revision + ":" + relativePath]);
}

function worktreeBlob(relativePath) {
  return git(["hash-object", "--path=" + relativePath, relativePath]);
}

function overlay(base, patch) {
  if (typeof patch !== "object" || patch === null || Array.isArray(patch)) {
    return structuredClone(patch);
  }
  const result =
    typeof base === "object" && base !== null && !Array.isArray(base)
      ? structuredClone(base)
      : {};
  for (const [key, value] of Object.entries(patch)) {
    result[key] = overlay(result[key], value);
  }
  return result;
}

function runImmutableVerifier(revision, branch, verifier, prefix) {
  const temp = mkdtempSync(path.join(tmpdir(), prefix));
  const clone = path.join(temp, "repo");
  try {
    execFileSync("git.exe", ["clone", "--quiet", "--no-checkout", root, clone], {
      cwd: root,
      stdio: "pipe",
    });
    symlinkSync(path.join(root, "node_modules"), path.join(clone, "node_modules"), "junction");
    const safe = "safe.directory=" + clone.replaceAll("\\", "/");
    execFileSync(
      "git.exe",
      ["-c", safe, "config", "core.autocrlf", "true"],
      { cwd: clone, stdio: "pipe" },
    );
    const refs = git([
      "for-each-ref",
      "--format=%(refname)%09%(objectname)",
      "refs/heads",
      "refs/remotes/origin",
    ])
      .split(/\r?\n/u)
      .filter(Boolean)
      .map((line) => line.split("\t"));
    for (const [refName, revision] of refs) {
      execFileSync("git.exe", ["-c", safe, "update-ref", refName, revision], {
        cwd: clone,
        stdio: "pipe",
      });
    }
    execFileSync(
      "git.exe",
      ["-c", safe, "checkout", "--quiet", "-B", branch, revision],
      { cwd: clone, stdio: "pipe" },
    );
    // Preserve the byte representation of unchanged authority files. Several
    // immutable verifiers deliberately parse LF-delimited source snippets, and
    // their own nested snapshot runners copy these bytes forward.
    const trackedPaths = git(["ls-tree", "-r", "--name-only", revision])
      .split(/\r?\n/u)
      .filter(Boolean);
    for (const candidate of trackedPaths) {
      const sourcePath = path.join(root, candidate);
      if (!existsSync(sourcePath)) continue;
      if (worktreeBlob(candidate) !== blob(revision, candidate)) continue;
      copyFileSync(sourcePath, path.join(clone, candidate));
    }
    const sourceContract = readJson(
      "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p1/source-contract-v1.json",
    );
    const marker = sourceContract.frozen_state.marker_path;
    if (existsSync(path.join(root, marker))) {
      copyFileSync(
        path.join(root, marker),
        path.join(clone, ".git", path.basename(marker)),
      );
    }
    const run = spawnSync(process.execPath, [path.join(clone, verifier)], {
      cwd: clone,
      encoding: "utf8",
      maxBuffer: 256 * 1024 * 1024,
    });
    if (run.status !== 0) {
      throw new Error(`accepted plan verifier failed\n${run.stdout}\n${run.stderr}`);
    }
    return run.stdout;
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
}

function runOriginalImplementationVerifier() {
  return runImmutableVerifier(
    baseline,
    originalImplementationBranch,
    "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-a2-clarification-integration.mjs",
    "moon-reply-v1-a2-implementation-",
  );
}

function expectedRuntimeError(callback, safeCode, status) {
  let caught;
  try {
    callback();
  } catch (error) {
    caught = error;
  }
  assert.ok(caught instanceof M2RuntimeError);
  assert.equal(caught.safeCode, safeCode);
  if (status !== undefined) assert.equal(caught.httpStatus, status);
}

function ids() {
  let index = 0;
  return () =>
    `00000000-0000-4000-8000-${String(++index).padStart(12, "0")}`;
}

const diagnostics = readJson(
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3/diagnostic-results-v1.json",
);
function diagnosticCase(caseId) {
  const selected = diagnostics.cases.find((entry) => entry.case_id === caseId);
  assert.ok(selected, caseId);
  const outputs = Object.fromEntries(
    selected.provider_calls.map((call) => [call.stage_id, call.raw_output]),
  );
  const pb01 = selected.provider_calls.find((call) => call.stage_id === "PB-01");
  const pb04 = selected.provider_calls.find((call) => call.stage_id === "PB-04");
  return {
    selected,
    outputs,
    input: {
      currentSituation: pb01.provider_request.input.current_situation,
      optionalMessage: pb04?.provider_request.input.user_supplied_optional_message ?? null,
      relationship: pb01.provider_request.input.relationship,
      requestedTopics: pb01.provider_request.input.requested_topics,
      privacyAcknowledged: true,
    },
  };
}

const capabilities = readJson(packageRoot + "/capabilities-v1.json");
const fixtureCatalog = readJson(packageRoot + "/integration-fixtures-v1.json");
const offlineResults = readJson(packageRoot + "/offline-results-v1.json");
let catalog;
let immutableImplementationOutput = "";
let checks = 0;
const failures = [];

async function check(name, callback) {
  checks += 1;
  try {
    await callback();
    console.log("PASS " + name);
  } catch (error) {
    failures.push(name);
    console.error("FAIL " + name);
    console.error(error instanceof Error ? error.stack : error);
  }
}

await check("exact branch parent direct-child main and stash", () => {
  const head = git(["rev-parse", "HEAD"]);
  assert.equal(git(["branch", "--show-current"]), expectedBranch);
  assert.equal(git(["rev-parse", baseline]), baseline);
  assert.equal(git(["rev-parse", baseline + "^"]), acceptedPlan);
  assert.equal(git(["rev-parse", acceptedPlan + "^"]), predecessor);
  assert.equal(git(["merge-base", head, baseline]), baseline);
  const count = Number(git(["rev-list", "--count", baseline + ".." + head]));
  assert.ok(count === 0 || count === 1);
  if (count === 1) {
    assert.equal(git(["rev-parse", "HEAD^"]), baseline);
    assert.equal(git(["show", "-s", "--format=%s", "HEAD"]), expectedSubject);
  }
  assert.equal(git(["rev-parse", "main"]), expectedMain);
  assert.equal(git(["rev-parse", "origin/main"]), expectedMain);
  assert.equal(remoteHead("main"), expectedMain);
  assert.equal(git(["stash", "list"]), "");
});

await check("exact 23 path correction scope with 23 UPDATE and 0 NEW", () => {
  const tracked = git(["diff", "--name-status", "--no-renames", baseline, "--"])
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((line) => {
      const [status, relativePath] = line.split("\t");
      return { status, path: relativePath.replaceAll("\\", "/") };
    });
  const trackedNames = new Set(tracked.map((entry) => entry.path));
  const untracked = git(["ls-files", "--others", "--exclude-standard"])
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((entry) => entry.replaceAll("\\", "/"))
    .filter((entry) => !trackedNames.has(entry))
    .map((entry) => ({ status: "A", path: entry }));
  const actual = [...tracked, ...untracked];
  assert.equal(actual.length, 23);
  assert.deepEqual(sorted(actual.map((entry) => entry.path)), sorted(exactScope));
  assert.deepEqual(
    sorted(actual.filter((entry) => entry.status === "M").map((entry) => entry.path)),
    sorted(updatedPaths),
  );
  assert.deepEqual(
    sorted(actual.filter((entry) => entry.status === "A").map((entry) => entry.path)),
    sorted(newPaths),
  );
});

await check("immutable implementation 22/22 includes accepted planning 27/27", () => {
  immutableImplementationOutput = runOriginalImplementationVerifier();
  assert.match(immutableImplementationOutput, /clarification integration verifier: PASS 22\/22/u);
  assert.match(immutableImplementationOutput, /Exact implementation scope: 37\/37/u);
  assert.match(immutableImplementationOutput, /Accepted V1-A2 R1 planning verifier: PASS 27\/27/u);
  assert.match(immutableImplementationOutput, /all upstream accepted verifiers: PASS/iu);
});

await check("v12 catalog and clarification schema load fail closed", async () => {
  catalog = await loadM2P4ClarificationIntegrationRuntimeStageCatalog();
  assert.equal(catalog.catalogVersion, "runtime-stage-catalog-v12.0.0");
  assert.equal(catalog.promptBundleVersion, "prompt-bundle-runtime-v12.0.0");
  assert.equal(catalog.schemaSetVersion, "pipeline-schema-runtime-v6.0.0");
  assert.deepEqual(catalog.definitions.map((entry) => entry.stageId), [
    "PB-01", "PB-01C", "PB-02", "PB-03", "PB-04", "PB-05", "PB-06",
  ]);
  assert.ok(catalog.definitions[0].clarificationOutputSchema);
});

await check("actual V12 developer prompts self-contain predecessor semantics", () => {
  const prompts = Object.fromEntries(
    catalog.definitions.map((definition) => [definition.stageId, definition.developerPrompt]),
  );
  const required = {
    "PB-01": [
      "## Input boundary",
      "## Responsibility",
      "## User-owned contact constraint",
      "## Cross-projection semantic agreement",
      "## Clarification resume responsibility",
      "run_mode=initial_base",
      "run_mode=clarification_resume",
    ],
    "PB-04": [
      "## Authoritative inputs",
      "## Directional Guidance outcome",
      "## Decision and draft authority",
      "## Action and aftercare quality",
      "## Clarification successor authority",
    ],
    "PB-05": [
      "## Product Doctrine",
      "## Field-by-field responsibility",
      "## Clarification successor authority",
    ],
    "PB-06": [
      "## Finding vocabulary and output boundary",
      "## Tier 1 — Hard factual and Safety materiality",
      "## Tier 2 — Flexible semantics",
      "## Tier 3 — Product Outcome",
      "## Clarification successor validation",
    ],
  };
  for (const [stageId, markers] of Object.entries(required)) {
    for (const marker of markers) assert.match(prompts[stageId], new RegExp(marker, "u"));
    assert.doesNotMatch(prompts[stageId], /Apply the accepted PB-(?:01|04|05|06)/u);
  }
  assert.match(prompts["PB-01"], /do not consume, restate, or rewrite Base or Candidate/u);
  assert.match(prompts["PB-06"], /proves wiring only and is not semantic evidence/u);
});

await check("Product scope validator enforces exact anchors and Candidate rule", () => {
  const base = {
    currentSituation: "テスト用の状況です。",
    optionalMessage: null,
    relationship: "other",
    requestedTopics: ["draft_message"],
    privacyAcknowledged: true,
  };
  assert.equal(validateJpy980ProductScopeV1(base).accepted, true);
  expectedRuntimeError(
    () => validateJpy980ProductScopeV1({ ...base, requestedTopics: ["relationship"] }),
    "M2_ACTIONABLE_TOPIC_REQUIRED",
  );
  expectedRuntimeError(
    () => validateJpy980ProductScopeV1({ ...base, requestedTopics: ["message_impact"] }),
    "M2_MESSAGE_IMPACT_CANDIDATE_REQUIRED",
  );
  assert.equal(
    validateJpy980ProductScopeV1({
      ...base,
      requestedTopics: ["message_impact"],
      optionalMessage: "候補文です。",
    }).accepted,
    true,
  );
});

await check("opaque capability uses secure 256-bit construction and rejects weak IDs", () => {
  const first = createOpaqueClarificationIdV1();
  const second = createOpaqueClarificationIdV1();
  assert.notEqual(first, second);
  assert.ok(Buffer.from(first, "base64url").byteLength * 8 >= 128);
  assert.equal(validateOpaqueClarificationIdV1(first), first);
  expectedRuntimeError(
    () => validateOpaqueClarificationIdV1("123"),
    "M2_CLARIFICATION_CAPABILITY_INVALID",
    404,
  );
  assert.doesNotMatch(
    readText("lib/assessment/runtime/clarification-evidence-v1.ts"),
    /randomUUID/u,
  );
});

await check("target answer validation and canonical fingerprint are deterministic", () => {
  const at = "2026-08-16T10:00:00.000Z";
  const a = validateClarificationAnswerV1({
    target: "requested_message_tone",
    answer: { detail: " やさしく\r\n短く ", choice: "custom" },
    resumeStartedAt: at,
  });
  const b = validateClarificationAnswerV1({
    target: "requested_message_tone",
    answer: { choice: "custom", detail: "やさしく\n短く" },
    resumeStartedAt: at,
  });
  assert.equal(a.answerFingerprint, b.answerFingerprint);
  assert.deepEqual(a.validatedAnswer, b.validatedAnswer);
  expectedRuntimeError(
    () => validateClarificationAnswerV1({
      target: "usual_reply_cadence",
      answer: "sometimes",
      resumeStartedAt: at,
    }),
    "M2_CLARIFICATION_ANSWER_INVALID",
  );
});

await check("central concern uses structured concern or explicit none only", () => {
  const at = "2026-08-16T10:00:00.000Z";
  const concern = validateClarificationAnswerV1({
    target: "central_fear_or_decision_concern",
    answer: { kind: "concern", value: " 関係が終わることが不安です " },
    resumeStartedAt: at,
  });
  assert.deepEqual(concern.validatedAnswer, {
    kind: "concern",
    value: "関係が終わることが不安です",
  });
  assert.equal(concern.resolvesTarget, true);
  const none = validateClarificationAnswerV1({
    target: "central_fear_or_decision_concern",
    answer: { kind: "none" },
    resumeStartedAt: at,
  });
  assert.deepEqual(none.validatedAnswer, { kind: "none" });
  assert.equal(none.resolvesTarget, false);
  expectedRuntimeError(
    () => validateClarificationAnswerV1({
      target: "central_fear_or_decision_concern",
      answer: "特になし",
      resumeStartedAt: at,
    }),
    "M2_CLARIFICATION_ANSWER_INVALID",
  );
});

await check("timing fingerprint excludes trusted-now derived elapsed", () => {
  const answer = {
    kind: "local_datetime",
    localDateTime: "2026-08-16T09:00",
    timeZone: "Asia/Tokyo",
  };
  const first = validateClarificationAnswerV1({
    target: "latest_contact_timing",
    answer,
    resumeStartedAt: "2026-08-16T01:00:00.000Z",
  });
  const later = validateClarificationAnswerV1({
    target: "latest_contact_timing",
    answer,
    resumeStartedAt: "2026-08-16T02:00:00.000Z",
  });
  assert.equal(first.answerFingerprint, later.answerFingerprint);
  assert.notDeepEqual(
    first.groundedNormalizedRepresentation,
    later.groundedNormalizedRepresentation,
  );
  expectedRuntimeError(
    () => validateClarificationAnswerV1({
      target: "latest_contact_timing",
      answer: { ...answer, localDateTime: "2026-08-17T09:00" },
      resumeStartedAt: "2026-08-16T01:00:00.000Z",
    }),
    "M2_CLARIFICATION_TIME_INVALID",
  );
});

await check("V2 no-clarification behavior equals accepted V1 with cadence copy exception", () => {
  const fixtures = readJson(
    "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-a1/routing-fixtures-v1.json",
  );
  for (const fixture of fixtures.fixtures) {
    const scenario = overlay(
      fixtures.base_structured_intake_template,
      fixtures.scenario_patches[fixture.scenario],
    );
    const base = overlay(scenario, fixture.input_patch);
    const policyInput = {
      aggregateSafety: { classification: fixture.aggregate_safety_classification },
      baseStructuredIntake: base,
      decisionFacts: structuredClone(base.decision_facts),
      baseWritingSignals: structuredClone(base.base_writing_signals),
    };
    let v1;
    try {
      v1 = evaluateJpy980InputSufficiencyV1({
        ...policyInput,
        clarificationAlreadyUsed: false,
      });
    } catch (error) {
      assert.ok(error instanceof M2RuntimeError);
      assert.equal(
        error.safeCode,
        "M2_JPY980_INPUT_SUFFICIENCY_POLICY_INVALID",
      );
      const invalidAuthority = buildEffectiveAssessmentAuthorityV1({
        baseStructuredIntake: base,
        candidateEnvelope: { presence: false },
        clarificationGrounding: null,
      });
      expectedRuntimeError(
        () =>
          evaluateJpy980InputSufficiencyV2({
            basePolicyInput: policyInput,
            clarificationGrounding: null,
            effectiveAssessmentAuthority: invalidAuthority,
          }),
        "M2_JPY980_INPUT_SUFFICIENCY_POLICY_INVALID",
      );
      continue;
    }
    const authority = buildEffectiveAssessmentAuthorityV1({
      baseStructuredIntake: base,
      candidateEnvelope: { presence: false },
      clarificationGrounding: null,
    });
    const result = evaluateJpy980InputSufficiencyV2({
      basePolicyInput: policyInput,
      clarificationGrounding: null,
      effectiveAssessmentAuthority: authority,
    });
    assert.equal(result.state, v1.state, fixture.fixture_id);
    assert.deepEqual(result.reasonCodes, v1.reasonCodes, fixture.fixture_id);
    assert.deepEqual(
      result.missingMaterialDimensions,
      v1.missingMaterialDimensions,
      fixture.fixture_id,
    );
    assert.deepEqual(result.clarificationBudget, v1.clarificationBudget);
    if (result.clarification?.target === "usual_reply_cadence") {
      assert.equal(
        result.clarification.question,
        "今の待ち時間は、その相手の普段の返信ペースの範囲内ですか？",
      );
    }
  }
});

await check("EffectiveAssessmentAuthority is derived target-limited and provenance-complete", () => {
  const fixtures = readJson(
    "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-a1/routing-fixtures-v1.json",
  );
  const base = structuredClone(fixtures.base_structured_intake_template);
  base.decision_facts.contact_state.elapsed_since_latest_user_message_minutes = null;
  base.decision_facts.information_state.unresolved_fields = [
    ...base.decision_facts.information_state.unresolved_fields,
    "contact_state.elapsed_since_latest_user_message_minutes",
  ];
  const targets = {
    material_relationship_or_communication_concern: { choice: "distance", detail: null },
    latest_contact_timing: { kind: "elapsed_bucket", value: "six_to_24_hours", elapsedMinutesLowerBound: 360 },
    usual_reply_cadence: { relation: "within_usual" },
    central_fear_or_decision_concern: { kind: "concern", value: "関係が終わることが不安です" },
    relationship_intent: { choice: "move_closer", detail: null },
    requested_message_tone: { choice: "soft", detail: null },
  };
  for (const [target, normalizedValue] of Object.entries(targets)) {
    const sourceIdentity = "clarification:AAAAAAAAAAAAAAAAAAAAAA:answer:1";
    const grounding = {
      schemaVersion: "m2-p4-clarification-grounding-v1",
      clarificationId: "AAAAAAAAAAAAAAAAAAAAAA",
      target,
      sourceIdentity,
      answerFingerprint: "a".repeat(64),
      normalizedValue,
      materiallyResolvesTarget: true,
      clarificationSafety: {
        classification: "normal_allowed",
        reason_codes: [],
        response_mode: "none",
      },
    };
    const authority = buildEffectiveAssessmentAuthorityV1({
      baseStructuredIntake: base,
      candidateEnvelope: { presence: false },
      clarificationGrounding: grounding,
    });
    validateEffectiveAssessmentAuthorityIntegrityV1({
      authority,
      baseStructuredIntake: base,
      candidateEnvelope: { presence: false },
      clarificationGrounding: grounding,
    });
    const entries = authority.sourceMap.filter((entry) => entry.sourceLane === "clarification");
    assert.ok(entries.length >= 1, target);
    assert.ok(entries.every((entry) => entry.clarificationTarget === target));
    assert.ok(entries.every((entry) => entry.sourceRef === sourceIdentity));
    assert.ok(entries.every((entry) => entry.sourceValuePath === "normalizedValue"));
    const consumers = [
      ...clarificationConsumptionPathsForStageV1(authority, "PB-04"),
      ...clarificationConsumptionPathsForStageV1(authority, "PB-05"),
    ];
    assert.ok(consumers.length >= 1, target);
  }
});

await check("clarification provenance paths resolve and mutants fail closed", () => {
  const fixtures = readJson(
    "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-a1/routing-fixtures-v1.json",
  );
  const grounding = {
    schemaVersion: "m2-p4-clarification-grounding-v1",
    clarificationId: "AAAAAAAAAAAAAAAAAAAAAA",
    target: "requested_message_tone",
    sourceIdentity: "clarification:AAAAAAAAAAAAAAAAAAAAAA:answer:1",
    answerFingerprint: "a".repeat(64),
    normalizedValue: { choice: "soft", detail: null },
    materiallyResolvesTarget: true,
    clarificationSafety: {
      classification: "normal_allowed",
      reason_codes: [],
      response_mode: "none",
    },
  };
  const args = {
    baseStructuredIntake: fixtures.base_structured_intake_template,
    candidateEnvelope: { presence: false },
    clarificationGrounding: grounding,
  };
  const authority = buildEffectiveAssessmentAuthorityV1(args);
  assert.equal(validateEffectiveAssessmentAuthorityIntegrityV1({ authority, ...args }), true);
  const mutants = [];
  const nonexistent = structuredClone(authority);
  nonexistent.sourceMap[0].sourceValuePath = "normalizedValue.missing";
  mutants.push(nonexistent);
  const wrongRef = structuredClone(authority);
  wrongRef.sourceMap[0].sourceRef = "clarification:BBBBBBBBBBBBBBBBBBBBBB:answer:1";
  mutants.push(wrongRef);
  const wrongValue = structuredClone(authority);
  wrongValue.effectiveWritingContext.requestedMessageTone = { choice: "direct", detail: null };
  mutants.push(wrongValue);
  const unrelated = structuredClone(authority);
  unrelated.effectiveDecisionContext.relationshipIntent = { choice: "move_closer", detail: null };
  mutants.push(unrelated);
  const falseBase = structuredClone(authority);
  falseBase.sourceMap[0].sourceLane = "base";
  falseBase.sourceMap[0].sourceRef = "input:current_situation";
  mutants.push(falseBase);
  for (const mutant of mutants) {
    expectedRuntimeError(
      () => validateEffectiveAssessmentAuthorityIntegrityV1({ authority: mutant, ...args }),
      "M2_CLARIFICATION_AUTHORITY_CONFLICT",
    );
  }
});

await check("bounded timing never becomes exact minutes while trusted local datetime may", () => {
  const fixtures = readJson(
    "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-a1/routing-fixtures-v1.json",
  );
  const base = structuredClone(fixtures.base_structured_intake_template);
  base.decision_facts.contact_state.elapsed_since_latest_user_message_minutes = null;
  base.decision_facts.information_state.unresolved_fields = [
    ...base.decision_facts.information_state.unresolved_fields,
    "contact_state.elapsed_since_latest_user_message_minutes",
  ];
  const make = (normalizedValue) => buildEffectiveAssessmentAuthorityV1({
    baseStructuredIntake: base,
    candidateEnvelope: { presence: false },
    clarificationGrounding: {
      schemaVersion: "m2-p4-clarification-grounding-v1",
      clarificationId: "AAAAAAAAAAAAAAAAAAAAAA",
      target: "latest_contact_timing",
      sourceIdentity: "clarification:AAAAAAAAAAAAAAAAAAAAAA:answer:1",
      answerFingerprint: "a".repeat(64),
      normalizedValue,
      materiallyResolvesTarget: true,
      clarificationSafety: {
        classification: "normal_allowed",
        reason_codes: [],
        response_mode: "none",
      },
    },
  });
  const bucket = buildEffectiveDecisionPolicyV1({
    authority: make({
      kind: "elapsed_bucket",
      value: "six_to_24_hours",
      elapsedMinutesLowerBound: 360,
    }),
    candidateEnvelope: { presence: false },
  });
  assert.equal(
    bucket.effectiveDecisionFacts.contact_state.elapsed_since_latest_user_message_minutes,
    base.decision_facts.contact_state.elapsed_since_latest_user_message_minutes,
  );
  assert.ok(
    bucket.effectiveDecisionFacts.information_state.unresolved_fields.includes(
      "contact_state.elapsed_since_latest_user_message_minutes",
    ),
  );
  assert.equal(
    bucket.consumedEffectivePaths.includes("effectiveDecisionContext.latestContactTiming"),
    false,
  );
  const exact = buildEffectiveDecisionPolicyV1({
    authority: make({
      kind: "local_datetime",
      localDateTime: "2026-08-16T09:00",
      timeZone: "Asia/Tokyo",
      derivedElapsedMinutes: 120,
      trustedNowAuthority: "resume_run_started_at",
    }),
    candidateEnvelope: { presence: false },
  });
  assert.equal(
    exact.effectiveDecisionFacts.contact_state.elapsed_since_latest_user_message_minutes,
    120,
  );
  assert.equal(
    exact.effectiveDecisionFacts.information_state.unresolved_fields.includes(
      "contact_state.elapsed_since_latest_user_message_minutes",
    ),
    false,
  );
  assert.ok(exact.consumedEffectivePaths.includes("effectiveDecisionContext.latestContactTiming"));
  assert.doesNotMatch(
    readText("lib/assessment/runtime/effective-decision-policy-v1.ts"),
    /case\s+"(?:less_than_6_hours|six_to_24_hours|one_to_three_days|more_than_three_days)"/u,
  );
});

await check("ready-making clarification discard is blocking", () => {
  const grounding = {
    schemaVersion: "m2-p4-clarification-grounding-v1",
    clarificationId: "AAAAAAAAAAAAAAAAAAAAAA",
    target: "requested_message_tone",
    sourceIdentity: "clarification:AAAAAAAAAAAAAAAAAAAAAA:answer:1",
    answerFingerprint: "a".repeat(64),
    normalizedValue: { choice: "soft", detail: null },
    materiallyResolvesTarget: true,
    clarificationSafety: {
      classification: "normal_allowed",
      reason_codes: [],
      response_mode: "none",
    },
  };
  const fixtures = readJson(
    "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-a1/routing-fixtures-v1.json",
  );
  const authority = buildEffectiveAssessmentAuthorityV1({
    baseStructuredIntake: fixtures.base_structured_intake_template,
    candidateEnvelope: { presence: false },
    clarificationGrounding: grounding,
  });
  expectedRuntimeError(
    () => requireReadyMakingClarificationDownstreamV1({
      authority,
      clarificationGrounding: grounding,
      consumedEffectivePaths: [],
    }),
    "M2_CLARIFICATION_DOWNSTREAM_DISCARDED",
  );
});

await check("initial sufficient path reaches ready with no clarification", async () => {
  const fixture = diagnosticCase("E-R3-02");
  const repository = new FakeAssessmentRepository();
  const transport = new FakeAiStageTransport({ outputs: fixture.outputs });
  const application = new AssessmentApplication({
    repository,
    transport,
    model: "gpt-5.6-luna",
    promptBundleVersion: catalog.promptBundleVersion,
    schemaSetVersion: catalog.schemaSetVersion,
    definitions: catalog.definitions,
    now: () => fixture.selected.fixed_clock,
    uuid: ids(),
    timeZone: "Asia/Tokyo",
  });
  const result = await application.submit(
    fixture.input,
    "11111111-1111-4111-8111-111111111111",
  );
  assert.equal(result.eligibility, "ready");
  assert.deepEqual(transport.calls, ["PB-01", "PB-02", "PB-03", "PB-04", "PB-05", "PB-06"]);
  assert.equal(repository.clarifications.size, 0);
  assert.equal(transport.actualProviderCalls, 0);
});

await check("one-gap initial persists one clarification and idempotency retry restores it", async () => {
  const fixture = diagnosticCase("E-R3-05");
  const pass = diagnosticCase("E-R3-02").outputs["PB-06"];
  fixture.outputs["PB-06"] = pass;
  const clarificationId = createOpaqueClarificationIdV1(new Uint8Array(32).fill(7));
  const answer = { kind: "elapsed_bucket", value: "six_to_24_hours" };
  const validated = validateClarificationAnswerV1({
    target: "latest_contact_timing",
    answer,
    resumeStartedAt: fixture.selected.fixed_clock,
  });
  const groundingOutput = {
    schema_version: "pipeline-schema-clarification-grounding-v1.0.0",
    target: "latest_contact_timing",
    source_identity: clarificationSourceIdentityV1(clarificationId),
    answer_fingerprint: validated.answerFingerprint,
    materially_resolves_target: true,
    clarification_safety_result: {
      classification: "normal_allowed",
      reason_codes: [],
      response_mode: "none",
    },
  };
  const repository = new FakeAssessmentRepository();
  const transport = new FakeAiStageTransport({
    outputs: fixture.outputs,
    outputSequence: { "PB-01": [fixture.outputs["PB-01"], groundingOutput] },
  });
  const application = new AssessmentApplication({
    repository,
    transport,
    model: "gpt-5.6-luna",
    promptBundleVersion: catalog.promptBundleVersion,
    schemaSetVersion: catalog.schemaSetVersion,
    definitions: catalog.definitions,
    now: () => fixture.selected.fixed_clock,
    uuid: ids(),
    clarificationId: () => clarificationId,
    timeZone: "Asia/Tokyo",
  });
  const key = "22222222-2222-4222-8222-222222222222";
  const first = await application.submit(fixture.input, key);
  assert.equal(first.eligibility, "needs_more_information");
  assert.equal(first.clarification.opaqueClarificationId, clarificationId);
  assert.deepEqual(transport.calls, ["PB-01", "PB-01C", "PB-02", "PB-03"]);
  const retry = await application.submit(fixture.input, key);
  assert.equal(retry.duplicate, true);
  assert.equal(retry.clarification.opaqueClarificationId, clarificationId);
  assert.equal(repository.runs.size, 1);
  assert.equal(transport.calls.length, 4);

  const resumed = await application.answerClarification(clarificationId, answer);
  assert.equal(resumed.eligibility, "ready");
  assert.deepEqual(transport.calls.slice(4), ["PB-01", "PB-04", "PB-05", "PB-06"]);
  const resumeRun = [...repository.runs.values()].find(
    (run) => run.runKind === "clarification_resume",
  );
  assert.ok(resumeRun);
  const resumeStages = [...repository.stageRuns.values()]
    .filter((stage) => stage.runId === resumeRun.id)
    .sort((left, right) => left.sequenceNumber - right.sequenceNumber);
  assert.deepEqual(
    resumeStages.map((stage) => [stage.stageId, stage.status]),
    [
      ["PB-01", "completed"],
      ["PB-01C", "skipped"],
      ["PB-02", "skipped"],
      ["PB-03", "skipped"],
      ["PB-04", "completed"],
      ["PB-05", "completed"],
      ["PB-06", "completed"],
    ],
  );
  const pb04 = transport.requests.findLast((request) => request.stageId === "PB-04");
  assert.ok(pb04.input.effective_assessment_authority);
  assert.deepEqual(
    pb04.input.clarification_consumption_contract.consumed_effective_paths,
    ["effectiveDecisionContext.latestContactTiming"],
  );

  const callsBeforeDuplicate = transport.calls.length;
  const runsBeforeDuplicate = repository.runs.size;
  const duplicate = await application.answerClarification(clarificationId, answer);
  assert.equal(duplicate.duplicate, true);
  assert.equal(transport.calls.length, callsBeforeDuplicate);
  assert.equal(repository.runs.size, runsBeforeDuplicate);
  await assert.rejects(
    application.answerClarification(clarificationId, {
      kind: "elapsed_bucket",
      value: "one_to_three_days",
    }),
    (error) => error instanceof M2RuntimeError &&
      error.safeCode === "M2_CLARIFICATION_ALREADY_ANSWERED" &&
      error.httpStatus === 409,
  );
});

await check("PB-06 blocking clarification fidelity finding prevents delivery", async () => {
  const fixture = diagnosticCase("E-R3-05");
  const clarificationId = createOpaqueClarificationIdV1(new Uint8Array(32).fill(10));
  const answer = { kind: "elapsed_bucket", value: "six_to_24_hours" };
  const validated = validateClarificationAnswerV1({
    target: "latest_contact_timing",
    answer,
    resumeStartedAt: fixture.selected.fixed_clock,
  });
  const groundingOutput = {
    schema_version: "pipeline-schema-clarification-grounding-v1.0.0",
    target: "latest_contact_timing",
    source_identity: clarificationSourceIdentityV1(clarificationId),
    answer_fingerprint: validated.answerFingerprint,
    materially_resolves_target: true,
    clarification_safety_result: {
      classification: "normal_allowed",
      reason_codes: [],
      response_mode: "none",
    },
  };
  const blocking = structuredClone(diagnosticCase("E-R3-02").outputs["PB-06"]);
  blocking.semantic_checks = [{
    finding_code: "FACT_FIDELITY",
    severity: "major",
    json_path: "report_content.decision_reason_summary",
    evidence_refs: ["F001"],
    detail: "追加回答の時期情報が出力で失われたため停止する。",
  }];
  fixture.outputs["PB-06"] = blocking;
  const repository = new FakeAssessmentRepository();
  const transport = new FakeAiStageTransport({
    outputs: fixture.outputs,
    outputSequence: { "PB-01": [fixture.outputs["PB-01"], groundingOutput] },
  });
  const application = new AssessmentApplication({
    repository,
    transport,
    model: "gpt-5.6-luna",
    promptBundleVersion: catalog.promptBundleVersion,
    schemaSetVersion: catalog.schemaSetVersion,
    definitions: catalog.definitions,
    now: () => fixture.selected.fixed_clock,
    uuid: ids(),
    clarificationId: () => clarificationId,
    timeZone: "Asia/Tokyo",
  });
  await application.submit(fixture.input, "25252525-2525-4525-8525-252525252525");
  await assert.rejects(
    application.answerClarification(clarificationId, answer),
    (error) => error instanceof M2RuntimeError &&
      error.safeCode === "M2_SEMANTIC_VALIDATION_FAILED",
  );
  assert.equal(repository.reports.size, 0);
  assert.equal(transport.calls.at(-1), "PB-06");
  const resume = [...repository.runs.values()].find(
    (run) => run.runKind === "clarification_resume",
  );
  assert.equal(resume.status, "failed");
});

await check("resume failure preserves accumulated usage and finalizes exactly once", async () => {
  const fixture = diagnosticCase("E-R3-05");
  const clarificationId = createOpaqueClarificationIdV1(new Uint8Array(32).fill(11));
  const answer = { kind: "elapsed_bucket", value: "six_to_24_hours" };
  const validated = validateClarificationAnswerV1({
    target: "latest_contact_timing",
    answer,
    resumeStartedAt: fixture.selected.fixed_clock,
  });
  const groundingOutput = {
    schema_version: "pipeline-schema-clarification-grounding-v1.0.0",
    target: "latest_contact_timing",
    source_identity: clarificationSourceIdentityV1(clarificationId),
    answer_fingerprint: validated.answerFingerprint,
    materially_resolves_target: true,
    clarification_safety_result: {
      classification: "normal_allowed",
      reason_codes: [],
      response_mode: "none",
    },
  };
  const repository = new FakeAssessmentRepository();
  const transport = new FakeAiStageTransport({
    outputs: fixture.outputs,
    outputSequence: { "PB-01": [fixture.outputs["PB-01"], groundingOutput] },
    failAtStage: "PB-04",
  });
  const application = new AssessmentApplication({
    repository,
    transport,
    model: "gpt-5.6-luna",
    promptBundleVersion: catalog.promptBundleVersion,
    schemaSetVersion: catalog.schemaSetVersion,
    definitions: catalog.definitions,
    now: () => fixture.selected.fixed_clock,
    uuid: ids(),
    clarificationId: () => clarificationId,
    timeZone: "Asia/Tokyo",
  });
  await application.submit(fixture.input, "26262626-2626-4626-8626-262626262626");
  await assert.rejects(
    application.answerClarification(clarificationId, answer),
    (error) => error instanceof M2RuntimeError && error.safeCode === "M2_FAKE_STAGE_FAILURE",
  );
  const resume = [...repository.runs.values()].find(
    (run) => run.runKind === "clarification_resume",
  );
  assert.equal(resume.status, "failed");
  assert.equal(resume.errorCode, "M2_FAKE_STAGE_FAILURE");
  assert.equal(resume.returnedModel, "gpt-5.6-luna");
  assert.ok(resume.totalInputTokens > 0);
  assert.ok(resume.totalOutputTokens > 0);
  assert.ok(resume.totalReasoningTokens > 0);
  assert.ok(resume.usageDerivedCostUsd > 0);
  assert.equal(repository.events.filter((event) => event === "failRun").length, 1);
  assert.doesNotMatch(
    readText("lib/assessment/runtime/application.ts"),
    /returnedModel:\s*null[\s\S]{0,300}totalInputTokens:\s*0/u,
  );
});

await check("clarification Safety overrides sufficiency before Product", async () => {
  const fixture = diagnosticCase("E-R3-05");
  const clarificationId = createOpaqueClarificationIdV1(new Uint8Array(32).fill(8));
  const answer = { kind: "elapsed_bucket", value: "six_to_24_hours" };
  const validated = validateClarificationAnswerV1({
    target: "latest_contact_timing",
    answer,
    resumeStartedAt: fixture.selected.fixed_clock,
  });
  const rejected = {
    schema_version: "pipeline-schema-clarification-grounding-v1.0.0",
    target: "latest_contact_timing",
    source_identity: clarificationSourceIdentityV1(clarificationId),
    answer_fingerprint: validated.answerFingerprint,
    materially_resolves_target: true,
    clarification_safety_result: {
      classification: "rejected",
      reason_codes: ["stalking_or_visit"],
      response_mode: "unsafe_contact_stop",
    },
  };
  const repository = new FakeAssessmentRepository();
  const transport = new FakeAiStageTransport({
    outputs: fixture.outputs,
    outputSequence: { "PB-01": [fixture.outputs["PB-01"], rejected] },
  });
  const application = new AssessmentApplication({
    repository,
    transport,
    model: "gpt-5.6-luna",
    promptBundleVersion: catalog.promptBundleVersion,
    schemaSetVersion: catalog.schemaSetVersion,
    definitions: catalog.definitions,
    now: () => fixture.selected.fixed_clock,
    uuid: ids(),
    clarificationId: () => clarificationId,
    timeZone: "Asia/Tokyo",
  });
  await application.submit(fixture.input, "33333333-3333-4333-8333-333333333333");
  const before = transport.calls.length;
  const result = await application.answerClarification(clarificationId, answer);
  assert.equal(result.eligibility, "safety_blocked");
  assert.deepEqual(transport.calls.slice(before), ["PB-01"]);
});

await check("non-resolving single answer routes not-full with no second question", async () => {
  const fixture = diagnosticCase("E-R3-01");
  const clarificationId = createOpaqueClarificationIdV1(new Uint8Array(32).fill(9));
  const answer = { choice: "no_material_concern" };
  const validated = validateClarificationAnswerV1({
    target: "material_relationship_or_communication_concern",
    answer,
    resumeStartedAt: fixture.selected.fixed_clock,
  });
  const output = {
    schema_version: "pipeline-schema-clarification-grounding-v1.0.0",
    target: "material_relationship_or_communication_concern",
    source_identity: clarificationSourceIdentityV1(clarificationId),
    answer_fingerprint: validated.answerFingerprint,
    materially_resolves_target: false,
    clarification_safety_result: {
      classification: "normal_allowed",
      reason_codes: [],
      response_mode: "none",
    },
  };
  const repository = new FakeAssessmentRepository();
  const transport = new FakeAiStageTransport({
    outputs: fixture.outputs,
    outputSequence: { "PB-01": [fixture.outputs["PB-01"], output] },
  });
  const application = new AssessmentApplication({
    repository,
    transport,
    model: "gpt-5.6-luna",
    promptBundleVersion: catalog.promptBundleVersion,
    schemaSetVersion: catalog.schemaSetVersion,
    definitions: catalog.definitions,
    now: () => fixture.selected.fixed_clock,
    uuid: ids(),
    clarificationId: () => clarificationId,
    timeZone: "Asia/Tokyo",
  });
  const initial = await application.submit(
    fixture.input,
    "44444444-4444-4444-8444-444444444444",
  );
  assert.equal(initial.eligibility, "needs_more_information");
  const before = transport.calls.length;
  const stopped = await application.answerClarification(clarificationId, answer);
  assert.equal(stopped.eligibility, "not_full_product_candidate");
  assert.equal(stopped.clarification, null);
  assert.deepEqual(transport.calls.slice(before), ["PB-01"]);
  assert.equal(repository.clarifications.size, 1);
});

await check("historical completeRun remains compatible and V1-A2 stops stay first-class", async () => {
  async function repositoryWithRun(suffix) {
    const repository = new FakeAssessmentRepository();
    const requestId = `10000000-0000-4000-8000-${suffix.padStart(12, "0")}`;
    const runId = `20000000-0000-4000-8000-${suffix.padStart(12, "0")}`;
    await repository.createRequest({
      id: requestId,
      idempotencyKey: `30000000-0000-4000-8000-${suffix.padStart(12, "0")}`,
      source: "internal_test",
      currentSituation: "履歴互換性のオフライン確認",
      optionalMessage: null,
      relationship: "other",
      requestedTopics: ["decide_send_or_wait"],
      privacyAcknowledged: true,
      now: "2026-08-16T00:00:00.000Z",
    });
    await repository.createRun({
      id: runId,
      requestId,
      requestedModel: "gpt-5.6-luna",
      promptBundleVersion: "prompt-bundle-runtime-v11.0.0",
      schemaSetVersion: "pipeline-schema-runtime-v5.0.0",
      stageTopologyVersion: "split-base-candidate-v1",
      runKind: "initial",
      startedAt: "2026-08-16T00:00:00.000Z",
    });
    return { repository, requestId, runId };
  }
  const usage = {
    returnedModel: "gpt-5.6-luna",
    decision: null,
    completedAt: "2026-08-16T00:01:00.000Z",
    totalInputTokens: 10,
    totalCachedTokens: 0,
    totalOutputTokens: 2,
    totalReasoningTokens: 1,
    usageDerivedCostUsd: 0.001,
  };
  const historicalNeedsMore = await repositoryWithRun("1");
  await historicalNeedsMore.repository.completeRun({
    runId: historicalNeedsMore.runId,
    requestId: historicalNeedsMore.requestId,
    eligibility: "needs_more_information",
    ...usage,
  });
  assert.deepEqual(historicalNeedsMore.repository.completeRunModes, ["legacy"]);
  const historicalSafety = await repositoryWithRun("2");
  await historicalSafety.repository.completeRun({
    runId: historicalSafety.runId,
    requestId: historicalSafety.requestId,
    eligibility: "safety_blocked",
    ...usage,
  });
  assert.deepEqual(historicalSafety.repository.completeRunModes, ["legacy"]);
  const v1a2Stop = await repositoryWithRun("3");
  await v1a2Stop.repository.completeRun({
    runId: v1a2Stop.runId,
    requestId: v1a2Stop.requestId,
    eligibility: "not_full_product_candidate",
    resultJson: { eligibility: "not_full_product_candidate" },
    ...usage,
  });
  assert.deepEqual(v1a2Stop.repository.completeRunModes, ["v1a2_first_class_stop"]);
  const ready = await repositoryWithRun("4");
  await ready.repository.finalizeCompletedAssessment({
    ...usage,
    reportId: "40000000-0000-4000-8000-000000000004",
    runId: ready.runId,
    requestId: ready.requestId,
    eligibility: "ready",
    decision: "wait_and_reassess",
    reportJson: {},
    decisionCardJson: {},
  });
  assert.ok(ready.repository.events.includes("finalizeCompletedAssessment"));
  const source = readText("lib/assessment/runtime/supabase-repository.ts");
  assert.match(source, /if \(record\.resultJson !== undefined\)[\s\S]*finalize_stopped_assessment_v1/u);
  assert.match(source, /from\("assessment_runs"\)[\s\S]*eligibility: record\.eligibility/u);
});

await check("migration encodes one-row and atomic lifecycle contracts", () => {
  const sql = readText("supabase/migrations/0006_m2_p4_jpy980_clarification_lifecycle.sql");
  for (const pattern of [
    /request_id uuid not null unique/u,
    /ordinal = 1/u,
    /awaiting_clarification/u,
    /not_full_product_candidate/u,
    /accept_assessment_clarification_v1/u,
    /for update/u,
    /run_kind = 'clarification_resume'/u,
    /M2_CLARIFICATION_ALREADY_ANSWERED/u,
    /result_json/u,
  ]) assert.match(sql, pattern);
  assert.equal(capabilities.implemented.migration_applied, false);
});

await check("API and UI expose one bounded question without internal authority IDs", () => {
  const initialApi = readText("app/api/internal/assessments/route.ts");
  const answerApi = readText(
    "app/api/internal/assessment-clarifications/[clarificationId]/answer/route.ts",
  );
  const ui = readText("components/runtime/RuntimeAssessmentForm.tsx");
  assert.match(initialApi, /validateJpy980ProductScopeV1/u);
  assert.match(answerApi, /Object\.keys\(value\)\.length !== 1/u);
  assert.doesNotMatch(answerApi, /client.*requestId|record\.target|record\.questionCode/iu);
  assert.match(ui, /追加でひとつだけ教えてください/u);
  assert.match(ui, /追加質問 1 \/ 1/u);
  assert.match(ui, /fieldset/u);
  assert.match(ui, /legend/u);
  assert.match(ui, /\{ kind: "none" \}/u);
  assert.match(ui, /\{ kind: "concern", value: clarificationDetail\.trim\(\) \}/u);
  assert.match(ui, /今は特にない/u);
  assert.doesNotMatch(ui, /PB-01からPB-06/u);
  assert.match(ui, /料金は発生しません/u);
});

await check("original 28 fixture intentions are retained and expanded to 36/36", () => {
  const original = JSON.parse(git(["show", baseline + ":" + packageRoot + "/integration-fixtures-v1.json"]));
  const currentIds = new Set(fixtureCatalog.fixtures.map((entry) => entry.id));
  assert.equal(original.fixtures.length, 28);
  for (const fixture of original.fixtures) assert.ok(currentIds.has(fixture.id), fixture.id);
  assert.equal(fixtureCatalog.fixtures.length, 36);
  assert.equal(currentIds.size, 36);
  assert.equal(fixtureCatalog.fixture_id_is_routing_authority, false);
  assert.equal(offlineResults.fixture_count, 36);
  assert.equal(offlineResults.passed, 36);
  assert.equal(offlineResults.failed, 0);
  assert.deepEqual(
    sorted(offlineResults.results),
    sorted(fixtureCatalog.fixtures.map((entry) => entry.id)),
  );
  assert.equal(
    offlineResults.evidence_boundary.deterministic_integration_proof,
    "established",
  );
  assert.equal(offlineResults.evidence_boundary.provider_semantic_fidelity, "unestablished");
  assert.match(offlineResults.evidence_boundary.claim, /wiring and fail-closed validator plumbing only/u);
});

await check("authority remains closed beyond V1-A2", () => {
  assert.equal(capabilities.authority.accepted_plan, acceptedPlan);
  assert.equal(capabilities.authority.v1_a1, "accepted_complete_immutable");
  assert.equal(
    capabilities.authority.v1_a2_implementation,
    "r1_runtime_integrity_corrected_pending_human_chatgpt_review",
  );
  assert.equal(capabilities.authority.v1_b, "unauthorized");
  assert.equal(capabilities.authority.v1_c, "unauthorized");
  assert.equal(capabilities.authority.v1_d, "unauthorized");
  assert.deepEqual(capabilities.current_state, {
    r2_c: "remediation_required",
    experienceProductJudgment: "pending_remediation",
    jpy980RuntimeReadiness: "not_established",
    globalQ0Completion: false,
    production_runtime_authorized: false,
    payment_authorized: false,
    main_integration_authorized: false,
  });
  assert.deepEqual(capabilities.r1_runtime_integrity_correction.review_findings, {
    blocker: 1,
    major: 5,
    minor: 1,
  });
  assert.equal(capabilities.r1_runtime_integrity_correction.provider_semantic_fidelity, "unestablished");
  assert.deepEqual(capabilities.r1_runtime_integrity_correction.exact_scope, {
    total: "23/23",
    updated: 23,
    new: 0,
    deleted: 0,
    renamed: 0,
  });
});

await check("protected V1-A1 Product semantic Payment main and next-env are unchanged", () => {
  const protectedPaths = [
    "lib/assessment/runtime/jpy980-input-sufficiency-policy-v1.ts",
    "components/runtime/CustomerAssessmentNote.tsx",
    "components/runtime/CustomerAssessmentNote.module.css",
    "components/runtime/CustomerDraftCopyButton.tsx",
    "lib/assessment/runtime/customer-assessment-experience-projection-v2.ts",
    "lib/assessment/runtime/customer-assessment-projection-v1.ts",
    "lib/assessment/runtime/semantic-disposition-v4.ts",
    "supabase/migrations/0006_m2_p4_jpy980_clarification_lifecycle.sql",
    "next-env.d.ts",
  ];
  for (const candidate of protectedPaths) {
    assert.equal(worktreeBlob(candidate), blob(baseline, candidate), candidate);
  }
  const baselinePaths = git(["ls-tree", "-r", "--name-only", baseline])
    .split(/\r?\n/u)
    .filter(Boolean);
  for (const candidate of baselinePaths.filter((value) =>
    /(?:payment|stripe|payjp)/iu.test(value),
  )) {
    assert.equal(worktreeBlob(candidate), blob(baseline, candidate), candidate);
  }
  assert.equal(git(["rev-parse", acceptedV1A1]), acceptedV1A1);
  assert.equal(git(["rev-parse", "main"]), expectedMain);
});

await check("no case ID raw-prose routing Provider calls or external operations", () => {
  for (const candidate of [
    "lib/assessment/runtime/jpy980-product-scope-validation-v1.ts",
    "lib/assessment/runtime/jpy980-input-sufficiency-policy-v2.ts",
    "lib/assessment/runtime/clarification-grounding-v1.ts",
    "lib/assessment/runtime/effective-assessment-authority-v1.ts",
  ]) {
    const source = readText(candidate);
    assert.doesNotMatch(source, /case[_-]?id|fixture[_-]?id/iu);
    assert.doesNotMatch(source, /user_emotions\.(?:statement|description)|new RegExp/iu);
    assert.doesNotMatch(source, /OpenAI|fetch\(/u);
  }
  assert.deepEqual(capabilities.operations, {
    provider_calls: 0,
    db_operations: 0,
    supabase_operations: 0,
    migration_applies: 0,
    payment_operations: 0,
    deploy_operations: 0,
  });
});

await check("UTF-8 sensitive scan and git diff check pass", () => {
  const patterns = [
    /sk-[A-Za-z0-9_-]{20,}/gu,
    /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/gu,
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/gu,
  ];
  let sensitive = 0;
  for (const candidate of exactScope) {
    const source = readText(candidate);
    assert.equal(source.includes("\uFFFD"), false, candidate);
    for (const pattern of patterns) sensitive += [...source.matchAll(pattern)].length;
  }
  assert.equal(sensitive, 0);
  git(["diff", "--check", baseline, "--"]);
});

assert.equal(checks, 29);
if (failures.length > 0) {
  console.error(`\n${taskId} verifier: FAIL`);
  console.error("Failed checks: " + failures.join("; "));
  process.exit(1);
}

console.log(`\n${taskId} runtime integrity correction verifier: PASS 29/29`);
console.log("Exact correction scope: 23/23; UPDATE 23; NEW 0; DELETE 0; RENAME 0");
console.log("Immutable original V1-A2 implementation verifier: PASS 22/22");
console.log("Accepted V1-A2 R1 planning verifier: PASS 27/27");
console.log("Original A2 plan / V1-A1 R1 / original V1-A1: PASS 26/26, 25/25, 24/24");
console.log("Decision Policy verifier: PASS 40/40; all upstream accepted verifiers: PASS");
console.log("Offline fixtures: PASS 36/36; live Provider calls: 0");
console.log("Deterministic wiring / Provider semantic fidelity: established / unestablished");
console.log("Provider / DB / Supabase / migration apply / Payment / deploy: 0 / 0 / 0 / 0 / 0 / 0");
console.log("R2-C: remediation_required; JPY980 Runtime readiness: not_established; Global Q0: false");
