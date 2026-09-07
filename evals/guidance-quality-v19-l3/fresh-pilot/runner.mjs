// Fresh evaluation profile only. The existing executeSession/Application,
// EvaluationTransport, live sender, reservation ledger and renderer are reused.
import fs from "node:fs";
import path from "node:path";
import { parseEnv, isDeepStrictEqual } from "node:util";
import { createHash, randomInt, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadM2P4FinalProductRecoveryRuntimeStageCatalog } from "../../../lib/assessment/runtime/schema-catalog.ts";
import { loadV19L3StageCatalog } from "../../../lib/assessment/runtime/v19-l3-stage-catalog.ts";
import { projectBaseProviderInputV1 } from "../../../lib/assessment/runtime/base-structured-intake-grounding-v1.ts";
import { PilotStop, ReservationLedger, hash, reserveNanos } from "../../guidance-quality-wave1/real-pilot/budget.mjs";
import { durableJson } from "../../guidance-quality-wave1/real-pilot/transport.mjs";
import { executeSession, acquireOneShotLock, createLiveSender } from "../../guidance-quality-wave1/real-pilot/runner.mjs";
import { reviewReceipt } from "../../guidance-quality-v19-l1/real-pilot.mjs";
import { SessionLedger, assertNoRawActionConsistency } from "./stop-policy.mjs";
import { writeFreshBlindArtifacts } from "./review.mjs";

export const IMPLEMENTATION_HEAD = "cc899b92e94e26b71d83eae3a747f0b849874ddc";
export const EXECUTION_HEAD = "b62e1a9ac3794344925e2fef8d1fed71c99fb48f";
export const RUN_NAME = "2026-09-08-fresh-01";
export const CASES = ["GQ-05", "GQ-24", "GQ-13", "GQ-29-P3"];
const arms = ["current-v17", "candidate-v19-l3"];
const root = fileURLToPath(new URL("../../../", import.meta.url));
const entry = "evals/guidance-quality-v19-l3/fresh-pilot/";
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
const git = args => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
const sha = file => createHash("sha256").update(fs.readFileSync(path.join(root, file))).digest("hex");
const check = (condition, code) => { if (!condition) throw new PilotStop(code); };
const profileFiles = ["runner.mjs", "stop-policy.mjs", "review.mjs", "verify.mjs", "verification.json", "pricing.json", "authorization.md", ".gitattributes"].map(file => entry + file);
const reusedFiles = ["evals/guidance-quality-wave1/real-pilot/runner.mjs", "evals/guidance-quality-wave1/real-pilot/transport.mjs",
  "evals/guidance-quality-wave1/real-pilot/budget.mjs", "evals/guidance-quality-wave1/real-pilot/review.mjs", "evals/guidance-quality-v19-l1/real-pilot.mjs",
  "evals/guidance-quality-wave1/pilot-inputs.json", "evals/guidance-quality-v19-l2/pilot-plan.json", "evals/guidance-quality-v19-l3/catalog-identity.json"];

export function catalogIdentity(catalog) {
  return { catalogVersion: catalog.catalogVersion, promptBundleVersion: catalog.promptBundleVersion, schemaSetVersion: catalog.schemaSetVersion,
    definitions: catalog.definitions.map(({ stageId, promptVersion, promptHash, schemaVersion, schemaHash, schemaName }) =>
      ({ stageId, promptVersion, promptHash, schemaVersion, schemaHash, schemaName })) };
}

function verifyHistoricalBytes() {
  const old = read("evals/guidance-quality-v19-l3/preservation-manifest.json").hashes;
  const lastRun = "evals/guidance-quality-v19-l3/runs/2026-09-08-gq29-p3-targeted/";
  const recent = read(lastRun + "evidence-hashes.json").files;
  for (const [file, expected] of [...Object.entries(old), ...Object.entries(recent).map(([f,h]) => [lastRun + f,h])]) check(sha(file) === expected, "HISTORICAL_EVIDENCE_CHANGED");
  return Object.keys(old).length + Object.keys(recent).length;
}

export async function loadFreshConfiguration({ requireVerification = true } = {}) {
  check(path.resolve(process.cwd()) === path.resolve(root), "WRONG_CHECKOUT");
  check(git(["rev-parse", "HEAD"]) === EXECUTION_HEAD && git(["branch", "--show-current"]) === "release/private-ready", "AUTHORIZED_EXECUTION_HEAD_MISMATCH");
  git(["merge-base", "--is-ancestor", IMPLEMENTATION_HEAD, "HEAD"]);
  const evidenceCommitFiles = git(["diff", "--name-only", IMPLEMENTATION_HEAD, "HEAD"]).split("\n").filter(Boolean);
  check(evidenceCommitFiles.every(p => p.startsWith("evals/guidance-quality-v19-l3/targeted/") || p.startsWith("evals/guidance-quality-v19-l3/runs/2026-09-08-gq29-p3-targeted/") || p === "evals/guidance-quality-v19-l3/.gitattributes"), "CANDIDATE_IMPLEMENTATION_CHANGED");
  check(!git(["diff", "--name-only", "HEAD"]), "TRACKED_SOURCE_CHANGED");
  check(git(["ls-files", "--others", "--exclude-standard"]).split("\n").filter(Boolean).every(p => profileFiles.includes(p)), "UNAUTHORIZED_PROFILE_CHANGE");
  const historyFilesVerified = verifyHistoricalBytes();
  const prepared = read("evals/guidance-quality-v19-l2/pilot-plan.json"), inputs = read(prepared.inputSource);
  check(hash(fs.readFileSync(path.join(root, prepared.inputSource), "utf8").replaceAll("\r\n", "\n")) === prepared.inputSourceSha256, "FIXED_INPUT_IDENTITY_MISMATCH");
  check(isDeepStrictEqual(inputs.cases.map(c => c.id), CASES), "WRONG_CASE_OR_INPUT");
  check(inputs.cases.every(c => c.input.optionalMessage === null && isDeepStrictEqual(Object.keys(c.input).sort(), ["currentSituation", "optionalMessage", "relationship", "requestedTopics"])), "WRONG_CASE_OR_INPUT");
  const catalogs = { "current-v17": await loadM2P4FinalProductRecoveryRuntimeStageCatalog(), "candidate-v19-l3": await loadV19L3StageCatalog() };
  const baseline = catalogIdentity(catalogs[arms[0]]), candidate = catalogIdentity(catalogs[arms[1]]);
  check(baseline.catalogVersion === "runtime-stage-catalog-v17.0.0", "BASELINE_VERSION_MISMATCH");
  check(isDeepStrictEqual(candidate, catalogIdentity(read("evals/guidance-quality-v19-l3/catalog-identity.json"))) && candidate.catalogVersion === "runtime-stage-catalog-v21.0.0" && candidate.promptBundleVersion === "prompt-bundle-runtime-v21.0.0" && candidate.schemaSetVersion === "pipeline-schema-runtime-v6.0.0", "CANDIDATE_VERSION_HASH_MISMATCH");
  const prices = read(entry + "pricing.json");
  check(prices.model === "gpt-5.6-luna" && prices.serviceTier === "default" && isDeepStrictEqual(prices.perMillionTokens, prepared.prices.perMillionTokens), "PRICING_ACCOUNTING_MISMATCH");
  check(Date.now() - Date.parse(prices.verifiedAt) >= 0 && Date.now() - Date.parse(prices.verifiedAt) < 24 * 3600000, "PRICING_VERIFICATION_STALE");
  if (requireVerification) {
    const verification = read(entry + "verification.json");
    check(verification.pass === true && verification.realApiCalls === 0 && Object.keys(verification.sourceHashes).length >= 7, "LOCAL_VERIFICATION_REQUIRED");
    for (const [file, expected] of Object.entries(verification.sourceHashes)) check(sha(file) === expected, "VERIFIED_SOURCE_CHANGED");
  }
  const plan = { model: "gpt-5.6-luna", maxTotalSessions: 8, maxHttpAttempts: 72, proposedBudgetUsd: 2,
    generation: structuredClone(prepared.generation), tokenCapsProposal: structuredClone(prepared.tokenCapsProposal),
    executionOrder: prepared.executionOrder.map(([id,arm]) => [id, arm === "current-v17" ? arm : "candidate-v19-l3"]),
    maximumClarificationAnswers: 0, transportRetries: 0, applicationProviderRetries: 0, attempt3: 0, additionalSamples: 0, samplesPerArmCase: 1,
    productGenerationAttempts: 2, stoppedSessionRepair: 0, prices,
    knownF007: "OPEN; a stopped contradiction never reaches repair or exhaustion. A pilot result cannot resolve F007." };
  check(plan.tokenCapsProposal.reduce((n,c) => n + c.invocationsPerSession, 0) * 8 === 72, "HTTP_CAP_MISMATCH");
  check(plan.tokenCapsProposal.reduce((n,c) => n + reserveNanos(c) * c.invocationsPerSession, 0) * 8 === 1533011200, "BUDGET_RESERVATION_MISMATCH");
  return { plan, inputs, catalogs, runName: RUN_NAME, candidateArm: arms[1], executionHead: EXECUTION_HEAD,
    runtimeProof: { implementationHead: IMPLEMENTATION_HEAD, executionHead: EXECUTION_HEAD, evidenceOnlyCommitFiles: evidenceCommitFiles.length,
      implementationChanges: 0, baseline, candidate, historicalFileBytesVerified: historyFilesVerified },
    evaluationSourceHashes: Object.fromEntries([...profileFiles, ...reusedFiles].filter(f => fs.existsSync(path.join(root,f))).map(f => [f,sha(f)])) };
}

export function createManifest(config) {
  const mapping = Object.fromEntries(CASES.map(id => [id, randomInt(2) ? { A: arms[0], B: arms[1] } : { A: arms[1], B: arms[0] }]));
  const sessions = config.plan.executionOrder.map(([caseId, arm]) => ({ sessionId: randomUUID(), caseId, arm, anonymousVariantId: Object.entries(mapping[caseId]).find(([,a]) => a === arm)[0] }));
  const sealedMapping = { disclosureStatus: "HUMAN_REVIEW_PENDING_DO_NOT_DISPLAY", mapping };
  const manifest = { schemaVersion: "guidance-fresh-session-isolation-v1", createdAt: new Date().toISOString(), runName: config.runName,
    executionHead: config.executionHead, runtimeProof: config.runtimeProof, inputHash: hash(config.inputs), planHash: hash(config.plan), mappingHash: hash(sealedMapping),
    evaluationSourceHashes: config.evaluationSourceHashes, model: "gpt-5.6-luna", caps: config.plan.tokenCapsProposal, maxHttpAttempts: 72, budgetNanos: 2e9,
    generation: config.plan.generation, prices: config.plan.prices, sessions,
    catalogs: Object.fromEntries(arms.map(arm => [arm, catalogIdentity(config.catalogs[arm])])),
    authorization: "Fresh synthetic 4x2; quality/model-output failure stops only its session; identity/input/mapping/budget/infrastructure failures stop the pilot",
    clarificationAnswers: 0, httpRetries: 0, attempt3: 0, additionalSamples: 0, stoppedSessionRepairs: 0 };
  validateManifest(config, manifest, sealedMapping); return { manifest, sealedMapping };
}

export function validateManifest(config, manifest, sealedMapping) {
  check(hash(config.inputs) === hash(read("evals/guidance-quality-wave1/pilot-inputs.json")) && manifest.inputHash === hash(config.inputs), "WRONG_CASE_OR_INPUT");
  check(manifest.planHash === hash(config.plan) && manifest.model === "gpt-5.6-luna" && config.plan.model === manifest.model && manifest.maxHttpAttempts === 72 && manifest.budgetNanos === 2e9 && isDeepStrictEqual(manifest.caps, config.plan.tokenCapsProposal), "EXPERIMENT_CONTRACT_MISMATCH");
  check(manifest.mappingHash === hash(sealedMapping) && sealedMapping.disclosureStatus === "HUMAN_REVIEW_PENDING_DO_NOT_DISPLAY" && isDeepStrictEqual(Object.keys(sealedMapping.mapping), CASES), "BLIND_MAPPING_CORRUPTION");
  check(manifest.sessions.length === 8 && new Set(manifest.sessions.map(s => s.sessionId)).size === 8, "SESSION_IDENTITY_MISMATCH");
  check(isDeepStrictEqual(manifest.sessions.map(s => [s.caseId,s.arm]), config.plan.executionOrder), "SESSION_ORDER_MISMATCH");
  for (const id of CASES) {
    const map = sealedMapping.mapping[id];
    check(isDeepStrictEqual(Object.keys(map), ["A", "B"]) && isDeepStrictEqual(Object.values(map).sort(), [...arms].sort()), "BLIND_MAPPING_CORRUPTION");
    for (const variant of ["A", "B"]) check(manifest.sessions.filter(s => s.caseId === id && s.anonymousVariantId === variant && s.arm === map[variant]).length === 1, "BLIND_MAPPING_CORRUPTION");
  }
  for (const arm of arms) check(isDeepStrictEqual(manifest.catalogs[arm], catalogIdentity(config.catalogs[arm])), "CANDIDATE_VERSION_HASH_MISMATCH");
  check(manifest.generation.reasoningEffort === "low" && manifest.generation.serviceTier === "default" && isDeepStrictEqual(manifest.generation, config.plan.generation), "GENERATION_SETTINGS_MISMATCH");
}

function sourceGuard(config) {
  check(git(["rev-parse", "HEAD"]) === config.executionHead && !git(["diff", "--name-only", "HEAD"]), "EXECUTION_SOURCE_CHANGED");
  for (const [file,expected] of Object.entries(config.evaluationSourceHashes)) check(sha(file) === expected, "EVALUATION_SOURCE_CHANGED");
}

function evidenceIndex(session, record, directory, scoped) {
  const receipts = fs.readdirSync(directory).filter(f => f.endsWith("-response.json")).map(file => ({ file, ...JSON.parse(fs.readFileSync(path.join(directory,file),"utf8")) }));
  const requests = fs.readdirSync(directory).filter(f => f.endsWith("-request.json")).map(file => ({ file, ...JSON.parse(fs.readFileSync(path.join(directory,file),"utf8")) }));
  const parsed = receipt => { try { return JSON.parse(receipt.outputText); } catch { return null; } };
  const timeline = receipts.map(r => ({ stageId: r.stageId, attempt: r.attempt, rawReceipt: r.file, parsedOutput: parsed(r), usage: r.usage }));
  const pb05s = requests.filter(q => q.stageId === "PB-05").map(q => ({ attempt: q.attempt,
    inputFacts: q.input.base_structured_intake?.observed_facts ?? null,
    report: timeline.find(t => t.stageId === "PB-05" && t.attempt === q.attempt)?.parsedOutput ?? null,
    pb06: timeline.find(t => t.stageId === "PB-06" && t.attempt === q.attempt)?.parsedOutput ?? null }));
  return { caseId: session.caseId, anonymousVariantId: session.anonymousVariantId, actualRuntimeVersion: record.actualRuntimeVersion,
    timeline, inputSufficiencyDisposition: record.entryDisposition, finalDisposition: record.finalDeliveryDisposition,
    initialDirection: record.initialDirection, reassessment: record.reassessment, findings: record.findings,
    sessionStopReason: scoped.sessionStopReason ?? null, stopRecords: scoped.stopRecords, inputFactToReportToEvaluator: pb05s,
    renderedEvidence: "See new run blind-review.html and blind-review.md, corresponding case and anonymous ID; stopped raw reports are internal only",
    cost: record.costRecords, errorCode: record.errorCode };
}

export async function runFresh({ config, directory, send, inspect }) {
  check(typeof inspect === "function" && typeof send === "function", "EVALUATION_DEPENDENCY_MISSING");
  check(!fs.existsSync(directory), "ONE_SHOT_RUN_ALREADY_EXISTS");
  const { manifest, sealedMapping } = createManifest(config);
  sourceGuard(config);
  fs.mkdirSync(directory, { recursive: true }); acquireOneShotLock(directory);
  // New-run-only attributes preserve receipt bytes without global Git changes.
  fs.writeFileSync(path.join(directory,".gitattributes"), "* -text\n", { flag: "wx" });
  const internal = path.join(directory,"internal"); fs.mkdirSync(internal);
  durableJson(path.join(internal,"mapping-SEALED-until-human-review.json"), sealedMapping);
  durableJson(path.join(internal,"manifest.json"), manifest);
  const ledger = new ReservationLedger(path.join(internal,"reservations.jsonl"), manifest, { create: true });
  const records = [], scopedStops = [];
  const guard = () => {
    sourceGuard(config);
    const diskManifest = JSON.parse(fs.readFileSync(path.join(internal,"manifest.json"),"utf8"));
    const diskMapping = JSON.parse(fs.readFileSync(path.join(internal,"mapping-SEALED-until-human-review.json"),"utf8"));
    validateManifest(config, diskManifest, diskMapping);
    check(hash(diskManifest) === hash(manifest), "MANIFEST_IDENTITY_MISMATCH");
    const diskLedger = new ReservationLedger(path.join(internal,"reservations.jsonl"),manifest);
    check(diskLedger.events.at(-1)?.checksum === ledger.events.at(-1)?.checksum && isDeepStrictEqual(diskLedger.summary(),ledger.summary()), "BUDGET_LEDGER_ACCOUNTING_MISMATCH");
  };
  try {
    for (const session of manifest.sessions) {
      if (ledger.stopReason) break;
      guard();
      const sessionDirectory = path.join(internal,session.sessionId); fs.mkdirSync(sessionDirectory);
      const catalog = config.catalogs[session.arm], input = config.inputs.cases.find(c => c.id === session.caseId).input;
      const scoped = new SessionLedger(ledger,{ sessionId: session.sessionId, definitions: catalog.definitions });
      const record = await executeSession({ session, catalog, input, directory: sessionDirectory, ledger: scoped,
        frozenNow: config.plan.generation.frozenApplicationNow,
        send: async (body, mark) => {
          guard();
          const definition = catalog.definitions.find(d => d.schemaName === body.text?.format?.name);
          check(definition && body.model === "gpt-5.6-luna" && body.service_tier === "default" && body.reasoning?.effort === "low", "REQUEST_IDENTITY_MISMATCH");
          if (definition.stageId === "PB-01") check(isDeepStrictEqual(JSON.parse(body.input[1].content[0].text), { run_mode: "initial_base", base_provider_input: projectBaseProviderInputV1(input) }), "WRONG_CASE_OR_INPUT");
          const response = await send(body,mark); scoped.noteResponse(body,response); return response;
        },
        reviewReceipt: async receipt => { assertNoRawActionConsistency(receipt); await inspect(receipt); } });
      records.push(record); scopedStops.push(...scoped.stopRecords);
      check(record.repository.actualDatabaseCalls === 0, "UNINTENDED_DATABASE_ACTIVITY");
      if (scoped.sessionStopReason) {
        const stoppedAt = scoped.stopRecords.find(s => s.scope === "session")?.provenance?.reservationSequence;
        check(record.errorCode && record.finalDeliveryDisposition !== "ready_local_only" &&
          (!stoppedAt || !ledger.calls.some(c => c.sessionId === session.sessionId && c.sequence > stoppedAt)), "STOPPED_SESSION_REPAIR_OR_DELIVERY");
      }
      durableJson(path.join(sessionDirectory,"evidence-index.json"), evidenceIndex(session,record,sessionDirectory,scoped));
      console.log(JSON.stringify({ sessionsAttempted: records.length, slots: 8, httpCalls: ledger.summary().actualHttpCalls, sessionStops: records.filter(r => r.errorCode).length, globalStop: Boolean(ledger.stopReason) }));
    }
  } catch (error) { ledger.stop(error.safeCode ?? "EVALUATION_RUNNER_INTEGRITY_FAILURE"); }
  try {
    guard();
    const reloaded = new ReservationLedger(path.join(internal,"reservations.jsonl"),manifest);
    check(isDeepStrictEqual(reloaded.summary(),ledger.summary()), "BUDGET_LEDGER_ACCOUNTING_MISMATCH");
    check(records.reduce((n,r) => n + r.actualHttpCalls,0) === ledger.summary().actualHttpCalls, "HTTP_ACCOUNTING_MISMATCH");
  } catch (error) { ledger.stop(error.safeCode ?? "POSTFLIGHT_INTEGRITY_FAILURE"); }
  const stats = ledger.summary(), ready = records.filter(r => r.finalDeliveryDisposition === "ready_local_only").length;
  const clarification = records.filter(r => !r.errorCode && r.finalOutput?.clarification?.question).length;
  const summary = { schemaVersion: "guidance-fresh-anonymous-technical-summary-v1", totalSlots: 8, attemptedSessions: records.length,
    completedAnswers: ready, clarifications: clarification, stoppedSessions: records.length - ready - clarification, notStarted: 8 - records.length,
    httpCalls: stats.actualHttpCalls, maximumHttpCalls: 72, reservedUsd: stats.reservedUsd, hardCapUsd: 2,
    inputTokens: stats.inputTokens, outputTokensIncludingReasoning: stats.outputTokens, reasoningTokensIncluded: stats.reasoningTokens, cachedInputTokens: stats.cachedTokens,
    usagePricedUsdLower: stats.usageBasedCostLowerUsd, usagePricedUsdUpper: stats.usageBasedCostUpperUsd, completeCacheWriteUsage: stats.completeCacheWriteUsage,
    unknownUsageCalls: stats.unknownUsageCalls, globalStop: ledger.stopReason,
    sessionStopReasons: scopedStops.filter(s => s.scope === "session").reduce((acc,s) => ({...acc,[s.reason]:(acc[s.reason]??0)+1}),{}),
    findings: records.flatMap(r => r.findings.filter(f => f.stopReason).map(f => ({ stageId:f.stageId, reason:f.stopReason, count:f.findings?.length ?? 0 }))),
    reassessmentSessions: records.filter(r => r.reassessment.length > 0).length,
    retries: 0, clarificationAnswers: 0, attempt3: 0, additionalSamples: 0, stoppedSessionRepairs: 0,
    humanReview: "PENDING_MAPPING_NOT_DISCLOSED", F007: "OPEN", actualDatabaseCalls: 0, actualEmailCalls: 0, productionChanges: 0, push: 0, deploy: 0 };
  durableJson(path.join(internal,"stop-events.json"),scopedStops);
  try { await writeFreshBlindArtifacts({ runDirectory:directory,inputs:config.inputs,records,summary }); }
  catch (error) {
    ledger.stop(error.safeCode ?? "BLIND_RENDERER_INTEGRITY_FAILURE");
    summary.globalStop = ledger.stopReason;
    summary.blindArtifactAvailable = false;
  }
  durableJson(path.join(directory,"technical-summary.json"),summary);
  durableJson(path.join(directory,"human-review-status.json"),{status:"PENDING",answers:null,mappingDisclosed:false});
  return {runDirectory:directory,summary,records};
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  if (process.argv.length !== 3 || process.argv[2] !== "--execute-human-authorized-fresh-eight") { console.error("Exact authorization flag required; no API invoked."); process.exitCode = 1; }
  else try {
    const config = await loadFreshConfiguration();
    const knownEnv = path.join(root,".env.local");
    const key = process.env.GUIDANCE_PILOT_OPENAI_API_KEY || process.env.OPENAI_API_KEY || (fs.existsSync(knownEnv) ? parseEnv(fs.readFileSync(knownEnv,"utf8")).OPENAI_API_KEY : null);
    check(Boolean(key),"LOCAL_OPENAI_KEY_MISSING");
    const result = await runFresh({ config, directory:path.join(root,"evals/blind-runs",RUN_NAME), send:createLiveSender(key), inspect:reviewReceipt });
    console.log(JSON.stringify({artifact:`evals/blind-runs/${RUN_NAME}/blind-review.html`,...result.summary}));
  } catch (error) { console.error(JSON.stringify({globalStop:true,reason:error.safeCode??"FRESH_RUNNER_FAILURE",mappingDisclosed:false})); process.exitCode = 1; }
}
