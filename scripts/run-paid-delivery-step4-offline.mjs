import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createOfflineRuntime } from "./remediation-offline-runtime.mjs";

// Twenty integrated cases use a larger local-only wall-clock allowance than
// the short regression wrapper. Production environment and egress stay blocked.
const runtime=createOfflineRuntime(); runtime.env.NODE_ENV="test";
const args=process.argv.slice(2);
assert.ok(args.length>0,"explicit local verification script required");
const child=spawn(process.execPath,["--experimental-transform-types",...args],{env:runtime.env,stdio:"inherit",windowsHide:true});
const timer=setTimeout(()=>child.kill(),1_200_000);
try {
  const status=await new Promise((resolve,reject)=>{child.once("error",reject);child.once("exit",resolve);});
  runtime.assertNoExternalAttempts(); assert.equal(status,0,"STEP4 offline verification failed");
  console.log("STEP4_OFFLINE_WRAPPER_PASS external_network_attempts=0");
} finally { clearTimeout(timer); }
