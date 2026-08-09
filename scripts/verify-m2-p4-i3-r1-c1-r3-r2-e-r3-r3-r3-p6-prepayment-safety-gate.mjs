import assert from "node:assert/strict";
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
const baseline = "ddbea5347d0fb2c1cfacd990e9a7f17acaf53801";
const expectedBranch =
  "fix/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p6-i2-r2-customer-experience";
const expectedMain = "61e33a10e195fad17e253a6b9719217e1992f273";
const exactScope = [
  "components/request/RequestForm.tsx",
  "components/request/PrePaymentSafetyStop.module.css",
  "fixtures/review/prepayment-safety-states.ts",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p6/safety-payment-contract-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p6/safety-payment-cases-v1.json",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p6/visual-review-checklist-v1.md",
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p6/capabilities-v1.json",
  "scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p6-prepayment-safety-gate.mjs",
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R3_P6_REVIEW.md",
];
const legacyComponentPath =
  "components/review/ReviewPurchaseConfirmation.tsx";
const legacyFixturePath = "fixtures/review/purchase-confirmations.ts";
const expectedLegacyComponentBlob =
  "5f77c298639a78d3c9d0d3c7dc987f32f806ae5a";
const expectedLegacyFixtureBlob =
  "ec22a26bd3df38781b029db8e0e646e2d4db8d0d";
const stopComponentPath = "components/request/PrePaymentSafetyStop.tsx";
const expectedStopComponentBlob =
  "2c146a032049dedca3a1547c3bcfc52aa66e1fa5";
const reviewComponentPath =
  "components/review/ReviewPrePaymentSafetyConfirmation.tsx";
const expectedReviewComponentBlob =
  "d96c311af2d18af370238a7a940185e5576b573a";
const contractPath =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p6/safety-payment-contract-v1.json";
const casesPath =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p6/safety-payment-cases-v1.json";
const checklistPath =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p6/visual-review-checklist-v1.md";
const capabilitiesPath =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p6/capabilities-v1.json";
const reviewPath =
  "docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R3_P6_REVIEW.md";

let passed = 0;
const failures = [];

function run(command, args, allowFailure = false) {
  const result = spawnSync(command, args, {
    cwd: repositoryRoot,
    encoding: "utf8",
    shell: false,
  });
  if (!allowFailure && result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `${command} failed`);
  }
  return result;
}

function git(args, allowFailure = false) {
  return run(
    "git",
    ["-c", "safe.directory=C:/projects/moon-reply", ...args],
    allowFailure,
  );
}

function readUtf8(relativePath) {
  return new TextDecoder("utf-8", { fatal: true }).decode(
    fs.readFileSync(path.join(repositoryRoot, relativePath)),
  );
}

function readJson(relativePath) {
  return JSON.parse(readUtf8(relativePath));
}

function normalizePath(value) {
  return value.trim().replaceAll("\\", "/");
}

function currentChangedPaths() {
  const changed = git(["diff", "--name-only", baseline, "--"])
    .stdout.split(/\r?\n/u)
    .map(normalizePath)
    .filter(Boolean);
  const untracked = git(["ls-files", "--others", "--exclude-standard"])
    .stdout.split(/\r?\n/u)
    .map(normalizePath)
    .filter(Boolean);
  return [...new Set([...changed, ...untracked])].sort();
}

function filteredWorktreeBlob(relativePath) {
  return git([
    "hash-object",
    `--path=${relativePath}`,
    relativePath,
  ]).stdout.trim();
}

function check(label, callback) {
  try {
    callback();
    passed += 1;
    console.log(`PASS ${label}`);
  } catch (error) {
    failures.push({ label, error });
    console.error(`FAIL ${label}`);
    console.error(error?.stack ?? error);
  }
}

function deepMerge(base, overrides) {
  const output = structuredClone(base);
  for (const [key, value] of Object.entries(overrides)) {
    if (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      output[key] !== null &&
      typeof output[key] === "object" &&
      !Array.isArray(output[key])
    ) {
      output[key] = deepMerge(output[key], value);
    } else {
      output[key] = structuredClone(value);
    }
  }
  return output;
}

function sliceBetween(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.ok(start >= 0, `missing start marker: ${startMarker}`);
  assert.ok(end > start, `missing end marker: ${endMarker}`);
  return source.slice(start, end);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function assertPresentationBlock(block, expected) {
  for (const property of [
    "scopeLabel",
    "heading",
    "description",
    "draftAvailability",
  ]) {
    assert.match(
      block,
      new RegExp(
        `${property}:\\s*${escapeRegExp(JSON.stringify(expected[property]))}`,
        "u",
      ),
      property,
    );
  }
  const providesBlock = sliceBetween(block, "provides:", "draftAvailability:");
  const actualProvides = [
    ...providesBlock.matchAll(/"(?:\\.|[^"\\])*"/gu),
  ].map((match) => JSON.parse(match[0]));
  assert.deepEqual(actualProvides, expected.provides);
}

function assertOptionBlock(block, expectedOptions) {
  let cursor = 0;
  for (const option of expectedOptions) {
    const marker = `value: ${JSON.stringify(option.value)}`;
    const start = block.indexOf(marker, cursor);
    assert.ok(start >= cursor, option.value);
    const next = block.indexOf("value: ", start + marker.length);
    const optionSource = block.slice(start, next >= 0 ? next : block.length);
    assert.ok(
      optionSource.includes(`label: ${JSON.stringify(option.label)}`),
      option.label,
    );
    if (option.helper) {
      assert.ok(
        optionSource.includes(JSON.stringify(option.helper)),
        option.helper,
      );
    } else {
      assert.doesNotMatch(optionSource, /helper:/u, option.value);
    }
    cursor = start + marker.length;
  }
}

const contract = readJson(contractPath);
const cases = readJson(casesPath);
const capabilities = readJson(capabilitiesPath);
const requestSource = readUtf8("components/request/RequestForm.tsx");
const stopSource = readUtf8("components/request/PrePaymentSafetyStop.tsx");
const styleSource = readUtf8(
  "components/request/PrePaymentSafetyStop.module.css",
);
const reviewSource = readUtf8(
  "components/review/ReviewPrePaymentSafetyConfirmation.tsx",
);
const routeSource = readUtf8(
  "app/review/purchase/safety/[fixtureId]/page.tsx",
);
const fixtureSource = readUtf8(
  "fixtures/review/prepayment-safety-states.ts",
);
const fixtureModuleUrl = pathToFileURL(
  path.join(repositoryRoot, "fixtures/review/prepayment-safety-states.ts"),
).href;
const { PREPAYMENT_SAFETY_REVIEW_FIXTURES } = await import(fixtureModuleUrl);
const presentationExpectations = cases.presentation_expectations;

check("exact branch baseline main and empty stash authority", () => {
  assert.equal(git(["branch", "--show-current"]).stdout.trim(), expectedBranch);
  assert.equal(git(["merge-base", "HEAD", baseline]).stdout.trim(), baseline);
  assert.equal(git(["rev-parse", "main"]).stdout.trim(), expectedMain);
  assert.equal(git(["rev-parse", "origin/main"]).stdout.trim(), expectedMain);
  assert.equal(git(["stash", "list"]).stdout.trim(), "");
  const commitCount = Number(
    git(["rev-list", "--count", `${baseline}..HEAD`]).stdout.trim(),
  );
  assert.ok(commitCount === 0 || commitCount === 1);
  if (commitCount === 1) {
    assert.equal(git(["rev-parse", "HEAD^"]).stdout.trim(), baseline);
  }
});

check("exact R2 customer presentation scope is 9/9 update only", () => {
  assert.deepEqual(currentChangedPaths(), [...exactScope].sort());
  for (const relativePath of exactScope) {
    assert.ok(fs.statSync(path.join(repositoryRoot, relativePath)).isFile());
    assert.equal(
      git(["cat-file", "-e", `${baseline}:${relativePath}`], true).status,
      0,
      `${relativePath} must pre-exist at baseline`,
    );
  }
});

check("strict UTF-8 trailing whitespace U+FFFD and secret material zero", () => {
  const secretPattern =
    /(?:sk-[A-Za-z0-9_-]{20,}|OPENAI_API_KEY\s*=|SUPABASE_SERVICE_ROLE_KEY\s*=)/u;
  for (const relativePath of exactScope) {
    const source = readUtf8(relativePath);
    assert.ok(!source.includes("\uFFFD"), relativePath);
    assert.doesNotMatch(source, /[\t ]+$/mu, relativePath);
    assert.doesNotMatch(source, secretPattern, relativePath);
    if (relativePath.endsWith(".json")) JSON.parse(source);
  }
});

check("legacy M1 purchase review component and fixture blobs are unchanged", () => {
  assert.equal(
    git(["rev-parse", `${baseline}:${legacyComponentPath}`]).stdout.trim(),
    expectedLegacyComponentBlob,
  );
  assert.equal(
    git(["rev-parse", `${baseline}:${legacyFixturePath}`]).stdout.trim(),
    expectedLegacyFixtureBlob,
  );
  assert.equal(
    filteredWorktreeBlob(legacyComponentPath),
    expectedLegacyComponentBlob,
  );
  assert.equal(filteredWorktreeBlob(legacyFixturePath), expectedLegacyFixtureBlob);
  assert.equal(
    filteredWorktreeBlob(stopComponentPath),
    expectedStopComponentBlob,
  );
  assert.equal(
    filteredWorktreeBlob(reviewComponentPath),
    expectedReviewComponentBlob,
  );
});

check("legacy M1 review contract is not imported wrapped or repurposed", () => {
  const combined = `${reviewSource}\n${routeSource}\n${fixtureSource}`;
  assert.doesNotMatch(combined, /ReviewPurchaseConfirmation/u);
  assert.doesNotMatch(combined, /purchase-confirmations/u);
  assert.doesNotMatch(combined, /normal-001/u);
  assert.match(routeSource, /ReviewPrePaymentSafetyConfirmation/u);
  assert.match(routeSource, /prepayment-safety-states/u);
});

check("accepted stop Safety Engine API state machine and Runtime remain unchanged", () => {
  const protectedPaths = [
    stopComponentPath,
    reviewComponentPath,
    "app/review/purchase/safety/[fixtureId]/page.tsx",
    "lib/safety",
    "lib/purchase/prepayment-safety-types-v1.ts",
    "lib/purchase/prepayment-safety-rules-v1.ts",
    "lib/purchase/prepayment-safety-identity-v1.ts",
    "lib/purchase/prepayment-safety-gate-v1.ts",
    "lib/purchase/purchase-state-machine-v1.ts",
    "app/api/internal/purchase-eligibility/route.ts",
    "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p6-i1",
    "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p6-p0",
    "lib/assessment/runtime",
  ];
  assert.equal(
    git(["diff", "--name-only", baseline, "--", ...protectedPaths]).stdout.trim(),
    "",
  );
});

check("RequestForm removes legacy purchase classifier without fallback", () => {
  assert.doesNotMatch(requestSource, /classifySafetyInput/u);
  assert.doesNotMatch(requestSource, /SAFETY_SELECTED_FLAGS/u);
  assert.doesNotMatch(requestSource, /NONE_SAFETY_FLAG/u);
  assert.doesNotMatch(requestSource, /@\/lib\/safety/u);
  assert.doesNotMatch(requestSource, /evaluatePrepaymentSafetyV1/u);
  assert.doesNotMatch(requestSource, /prepayment-safety-rules/u);
  assert.doesNotMatch(requestSource, /prepayment-safety-gate/u);
});

check("RequestForm uses only the internal server-owned eligibility endpoint", () => {
  assert.match(requestSource, /fetch\("\/api\/internal\/purchase-eligibility"/u);
  assert.match(requestSource, /method: "POST"/u);
  assert.match(requestSource, /cache: "no-store"/u);
  assert.match(requestSource, /credentials: "same-origin"/u);
  assert.equal((requestSource.match(/\bfetch\(/gu) ?? []).length, 1);
});

check("free-text inbound outbound relationship and topic mappings are exact", () => {
  const mappings = [
    ["付き合う前", "dating"],
    ["交際中", "in_relationship"],
    ["曖昧な関係", "ambiguous"],
    ["元恋人", "former_partner"],
    ["マッチングアプリ", "matching_app"],
    ["職場・学校・知人", "work_or_school"],
    ["その他", "other"],
    ["送るか待つか決めたい", "decide_send_or_wait"],
    ["この文面がどう届くか知りたい", "message_impact"],
    ["送る文章を整えたい", "draft_message"],
    ["相手との関係を整理したい", "relationship"],
    ["これから3日どう動くか知りたい", "next_three_days"],
    ["不安を整理したい", "organize_emotions"],
  ];
  for (const [label, value] of mappings) {
    assert.ok(requestSource.includes(`label: "${label}", value: "${value}"`));
  }
  assert.match(requestSource, /latestInboundMessage: latestInboundMessage \|\| null/u);
  assert.match(requestSource, /optionalMessage: optionalMessage \|\| null/u);
  assert.doesNotMatch(
    requestSource,
    /latestInboundMessage:\s*\[[^\]]*(?:draftMessage|optionalMessage)/u,
  );
});

check("nine engine states use progressive 5 plus 3 plus urgent presentation", () => {
  assert.ok(
    requestSource.includes(
      `<h2 id="request-phase-2-title">${presentationExpectations.phase_2_title}</h2>`,
    ),
  );
  assert.ok(requestSource.includes(JSON.stringify(presentationExpectations.intro)));
  assert.equal(
    requestSource.split(JSON.stringify(presentationExpectations.intro)).length - 1,
    1,
  );
  assert.ok(
    requestSource.includes(
      `2: ${JSON.stringify(presentationExpectations.phase_2_navigation_label)}`,
    ),
  );
  assert.ok(requestSource.includes(JSON.stringify(presentationExpectations.cta)));
  assert.doesNotMatch(requestSource, /決済前の利用確認|利用確認の結果を見る/u);
  const primaryBlock = sliceBetween(
    requestSource,
    "const primaryContactBoundaryOptions:",
    "const secondaryContactBoundaryOptions:",
  );
  const secondaryBlock = sliceBetween(
    requestSource,
    "const secondaryContactBoundaryOptions:",
    "const urgentSafetyContactBoundaryOption:",
  );
  const urgentBlock = sliceBetween(
    requestSource,
    "const urgentSafetyContactBoundaryOption:",
    "const primaryAssistanceOptions:",
  );
  assert.equal(presentationExpectations.primary_contact_boundaries.length, 5);
  assert.equal(presentationExpectations.secondary_contact_boundaries.length, 3);
  assertOptionBlock(
    primaryBlock,
    presentationExpectations.primary_contact_boundaries,
  );
  assertOptionBlock(
    secondaryBlock,
    presentationExpectations.secondary_contact_boundaries,
  );
  assertOptionBlock(urgentBlock, [presentationExpectations.urgent_safety_entry]);
  assert.doesNotMatch(primaryBlock, /urgent_safety/u);
  assert.doesNotMatch(secondaryBlock, /urgent_safety/u);
  assert.doesNotMatch(urgentBlock, /自傷|自殺|暴力|脅迫/u);
  assert.ok(
    requestSource.includes(presentationExpectations.urgent_safety_entry.summary),
  );
  assert.match(requestSource, /その他の連絡状況はこちら/u);
  assert.doesNotMatch(requestSource, /contactBoundaryOptions\.map/u);

  const primaryGoalBlock = sliceBetween(
    requestSource,
    "const primaryAssistanceOptions:",
    "const secondaryAssistanceOptions:",
  );
  const secondaryGoalBlock = sliceBetween(
    requestSource,
    "const secondaryAssistanceOptions:",
    "const phaseTitles:",
  );
  for (const value of presentationExpectations.primary_assistance_goals) {
    assert.ok(primaryGoalBlock.includes(`value: ${JSON.stringify(value)}`), value);
  }
  for (const value of presentationExpectations.secondary_assistance_goals) {
    assert.ok(secondaryGoalBlock.includes(`value: ${JSON.stringify(value)}`), value);
  }
  assert.match(requestSource, /その他の目的に当てはまる場合/u);
});

check("two-step acknowledgement flow is server re-evaluated", () => {
  assert.match(
    requestSource,
    /scopeAcknowledgements: emptyScopeAcknowledgements/u,
  );
  assert.match(requestSource, /attestationConfirmed: false/u);
  assert.ok(
    (requestSource.match(/requestServerEvaluation\(/gu) ?? []).length >= 5,
  );
  assert.match(
    requestSource,
    /result\.purchaseGateSatisfied[\s\S]{0,120}moveToPhase\(3\)/u,
  );
  assert.match(
    requestSource,
    /handleEmailSubmit[\s\S]{0,1600}requestServerEvaluation\(\)/u,
  );
});

check("bound input mutation clears result and late responses cannot restore it", () => {
  assert.match(requestSource, /requestSequence\.current \+= 1/u);
  assert.match(requestSource, /setSafetyResult\(null\)/u);
  assert.match(requestSource, /setCompletedClassification\(null\)/u);
  assert.match(requestSource, /requestSequence\.current !== sequence/u);
  assert.ok(
    (requestSource.match(/clearServerAssessment\(/gu) ?? []).length >= 7,
  );
  assert.ok(
    (requestSource.match(/resetDependentSafetyAnswers\(/gu) ?? []).length >= 4,
  );
});

check("API unavailable and unexpected responses fail closed with calm local copy", () => {
  assert.match(requestSource, /if \(!response\.ok\) throw/u);
  assert.match(requestSource, /if \(!result\) throw/u);
  assert.match(requestSource, /setGatePrompt\(null\)/u);
  assert.match(requestSource, /setSafetyApiError\(true\)/u);
  assert.match(requestSource, /現在、利用確認を完了できません。/u);
  assert.match(requestSource, /時間を置いてもう一度お試しください。/u);
  assert.doesNotMatch(requestSource, />\s*PREPAYMENT_[A-Z_]+\s*</u);
});

check("pause and boundary Product copy is exact and fixture-identical", () => {
  const expectedPause =
    presentationExpectations.product_presentations.eligible_pause_assessment;
  const expectedBoundary =
    presentationExpectations.product_presentations
      .eligible_boundary_support_only;
  const requestPauseBlock = sliceBetween(
    requestSource,
    "  eligible_pause_assessment: {",
    "  eligible_boundary_support_only: {",
  );
  const requestBoundaryBlock = sliceBetween(
    requestSource,
    "  eligible_boundary_support_only: {",
    "  eligible_scoped_reply: {",
  );
  assertPresentationBlock(requestPauseBlock, expectedPause);
  assertPresentationBlock(requestBoundaryBlock, expectedBoundary);

  for (const [fixtureId, expected] of [
    ["eligible-pause-assessment", expectedPause],
    ["eligible-boundary-support-only", expectedBoundary],
  ]) {
    const fixture = PREPAYMENT_SAFETY_REVIEW_FIXTURES[fixtureId];
    assert.deepEqual(
      {
        scopeLabel: fixture.scopeLabel,
        heading: fixture.heading,
        description: fixture.description,
        provides: fixture.provides,
        draftAvailability: fixture.draftAvailability,
      },
      expected,
      fixtureId,
    );
  }

  assert.match(requestSource, /gatePresentation\.provides\.map/u);
  assert.match(requestSource, /eligibleProvideList/u);
  for (const preservedCopy of [
    "『今は送らない』という判断になり",
    "理由・今の動き方・見直す条件を",
    "相手への連絡文案や再接触方法は提供しません。",
    "相手から届いた最新の文面の用件だけ",
    "明確に許可された実務上の用件だけ",
  ]) {
    assert.ok(requestSource.includes(preservedCopy), preservedCopy);
  }
  assert.doesNotMatch(
    JSON.stringify(expectedPause),
    /(?:返信|返事).*(?:保証|必ず|来る)/u,
  );
});

check("common attestation is exact and remains non-authoritative client input", () => {
  for (const copy of [
    "相手から示された拒否や連絡制限を回避する方法",
    "監視・追跡",
    "脅しや強い圧力を使う方法として",
    "利用しないことを確認します。",
  ]) {
    assert.ok(requestSource.includes(copy), copy);
  }
  assert.doesNotMatch(requestSource, /legal consent|waiver|proof/u);
});

check("all eleven clarification codes have bounded customer handling", () => {
  const codes = [
    "boundary_state_required",
    "boundary_state_conflict",
    "latest_inbound_message_required",
    "unsafe_execution_intent_required",
    "current_safety_status_required",
    "business_permission_required",
    "business_scope_required",
    "reply_invitation_required",
    "reply_scope_required",
    "professional_scope_required",
    "structured_content_conflict",
  ];
  for (const code of codes) assert.ok(requestSource.includes(`"${code}"`), code);
  assert.match(requestSource, /submissionCount: 1/u);
  assert.match(requestSource, /もう少しだけ確認させてください/u);
  assert.match(requestSource, /相手から届いた最新の文面を追加する/u);
  assert.match(requestSource, /一度の確認で解消しなかったため、購入へは進みません/u);
  assert.match(
    requestSource,
    /code !== "boundary_state_conflict"/u,
    "boundary conflicts must not become answerable clarification authority",
  );
  assert.match(requestSource, /連絡状況の選択を見直す/u);
  assert.match(requestSource, /相談文を見直す/u);
});

check("unsafe urgent and professional stop copy is distinct and nonjudgmental", () => {
  for (const copy of [
    "その目的のお手伝いはできません",
    "いまは鑑定より、安全を優先してください",
    "この内容は、月の返事の対応範囲外です",
    "気持ちを整理する相談に切り替える",
    "気持ちの整理だけに切り替える",
    "この画面では決済は発生しません。",
  ]) {
    assert.ok(stopSource.includes(copy), copy);
  }
  assert.doesNotMatch(stopSource, /危険人物|ストーカー|加害者|犯罪者/u);
  const urgentBlock = stopSource.slice(
    stopSource.indexOf("urgent_safety_redirect:"),
    stopSource.indexOf("unsupported_professional_request:"),
  );
  assert.doesNotMatch(urgentBlock, /切り替える/u);
});

check("stop and clarification accessibility focus and semantics are explicit", () => {
  assert.match(stopSource, /headingRef\.current\?\.focus\(\)/u);
  assert.match(stopSource, /kind === "urgent_safety_redirect" \? "alert" : "status"/u);
  assert.match(requestSource, /clarificationHeadingRef\.current\?\.focus\(\)/u);
  assert.match(requestSource, /role="status"/u);
  assert.match(requestSource, /role="alert"/u);
  assert.match(requestSource, /<fieldset[\s\S]*primaryContactBoundaryOptions/u);
  assert.match(requestSource, /<details[\s\S]*その他の連絡状況はこちら/u);
  assert.match(requestSource, /urgentSafetyContactBoundaryOption\.value/u);
  assert.match(styleSource, /:focus-visible/u);
  assert.match(styleSource, /\.choiceLabel/u);
  assert.match(styleSource, /\.choiceHelper/u);
  assert.match(styleSource, /\.secondaryChoices summary:focus-visible/u);
  assert.match(styleSource, /overflow-wrap: anywhere/u);
  assert.match(styleSource, /@media \(max-width: 320px\)/u);
  assert.match(styleSource, /@media \(prefers-reduced-motion: reduce\)/u);
});

check("review fixtures are exact stable allowlisted IDs", () => {
  const expectedIds = [
    "eligible-general",
    "eligible-pause-assessment",
    "eligible-boundary-support-only",
    "eligible-scoped-reply",
    "eligible-business-only",
    "needs-clarification",
    "boundary-state-conflict",
    "blocked-unsafe-assistance",
    "urgent-safety-redirect",
    "unsupported-professional-request",
    "purchase-gate-ready-payment-absent",
  ];
  const actualIds = [
    ...fixtureSource.matchAll(/^  "([a-z0-9-]+)":/gmu),
  ].map((match) => match[1]);
  assert.deepEqual(actualIds, expectedIds);
  for (const id of expectedIds) {
    assert.ok(routeSource.includes("PREPAYMENT_SAFETY_REVIEW_FIXTURES"));
    assert.ok(readUtf8(reviewPath).includes(`/review/purchase/safety/${id}`));
  }
});

check("review primary customer view hides internal codes and isolates metadata", () => {
  assert.doesNotMatch(
    requestSource,
    /\{(?:result|safetyResult|gatePrompt)\??\.classification\}/u,
  );
  assert.doesNotMatch(requestSource, /normal_allowed/u);
  assert.doesNotMatch(reviewSource, /eligibilityInputHash|reasonCodes|outputKinds/u);
  const detailsIndex = reviewSource.indexOf(
    "<details className={styles.reviewDisclosure}>",
  );
  const classificationIndex = reviewSource.indexOf("{classification}");
  assert.ok(detailsIndex >= 0 && classificationIndex > detailsIndex);
});

check("payment confirmation remains disabled and no transaction path exists", () => {
  const combined = `${requestSource}\n${reviewSource}\n${routeSource}`;
  assert.match(combined, /税込980円/u);
  assert.match(combined, /決済機能は現在準備中です/u);
  assert.match(combined, /この画面では料金は発生しません/u);
  assert.match(combined, /disabled/u);
  assert.doesNotMatch(
    combined,
    /(?:stripe|checkout\.sessions|paymentIntent|createPaymentSession|payment_token|fake purchase)/iu,
  );
});

check("Provider DB Supabase external execution remains zero", () => {
  const codeSources = [requestSource, stopSource, reviewSource, routeSource, fixtureSource];
  const combined = codeSources.join("\n");
  assert.doesNotMatch(combined, /from\s+["']openai["']/iu);
  assert.doesNotMatch(combined, /from\s+["']@supabase/u);
  assert.doesNotMatch(combined, /https?:\/\//u);
  assert.equal(contract.external_operations.provider_calls, 0);
  assert.equal(contract.external_operations.db_operations, 0);
  assert.equal(contract.external_operations.supabase_operations, 0);
});

check("contract records exact authority scope flow and review boundary", () => {
  assert.equal(contract.status, capabilities.status);
  assert.equal(
    contract.task_id,
    "M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P6-I2-R2",
  );
  assert.equal(contract.baseline, baseline);
  assert.equal(contract.branch, expectedBranch);
  assert.equal(contract.scope.path_count, 9);
  assert.deepEqual(contract.scope.update_only, exactScope);
  assert.deepEqual(contract.scope.new_only, []);
  assert.equal(contract.authority.classification_owner, "server");
  assert.equal(contract.authority.purchase_gate_owner, "server");
  assert.equal(contract.authority.accepted_p6_i2_head, baseline);
  assert.equal(
    contract.protected_customer_surfaces.stop_component_blob_sha,
    expectedStopComponentBlob,
  );
  assert.equal(
    contract.protected_customer_surfaces.review_component_blob_sha,
    expectedReviewComponentBlob,
  );
  assert.equal(contract.request_flow.phase_2_customer_title, "鑑定前の確認");
  assert.equal(contract.request_flow.phase_2_intro_block_count, 1);
  assert.equal(contract.request_flow.primary_contact_boundary_option_count, 5);
  assert.equal(contract.request_flow.secondary_contact_boundary_option_count, 3);
  assert.equal(contract.request_flow.urgent_safety_entry_separate, true);
  assert.equal(contract.request_flow.customer_cta, "この内容で確認する");
  assert.equal(contract.request_flow.eligible_classification_count, 5);
  assert.equal(contract.request_flow.one_completed_clarification_submission_maximum, 1);
  assert.equal(contract.request_flow.eligibility_hash_stored_or_reused_by_client, false);
  assert.equal(contract.payment.payment_implementation_present, false);
  assert.equal(contract.human_review.phase_1_request_ux, "human_visual_accepted");
  assert.equal(
    contract.human_review.blocked_unsafe_stop,
    "human_visual_accepted",
  );
  assert.equal(contract.human_review.urgent_safety_stop, "human_visual_accepted");
  assert.equal(
    contract.human_review.phase_2_customer_presentation,
    "pending_r2_human_visual_review",
  );
  assert.equal(
    contract.human_review.pause_product_value_presentation,
    "pending_r2_human_visual_review",
  );
  assert.equal(
    contract.human_review.boundary_support_product_value_presentation,
    "pending_r2_human_visual_review",
  );
  assert.equal(
    contract.human_review.p6_i2_overall,
    "pending_human_visual_product_review",
  );
  assert.equal(contract.human_review.package_e_c, "unauthorized");
  assert.equal(contract.human_review.final_jpy980_readiness, false);
});

check("capabilities preserve every no-authority boundary", () => {
  const expected = {
    status:
      "prepayment_safety_customer_experience_refined_pending_r2_human_visual_review",
    baseline,
    safety_engine_accepted: true,
    legacy_m1_purchase_review_asset_preserved: true,
    new_p6_review_component_isolated: true,
    request_form_connected_to_pre_payment_api: true,
    legacy_purchase_safety_classifier_used_by_request_form: false,
    legacy_safety_assets_modified: false,
    eligible_pause_assessment_ui_complete: true,
    eligible_boundary_support_only_ui_complete: true,
    clarification_ui_complete: true,
    unsafe_stop_ui_complete: true,
    urgent_safety_ui_complete: true,
    professional_scope_ui_complete: true,
    review_route_complete: true,
    phase_2_customer_presentation_refined: true,
    progressive_contact_boundary_presentation_complete: true,
    urgent_safety_entry_separated_from_primary_contact_choices: true,
    pause_and_boundary_fixture_copy_matches_request_form: true,
    accepted_phase_1_and_stop_surfaces_unchanged: true,
    payment_provider_implemented: false,
    payment_session_created: false,
    payment_authority_issued: false,
    provider_calls: 0,
    db_operations: 0,
    supabase_operations: 0,
    active_runtime: "v4",
    v12_active: false,
    runtime_activated: false,
    human_visual_product_review_complete: false,
    phase_1_request_ux_status: "human_visual_accepted",
    blocked_unsafe_stop_status: "human_visual_accepted",
    urgent_safety_stop_status: "human_visual_accepted",
    phase_2_customer_presentation_status: "pending_r2_human_visual_review",
    pause_product_value_presentation_status: "pending_r2_human_visual_review",
    boundary_support_product_value_presentation_status:
      "pending_r2_human_visual_review",
    p6_i2_overall_status: "pending_human_visual_product_review",
    package_e_c_authorized: false,
    package_f_authorized: false,
    provider_rerun_authorized: false,
    final_jpy980_readiness_established: false,
    next_action: "r2_human_visual_product_review_of_customer_presentation",
  };
  for (const [key, value] of Object.entries(expected)) {
    assert.deepEqual(capabilities[key], value, key);
  }
});

const gateModuleUrl = pathToFileURL(
  path.join(repositoryRoot, "lib/purchase/prepayment-safety-gate-v1.ts"),
).href;
const { evaluatePrepaymentSafetyV1 } = await import(gateModuleUrl);

check("automated Safety and payment cases execute 20/20", () => {
  assert.equal(
    cases.task_id,
    "M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P6-I2-R2",
  );
  assert.equal(cases.baseline, baseline);
  assert.equal(cases.cases.length, 20);
  for (const testCase of cases.cases) {
    const input = deepMerge(cases.base_input, testCase.input_overrides);
    const before = JSON.stringify(input);
    const result = evaluatePrepaymentSafetyV1(input);
    assert.equal(JSON.stringify(input), before, `${testCase.case_id} mutated input`);
    assert.equal(
      result.classification,
      testCase.expected_classification,
      testCase.case_id,
    );
    assert.equal(
      result.purchaseGateSatisfied,
      testCase.expected_purchase_gate_satisfied,
      testCase.case_id,
    );
    if (testCase.expected_clarification_codes) {
      assert.deepEqual(
        result.requiredClarificationCodes,
        testCase.expected_clarification_codes,
        testCase.case_id,
      );
    }
    if (testCase.expected_acknowledgement_codes) {
      assert.deepEqual(
        result.requiredAcknowledgementCodes,
        testCase.expected_acknowledgement_codes,
        testCase.case_id,
      );
    }
    assert.equal(result.paymentImplementationPresent, false, testCase.case_id);
    assert.equal(result.paymentSessionAvailable, false, testCase.case_id);
    assert.equal(result.paymentAuthorityIssued, false, testCase.case_id);
  }
});

check("material input mutation changes server identity and client invalidates it", () => {
  const firstInput = deepMerge(cases.base_input, {
    attestationConfirmed: true,
  });
  const secondInput = deepMerge(firstInput, {
    currentSituation: "状況と気持ちを、今夜あらためて整理したいです。",
  });
  const first = evaluatePrepaymentSafetyV1(firstInput);
  const second = evaluatePrepaymentSafetyV1(secondInput);
  assert.equal(first.purchaseGateSatisfied, true);
  assert.equal(second.purchaseGateSatisfied, true);
  assert.notEqual(first.eligibilityInputHash, second.eligibilityInputHash);
  assert.match(requestSource, /field === "currentSituation"[\s\S]{0,180}resetDependentSafetyAnswers\(\)/u);
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

check("Human review evidence records accepted locks and R2 pending states", () => {
  const checklist = readUtf8(checklistPath);
  const review = readUtf8(reviewPath);
  for (const marker of [
    "Desktop width",
    "399px",
    "320px",
    "Keyboard only",
    "Visible focus",
    "Screen reader names",
    "200% zoom",
    "Reduced motion",
    "A.",
    "B.",
    "C.",
    "D.",
    "E.",
    "F.",
    "G.",
    "H.",
    "I.",
    "J.",
    "Phase 1 Request UX: `human_visual_accepted`",
    "Blocked unsafe stop: `human_visual_accepted`",
    "Urgent Safety stop: `human_visual_accepted`",
    "Phase 2 customer presentation: `pending_r2_human_visual_review`",
    "Pause Product value presentation: `pending_r2_human_visual_review`",
    "Boundary-support Product value presentation: `pending_r2_human_visual_review`",
    "P6-I2 overall: `pending_human_visual_product_review`",
    "Package E-C: `unauthorized`",
    "Final JPY980 readiness: `false`",
  ]) {
    assert.ok(checklist.includes(marker), marker);
  }
  assert.match(review, /## TECHNICAL/u);
  assert.match(review, /## PLAIN-LANGUAGE/u);
  assert.match(review, /pending_r2_human_visual_review/u);
  assert.match(review, /pending_human_visual_product_review/u);
  assert.match(review, /Final JPY980 readiness: `false`/u);
  assert.match(review, /Provider \/ DB \/ Supabase operations are `0 \/ 0 \/ 0`/u);
});

check("git diff check passes", () => {
  const result = git(["diff", "--check"], true);
  assert.equal(result.status, 0, result.stderr || result.stdout);
});

const total = passed + failures.length;
if (failures.length > 0) {
  console.error(
    `Pre-payment Safety UX gate verifier: FAIL ${passed}/${total}`,
  );
  console.error(
    `Failed checks: ${failures.map((failure) => failure.label).join("; ")}`,
  );
  process.exitCode = 1;
} else {
  console.log(`Pre-payment Safety UX gate verifier: PASS ${passed}/${total}`);
  console.log("Exact R2 scope: 9/9 update only");
  console.log("Automated Safety/payment cases: 20/20");
  console.log("Legacy M1 review blobs: 2/2 unchanged");
  console.log("Provider / DB / Supabase: 0 / 0 / 0");
  console.log("Payment implementation/session/authority: false / false / false");
  console.log("Active Runtime: v4; v12 inactive");
  console.log("R2 Human visual/Product review: pending");
}
