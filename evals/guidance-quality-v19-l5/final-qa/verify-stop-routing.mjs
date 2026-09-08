// Evaluation-only regression tests. All sends are authored fake receipts.
// Real stage capture and the unchanged Applications run locally; no Provider,
// credential, historical run mutation, or new generation input is used.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { executeFinalBatch, validateFinalStageOutput } from './runner.mjs';
import { loadV19L5StageCatalog } from '../../../lib/assessment/runtime/v19-l5-stage-catalog.ts';
import { loadM2P4FinalProductRecoveryRuntimeStageCatalog } from '../../../lib/assessment/runtime/schema-catalog.ts';
import { createRepairFixture, validationPass, assertSeedUnchanged } from '../repair-fixtures.mjs';

const root = 'evals/guidance-quality-v19-l5';
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const sha = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const clone = value => structuredClone(value);
const inputs = read(`${root}/final-qa/inputs.json`);
const plan = read(`${root}/final-qa/plan.json`);
const cases = read(`${root}/expected-dispositions.json`).cases.map(c => ({ id: c.caseId, label: c.label, consultation: c.consultation, input: c.input }));
const protectedFiles = [`${root}/final-qa/inputs.json`, `${root}/expected-dispositions.json`, `${root}/final-qa-acceptance.md`,
  `${root}/final-qa/plan.json`, `${root}/candidate-identity.json`, `${root}/final-qa/review.mjs`];
const protectedHashes = Object.fromEntries(protectedFiles.map(file => [file, sha(file)]));
const fixture = createRepairFixture({ clean: true });
const targetCase = 'GQ-29-P3';
assert.deepEqual(fixture.request, inputs.cases.find(c => c.id === targetCase).input, 'offline structural fixture must use this exact fixed input');
const previousFetch = globalThis.fetch;
let networkAttempts = 0;
globalThis.fetch = async () => { networkAttempts++; throw Error('STOP_ROUTING_TEST_NETWORK_FORBIDDEN'); };
const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'moon-reply-stop-routing-'));
const results = [], sessionRuns = [], globalRuns = [];
let runNumber = 0;

try {
  const catalogs = { V17: await loadM2P4FinalProductRecoveryRuntimeStageCatalog(), 'V19-L5': await loadV19L5StageCatalog() };
  const stageFromBody = body => {
    const found = Object.values(catalogs).flatMap(c => c.definitions).find(d => d.schemaName === body.text.format.name);
    assert.ok(found, 'request must use a known fixed stage contract');
    return found.stageId;
  };
  const payload = body => JSON.parse(body.input[1].content[0].text);
  const receipt = (body, output, id) => ({ id: `authored-fake-${id}`, model: body.model, service_tier: 'default', status: 'completed',
    output_text: JSON.stringify(output), usage: { input_tokens: 100, output_tokens: 10, total_tokens: 110,
      input_tokens_details: { cached_tokens: 0, cache_write_tokens: 0 }, output_tokens_details: { reasoning_tokens: 0 } } });
  function stageOutput(body, session) {
    const stage = stageFromBody(body), q = payload(body), candidate = session.arm === 'V19-L5';
    if (stage === 'PB-01') return candidate ? { schema_version: 'v19-l5-base-intent-v1', base_intake: clone(fixture.base),
      request_intent: { message_task: 'NONE', decision_requested: true, decision_explicitly_excluded: false,
        communication_purpose: 'OTHER', evidence_fact_ids: ['F305'], source_excerpt: q.base_provider_input.current_situation } } : clone(fixture.base);
    if (stage === 'PB-02') return clone(fixture.outputSequence[stage][0]);
    if (stage === 'PB-03') return { schema_version: 'pipeline-schema-v3.0.0', acknowledged_eligibility: clone(q.application_eligibility_expectation) };
    if (stage === 'PB-04') return candidate ? { schema_version: 'v19-l5-plan-v1', answer_mode: 'decision_guidance', decision_plan: clone(fixture.plan), message_plan: null } : clone(fixture.plan);
    if (stage === 'PB-05') return candidate ? { schema_version: 'v19-l5-report-v1', answer_mode: 'decision_guidance', report_content: clone(fixture.report), message_content: null } : clone(fixture.report);
    if (stage === 'PB-06') {
      const output = validationPass();
      if (!candidate) { output.schema_version = 'pipeline-schema-v1.0.0'; delete output.report_fact_repair_verification; }
      return output;
    }
    throw Error(`UNEXPECTED_AUTHORED_STAGE_${stage}`);
  }

  async function batch(name, options = {}) {
    const directory = path.join(temporaryRoot, `${++runNumber}-${name}`), calls = [];
    const selectedPlan = clone(plan), selectedInputs = clone(inputs), selectedCases = clone(cases), selectedCatalogs = clone(catalogs);
    const state = { directory, calls, plan: selectedPlan, inputs: selectedInputs, cases: selectedCases, catalogs: selectedCatalogs };
    options.configure?.(state);
    const send = async (body, dispatch, context) => {
      const stage = stageFromBody(body), { session, attempt } = context;
      options.beforeDispatch?.({ ...state, body, session, stage, attempt });
      dispatch();
      calls.push({ sessionId: session.sessionId, caseId: session.caseId, stageId: stage, attempt });
      if (options.throwAfterDispatch) throw Error('AUTHORED_UNKNOWN_OUTCOME');
      const targeted = options.allFirst || session.caseId === targetCase;
      const output = targeted ? stageOutput(body, session) : {};
      const response = receipt(body, output, `${runNumber}-${calls.length}`);
      options.mutateReceipt?.({ ...state, body, session, stage, attempt, targeted, output, response });
      return response;
    };
    const inspect = async review => {
      const decision = { binding: review.binding, action: 'continue', materialFindings: [], reason: 'Authored offline contract inspection; no model-quality conclusion.' };
      await options.inspect?.({ ...state, ...review, decision });
      return decision;
    };
    let result = null, error = null;
    try {
      result = await executeFinalBatch({ mode: 'offline_fake', plan: selectedPlan, inputs: selectedInputs, cases: selectedCases,
        catalogs: selectedCatalogs, directory, send, inspect, sourceGuard: () => {} });
    } catch (caught) { error = caught; }
    assert.equal(networkAttempts, 0);
    return { name, directory, calls, result, error };
  }

  function assertSessionRun(run, expectedStage, expectedCode, { targetedOnly = true } = {}) {
    assert.equal(run.error, null, `unexpected outer failure: ${run.error?.safeCode ?? run.error?.message}`);
    const { summary, records } = run.result;
    assert.equal(summary.status, 'BATCH_FINISHED'); assert.equal(records.length, 24);
    assert.equal(summary.realApiCalls, 0); assert.equal(summary.actualHttpCalls, run.calls.length);
    assert.equal(new Set(records.map(r => r.sessionId)).size, 24);
    assert.ok(records.every(r => r.finalState === 'stopped' && r.stopScope === 'session'));
    const targets = targetedOnly ? records.filter(r => r.caseId === targetCase) : records;
    assert.equal(targets.length, targetedOnly ? 2 : 24);
    for (const record of targets) {
      const calls = run.calls.filter(c => c.sessionId === record.sessionId);
      assert.equal(calls.at(-1).stageId, expectedStage, 'real Application must reach the tested stage');
      assert.equal(record.errorCode, expectedCode);
      assert.equal(record.stopProvenance.stageId, expectedStage);
      assert.equal(record.stopProvenance.accounted, true);
      assert.ok(calls.every(c => c.attempt === 1), 'no retry or repair is authorized in these failure fixtures');
      assert.equal(new Set(calls.map(c => c.stageId)).size, calls.length, 'no repeated stage');
      if (expectedStage !== 'PB-01') assert.deepEqual(calls.map(c => c.stageId), ['PB-01', 'PB-02', 'PB-03', 'PB-04', 'PB-05', 'PB-06'].slice(0, Number(expectedStage.slice(-2))));
      assert.ok(record.usageCost.every(c => c.status === 'received' && c.accounting), 'received quality failures retain usage');
    }
    assert.ok(summary.reservedUsd > summary.usageBasedCostUpperUsd);
    sessionRuns.push(run);
  }

  function assertGlobalRun(run, reason, expectedCalls = 1) {
    if (run.error) assert.equal(run.error.safeCode, reason);
    else {
      assert.equal(run.result.summary.status, 'GLOBAL_STOP');
      assert.equal(run.result.summary.stopReason, reason);
      assert.equal(run.result.summary.realApiCalls, 0);
      assert.ok(run.result.summary.sessionsStarted <= 1);
      assert.ok(run.result.records.every(r => r.finalState === 'stopped' && r.stopScope === 'global'));
      assert.equal(run.result.summary.actualHttpCalls, expectedCalls);
    }
    assert.equal(run.calls.length, expectedCalls, 'no extra dispatch after GLOBAL STOP');
    globalRuns.push(run);
  }
  const test = async (number, name, action) => {
    const evidence = await action(); results.push({ number, name, status: 'PASS', ...evidence }); console.log(`PASS ${number}: ${name}`);
  };
  const stageFailure = (stage, value) => batch(`${stage}-${value === null ? 'null' : 'invalid'}`, {
    mutateReceipt: ({ stage: current, targeted, response }) => { if (targeted && current === stage) response.output_text = JSON.stringify(value); },
  });

  await test(1, 'received incomplete and completed missing text are SESSION STOP', async () => {
    for (const mode of ['incomplete', 'missing-text']) {
      const run = await batch(mode, { allFirst: true, mutateReceipt: ({ response }) => {
        if (mode === 'incomplete') { response.status = 'incomplete'; response.incomplete_details = { reason: 'max_output_tokens' }; response.output_text = '{'; }
        else delete response.output_text;
      } });
      assertSessionRun(run, 'PB-01', 'INCOMPLETE_RESPONSE', { targetedOnly: false });
    }
    return { variants: 2, sessions: 48, reservationReleased: false };
  });
  for (const [number, stage] of [[2, 'PB-04'], [3, 'PB-05'], [4, 'PB-06']]) {
    await test(number, `${stage} null reaches the real stage and SESSION STOP`, async () => {
      const run = await stageFailure(stage, null); assertSessionRun(run, stage, 'M2_STAGE_SCHEMA_INVALID');
      return { targetCase, reachedStage: stage, targetSessions: 2, totalSessions: 24 };
    });
  }
  await test(5, 'parseable invalid PB04/PB05/PB06 and malformed JSON are SESSION STOP', async () => {
    for (const stage of ['PB-04', 'PB-05', 'PB-06']) {
      for (const value of [{ unexpected: true }, []]) assertSessionRun(await stageFailure(stage, value), stage, 'M2_STAGE_SCHEMA_INVALID');
      for (const arm of ['V17', 'V19-L5']) {
        const definition = catalogs[arm].definitions.find(d => d.stageId === stage);
        for (const value of [null, [], false, 1, 'invalid', { unexpected: true }]) {
          assert.throws(() => validateFinalStageOutput({ stageId: stage }, value, definition, arm), e => e.safeCode === 'M2_STAGE_SCHEMA_INVALID');
        }
      }
    }
    const malformed = await batch('malformed-json', { allFirst: true, mutateReceipt: ({ response }) => { response.output_text = '{'; } });
    assertSessionRun(malformed, 'PB-01', 'SCHEMA_INVALID_JSON', { targetedOnly: false });
    return { integratedStageVariants: 6, pureTypeVariants: 36, malformedJsonSessions: 24 };
  });
  await test(6, 'material fact, Safety, meaning and true action review remain SESSION STOP', async () => {
    const findings = [['FACT_FIDELITY', 'report_content.decision_reason_summary'], ['SAFETY_REGRESSION', 'report_content.short_letter[0]'],
      ['REQUIRED_SECTION_MEANING', 'report_content.decision_reason_summary'], ['ACTION_CONSISTENCY', 'decision_plan.actions_to_take[0]']];
    for (const [finding_code, json_path] of findings) {
      const run = await batch(`material-${finding_code}`, { inspect: ({ session, request, decision }) => {
        if (session.caseId === targetCase && request.stageId === 'PB-06') {
          decision.action = 'stop'; decision.reason = 'Authored independent material verdict; stop routing only, no real-model quality claim.';
          decision.materialFindings = [{ finding_code, severity: 'major', json_path, evidence_refs: ['F105'], detail: decision.reason }];
        }
      } });
      assertSessionRun(run, 'PB-06', 'MATERIAL_MANUAL_INTEGRITY_OR_SAFETY');
    }
    return { findingClasses: findings.map(([code]) => code), targetSessions: 8 };
  });
  await test(7, 'wrong model stays GLOBAL even with incomplete status', async () => {
    for (const status of ['completed', 'incomplete']) {
      const run = await batch(`wrong-model-${status}`, { mutateReceipt: ({ response }) => { response.model = 'wrong-model'; response.status = status; } });
      assertGlobalRun(run, 'MODEL_OR_SERVICE_TIER_MISMATCH');
    }
    return { variants: 2 };
  });
  await test(8, 'wrong fixed input or hash is GLOBAL before another call', async () => {
    const wrongInput = await batch('wrong-input', { configure: state => { state.inputs.cases[0].input.currentSituation = 'AUTHORED WRONG INPUT'; } });
    assertGlobalRun(wrongInput, 'WRONG_CASE_OR_INPUT', 0);
    const wrongHash = await batch('wrong-hash', { configure: state => { state.plan.inputHash = '0'.repeat(64); } });
    assertGlobalRun(wrongHash, 'WRONG_CASE_OR_INPUT', 0);
    const changedCatalog = await batch('catalog-hash-change', { beforeDispatch: state => { state.catalogs.V17.promptBundleVersion = 'AUTHORED HASH MISMATCH'; } });
    assertGlobalRun(changedCatalog, 'MODEL_VERSION_MISMATCH', 0);
    return { variants: 3, dispatches: 0 };
  });
  await test(9, 'corruption of a disposable fake mapping causes GLOBAL STOP', async () => {
    const run = await batch('fake-mapping-corruption', { allFirst: true, inspect: ({ directory }) => {
      const file = path.join(directory, 'internal', 'mapping-SEALED.json');
      const generated = read(file); generated.sealed = false;
      fs.writeFileSync(file, JSON.stringify(generated)); // Only this newly generated temporary test artifact.
    } });
    assertGlobalRun(run, 'MAPPING_CORRUPTION'); return { dispatches: 1, nextDispatches: 0 };
  });
  await test(10, 'invalid accounting remains GLOBAL including incomplete receipts', async () => {
    for (const status of ['completed', 'incomplete']) {
      const run = await batch(`bad-accounting-${status}`, { mutateReceipt: ({ response }) => { response.status = status; response.usage.total_tokens = 999; } });
      assertGlobalRun(run, 'BUDGET_USAGE_INCONSISTENT');
      assert.equal(run.result.summary.unknownUsageCalls, 1); assert.ok(run.result.summary.reservedUsd > 0);
    }
    return { variants: 2, reservationReleased: false };
  });
  await test(11, 'reservation beyond the unchanged $6 cap is GLOBAL before dispatch', async () => {
    const run = await batch('budget-cap', { configure: state => { state.plan.caps.find(c => c.stage === 'PB-01').input = 24_000_001; } });
    assertGlobalRun(run, 'BUDGET_RESERVATION_REJECTED', 0); return { dispatches: 0, hardCapUsd: 6 };
  });
  await test(12, 'SESSION STOP is final for that session and the next case still runs', async () => {
    assert.ok(sessionRuns.length >= 1);
    for (const run of sessionRuns) {
      assert.equal(new Set(run.result.records.map(r => r.caseId)).size, 12);
      assert.deepEqual(run.result.records.slice(-2).map(r => r.caseId), ['GQ-15', 'GQ-15']);
      assert.ok(run.result.records.every(r => r.finalState !== 'completed' && r.repair === false));
      for (const record of run.result.records) assert.equal(run.calls.filter(c => c.sessionId === record.sessionId && c.stageId === record.stopProvenance.stageId).length, 1);
    }
    return { verifiedRuns: sessionRuns.length, laterCase: 'GQ-15', completedMislabels: 0, retries: 0 };
  });
  await test(13, 'GLOBAL STOP permits zero next calls; failed API and unknown outcome stay GLOBAL', async () => {
    for (const status of ['failed', 'queued', 'unknown']) {
      const run = await batch(`api-status-${status}`, { mutateReceipt: ({ response }) => { response.status = status; } });
      assertGlobalRun(run, 'API_RESPONSE_STATUS_FAILURE');
    }
    const unknown = await batch('unknown-outcome', { throwAfterDispatch: true });
    assertGlobalRun(unknown, 'RUNNER_UNCLASSIFIED_FAILURE');
    assert.equal(unknown.result.summary.unknownUsageCalls, 1); assert.ok(unknown.result.summary.reservedUsd > 0);
    assert.ok(globalRuns.every(r => r.calls.length <= 1));
    return { verifiedRuns: globalRuns.length, nextDispatches: 0, retries: 0, unknownReservationReleased: false };
  });

  assertSeedUnchanged(fixture);
  for (const [file, expected] of Object.entries(protectedHashes)) assert.equal(sha(file), expected, `protected artifact changed: ${file}`);
  assert.equal(results.length, 13); assert.equal(networkAttempts, 0);
  const report = { schemaVersion: 'v19-l5-evaluation-stop-routing-fix-v1', status: 'PASS', requiredTests: 13, passed: results.length,
    evidenceType: 'OFFLINE_FAKE_RECEIPTS_ONLY', fixtureNotice: 'Existing offline structural seed is used only inside an injected fake transport; no historical output is submitted for generation.',
    temporaryEvidenceDirectory: temporaryRoot, sessionRuns: sessionRuns.length, globalRuns: globalRuns.length, results,
    runnerSha256: sha(`${root}/final-qa/runner.mjs`), verifierSha256: sha(`${root}/final-qa/verify-stop-routing.mjs`),
    historicalSeedUnchanged: true, fixedInputsExpectationsAndUiUnchanged: true, networkAttempts, realApiCalls: 0, keyAccess: 0,
    productionOperations: 0, liveLockCreated: false, liveAuthorizationConsumed: false };
  if (!process.argv.includes('--stdout-only')) fs.writeFileSync(`${root}/final-qa/runner-fix-results.json`, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify(report));
} finally {
  globalThis.fetch = previousFetch;
}
