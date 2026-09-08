// Preparation only. No Provider entrypoint, credential read, mapping reveal, or API.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { loadV19L5StageCatalog } from '../../../lib/assessment/runtime/v19-l5-stage-catalog.ts';
import { loadM2P4FinalProductRecoveryRuntimeStageCatalog } from '../../../lib/assessment/runtime/schema-catalog.ts';
import { reserveNanos } from '../../guidance-quality-wave1/real-pilot/budget.mjs';
import { writeBlindReview } from './review.mjs';
const root='evals/guidance-quality-v19-l5', dir=path.join(root,'final-qa');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const expected=read(`${root}/expected-dispositions.json`);
const cases=expected.cases.map(c=>({id:c.caseId,label:c.label,consultation:c.consultation,input:c.input}));
const inputs={schemaVersion:'final-expanded-12-inputs-v1',cases:cases.map(c=>({id:c.id,input:c.input}))};
// This input-only artifact never includes expectations, historical preferences or examples.
fs.writeFileSync(`${dir}/inputs.json`,JSON.stringify(inputs,null,2)+'\n');
const catalogs=[await loadM2P4FinalProductRecoveryRuntimeStageCatalog(),await loadV19L5StageCatalog()];
const caps=[
  {stage:'PB-01',input:56000,outputIncludingReasoning:8192},
  {stage:'PB-01C',input:42000,outputIncludingReasoning:8192},
  {stage:'PB-02',input:24000,outputIncludingReasoning:3072},
  {stage:'PB-03',input:24000,outputIncludingReasoning:2048},
  {stage:'PB-04',input:60000,outputIncludingReasoning:8192},
  {stage:'PB-05',input:72000,outputIncludingReasoning:8192},
  {stage:'PB-06',input:112000,outputIncludingReasoning:4096},
];
const candidateCount=cases.filter(c=>c.input.optionalMessage!==null).length;
const maximums={V17:{'PB-01':12,'PB-01C':candidateCount,'PB-02':12,'PB-03':12,'PB-04':24,'PB-05':24,'PB-06':24},
  'V19-L5':{'PB-01':12,'PB-01C':candidateCount,'PB-02':12,'PB-03':12,'PB-04':12,'PB-05':24,'PB-06':24}};
const conservativeNanos=Object.values(maximums).reduce((sum,arm)=>sum+caps.reduce((n,cap)=>n+arm[cap.stage]*reserveNanos(cap),0),0);
const plan={schemaVersion:'final-expanded-12-preparation-v1',status:'PREPARED_NO_API_AUTHORIZATION',
  model:'gpt-5.6-luna',reasoning:'low',serviceTier:'default',sessions:24,samplesPerCaseVersion:1,
  comparison:['V17','V19-L5'],caps,maximums,maxHttp:Object.values(maximums).flatMap(Object.values).reduce((a,b)=>a+b,0),
  conservativeMaximumAtReferencePricingUsd:conservativeNanos/1e9,recommendedHardCapUsd:6,
  pricingStatus:'REFERENCE_ONLY: refresh official pricing immediately before separately authorized execution and verify reservation/accounting agreement. Any mismatch stops before HTTP.',
  referenceReservationRatesPerMillionUsd:{inputIncludingCacheWrite:0.25,outputIncludingReasoning:1.2},
  referenceAccountingRatesPerMillionUsd:{input:0.2,cached:0.02,cacheWrite:0.25,output:1.2},
  noRetries:true,noAdditionalSamples:true,clarificationAnswers:0,attempt3:0,maximumFinalQaRuns:1,
  reservationRule:'Durable worst-case reservation before dispatch; no release on success, timeout or unknown outcome.',
  candidateReassessment:'PB04 once. Only unchanged L4 narrow Report fact repair can call PB05/PB06 again. Message-only has no repair expansion.',
  stopPolicy:{session:'Observed quality, fact/source, Safety, meaning, request or action defect; no delivery of intermediate text. Continue other cases.',
    global:'Wrong model/version/input, mapping corruption, ledger/accounting/cap/runner failure, unintended Production/Customer connection. Unknown infrastructure cause is GLOBAL.'},
  inputHash:sha(fs.readFileSync(`${dir}/inputs.json`)),expectedDispositionHash:sha(fs.readFileSync(`${root}/expected-dispositions.json`)),
  acceptanceHash:sha(fs.readFileSync(`${root}/final-qa-acceptance.md`)),
  prerequisites:['Exact candidate commit and implementation-file hashes frozen after Local Technical PASS.',
    'Fresh Human authorization for exactly one final 24-session batch and the budget; old one-time authorization is consumed.',
    'Current official pricing and conservative reservation calculation agree; otherwise STOP.',
    'New one-shot execution directory and independently randomized sealed mapping; source/receipt/ledger/mapping guards before each HTTP.',
    'Mandatory per-receipt fact/source/Safety review; no automated code/severity waiver or repair outside Application eligibility.'],
  realApiCalls:0,productionOperations:0,pushDeploy:0,
  knownOpen:['F007 overall','F008','real-model narrow repair success rate','Production readiness']};
if(conservativeNanos>6e9)throw Error('BUDGET_PLAN_EXCEEDS_RECOMMENDED_CAP');
fs.writeFileSync(`${dir}/plan.json`,JSON.stringify(plan,null,2)+'\n');
fs.writeFileSync(`${dir}/runtime-identities.json`,JSON.stringify(catalogs.map(c=>({catalogVersion:c.catalogVersion,promptBundleVersion:c.promptBundleVersion,schemaSetVersion:c.schemaSetVersion,definitions:c.definitions.map(d=>({stageId:d.stageId,promptVersion:d.promptVersion,promptHash:d.promptHash,schemaVersion:d.schemaVersion,schemaHash:d.schemaHash,reportFactRepair:d.reportFactRepair??null}))})),null,2)+'\n');
await writeBlindReview({directory:`${dir}/preview`,cases,records:[]});
console.log(JSON.stringify({status:plan.status,slots:24,maxHttp:plan.maxHttp,conservativeMaximumUsd:conservativeNanos/1e9,hardCapUsd:6,realApiCalls:0}));
