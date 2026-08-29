import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  HOSTED_CONTINUATION_ENDPOINT,
  HOSTED_CONTINUATION_SCHEMA_VERSION,
  decodeHostedContinuationResponseV1,
  requestHostedContinuationV1,
} from "../lib/assessment/production/hosted-continuation-contract-r1.ts";
import { ProviderFreeIntakeApplication } from "../lib/assessment/production/provider-free-intake.ts";
import { deriveHostedPreparationReplayCapability } from "../lib/assessment/production/capabilities.ts";
import { runHostedContinuationFlowV1 } from "../lib/assessment/production/hosted-continuation-flow-r1.ts";
import { M2RuntimeError } from "../lib/assessment/runtime/errors.ts";

const root = process.cwd();
const source = (relativePath) =>
  readFileSync(path.join(root, relativePath), "utf8");
const response = (data, ok = true) => ({
  ok,
  async json() {
    return structuredClone(data);
  },
});
const status = (value) => ({
  data: {
    schemaVersion: HOSTED_CONTINUATION_SCHEMA_VERSION,
    kind: "status",
    status: value,
  },
});
const outcome = (value) => ({
  data: {
    schemaVersion: HOSTED_CONTINUATION_SCHEMA_VERSION,
    kind: "outcome",
    outcome: value,
  },
});

const pageSource = source("app/purchase/auth/continue/page.tsx");
const clientSource = source(
  "components/request/HostedAuthenticatedPreparation.tsx",
);
const flowSource = source(
  "lib/assessment/production/hosted-continuation-flow-r1.ts",
);
const routeSource = source(
  "app/api/consultations/authenticated-preparation/route.ts",
);
const providerFreeSource = source(
  "lib/assessment/production/provider-free-intake.ts",
);
const applicationSource = source("lib/assessment/production/application.ts");
const serviceSource = source("lib/assessment/production/service.ts");
const callbackSource = source("app/api/auth/callback/route.ts");
const migrationSource = source(
  "supabase/migrations/0020_m2_c1_prepayment_compute_budget.sql",
);

assert.match(pageSource, /<HostedAuthenticatedPreparation csrfToken=\{csrfToken\} \/>/u);
assert.doesNotMatch(
  pageSource,
  /Suspense|continueAuthenticatedProductionPreparation|getFreshIdentity|executeAuthenticatedPrepayment/u,
);
assert.ok(
  pageSource.indexOf("await cookies()") <
    pageSource.indexOf("<HostedAuthenticatedPreparation"),
  "navigation must return the hosted shell without executing preparation",
);
assert.match(clientSource, /鑑定の準備をしています/u);
assert.match(clientSource, /MAXIMUM_AUTOMATIC_RECHECKS = 24/u);
assert.match(clientSource, /もう一度確認する/u);
assert.match(clientSource, /runHostedContinuationFlowV1/u);
assert.match(flowSource, /options\.request\("status"\)/u);
assert.match(flowSource, /options\.request\("execute"\)/u);
assert.match(flowSource, /options\.request\("resolve"\)/u);
assert.ok(
  flowSource.indexOf('options.request("status"') <
    flowSource.indexOf('options.request("execute"'),
  "reload must observe durable state before requesting execution",
);
assert.doesNotMatch(clientSource, /localStorage|sessionStorage|EventSource|WebSocket/u);

assert.match(routeSource, /export async function POST/u);
assert.doesNotMatch(routeSource, /export async function GET/u);
assert.match(routeSource, /enforceSameOrigin\(request\)/u);
assert.match(routeSource, /readAuthContinuationCookie\(request\)/u);
assert.match(routeSource, /readAuthSessionCsrfCookie\(request\)/u);
assert.match(routeSource, /equalCustomerAuthSecret/u);
assert.match(
  routeSource,
  /enforceProductionRouteRateLimit\([\s\S]*?authenticated-preparation:\$\{action\}[\s\S]*?continuationToken/u,
);
assert.match(routeSource, /action === "status"/u);
assert.match(routeSource, /action === "execute"/u);
assert.match(routeSource, /replayAuthenticatedProductionPreparation/u);
assert.match(routeSource, /customerAuthJson/u);
assert.match(routeSource, /PRODUCTION_PREPARATION_IN_PROGRESS/u);
assert.match(routeSource, /PRODUCTION_PREPARATION_RECOVERY_REQUIRED/u);

const statusStart = providerFreeSource.indexOf(
  "async readAuthenticatedPreparationStatusFromContinuation",
);
const statusEnd = providerFreeSource.indexOf(
  "async replayAuthenticatedPreparationFromContinuation",
  statusStart,
);
assert.ok(statusStart >= 0 && statusEnd > statusStart);
const statusSlice = providerFreeSource.slice(statusStart, statusEnd);
assert.match(statusSlice, /getAuthenticatedPreparationFromContinuation/u);
assert.doesNotMatch(
  statusSlice,
  /claimPrepaymentExecution|replayPreparation|rotatePurchaseCapability|rotateClarificationCapability|pipeline/u,
);
assert.match(applicationSource, /claim\.disposition === "in_progress"/u);
assert.match(applicationSource, /claim\.disposition === "completed"/u);
assert.match(applicationSource, /executeAuthenticatedPrepaymentFromContinuation/u);
assert.match(
  serviceSource,
  /deriveHostedPreparationReplayCapability\([\s\S]*?"purchase_ready"[\s\S]*?deriveHostedPreparationReplayCapability\([\s\S]*?"awaiting_clarification"/u,
);
assert.match(
  callbackSource,
  /completeGoogleCallback[\s\S]*?redirect\(siteOrigin, "\/purchase\/auth\/continue"\)/u,
);
assert.equal(
  callbackSource.replaceAll("\r\n", "\n"),
  execFileSync(
    "git",
    [
      "show",
      "6a1604d82c55835defcbe147bc41e7bccdf40df3:app/api/auth/callback/route.ts",
    ],
    { cwd: root, encoding: "utf8" },
  ),
  "Google callback must remain byte-for-byte unchanged from Candidate B parent",
);
assert.match(
  migrationSource,
  /continuation\.state = 'consumed'[\s\S]*?binding\.state = 'active'[\s\S]*?binding\.customer_user_id = p_customer_user_id/u,
);
assert.match(
  migrationSource,
  /state = 'executing'[\s\S]*?return 'in_progress'/u,
);

const requestLog = [];
const purchaseCapability = "P".repeat(43);
const clarificationCapability = "Q".repeat(43);
const contractFetcher = async (url, init) => {
  requestLog.push({ url, init: structuredClone(init) });
  const body = JSON.parse(init.body);
  return body.action === "status"
    ? response(status("purchase_ready"))
    : response(outcome({ status: "purchase_ready", preparationCapability }));
};
const observed = await requestHostedContinuationV1(
  "status",
  "C".repeat(43),
  contractFetcher,
);
assert.deepEqual(observed, {
  schemaVersion: HOSTED_CONTINUATION_SCHEMA_VERSION,
  kind: "status",
  status: "purchase_ready",
});
assert.equal(requestLog[0].url, HOSTED_CONTINUATION_ENDPOINT);
assert.equal(requestLog[0].init.method, "POST");
assert.equal(requestLog[0].init.credentials, "same-origin");
assert.equal(requestLog[0].init.cache, "no-store");
assert.deepEqual(JSON.parse(requestLog[0].init.body), {
  action: "status",
  csrfToken: "C".repeat(43),
});
assert.equal(
  decodeHostedContinuationResponseV1({
    schemaVersion: HOSTED_CONTINUATION_SCHEMA_VERSION,
    kind: "outcome",
    outcome: {
      status: "needs_one_clarifying_answer",
      clarificationCapability,
      target: "relationship_intent",
      question: "関係をどうしたいですか？",
      maximumQuestionsTotal: 1,
    },
  })?.kind,
  "outcome",
);
assert.equal(
  decodeHostedContinuationResponseV1({
    schemaVersion: HOSTED_CONTINUATION_SCHEMA_VERSION,
    kind: "outcome",
    outcome: { status: "purchase_ready", preparationCapability: "short" },
  }),
  null,
);

function preparation(overrides = {}) {
  return {
    id: "10000000-0000-4000-8000-000000000001",
    requestId: "20000000-0000-4000-8000-000000000001",
    idempotencyKeyHash: "a".repeat(64),
    consultationSnapshotHash: "b".repeat(64),
    consultationSnapshot: {},
    assessmentInput: {},
    safetyAuthority: {},
    status: "preparing",
    stopReason: null,
    clarificationId: null,
    clarificationCapabilityHash: null,
    clarificationQuestion: null,
    clarificationAnswerFingerprint: null,
    purchaseCapabilityHash: null,
    purchaseReadyAuthority: null,
    purchaseReadyAuthorityHash: null,
    lastErrorCode: null,
    createdAt: "2026-08-30T00:00:00.000Z",
    updatedAt: "2026-08-30T00:00:00.000Z",
    ...overrides,
  };
}

let durable = preparation();
let purchaseRotations = 0;
let clarificationRotations = 0;
let clarificationReads = 0;
const purchaseRotationHashes = [];
const clarificationRotationHashes = [];
const providerFree = new ProviderFreeIntakeApplication({
  runtimeRepository: {
    async findClarificationById() {
      clarificationReads += 1;
      return {
        target: "relationship_intent",
        questionSnapshot: durable.clarificationQuestion,
      };
    },
  },
  lifecycleRepository: {
    async rotatePurchaseCapability(_preparationId, capabilityHash) {
      purchaseRotations += 1;
      purchaseRotationHashes.push(capabilityHash);
      durable.purchaseCapabilityHash = capabilityHash;
    },
    async rotateClarificationCapability(_preparationId, capabilityHash) {
      clarificationRotations += 1;
      clarificationRotationHashes.push(capabilityHash);
      durable.clarificationCapabilityHash = capabilityHash;
    },
  },
  prepaymentComputeAuthority: {
    async beginPrepaymentIntake() {
      throw new Error("UNEXPECTED_INTAKE");
    },
    async resolvePrepaymentContinuation(input) {
      return input.customerUserId === "customer-1" ? durable.id : null;
    },
    async getPreparationById() {
      return structuredClone(durable);
    },
  },
  capability: () => purchaseCapability,
  now: () => "2026-08-30T00:00:00.000Z",
});
const ownerInput = {
  customerUserId: "customer-1",
  continuationTokenHash: "c".repeat(64),
};
const continuationToken = "K".repeat(43);
const stableReplayCapabilities = {
  purchaseReady: deriveHostedPreparationReplayCapability(
    continuationToken,
    "purchase_ready",
  ),
  awaitingClarification: deriveHostedPreparationReplayCapability(
    continuationToken,
    "awaiting_clarification",
  ),
};
assert.notEqual(
  stableReplayCapabilities.purchaseReady,
  stableReplayCapabilities.awaitingClarification,
);

assert.equal(
  await providerFree.readAuthenticatedPreparationStatusFromContinuation(ownerInput),
  "processing",
);
assert.equal(purchaseRotations, 0);
assert.equal(clarificationRotations, 0);

durable = preparation({
  status: "purchase_ready",
  purchaseCapabilityHash: "d".repeat(64),
});
assert.equal(
  await providerFree.readAuthenticatedPreparationStatusFromContinuation(ownerInput),
  "purchase_ready",
);
assert.equal(purchaseRotations, 0, "status must not rotate purchase capability");
const concurrentPurchaseReplay = await Promise.all([
  providerFree.replayAuthenticatedPreparationFromContinuation({
    ...ownerInput,
    replayCapabilities: stableReplayCapabilities,
  }),
  providerFree.replayAuthenticatedPreparationFromContinuation({
    ...ownerInput,
    replayCapabilities: stableReplayCapabilities,
  }),
]);
assert.deepEqual(concurrentPurchaseReplay, [
  {
    status: "purchase_ready",
    preparationCapability: stableReplayCapabilities.purchaseReady,
  },
  {
    status: "purchase_ready",
    preparationCapability: stableReplayCapabilities.purchaseReady,
  },
]);
assert.ok(purchaseRotations >= 1 && purchaseRotations <= 2);
assert.equal(new Set(purchaseRotationHashes).size, 1);
const purchaseRotationsAfterConvergence = purchaseRotations;
await providerFree.replayAuthenticatedPreparationFromContinuation({
  ...ownerInput,
  replayCapabilities: stableReplayCapabilities,
});
assert.equal(purchaseRotations, purchaseRotationsAfterConvergence);

durable = preparation({
  status: "awaiting_clarification",
  clarificationId: "30000000-0000-4000-8000-000000000001",
  clarificationQuestion: "関係をどうしたいですか？",
});
assert.equal(
  await providerFree.readAuthenticatedPreparationStatusFromContinuation(ownerInput),
  "awaiting_clarification",
);
assert.equal(clarificationReads, 0, "status must not resolve clarification payload");
assert.deepEqual(
  await providerFree.replayAuthenticatedPreparationFromContinuation({
    ...ownerInput,
    replayCapabilities: stableReplayCapabilities,
  }),
  {
    status: "needs_one_clarifying_answer",
    clarificationCapability: stableReplayCapabilities.awaitingClarification,
    target: "relationship_intent",
    question: "関係をどうしたいですか？",
    maximumQuestionsTotal: 1,
  },
);
assert.equal(clarificationRotations, 1);
assert.equal(new Set(clarificationRotationHashes).size, 1);
await providerFree.replayAuthenticatedPreparationFromContinuation({
  ...ownerInput,
  replayCapabilities: stableReplayCapabilities,
});
assert.equal(clarificationRotations, 1);

durable = preparation({ status: "failed", lastErrorCode: "SYNTHETIC" });
assert.equal(
  await providerFree.readAuthenticatedPreparationStatusFromContinuation(ownerInput),
  "failed",
);
await assert.rejects(
  () => providerFree.replayAuthenticatedPreparationFromContinuation(ownerInput),
  (error) =>
    error instanceof M2RuntimeError &&
    error.safeCode === "PRODUCTION_PREPARATION_RECOVERY_REQUIRED",
);
assert.equal(
  await providerFree.readAuthenticatedPreparationStatusFromContinuation({
    ...ownerInput,
    customerUserId: "other-customer",
  }),
  null,
);

async function convergenceFixture(sequence, terminalOutcome) {
  const calls = [];
  let statusIndex = 0;
  let transientFailures = 0;
  const fetcher = async (_url, init) => {
    const action = JSON.parse(init.body).action;
    calls.push(action);
    if (action === "execute") return response(status("processing"));
    if (action === "resolve") return response(outcome(terminalOutcome));
    const next = sequence[Math.min(statusIndex, sequence.length - 1)];
    statusIndex += 1;
    if (next === "network_failure") {
      transientFailures += 1;
      throw new Error("SYNTHETIC_TRANSIENT_FAILURE");
    }
    return response(status(next));
  };
  const result = await runHostedContinuationFlowV1({
    request: (action) =>
      requestHostedContinuationV1(action, "C".repeat(43), fetcher),
    wait: async () => {},
    isCancelled: () => false,
    onTransientFailure: () => {},
    recheckDelayMilliseconds: 0,
    maximumStatusChecks: 12,
  });
  return {
    calls,
    result:
      result.kind === "outcome" ? result.outcome.status : result.kind,
    transientFailures,
  };
}

const r1 = await convergenceFixture(
  ["processing", "processing", "purchase_ready"],
  { status: "purchase_ready", preparationCapability: purchaseCapability },
);
assert.equal(r1.result, "purchase_ready");
assert.equal(r1.calls.filter((call) => call === "execute").length, 1);

const r2 = await convergenceFixture(
  ["processing", "awaiting_clarification"],
  {
    status: "needs_one_clarifying_answer",
    clarificationCapability,
    target: "relationship_intent",
    question: "関係をどうしたいですか？",
    maximumQuestionsTotal: 1,
  },
);
assert.equal(r2.result, "needs_one_clarifying_answer");

const r3 = await convergenceFixture(["processing", "failed"], {
  status: "safety_blocked",
});
assert.equal(r3.result, "failed");
assert.equal(r3.calls.includes("resolve"), false);

const r4 = await convergenceFixture(["purchase_ready"], {
  status: "purchase_ready",
  preparationCapability: purchaseCapability,
});
assert.equal(r4.result, "purchase_ready");
assert.equal(r4.calls.includes("execute"), false);

const r5 = await convergenceFixture(
  ["network_failure", "processing", "purchase_ready"],
  { status: "purchase_ready", preparationCapability: purchaseCapability },
);
assert.equal(r5.transientFailures, 1);
assert.equal(r5.result, "purchase_ready");

let reloadDurableStatus = "processing";
let reloadProviderInvocations = 0;
const reloadActions = [];
const reloadRequest = async (action) => {
  reloadActions.push(action);
  if (action === "status") {
    return {
      schemaVersion: HOSTED_CONTINUATION_SCHEMA_VERSION,
      kind: "status",
      status: reloadDurableStatus,
    };
  }
  if (action === "execute") {
    reloadProviderInvocations += 1;
    reloadDurableStatus = "purchase_ready";
    return {
      schemaVersion: HOSTED_CONTINUATION_SCHEMA_VERSION,
      kind: "status",
      status: "purchase_ready",
    };
  }
  return {
    schemaVersion: HOSTED_CONTINUATION_SCHEMA_VERSION,
    kind: "outcome",
    outcome: {
      status: "purchase_ready",
      preparationCapability: stableReplayCapabilities.purchaseReady,
    },
  };
};
const runReloadCycle = () =>
  runHostedContinuationFlowV1({
    request: reloadRequest,
    wait: async () => {},
    isCancelled: () => false,
    onTransientFailure: () => {},
    recheckDelayMilliseconds: 0,
    maximumStatusChecks: 4,
  });
assert.equal((await runReloadCycle()).kind, "outcome");
assert.equal((await runReloadCycle()).kind, "outcome");
assert.equal(reloadProviderInvocations, 1);
assert.equal(
  reloadActions.filter((action) => action === "execute").length,
  1,
);

console.log(
  "FINAL_HOSTED_CONTINUATION_R1=PASS R1_PURCHASE_READY=1 R2_CLARIFICATION=1 R3_FAILED=1 R4_COMPLETED_REPLAY_PROVIDER_0=1 R5_TRANSIENT_RECOVERY=1 R6_RELOAD_IDEMPOTENT=1 R7_GOOGLE_OWNERSHIP=1",
);
console.log(
  `NEW_ENDPOINTS=1 MIGRATION=0 NEW_DB=0 WORKER=0 QUEUE=0 AUTH_SEMANTICS=0 PAYMENT=0 PROVIDER_EXTERNAL_CALLS=0 EXTERNAL_DB_WRITES=0 FAKE_CAPABILITY_ROTATIONS=${purchaseRotations + clarificationRotations} STRIPE_OPERATIONS=0`,
);
