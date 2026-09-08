// Infrastructure preflight only: all live slots remain unstarted; no transport.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { loadV19L5StageCatalog } from '../../../lib/assessment/runtime/v19-l5-stage-catalog.ts';
import { loadM2P4FinalProductRecoveryRuntimeStageCatalog } from '../../../lib/assessment/runtime/schema-catalog.ts';
import { ReservationLedger, reserveNanos, hash } from '../../guidance-quality-wave1/real-pilot/budget.mjs';
import { verifyLedgerPricing } from './runner.mjs';
import { writeBlindReview } from './review.mjs';

const root='evals/guidance-quality-v19-l5', evidence=`${root}/final-qa/runner-fix-2026-09-09`;
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const sha=value=>createHash('sha256').update(value).digest('hex');
let networkAttempts=0;
globalThis.fetch=async()=>{networkAttempts++;throw Error('PREFLIGHT_NETWORK_FORBIDDEN');};
const protectedSnapshot=read(`${evidence}/protected-hashes.json`);
for(const [file,expectedHash] of Object.entries(protectedSnapshot.files))assert.equal(sha(fs.readFileSync(file)),expectedHash,`Protected bytes changed: ${file}`);
const identity=read(`${root}/candidate-identity.json`);
assert.equal(identity.implementationCommit,'9c0fe90166b6ef3d8ccd8874afb7ad51b92dbffe');
for(const [file,expectedHash] of Object.entries(identity.sourceHashes))assert.equal(sha(fs.readFileSync(file,'utf8').replace(/\r\n/gu,'\n')),expectedHash);
const plan=read(`${root}/final-qa/plan.json`), inputs=read(`${root}/final-qa/inputs.json`), frozen=read(`${root}/expected-dispositions.json`);
assert.equal(sha(fs.readFileSync(`${root}/final-qa/inputs.json`)),plan.inputHash);
assert.equal(sha(fs.readFileSync(`${root}/expected-dispositions.json`)),plan.expectedDispositionHash);
assert.equal(sha(fs.readFileSync(`${root}/final-qa-acceptance.md`)),plan.acceptanceHash);
const cases=frozen.cases.map(c=>({id:c.caseId,label:c.label,consultation:c.consultation,input:c.input}));
assert.deepEqual(inputs.cases,cases.map(c=>({id:c.id,input:c.input})));
assert.equal(cases.length,12);
const catalogs=[await loadM2P4FinalProductRecoveryRuntimeStageCatalog(),await loadV19L5StageCatalog()];
const runtimeIdentities=catalogs.map(c=>({catalogVersion:c.catalogVersion,promptBundleVersion:c.promptBundleVersion,schemaSetVersion:c.schemaSetVersion,
  definitions:c.definitions.map(d=>({stageId:d.stageId,promptVersion:d.promptVersion,promptHash:d.promptHash,schemaVersion:d.schemaVersion,schemaHash:d.schemaHash,reportFactRepair:d.reportFactRepair??null}))}));
assert.deepEqual(runtimeIdentities,read(`${root}/final-qa/runtime-identities.json`));
assert.equal(plan.model,'gpt-5.6-luna');assert.equal(plan.reasoning,'low');assert.equal(plan.serviceTier,'default');
assert.equal(plan.recommendedHardCapUsd,6);assert.equal(plan.sessions,24);assert.equal(plan.maxHttp,208);
const rates=verifyLedgerPricing(plan);
const maximum=Object.values(plan.maximums).reduce((sum,counts)=>sum+plan.caps.reduce((n,cap)=>n+counts[cap.stage]*reserveNanos(cap),0),0);
assert.equal(maximum,4898390400);assert(maximum<=6e9);
const classification=read(`${root}/final-qa/runner-fix-results.json`);
assert.equal(classification.status,'PASS');
assert.equal(classification.runnerSha256,sha(fs.readFileSync(`${root}/final-qa/runner.mjs`)));
assert.equal(classification.verifierSha256,sha(fs.readFileSync(`${root}/final-qa/verify-stop-routing.mjs`)));
const fixture=fs.mkdtempSync(path.join(evidence,'unstarted-fixture-'));
fs.mkdirSync(path.join(fixture,'internal'));
// This is an unexecuted test manifest, not the one-shot live manifest/mapping.
const manifest={mode:'OFFLINE_UNSTARTED_FIXTURE',sessions:inputs.cases.flatMap(c=>['A','B'].map(label=>({sessionId:`fake-${c.id}-${label}`}))),
  caps:plan.caps.map(c=>({...c,invocationsPerSession:['PB-04','PB-05','PB-06'].includes(c.stage)?2:1})),maxHttpAttempts:208,budgetNanos:6e9};
const ledgerPath=path.join(fixture,'internal','reservations.jsonl');
const ledger=new ReservationLedger(ledgerPath,manifest,{create:true});
assert.equal(ledger.summary().sessionsStarted,0);assert.equal(ledger.summary().actualHttpCalls,0);assert.equal(ledger.summary().reservedUsd,0);
assert.deepEqual(new ReservationLedger(ledgerPath,manifest).summary(),ledger.summary());
// Internal test sentinel verifies that the renderer consumes public slots only.
fs.writeFileSync(path.join(fixture,'internal','mapping-fixture.json'),JSON.stringify({notALiveMapping:true,secretSentinel:'PREFLIGHT_INTERNAL_MAPPING_SENTINEL'}));
await writeBlindReview({directory:path.join(fixture,'public'),cases,records:[]});
const html=fs.readFileSync(path.join(fixture,'public','blind-review.html'),'utf8');
assert.equal((html.match(/data-output-state="not_started"/gu)||[]).length,24);
assert.equal((html.match(/<strong>NO OUTPUT YET<\/strong>/gu)||[]).length,24);
assert(!/PREFLIGHT_INTERNAL_MAPPING_SENTINEL|V19-L5|V17|9c0fe901|mapping-fixture/gu.test(html));
assert(!fs.existsSync(`${root}/final-qa/live-consumed.lock`));
assert.equal(networkAttempts,0);
const report={status:'PASS',kind:'OFFLINE_INFRASTRUCTURE_PREFLIGHT',checkedAt:new Date().toISOString(),
  headAtVerification:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),implementationCommit:identity.implementationCommit,
  protectedRawByteFiles:Object.keys(protectedSnapshot.files).length,candidateCanonicalSourceFiles:Object.keys(identity.sourceHashes).length,
  candidateBytesUnchanged:true,candidateHashesUnchanged:true,fixedCasesAndExpectationsUnchanged:true,catalogPromptSchemaIdentityUnchanged:true,
  reviewDefinitionUnchanged:true,mappingIsolation:'PASS',classificationTests:'PASS',classificationReportHash:hash(classification),
  budgetAccountingRates:rates,maximumReservedUsd:maximum/1e9,hardCapUsd:6,
  liveSlots:24,unstartedSlots:24,completed:0,clarification:0,stopped:0,liveSessionsStarted:0,actualHttpCalls:0,realApiCalls:0,networkAttempts,
  fixtureDirectory:fixture,emptyLedger:ledger.summary(),liveMappingCreated:false,liveLockCreated:false,
  publicArtifactHashes:Object.fromEntries(['blind-review.html','blind-review.css','blind-review.md','blind-integrity-check.json'].map(file=>[file,sha(fs.readFileSync(path.join(fixture,'public',file)))])),
  productionChanges:0,pushDeploy:0,pricingForFutureExecution:'Refresh official pricing immediately before live execution; this preflight uses the frozen accounting rates.'};
fs.writeFileSync(`${evidence}/preflight-result.json`,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
