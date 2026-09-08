import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { createB1Harness } from "./lib/paid-delivery-step5a1-b1-harness.mjs";
import { fixture, consultationFor } from "./lib/paid-recovery-fixtures.mjs";
import { verifyB1BaselineBoundaries } from "./lib/paid-delivery-step5a1-b1-baseline.mjs";

assert.ok(process.argv.includes("--reproduce-baseline"),"This diagnostic requires --reproduce-baseline; formal B1 source and additive migration authorization remain pending.");

const directory=`evals/paid-delivery-step5a1/b1/${process.argv.includes("--reproduce-baseline")?"baseline-reproduction":"regression"}-${randomUUID()}`;
mkdirSync(directory,{recursive:true});
const sourceHead=execFileSync("git",["rev-parse","HEAD"],{encoding:"utf8",windowsHide:true}).trim();
const h=await createB1Harness();
try {
  if (process.argv.includes("--reproduce-baseline")) {
    await h.reset();
    const legacy=await h.createRun({contract:"v17"});
    const run=await h.createFactoryRun({delegate:legacy.transport,consultation:consultationFor(fixture("polite_thank_you_with_draft"))});
    const purchase=await run.seedVerifiedPurchase();
    const snapshot=await h.snapshot(run,purchase);
    assert.equal(snapshot.authorityVersion,"prompt-bundle-runtime-v17.0.0");
    const diagnostics=await verifyB1BaselineBoundaries(h);
    const receipt={status:"EXPECTED_B1_FAILURE_REPRODUCED",sourceHead,actualFactory:run.factoryEvidence,diagnostics,
      expectedNewPurchaseContract:"prompt-bundle-runtime-v23.0.0",actualNewPurchaseContract:snapshot.authorityVersion,
      snapshot,wire:run.sdk.wires,externalOperations:{openAiCalls:0,stripeCalls:0,realEmail:0,productionRead:0,productionWrite:0}};
    writeFileSync(`${directory}/receipt.json`,JSON.stringify(receipt,null,2)+"\n");
    console.log(JSON.stringify({status:receipt.status,actual:snapshot.authorityVersion,receipt:`${directory}/receipt.json`}));
  }
} catch(error) {
  writeFileSync(`${directory}/failure.json`,JSON.stringify({status:"FAIL",sourceHead,error:error.stack,databaseError:h.rest.failures.at(-1)},null,2)+"\n");
  throw error;
} finally {await h.stop();}
