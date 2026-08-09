import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { TextDecoder } from "node:util";

process.removeAllListeners("warning");
process.on("warning", () => {});

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const baseline = "c94e780a13e319873618e95412b48275d289970e";
const acceptedCharterCommit = "611eecbf1249b222588c979a37162872215c9182";
const expectedParent = "611eecbf1249b222588c979a37162872215c9182";
const expectedMain = "61e33a10e195fad17e253a6b9719217e1992f273";
const expectedBranch =
  "fix/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p6-i1-r1-safety-content-precision";
const fixtureDirectory = path.join(
  repositoryRoot,
  "evals",
  "runtime",
  "m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p6-i1",
);

const exactScope = [
  "lib/purchase/prepayment-safety-types-v1.ts",
  "lib/purchase/prepayment-safety-rules-v1.ts",
  "lib/purchase/prepayment-safety-identity-v1.ts",
  "app/api/internal/purchase-eligibility/route.ts",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p6-i1/safety-engine-contract-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p6-i1/safety-engine-cases-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p6-i1/offline-results-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p6-i1/capabilities-v1.json",
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p6-i1-prepayment-safety-engine.mjs",
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R3_P6_I1_REVIEW.md",
];

const engineBaselineScope = [
  "lib/purchase/prepayment-safety-types-v1.ts",
  "lib/purchase/prepayment-safety-rules-v1.ts",
  "lib/purchase/prepayment-safety-identity-v1.ts",
  "lib/purchase/prepayment-safety-gate-v1.ts",
  "lib/purchase/purchase-state-machine-v1.ts",
  "app/api/internal/purchase-eligibility/route.ts",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p6-i1/safety-engine-contract-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p6-i1/safety-engine-cases-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p6-i1/offline-results-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p6-i1/capabilities-v1.json",
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p6-i1-prepayment-safety-engine.mjs",
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R3_P6_I1_REVIEW.md",
];

const protectedCorrectionPaths = [
  "lib/purchase/prepayment-safety-gate-v1.ts",
  "lib/purchase/purchase-state-machine-v1.ts",
];

const charterScope = [
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R3_P6_P0_REVIEW.md",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p6-p0/capabilities-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p6-p0/decision-matrix-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p6-p0/product-policy-v1.md",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p6-p0/purchase-state-machine-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p6-p0/question-flow-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p6-p0/stop-copy-v1.json",
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p6-p0-prepayment-safety-charter.mjs",
];

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repositoryRoot,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
    ...options,
  });
  if (result.error) throw result.error;
  return result;
}

function git(args, allowFailure = false) {
  const result = run("git.exe", [
    "-c",
    "safe.directory=C:/projects/moon-reply",
    ...args,
  ]);
  if (!allowFailure && result.status !== 0) {
    throw new Error(
      `git ${args.join(" ")} failed: ${result.stderr || result.stdout}`,
    );
  }
  return result;
}

function normalizeRepoPath(value) {
  return value.replaceAll("\\", "/");
}

function splitNullTerminated(value) {
  return value.split("\0").filter(Boolean);
}

function currentChangedPaths() {
  const changed = new Set(
    splitNullTerminated(
      git(["diff", "--name-only", "-z", `${baseline}..HEAD`]).stdout,
    ).map(normalizeRepoPath),
  );
  const statusEntries = splitNullTerminated(
    git([
      "status",
      "--porcelain=v1",
      "-z",
      "--untracked-files=all",
    ]).stdout,
  );
  for (const entry of statusEntries) {
    const status = entry.slice(0, 2);
    assert.ok(!status.includes("R") && !status.includes("C"));
    changed.add(normalizeRepoPath(entry.slice(3)));
  }
  return [...changed].sort();
}

function readUtf8(relativePath) {
  const bytes = fs.readFileSync(path.join(repositoryRoot, relativePath));
  const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  assert.ok(!text.startsWith("\uFEFF"), `${relativePath} must not use a BOM`);
  assert.ok(!text.includes("\uFFFD"), `${relativePath} contains U+FFFD`);
  return text;
}

function readJson(relativePath) {
  return JSON.parse(readUtf8(relativePath));
}

function sha256File(absolutePath) {
  return createHash("sha256")
    .update(fs.readFileSync(absolutePath))
    .digest("hex");
}

function isPlainObject(value) {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function deepMerge(baseValue, overrideValue) {
  if (!isPlainObject(baseValue) || !isPlainObject(overrideValue)) {
    return structuredClone(overrideValue);
  }
  const output = structuredClone(baseValue);
  for (const [key, value] of Object.entries(overrideValue)) {
    output[key] =
      isPlainObject(output[key]) && isPlainObject(value)
        ? deepMerge(output[key], value)
        : structuredClone(value);
  }
  return output;
}

function setPath(target, dottedPath, value) {
  const parts = dottedPath.split(".");
  let cursor = target;
  for (const key of parts.slice(0, -1)) {
    assert.ok(isPlainObject(cursor[key]));
    cursor = cursor[key];
  }
  cursor[parts.at(-1)] = structuredClone(value);
}

function deletePath(target, dottedPath) {
  const parts = dottedPath.split(".");
  let cursor = target;
  for (const key of parts.slice(0, -1)) {
    assert.ok(isPlainObject(cursor[key]));
    cursor = cursor[key];
  }
  delete cursor[parts.at(-1)];
}

let passCount = 0;
function check(label, action) {
  try {
    action();
    passCount += 1;
    console.log(`PASS ${label}`);
  } catch (error) {
    console.error(`FAIL ${label}`);
    throw error;
  }
}

const [typesModule, gateModule, stateModule] = await Promise.all([
  import(
    pathToFileURL(
      path.join(
        repositoryRoot,
        "lib/purchase/prepayment-safety-types-v1.ts",
      ),
    ).href
  ),
  import(
    pathToFileURL(
      path.join(
        repositoryRoot,
        "lib/purchase/prepayment-safety-gate-v1.ts",
      ),
    ).href
  ),
  import(
    pathToFileURL(
      path.join(repositoryRoot, "lib/purchase/purchase-state-machine-v1.ts"),
    ).href
  ),
]);

const {
  CONTACT_BOUNDARY_STATES,
  ELIGIBLE_DELIVERY_SCOPES,
  PREPAYMENT_SAFETY_CLASSIFICATIONS,
  RELATIONSHIP_VALUES,
  REQUESTED_ASSISTANCE_GOALS,
  REQUESTED_TOPIC_VALUES,
  SAFETY_DISPOSITIONS,
  PrepaymentSafetyValidationError,
  decodePrepaymentSafetyInputV1,
} = typesModule;
const { evaluatePrepaymentSafetyV1 } = gateModule;
const { PURCHASE_STATES_V1, transitionPurchaseStateV1 } = stateModule;

const contract = readJson(
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p6-i1/safety-engine-contract-v1.json",
);
const fixture = readJson(
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p6-i1/safety-engine-cases-v1.json",
);
const capabilities = readJson(
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p6-i1/capabilities-v1.json",
);
const offlineResults = readJson(
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p6-i1/offline-results-v1.json",
);
const charterMatrixPath = path.resolve(
  fixtureDirectory,
  fixture.charter_case_import.path,
);
const charterMatrix = JSON.parse(
  new TextDecoder("utf-8", { fatal: true }).decode(
    fs.readFileSync(charterMatrixPath),
  ),
);
const charterQuestionFlow = readJson(
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p6-p0/question-flow-v1.json",
);

check("exact branch baseline parent main and empty stash authority", () => {
  assert.equal(git(["branch", "--show-current"]).stdout.trim(), expectedBranch);
  assert.equal(git(["merge-base", "HEAD", baseline]).stdout.trim(), baseline);
  assert.equal(git(["rev-parse", `${baseline}^`]).stdout.trim(), expectedParent);
  assert.equal(git(["rev-parse", "main"]).stdout.trim(), expectedMain);
  assert.equal(git(["rev-parse", "origin/main"]).stdout.trim(), expectedMain);
  assert.equal(git(["stash", "list"]).stdout.trim(), "");
  const successorCommitCount = Number(
    git(["rev-list", "--count", `${baseline}..HEAD`]).stdout.trim(),
  );
  assert.ok(successorCommitCount === 0 || successorCommitCount === 1);
  if (successorCommitCount === 1) {
    assert.equal(git(["rev-parse", "HEAD^"]).stdout.trim(), baseline);
  }
});

check("exact R1 correction scope 10/10 and all paths pre-exist", () => {
  assert.deepEqual(currentChangedPaths(), [...exactScope].sort());
  for (const relativePath of exactScope) {
    assert.ok(fs.statSync(path.join(repositoryRoot, relativePath)).isFile());
    assert.equal(
      git(["cat-file", "-e", `${baseline}:${relativePath}`], true).status,
      0,
      `${relativePath} is missing at the correction baseline`,
    );
  }
});

check("P6-I1 exact baseline scope exists 12/12 and protected pair is unchanged", () => {
  const committedScope = git([
    "diff-tree",
    "--no-commit-id",
    "--name-only",
    "-r",
    baseline,
  ])
    .stdout.trim()
    .split(/\r?\n/u)
    .map(normalizeRepoPath)
    .sort();
  assert.deepEqual(committedScope, [...engineBaselineScope].sort());
  for (const relativePath of protectedCorrectionPaths) {
    assert.equal(
      git(["hash-object", relativePath]).stdout.trim(),
      git(["rev-parse", `${baseline}:${relativePath}`]).stdout.trim(),
      relativePath,
    );
  }
});

check("strict UTF-8 JSON U+FFFD zero and trailing whitespace zero", () => {
  for (const relativePath of exactScope) {
    const text = readUtf8(relativePath);
    assert.ok(!/[ \t]+$/gmu.test(text), `${relativePath} has trailing whitespace`);
  }
  for (const jsonName of [
    "safety-engine-contract-v1.json",
    "safety-engine-cases-v1.json",
    "offline-results-v1.json",
    "capabilities-v1.json",
  ]) {
    JSON.parse(readUtf8(normalizeRepoPath(path.relative(repositoryRoot, path.join(fixtureDirectory, jsonName)))));
  }
});

check("secret material zero", () => {
  const combined = exactScope.map(readUtf8).join("\n");
  assert.doesNotMatch(combined, /sk-[A-Za-z0-9_-]{20,}/u);
  assert.doesNotMatch(combined, /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/u);
  assert.doesNotMatch(
    combined,
    /(?:OPENAI_API_KEY|SUPABASE_SECRET_KEY)\s*[:=]\s*["'][^"']+["']/u,
  );
});

check("accepted P6-P0-R1 Charter remains blob-identical 8/8", () => {
  const committedScope = git([
    "diff-tree",
    "--no-commit-id",
    "--name-only",
    "-r",
    acceptedCharterCommit,
  ])
    .stdout.trim()
    .split(/\r?\n/u)
    .map(normalizeRepoPath)
    .sort();
  assert.deepEqual(committedScope, [...charterScope].sort());
  for (const relativePath of charterScope) {
    const baselineBlob = git([
      "rev-parse",
      `${acceptedCharterCommit}:${relativePath}`,
    ]).stdout.trim();
    const workingBlob = git(["hash-object", relativePath]).stdout.trim();
    assert.equal(workingBlob, baselineBlob, relativePath);
  }
});

check("Package D legacy Safety RequestForm Runtime and protected assets unchanged", () => {
  const protectedPaths = [
    ...protectedCorrectionPaths,
    "components/request/RequestForm.tsx",
    "lib/safety",
    "lib/assessment/runtime/pipeline.ts",
    "lib/assessment/runtime/service.ts",
    "lib/assessment/runtime/schema-catalog.ts",
    "lib/assessment/runtime/evaluator-v2.ts",
    "lib/assessment/runtime/semantic-disposition-v5.ts",
    "lib/assessment/runtime/customer-assessment-projection-v1.ts",
    "lib/assessment/runtime/customer-assessment-delivery-v1.ts",
    "lib/assessment/runtime/supabase-repository.ts",
    "docs/CURRENT_FOCUS.md",
    "docs/WBS.md",
    "docs/CODEX_HANDOFF.md",
  ];
  assert.equal(
    git(["diff", "--quiet", baseline, "--", ...protectedPaths], true).status,
    0,
  );
});

check("exact Charter vocabularies and existing Assessment enums", () => {
  assert.deepEqual(
    [...CONTACT_BOUNDARY_STATES],
    charterQuestionFlow.primary_screen.contact_boundary_options.map(
      (option) => option.code,
    ),
  );
  assert.deepEqual(
    [...REQUESTED_ASSISTANCE_GOALS],
    charterQuestionFlow.primary_screen.requested_assistance_options.map(
      (option) => option.code,
    ),
  );
  assert.deepEqual(
    [...SAFETY_DISPOSITIONS],
    contract.classification_contract.safety_dispositions,
  );
  assert.deepEqual(
    [...ELIGIBLE_DELIVERY_SCOPES],
    contract.classification_contract.eligible_delivery_scopes,
  );
  assert.deepEqual(
    [...PREPAYMENT_SAFETY_CLASSIFICATIONS],
    charterMatrix.classification_states.map((state) => state.code),
  );
  assert.deepEqual(
    [...PREPAYMENT_SAFETY_CLASSIFICATIONS],
    contract.classification_contract.derived_classifications,
  );
  assert.deepEqual([...RELATIONSHIP_VALUES], [
    "dating",
    "in_relationship",
    "ambiguous",
    "former_partner",
    "matching_app",
    "work_or_school",
    "other",
  ]);
  assert.deepEqual([...REQUESTED_TOPIC_VALUES], [
    "decide_send_or_wait",
    "message_impact",
    "draft_message",
    "relationship",
    "next_three_days",
    "organize_emotions",
  ]);
});

check("R1 contract binds latest inbound and records conservative limitations", () => {
  assert.equal(
    contract.task_id,
    "M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P6-I1-R1",
  );
  assert.equal(
    contract.status,
    "prepayment_safety_engine_precision_corrected_pending_human_chatgpt_review",
  );
  assert.equal(contract.baseline, baseline);
  assert.equal(contract.input_contract.required_fields.length, 13);
  assert.ok(
    contract.input_contract.required_fields.includes("latestInboundMessage"),
  );
  assert.deepEqual(contract.input_contract.latest_inbound_message, {
    meaning: "latest_message_actually_received_from_the_other_person_when_available",
    nullable: true,
    trimmed_when_present: true,
    minimum_code_points_when_present: 1,
    maximum_code_points_when_present: 2000,
    distinct_from_current_situation_and_outbound_candidate: true,
  });
  assert.equal(
    contract.authority.full_semantic_scope_equivalence_claimed,
    false,
  );
  assert.equal(
    contract.classification_contract.unsafe_negation_boundary,
    "local_sentence_or_proposition",
  );
  assert.deepEqual(contract.classification_contract.boundary_source_fields, [
    "currentSituation",
    "latestInboundMessage",
  ]);
  assert.equal(
    contract.classification_contract.optional_message_can_define_received_boundary,
    false,
  );
  assert.equal(
    contract.classification_contract.boundary_source_conflict_code,
    "boundary_state_conflict",
  );
  assert.equal(
    contract.classification_contract.missing_new_inbound_source_code,
    "latest_inbound_message_required",
  );
  assert.equal(
    contract.classification_contract.new_inbound_prior_boundary_narrative_is_expected,
    true,
  );
  assert.equal(
    contract.classification_contract.new_inbound_current_conflict_source,
    "latestInboundMessage",
  );
  assert.ok(
    contract.identity_contract.normalization.includes(
      "latest_inbound_kept_separate_from_request_and_candidate",
    ),
  );
  assert.equal(contract.internal_api_contract.maximum_body_bytes, 49_152);
});

check("strict decoder exact top-level and nested allowlists", () => {
  const decoded = decodePrepaymentSafetyInputV1(fixture.base_input);
  assert.ok(Object.isFrozen(decoded));
  assert.ok(Object.isFrozen(decoded.requestedTopics));
  assert.ok(Object.isFrozen(decoded.clarificationAnswers));
  assert.ok(Object.isFrozen(decoded.scopeAcknowledgements));
  assert.equal(decoded.currentSituation, fixture.base_input.currentSituation);
  assert.equal(decoded.latestInboundMessage, null);
  assert.throws(
    () =>
      decodePrepaymentSafetyInputV1({
        ...fixture.base_input,
        clarificationAnswers: {
          ...fixture.base_input.clarificationAnswers,
          submissionCount: 1,
        },
      }),
    PrepaymentSafetyValidationError,
  );
  assert.throws(
    () =>
      decodePrepaymentSafetyInputV1({
        ...fixture.base_input,
        clarificationAnswers: {
          ...fixture.base_input.clarificationAnswers,
          submissionCount: 0,
          unsafeExecutionIntent: "stopping_or_avoiding",
        },
      }),
    PrepaymentSafetyValidationError,
  );
});

check("decoder rejects all declared mutation and authority inputs 15/15", () => {
  assert.equal(fixture.decoder_negative_cases.length, 15);
  for (const testCase of fixture.decoder_negative_cases) {
    const input = structuredClone(fixture.base_input);
    switch (testCase.operation) {
      case "add_top_level":
        input[testCase.key] = structuredClone(testCase.value);
        break;
      case "add_clarification_key":
        input.clarificationAnswers[testCase.key] = structuredClone(
          testCase.value,
        );
        break;
      case "add_acknowledgement_key":
        input.scopeAcknowledgements[testCase.key] = structuredClone(
          testCase.value,
        );
        break;
      case "replace":
        setPath(input, testCase.path, testCase.value);
        break;
      case "delete":
        deletePath(input, testCase.path);
        break;
      default:
        assert.fail(`Unknown negative operation ${testCase.operation}`);
    }
    assert.throws(
      () => evaluatePrepaymentSafetyV1(input),
      (error) =>
        error instanceof PrepaymentSafetyValidationError &&
        error.safeCode === testCase.expected_error,
      testCase.case_id,
    );
  }
});

check("R1 latest-inbound decoder and identity regressions execute 6/6", () => {
  assert.equal(fixture.r1_decoder_identity_cases.length, 6);
  for (const testCase of fixture.r1_decoder_identity_cases) {
    const input = structuredClone(fixture.base_input);
    switch (testCase.operation) {
      case "delete":
        deletePath(input, testCase.path);
        break;
      case "replace":
        setPath(input, testCase.path, testCase.value);
        break;
      case "replace_repeated":
        setPath(input, testCase.path, testCase.unit.repeat(testCase.count));
        break;
      case "valid_null": {
        const before = JSON.stringify(input);
        const result = evaluatePrepaymentSafetyV1(input);
        assert.equal(result.classification, testCase.expected_classification);
        assert.equal(JSON.stringify(input), before);
        continue;
      }
      case "canonical_hash_equivalence": {
        const equivalentInput = structuredClone(fixture.base_input);
        input.latestInboundMessage = testCase.value;
        equivalentInput.latestInboundMessage = testCase.equivalent_value;
        const before = JSON.stringify(input);
        const equivalentBefore = JSON.stringify(equivalentInput);
        const result = evaluatePrepaymentSafetyV1(input);
        const equivalentResult = evaluatePrepaymentSafetyV1(equivalentInput);
        assert.equal(
          result.eligibilityInputHash === equivalentResult.eligibilityInputHash,
          testCase.expected_same_hash,
        );
        assert.equal(JSON.stringify(input), before);
        assert.equal(JSON.stringify(equivalentInput), equivalentBefore);
        continue;
      }
      case "material_hash_mutation": {
        const mutatedInput = structuredClone(fixture.base_input);
        input.latestInboundMessage = testCase.value;
        mutatedInput.latestInboundMessage = testCase.mutated_value;
        const before = JSON.stringify(input);
        const mutatedBefore = JSON.stringify(mutatedInput);
        const result = evaluatePrepaymentSafetyV1(input);
        const mutatedResult = evaluatePrepaymentSafetyV1(mutatedInput);
        assert.equal(
          result.eligibilityInputHash === mutatedResult.eligibilityInputHash,
          testCase.expected_same_hash,
        );
        assert.equal(JSON.stringify(input), before);
        assert.equal(JSON.stringify(mutatedInput), mutatedBefore);
        continue;
      }
      default:
        assert.fail(`Unknown R1 decoder operation ${testCase.operation}`);
    }
    const before = JSON.stringify(input);
    assert.throws(
      () => evaluatePrepaymentSafetyV1(input),
      (error) =>
        error instanceof PrepaymentSafetyValidationError &&
        error.safeCode === testCase.expected_error,
      testCase.case_id,
    );
    assert.equal(JSON.stringify(input), before);
  }
});

check("no unchecked decoder casts and no case-ID branching", () => {
  const typeSource = readUtf8(exactScope[0]);
  const ruleSource = readUtf8(exactScope[1]);
  assert.doesNotMatch(
    typeSource,
    /\bas\s+(?:Record|Prepayment|Relationship|RequestedTopic)/u,
  );
  assert.doesNotMatch(ruleSource, /(?:DM-|ENG-|case[_-]?id)/iu);
});

function assertResultInvariants(result, input) {
  assert.match(result.eligibilityInputHash, /^[0-9a-f]{64}$/u);
  assert.equal(result.paymentImplementationPresent, false);
  assert.equal(result.paymentSessionAvailable, false);
  assert.equal(result.paymentAuthorityIssued, false);
  assert.equal(
    result.allowedOutputKinds.some((kind) =>
      result.forbiddenOutputKinds.includes(kind),
    ),
    false,
  );
  const serialized = JSON.stringify(result);
  assert.ok(!serialized.includes(input.currentSituation));
  if (input.optionalMessage !== null) {
    assert.ok(!serialized.includes(input.optionalMessage));
  }
  if (input.latestInboundMessage !== null) {
    assert.ok(!serialized.includes(input.latestInboundMessage));
  }
  assert.doesNotMatch(serialized, /(?:RegExp|regex|PHRASES|pattern_name)/u);
  if (!result.classification.startsWith("eligible_")) {
    assert.equal(result.purchaseGateSatisfied, false);
    assert.deepEqual(result.requiredAcknowledgementCodes, []);
  }
}

function runEngineCase(testCase, charterCase = false) {
  const input = deepMerge(fixture.base_input, testCase.input_overrides);
  const before = JSON.stringify(input);
  const result = evaluatePrepaymentSafetyV1(input);
  assert.equal(JSON.stringify(input), before, `${testCase.case_id} mutated input`);
  assert.equal(
    result.classification,
    testCase.expected_classification,
    testCase.case_id,
  );
  assertResultInvariants(result, input);
  if (testCase.expected_clarification_codes !== undefined) {
    assert.deepEqual(
      result.requiredClarificationCodes,
      testCase.expected_clarification_codes,
      testCase.case_id,
    );
  }

  if (charterCase) {
    const authorityCase = charterMatrix.cases.find(
      (candidate) => candidate.case_id === testCase.case_id,
    );
    assert.ok(authorityCase, testCase.case_id);
    assert.equal(authorityCase.classification, testCase.expected_classification);
    assert.equal(
      authorityCase.can_reach_purchase_available,
      testCase.expected_purchase_gate_satisfied,
    );
  }

  switch (testCase.kind) {
    case "material_input_mutation": {
      const mutatedInput = deepMerge(
        fixture.base_input,
        testCase.mutation_overrides,
      );
      const mutatedResult = evaluatePrepaymentSafetyV1(mutatedInput);
      assert.notEqual(
        mutatedResult.eligibilityInputHash,
        result.eligibilityInputHash,
      );
      const transition = transitionPurchaseStateV1(result.classification, {
        type: "bound_input_changed",
        previousEligibilityInputHash: result.eligibilityInputHash,
        currentEligibilityInputHash: mutatedResult.eligibilityInputHash,
      });
      assert.equal(transition.ok, false);
      assert.equal(transition.state, testCase.expected_state);
      assert.equal(transition.errorCode, "STALE_ELIGIBILITY_INPUT");
      break;
    }
    case "stale_hash": {
      const transition = transitionPurchaseStateV1(result.classification, {
        type: "server_make_purchase_available",
        result,
        presentedEligibilityInputHash: testCase.presented_hash,
      });
      assert.equal(transition.ok, false);
      assert.equal(transition.state, testCase.expected_state);
      assert.equal(transition.errorCode, "STALE_ELIGIBILITY_INPUT");
      break;
    }
    case "input_immutability":
      assert.equal(JSON.stringify(input), before);
      assert.equal(result.purchaseGateSatisfied, testCase.expected_purchase_gate_satisfied);
      break;
    case "canonical_hash_equivalence": {
      const equivalentInput = deepMerge(
        fixture.base_input,
        testCase.equivalent_overrides,
      );
      const equivalentResult = evaluatePrepaymentSafetyV1(equivalentInput);
      assert.equal(
        equivalentResult.eligibilityInputHash,
        result.eligibilityInputHash,
      );
      assert.equal(equivalentResult.classification, result.classification);
      assert.equal(result.purchaseGateSatisfied, testCase.expected_purchase_gate_satisfied);
      break;
    }
    case "payment_transition": {
      const purchaseAvailable = transitionPurchaseStateV1(
        result.classification,
        {
          type: "server_make_purchase_available",
          result,
          presentedEligibilityInputHash: result.eligibilityInputHash,
        },
      );
      assert.equal(purchaseAvailable.ok, true);
      assert.equal(purchaseAvailable.state, "purchase_available");
      const payment = transitionPurchaseStateV1(purchaseAvailable.state, {
        type: "server_create_payment_session",
      });
      assert.equal(payment.ok, false);
      assert.equal(payment.state, "purchase_available");
      assert.equal(payment.errorCode, testCase.expected_transition_error);
      const completion = transitionPurchaseStateV1("payment_pending", {
        type: "verified_payment_completion",
      });
      assert.equal(completion.ok, false);
      assert.equal(completion.errorCode, "PAYMENT_NOT_IMPLEMENTED");
      break;
    }
    default:
      assert.equal(
        result.purchaseGateSatisfied,
        testCase.expected_purchase_gate_satisfied,
      );
  }

  if (testCase.state_assertion === "unblocking_does_not_reopen_contact") {
    const transition = transitionPurchaseStateV1(result.classification, {
      type: "unblocked",
    });
    assert.equal(transition.ok, false);
    assert.equal(transition.state, result.classification);
    assert.equal(transition.errorCode, "FULL_RECLASSIFICATION_REQUIRED");
  }
  if (testCase.state_assertion === "time_passage_does_not_reopen_contact") {
    const transition = transitionPurchaseStateV1(result.classification, {
      type: "time_passed",
    });
    assert.equal(transition.ok, false);
    assert.equal(transition.state, result.classification);
    assert.equal(transition.errorCode, "FULL_RECLASSIFICATION_REQUIRED");
  }
  return result;
}

check("accepted Charter case import is exact and immutable", () => {
  assert.equal(
    sha256File(charterMatrixPath),
    fixture.charter_case_import.sha256,
  );
  assert.equal(charterMatrix.cases.length, 42);
  assert.equal(fixture.charter_executions.length, 42);
  assert.equal(charterMatrix.cases.at(0).case_id, "DM-01");
  assert.equal(charterMatrix.cases.at(-1).case_id, "DM-42");
  assert.deepEqual(
    fixture.charter_executions.map((item) => item.case_id),
    charterMatrix.cases.map((item) => item.case_id),
  );
  assert.equal(fixture.charter_case_import.expected_meaning_may_change, false);
});

check("Charter Decision Matrix executes 42/42", () => {
  for (const testCase of fixture.charter_executions) {
    runEngineCase(testCase, true);
  }
});

check("additional engine cases execute 36/36", () => {
  assert.equal(fixture.additional_engine_cases.length, 36);
  for (const testCase of fixture.additional_engine_cases) {
    runEngineCase(testCase, false);
  }
});

check("R1 precision regressions execute 30/30 with at least 21 new cases", () => {
  assert.equal(fixture.r1_precision_cases.length, 30);
  assert.ok(fixture.r1_precision_cases.length >= 21);
  assert.deepEqual(
    fixture.r1_precision_cases.map((testCase) => testCase.case_id),
    Array.from({ length: 30 }, (_, index) =>
      `R1-${String(index + 1).padStart(2, "0")}`,
    ),
  );
  for (const testCase of fixture.r1_precision_cases) {
    runEngineCase(testCase, false);
  }
});

function r1Case(caseId) {
  const testCase = fixture.r1_precision_cases.find(
    (candidate) => candidate.case_id === caseId,
  );
  assert.ok(testCase, caseId);
  return testCase;
}

check("direct present self-harm other-harm and assault gaps are closed", () => {
  for (const caseId of [
    "R1-01",
    "R1-02",
    "R1-03",
    "R1-04",
    "R1-05",
    "R1-08",
  ]) {
    assert.equal(
      runEngineCase(r1Case(caseId)).classification,
      "urgent_safety_redirect",
      caseId,
    );
  }
  for (const caseId of ["R1-06", "R1-07", "R1-26", "R1-27"]) {
    assert.equal(
      runEngineCase(r1Case(caseId)).classification,
      "eligible_general",
      caseId,
    );
  }
  for (const currentSituation of [
    "自分を傷つけたいわけではありません。",
    "相手を殺したいわけではありません。",
    "人を傷つけたいとは思っていません。",
  ]) {
    assert.equal(
      evaluatePrepaymentSafetyV1({
        ...fixture.base_input,
        currentSituation,
      }).classification,
      "eligible_general",
      currentSituation,
    );
  }
});

check("all declared present-form Safety examples redirect without time adverbs", () => {
  for (const currentSituation of [
    "死にたい",
    "消えたい",
    "生きていたくない",
    "自殺したい",
    "自分を傷つけたい",
    "相手を殺したい",
    "相手を傷つけたい",
    "人を殺したい",
    "殴られている",
    "蹴られている",
    "首を絞められている",
    "殺されそう",
    "襲われている",
  ]) {
    const input = { ...fixture.base_input, currentSituation };
    const before = JSON.stringify(input);
    const result = evaluatePrepaymentSafetyV1(input);
    assert.equal(
      result.classification,
      "urgent_safety_redirect",
      currentSituation,
    );
    assert.equal(JSON.stringify(input), before);
  }
});

check("unsafe assistance negation is proposition-local and mixed text blocks", () => {
  for (const caseId of [
    "R1-09",
    "R1-10",
    "R1-22",
    "R1-23",
    "R1-24",
    "R1-25",
  ]) {
    assert.equal(
      runEngineCase(r1Case(caseId)).classification,
      "eligible_general",
      caseId,
    );
  }
  assert.equal(
    runEngineCase(r1Case("R1-11")).classification,
    "blocked_unsafe_assistance",
  );
});

check("boundary source conflicts fail closed without rewriting structured state", () => {
  for (const caseId of ["R1-12", "R1-13", "R1-14", "R1-15", "R1-28"]) {
    const result = runEngineCase(r1Case(caseId));
    assert.equal(result.classification, "needs_clarification", caseId);
    assert.deepEqual(
      result.requiredClarificationCodes,
      ["boundary_state_conflict"],
      caseId,
    );
  }
});

check("business-only and scoped-reply source-content guards fail closed", () => {
  assert.equal(
    runEngineCase(r1Case("R1-16")).classification,
    "eligible_business_only",
  );
  assert.equal(
    runEngineCase(r1Case("R1-17")).classification,
    "needs_clarification",
  );
  assert.equal(
    runEngineCase(r1Case("R1-18")).requiredClarificationCodes[0],
    "latest_inbound_message_required",
  );
  assert.equal(
    runEngineCase(r1Case("R1-19")).classification,
    "eligible_scoped_reply",
  );
  assert.equal(
    runEngineCase(r1Case("R1-20")).requiredClarificationCodes[0],
    "boundary_state_conflict",
  );
  assert.equal(
    runEngineCase(r1Case("R1-21")).requiredClarificationCodes[0],
    "reply_scope_required",
  );
  assert.equal(
    runEngineCase(r1Case("R1-29")).classification,
    "eligible_business_only",
  );
  const unacknowledged = runEngineCase(r1Case("R1-30"));
  assert.equal(unacknowledged.classification, "eligible_scoped_reply");
  assert.equal(unacknowledged.purchaseGateSatisfied, false);
  assert.ok(
    unacknowledged.requiredAcknowledgementCodes.includes(
      "scoped_reply_scope_acknowledged",
    ),
  );
});

check("all declared private-expansion categories are guarded without broad tokens", () => {
  const businessBase = deepMerge(fixture.base_input, {
    contactBoundaryState: "business_only",
    requestedAssistanceGoal: "draft_within_current_permission",
    clarificationAnswers: {
      submissionCount: 1,
      practicalPermissionExplicit: "yes",
      currentRequestPracticalScopeOnly: "yes",
    },
  });
  for (const optionalMessage of [
    "今度カフェに行かない？",
    "今度二人でデートしませんか。",
    "もう一度やり直したいです。",
    "好きです。付き合ってください。",
    "個人的に会いたいです。",
  ]) {
    const input = { ...businessBase, optionalMessage };
    const before = JSON.stringify(input);
    const result = evaluatePrepaymentSafetyV1(input);
    assert.equal(result.classification, "needs_clarification", optionalMessage);
    assert.ok(
      result.requiredClarificationCodes.includes("business_scope_required"),
      optionalMessage,
    );
    assert.equal(JSON.stringify(input), before);
  }
  const currentSituationExpansion = {
    ...businessBase,
    currentSituation: "業務の相談に加えて、今度個人的に会いたいです。",
  };
  assert.equal(
    evaluatePrepaymentSafetyV1(currentSituationExpansion).classification,
    "needs_clarification",
  );
  assert.equal(
    runEngineCase(r1Case("R1-29")).classification,
    "eligible_business_only",
  );
});

check("classification precedence is urgent unsafe professional clarification eligible", () => {
  const byId = new Map(
    fixture.additional_engine_cases.map((testCase) => [
      testCase.case_id,
      runEngineCase(testCase),
    ]),
  );
  assert.equal(byId.get("ENG-B").classification, "urgent_safety_redirect");
  assert.equal(byId.get("ENG-A").classification, "blocked_unsafe_assistance");
  assert.equal(
    byId.get("ENG-M").classification,
    "unsupported_professional_request",
  );
  assert.equal(byId.get("ENG-E").classification, "needs_clarification");
  assert.equal(byId.get("ENG-L").classification, "eligible_general");
});

check("historical negated ambiguous and single-token distinctions are fail-closed", () => {
  const expected = new Map([
    ["ENG-C", "eligible_boundary_support_only"],
    ["ENG-D", "eligible_boundary_support_only"],
    ["ENG-E", "needs_clarification"],
    ["ENG-AC", "eligible_general"],
    ["ENG-AF", "eligible_general"],
    ["ENG-AG", "eligible_general"],
    ["ENG-AH", "eligible_general"],
  ]);
  for (const [caseId, classification] of expected) {
    const testCase = fixture.additional_engine_cases.find(
      (candidate) => candidate.case_id === caseId,
    );
    assert.equal(runEngineCase(testCase).classification, classification);
  }
});

check("hard Safety phrase coverage and Candidate override are preserved", () => {
  for (const caseId of [
    "ENG-F",
    "ENG-G",
    "ENG-H",
    "ENG-I",
    "ENG-U",
    "ENG-V",
    "ENG-W",
    "ENG-X",
    "ENG-Y",
    "ENG-Z",
    "ENG-AD",
    "ENG-AI",
    "ENG-AJ",
  ]) {
    const testCase = fixture.additional_engine_cases.find(
      (candidate) => candidate.case_id === caseId,
    );
    assert.equal(
      runEngineCase(testCase).classification,
      "blocked_unsafe_assistance",
      caseId,
    );
  }
  for (const caseId of ["ENG-B", "ENG-J", "ENG-AB"]) {
    const testCase = fixture.additional_engine_cases.find(
      (candidate) => candidate.case_id === caseId,
    );
    assert.equal(
      runEngineCase(testCase).classification,
      "urgent_safety_redirect",
      caseId,
    );
  }
});

check("acknowledgements affect purchase gate but never Safety classification", () => {
  const eligible = evaluatePrepaymentSafetyV1(fixture.base_input);
  const noAttestation = evaluatePrepaymentSafetyV1({
    ...fixture.base_input,
    attestationConfirmed: false,
  });
  const noAdultConfirmation = evaluatePrepaymentSafetyV1({
    ...fixture.base_input,
    adultConfirmed: false,
  });
  assert.equal(eligible.classification, noAttestation.classification);
  assert.equal(eligible.classification, noAdultConfirmation.classification);
  assert.equal(eligible.purchaseGateSatisfied, true);
  assert.equal(noAttestation.purchaseGateSatisfied, false);
  assert.equal(noAdultConfirmation.purchaseGateSatisfied, false);
});

check("output contracts have no overlap or prohibited eligible outputs", () => {
  const prohibitedEligibleOutputs = new Set([
    "unsafe_method",
    "workaround",
    "professional_advice",
    "professional_document",
    "hidden_state_certainty",
    "reconciliation_guarantee",
  ]);
  for (const testCase of [
    ...fixture.charter_executions,
    ...fixture.additional_engine_cases,
    ...fixture.r1_precision_cases,
  ]) {
    const input = deepMerge(fixture.base_input, testCase.input_overrides);
    const result = evaluatePrepaymentSafetyV1(input);
    assert.equal(
      result.allowedOutputKinds.some((kind) =>
        result.forbiddenOutputKinds.includes(kind),
      ),
      false,
    );
    if (result.classification.startsWith("eligible_")) {
      assert.equal(
        result.allowedOutputKinds.some((kind) =>
          prohibitedEligibleOutputs.has(kind),
        ),
        false,
      );
    }
  }
  const blocked = runEngineCase(
    fixture.additional_engine_cases.find(
      (candidate) => candidate.case_id === "ENG-A",
    ),
  );
  assert.ok(blocked.forbiddenOutputKinds.includes("provider_generated_assessment"));
  assert.ok(!blocked.allowedOutputKinds.includes("provider_generated_assessment"));
});

check("canonical identity equivalence mutation invalidation and determinism", () => {
  const canonicalCase = fixture.additional_engine_cases.find(
    (candidate) => candidate.case_id === "ENG-Q",
  );
  const mutationCase = fixture.additional_engine_cases.find(
    (candidate) => candidate.case_id === "ENG-R",
  );
  const first = runEngineCase(canonicalCase);
  const duplicate = runEngineCase(canonicalCase);
  assert.deepEqual(duplicate, first);
  runEngineCase(mutationCase);
});

check("pure fourteen-state machine rejects stale and payment transitions", () => {
  assert.equal(PURCHASE_STATES_V1.length, 14);
  assert.equal(new Set(PURCHASE_STATES_V1).size, 14);
  const result = evaluatePrepaymentSafetyV1(fixture.base_input);
  assert.deepEqual(
    transitionPurchaseStateV1("unassessed", {
      type: "begin_safety_and_assistance_assessment",
    }),
    {
      ok: true,
      state: "collecting_safety_answers",
      errorCode: null,
    },
  );
  const classified = transitionPurchaseStateV1(
    "collecting_safety_answers",
    { type: "apply_server_classification", result },
  );
  assert.equal(classified.state, "eligible_general");
  const purchase = transitionPurchaseStateV1(classified.state, {
    type: "server_make_purchase_available",
    result,
    presentedEligibilityInputHash: result.eligibilityInputHash,
  });
  assert.equal(purchase.state, "purchase_available");
  assert.equal(
    transitionPurchaseStateV1("blocked_unsafe_assistance", {
      type: "apply_server_classification",
      result,
    }).ok,
    false,
  );
  assert.equal(
    transitionPurchaseStateV1("purchase_available", {
      type: "server_create_payment_session",
    }).errorCode,
    "PAYMENT_NOT_IMPLEMENTED",
  );
  assert.equal(
    transitionPurchaseStateV1("payment_pending", {
      type: "verified_payment_completion",
    }).state,
    "payment_pending",
  );
  const stateSource = readUtf8(protectedCorrectionPaths[1]);
  assert.doesNotMatch(stateSource, /accepted\("payment_completed"\)/u);
  assert.doesNotMatch(stateSource, /\blet\s+(?:state|currentState)\s*=/u);
  assert.doesNotMatch(stateSource, /new Set/u);
});

check("internal API production origin content body allowlist and no-store guards", () => {
  const routeSource = readUtf8(exactScope[3]);
  const baselineRouteSource = git(["show", `${baseline}:${exactScope[3]}`]).stdout;
  const environmentSource = readUtf8(
    "lib/assessment/runtime/environment.ts",
  );
  assert.match(routeSource, /export const runtime = "nodejs"/u);
  assert.match(routeSource, /export const dynamic = "force-dynamic"/u);
  assert.match(routeSource, /isInternalRuntimeAvailable\(\)/u);
  assert.match(environmentSource, /process\.env\.NODE_ENV !== "production"/u);
  assert.match(
    environmentSource,
    /process\.env\.M2_INTERNAL_RUNTIME_ENABLED === "true"/u,
  );
  assert.match(routeSource, /origin !== expectedOrigin/u);
  assert.match(routeSource, /fetchSite !== "same-origin"/u);
  assert.match(routeSource, /JSON_CONTENT_TYPE/u);
  assert.match(routeSource, /MAXIMUM_BODY_BYTES/u);
  assert.match(routeSource, /MAXIMUM_BODY_BYTES = 49_152/u);
  assert.equal(
    routeSource,
    baselineRouteSource.replace(
      "const MAXIMUM_BODY_BYTES = 24_576;",
      "const MAXIMUM_BODY_BYTES = 49_152;",
    ),
  );
  assert.match(routeSource, /Buffer\.byteLength\(rawBody, "utf8"\)/u);
  assert.match(routeSource, /"Cache-Control": "no-store"/u);
  assert.match(routeSource, /"X-Robots-Tag": "noindex, nofollow"/u);
  assert.match(routeSource, /evaluatePrepaymentSafetyV1\(parsed\)/u);
  assert.match(routeSource, /return json\(\{ data:/u);
  assert.match(routeSource, /\}, 200\)/u);
  assert.doesNotMatch(routeSource, /currentSituation|optionalMessage/u);
  assert.doesNotMatch(routeSource, /latestInboundMessage/u);
  assert.doesNotMatch(routeSource, /error\.message|String\(error\)/u);
});

check("internal API and purchase engine import no Provider OpenAI DB or Supabase", () => {
  const source = [
    exactScope[0],
    exactScope[1],
    exactScope[2],
    protectedCorrectionPaths[0],
    protectedCorrectionPaths[1],
    exactScope[3],
  ]
    .map(readUtf8)
    .join("\n");
  const importTargets = [...source.matchAll(/\bfrom\s+["']([^"']+)["']/gu)].map(
    (match) => match[1],
  );
  assert.equal(
    importTargets.some((target) =>
      /(?:openai|supabase|repository|service|pipeline)/iu.test(target),
    ),
    false,
  );
  assert.doesNotMatch(source, /\bfetch\s*\(/u);
  assert.doesNotMatch(source, /\bcreateClient\s*\(/u);
  assert.doesNotMatch(source, /\bnew\s+OpenAI\b/u);
  assert.doesNotMatch(source, /process\.env\.(?:OPENAI|SUPABASE)/u);
});

check("capabilities preserve every no-authority boundary", () => {
  const expected = {
    task_id: "M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P6-I1-R1",
    status:
      "prepayment_safety_engine_precision_corrected_pending_human_chatgpt_review",
    baseline,
    safety_charter_accepted: true,
    two_axis_engine_complete: true,
    server_owned_identity_complete: true,
    purchase_state_machine_complete: true,
    internal_api_complete: true,
    structured_safe_option_cannot_override_unsafe_content: true,
    ambiguous_content_fails_to_clarification: true,
    direct_self_harm_present_form_gap_closed: true,
    generic_stopping_does_not_suppress_current_safety: true,
    local_unsafe_negation_handling_complete: true,
    boundary_source_conflict_detection_complete: true,
    latest_inbound_source_bound_to_identity: true,
    business_scope_content_guard_complete: true,
    scoped_reply_source_guard_complete: true,
    full_semantic_scope_equivalence_claimed: false,
    legacy_safety_classifier_reused_unchanged: false,
    legacy_safety_assets_modified: false,
    payment_authority_issued: false,
    payment_provider_implemented: false,
    ui_implemented: false,
    request_form_connected: false,
    provider_calls: 0,
    db_operations: 0,
    supabase_operations: 0,
    package_e_b_authorized: false,
    package_e_c_authorized: false,
    provider_rerun_authorized: false,
    active_runtime_activated: false,
    package_f_authorized: false,
    r4_authorized: false,
    c2_authorized: false,
    final_jpy980_readiness_established: false,
    next_action:
      "human_chatgpt_review_of_pre_payment_safety_engine_precision_correction",
  };
  for (const [key, value] of Object.entries(expected)) {
    assert.deepEqual(capabilities[key], value, key);
  }
});

check("offline evidence preserves 78/78 and adds R1 30/30 plus decoder 6/6", () => {
  assert.equal(offlineResults.status, "pass");
  assert.equal(offlineResults.baseline, baseline);
  assert.equal(offlineResults.branch, expectedBranch);
  assert.equal(offlineResults.charter_cases.passed, 42);
  assert.equal(offlineResults.charter_cases.total, 42);
  assert.equal(offlineResults.additional_engine_cases.passed, 36);
  assert.equal(offlineResults.additional_engine_cases.total, 36);
  assert.equal(offlineResults.classification_and_state_cases.passed, 78);
  assert.equal(offlineResults.classification_and_state_cases.total, 78);
  assert.equal(offlineResults.r1_precision_cases.passed, 30);
  assert.equal(offlineResults.r1_precision_cases.total, 30);
  assert.ok(offlineResults.r1_precision_cases.total >= 21);
  assert.equal(
    offlineResults.classification_state_and_r1_precision_cases.passed,
    108,
  );
  assert.equal(
    offlineResults.classification_state_and_r1_precision_cases.total,
    108,
  );
  assert.equal(offlineResults.decoder_negative_cases.passed, 15);
  assert.equal(offlineResults.decoder_negative_cases.total, 15);
  assert.equal(offlineResults.r1_decoder_identity_cases.passed, 6);
  assert.equal(offlineResults.r1_decoder_identity_cases.total, 6);
  assert.equal(offlineResults.all_decoder_identity_cases.passed, 21);
  assert.equal(offlineResults.all_decoder_identity_cases.total, 21);
  assert.equal(offlineResults.provider_calls, 0);
  assert.equal(offlineResults.db_operations, 0);
  assert.equal(offlineResults.supabase_operations, 0);
});

check("Decision Policy regression remains PASS 40/40", () => {
  const result = run("node", [
    "evals/quality/m2-p4-i1/verify-decision-policy.mjs",
  ]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /total: 40\/40/u);
  assert.match(result.stdout, /openai_calls: 0/u);
  assert.match(result.stdout, /db_operations: 0/u);
});

check("Active Runtime remains v4 and v12 remains inactive", () => {
  const serviceSource = readUtf8("lib/assessment/runtime/service.ts");
  const catalogSource = readUtf8("lib/assessment/runtime/schema-catalog.ts");
  assert.match(serviceSource, /loadM2P4ProductQualityRuntimeStageCatalog/u);
  assert.doesNotMatch(serviceSource, /v12|V12/u);
  const activeLoader = catalogSource.slice(
    catalogSource.indexOf(
      "export async function loadM2P4ProductQualityRuntimeStageCatalog",
    ),
    catalogSource.indexOf(
      "export async function loadM2P4WritingContextRuntimeStageCatalog",
    ),
  );
  assert.match(activeLoader, /runtime-stage-catalog-v4\.json/u);
  assert.doesNotMatch(activeLoader, /runtime-stage-catalog-v12\.json/u);
  assert.equal(capabilities.active_runtime, "v4");
  assert.equal(capabilities.v12_active, false);
});

check("review artifact separates R1 technical PASS from Human ChatGPT review", () => {
  const review = readUtf8(exactScope[9]);
  assert.match(review, /TECHNICAL/u);
  assert.match(review, /PLAIN-LANGUAGE/u);
  assert.match(review, /Human \/ ChatGPT engine review/u);
  assert.match(review, /pending/u);
  assert.match(review, /42\/42/u);
  assert.match(review, /36\/36/u);
  assert.match(review, /30\/30/u);
  assert.match(review, /6\/6/u);
  assert.match(review, /49,152-byte/u);
  assert.match(review, /full semantic subject equivalence/u);
  assert.match(
    review,
    /prepayment_safety_engine_precision_corrected_pending_human_chatgpt_review/u,
  );
  assert.match(review, /Provider \/ DB \/ Supabase: `0 \/ 0 \/ 0`/u);
});

check("git diff --check PASS", () => {
  const result = git(["diff", "--check"], true);
  assert.equal(result.status, 0, result.stderr || result.stdout);
});

console.log(
  `Pre-payment safety classification engine verifier: PASS ${passCount}/${passCount}`,
);
console.log("Exact correction scope: 10/10 updated only");
console.log("Charter cases: 42/42; additional engine cases: 36/36; total: 78/78");
console.log("R1 precision cases: 30/30 (minimum 21); combined: 108/108");
console.log("Decoder negative cases: 15/15; R1 decoder and identity: 6/6");
console.log("Decision Policy: 40/40");
console.log("Provider / DB / Supabase: 0 / 0 / 0");
console.log("Payment implementation/session/authority: false / false / false");
console.log("Active Runtime: v4; v12 inactive");
console.log("Next action: Human / ChatGPT engine review");
