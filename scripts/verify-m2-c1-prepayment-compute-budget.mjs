import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { ProductionFulfillmentApplication } from "../lib/assessment/production/application.ts";
import { FakeProductionFulfillmentRepository } from "../lib/assessment/production/fakes.ts";
import {
  PREPAYMENT_COMPUTE_POLICY_VERSION,
} from "../lib/assessment/production/prepayment-compute.ts";
import {
  isPrepaymentComputePolicyConfigured,
  readPrepaymentComputePolicy,
} from "../lib/assessment/production/prepayment-compute-policy.ts";
import { M2RuntimeError } from "../lib/assessment/runtime/errors.ts";
import { FakeAssessmentRepository } from "../lib/assessment/runtime/fakes.ts";
import { loadM2P4FinalProductRecoveryRuntimeStageCatalog } from "../lib/assessment/runtime/schema-catalog.ts";

const root = process.cwd();
const controlled = JSON.parse(
  readFileSync(
    path.join(
      root,
      "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-d/controlled-provider-inputs-v1.json",
    ),
    "utf8",
  ),
);
const safetyCases = JSON.parse(
  readFileSync(
    path.join(
      root,
      "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p6-i1/safety-engine-cases-v1.json",
    ),
    "utf8",
  ),
);
const selected = controlled.cases.find(
  (candidate) => candidate.fixture_id === "ordinary_reply_waiting",
);
assert.ok(selected);

function readText(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function safeCode(error) {
  return error instanceof M2RuntimeError ? error.safeCode : null;
}

function capabilities() {
  let index = 0;
  return () => Buffer.alloc(32, (index = (index % 250) + 1)).toString("base64url");
}

function consultation(overrides = {}) {
  return {
    ...structuredClone(safetyCases.base_input),
    currentSituation: selected.assessment_input.currentSituation,
    optionalMessage: selected.assessment_input.optionalMessage,
    relationship: selected.assessment_input.relationship,
    requestedTopics: selected.assessment_input.requestedTopics,
    consultationSchemaVersion: "rc1-production-consultation-v1",
    privacyAcknowledged: true,
    ...structuredClone(overrides),
  };
}

class CountingFailingTransport {
  calls = [];

  async invoke(request) {
    this.calls.push({
      stageId: request.stageId,
      attemptNumber: request.attemptNumber,
    });
    throw new M2RuntimeError("M2_C1_SYNTHETIC_PROVIDER_FAILURE", 503);
  }
}

class FakePrepaymentComputeAuthority {
  usedByCustomer = new Map();
  claimAttempts = 0;
  denyExecution = false;
  failBudgetDatabase = false;

  constructor(lifecycleRepository, runtimeRepository) {
    this.lifecycleRepository = lifecycleRepository;
    this.runtimeRepository = runtimeRepository;
  }

  async beginPrepaymentIntake(record) {
    const begun = await this.lifecycleRepository.beginPreparation(record);
    return { ...begun, executionDisposition: "awaiting_auth" };
  }

  async resolvePrepaymentContinuation() {
    return null;
  }

  async claimPrepaymentExecution(input) {
    if (this.denyExecution) {
      throw new M2RuntimeError("CUSTOMER_PREPARATION_OWNERSHIP_INVALID", 403);
    }
    const preparation = this.lifecycleRepository.preparations.get(
      input.preparationId,
    );
    if (!preparation) {
      throw new M2RuntimeError("CUSTOMER_PREPARATION_OWNERSHIP_INVALID", 403);
    }
    const request = this.runtimeRepository.requests.get(preparation.requestId);
    assert.ok(request);
    return {
      disposition: "acquired",
      preparation: structuredClone(preparation),
      request: structuredClone(request),
      preparationId: preparation.id,
    };
  }

  async beginPrepaymentClarification() {}

  async finalizePrepaymentExecution(record) {
    await this.lifecycleRepository.finalizePreparation(record);
  }

  async failPrepaymentExecution(input) {
    await this.lifecycleRepository.failPreparation(input);
  }

  async claimComputeUnit(input) {
    this.claimAttempts += 1;
    if (this.failBudgetDatabase) {
      throw new M2RuntimeError("PREPAYMENT_COMPUTE_AUTHORITY_UNAVAILABLE", 503);
    }
    const used = this.usedByCustomer.get(input.customerUserId) ?? 0;
    if (used >= input.policy.maximumProviderInvocations) return "exhausted";
    this.usedByCustomer.set(input.customerUserId, used + 1);
    return "acquired";
  }
}

async function harness() {
  const runtimeRepository = new FakeAssessmentRepository();
  const lifecycleRepository = new FakeProductionFulfillmentRepository(
    runtimeRepository,
  );
  const computeAuthority = new FakePrepaymentComputeAuthority(
    lifecycleRepository,
    runtimeRepository,
  );
  const transport = new CountingFailingTransport();
  const catalog = await loadM2P4FinalProductRecoveryRuntimeStageCatalog();
  const application = new ProductionFulfillmentApplication({
    runtimeRepository,
    lifecycleRepository,
    prepaymentComputeAuthority: computeAuthority,
    // Explicit synthetic adapter for the atomic global + Customer RPC. The
    // native F006 verifier proves transaction/concurrency behavior separately.
    globalUnpaidComputeAuthority: {
      async claim(input) {
        const disposition = await computeAuthority.claimComputeUnit(input);
        return disposition === "acquired" ? {
          disposition: "acquired", invocation_id: input.invocationId, slot_number: 1,
          lease_expires_at: "2026-08-24T00:04:00.000Z",
        } : { disposition: "customer_exhausted" };
      },
      async release() { return true; },
    },
    globalUnpaidComputePolicy: () => ({ windowSeconds: 3600, maximumProviderInvocations: 100, maximumConcurrent: 2 }),
    transport,
    catalog,
    model: "gpt-5.6-luna",
    now: () => "2026-08-24T00:00:00.000Z",
    uuid: () => crypto.randomUUID(),
    capability: capabilities(),
    timeZone: "Asia/Tokyo",
  });
  return {
    application,
    lifecycleRepository,
    computeAuthority,
    transport,
  };
}

const policy = {
  policyVersion: PREPAYMENT_COMPUTE_POLICY_VERSION,
  windowSeconds: 3_600,
  maximumProviderInvocations: 3,
};

let checks = 0;
async function check(name, callback) {
  await callback();
  checks += 1;
  console.log(`PASS ${String(checks).padStart(2, "0")} ${name}`);
}

await check("100 anonymous fresh snapshots create provider-free intake only", async () => {
  const run = await harness();
  for (let index = 1; index <= 100; index += 1) {
    const outcome = await run.application.beginProviderFreePreparation(
      consultation({
        currentSituation: `${selected.assessment_input.currentSituation}\n検証番号 ${index}`,
      }),
      crypto.randomUUID(),
    );
    assert.equal(outcome.status, "authentication_required");
  }
  assert.equal(run.lifecycleRepository.preparations.size, 100);
  assert.equal(run.transport.calls.length, 0);
  assert.equal(run.computeAuthority.claimAttempts, 0);
});

await check("provider-free safety stop creates no preparation and no provider call", async () => {
  const run = await harness();
  const outcome = await run.application.beginProviderFreePreparation(
    consultation({
      contactBoundaryState: "urgent_safety",
      requestedAssistanceGoal: "urgent_safety_help",
      currentSituation: "今すぐ自分を傷つけたい気持ちがあります。",
    }),
    crypto.randomUUID(),
  );
  assert.deepEqual(outcome, { status: "safety_blocked" });
  assert.equal(run.lifecycleRepository.preparations.size, 0);
  assert.equal(run.transport.calls.length, 0);
});

await check("same-key replay is free and changed snapshot conflicts before provider", async () => {
  const run = await harness();
  const key = crypto.randomUUID();
  const input = consultation();
  await run.application.beginProviderFreePreparation(input, key);
  await run.application.beginProviderFreePreparation(input, key);
  await assert.rejects(
    () =>
      run.application.beginProviderFreePreparation(
        consultation({
          currentSituation: `${input.currentSituation}\n異なるsnapshot`,
        }),
        key,
      ),
    (error) => safeCode(error) === "PRODUCTION_IDEMPOTENCY_CONFLICT",
  );
  assert.equal(run.lifecycleRepository.preparations.size, 1);
  assert.equal(run.transport.calls.length, 0);
  assert.equal(run.computeAuthority.claimAttempts, 0);
});

await check("fresh idempotency keys share one Customer budget", async () => {
  const run = await harness();
  const preparationIds = [];
  for (let index = 1; index <= 4; index += 1) {
    await run.application.beginProviderFreePreparation(
      consultation({
        currentSituation: `${selected.assessment_input.currentSituation}\nCustomer予算 ${index}`,
      }),
      crypto.randomUUID(),
    );
    preparationIds.push([...run.lifecycleRepository.preparations.keys()].at(-1));
  }
  const codes = [];
  for (const preparationId of preparationIds) {
    try {
      await run.application.executeAuthenticatedPrepayment({
        preparationId,
        customerUserId: "c1000000-0000-4000-8000-000000000001",
        policy,
      });
    } catch (error) {
      codes.push(safeCode(error));
    }
  }
  assert.deepEqual(codes, [
    "M2_C1_SYNTHETIC_PROVIDER_FAILURE",
    "M2_C1_SYNTHETIC_PROVIDER_FAILURE",
    "M2_C1_SYNTHETIC_PROVIDER_FAILURE",
    "PREPAYMENT_COMPUTE_BUDGET_EXHAUSTED",
  ]);
  assert.equal(run.transport.calls.length, 3);
  assert.equal(run.computeAuthority.usedByCustomer.values().next().value, 3);
});

await check("ownership, exhaustion, and budget DB failure all fence provider", async () => {
  for (const mode of ["ownership", "exhausted", "database"]) {
    const run = await harness();
    await run.application.beginProviderFreePreparation(
      consultation(),
      crypto.randomUUID(),
    );
    const preparationId = [...run.lifecycleRepository.preparations.keys()][0];
    if (mode === "ownership") run.computeAuthority.denyExecution = true;
    if (mode === "exhausted") {
      run.computeAuthority.usedByCustomer.set(
        "c1000000-0000-4000-8000-000000000001",
        3,
      );
    }
    if (mode === "database") run.computeAuthority.failBudgetDatabase = true;
    await assert.rejects(() =>
      run.application.executeAuthenticatedPrepayment({
        preparationId,
        customerUserId: "c1000000-0000-4000-8000-000000000001",
        policy,
      }),
    );
    assert.equal(run.transport.calls.length, 0, mode);
  }
});

await check("policy enablement is exact and invalid enabled config fails closed", () => {
  const saved = {
    enabled: process.env.PREPAYMENT_COMPUTE_BUDGET_ENABLED,
    window: process.env.PREPAYMENT_COMPUTE_WINDOW_SECONDS,
    maximum: process.env.PREPAYMENT_COMPUTE_MAX_PROVIDER_INVOCATIONS,
  };
  try {
    process.env.PREPAYMENT_COMPUTE_BUDGET_ENABLED = "TRUE";
    process.env.PREPAYMENT_COMPUTE_WINDOW_SECONDS = "3600";
    process.env.PREPAYMENT_COMPUTE_MAX_PROVIDER_INVOCATIONS = "3";
    assert.equal(isPrepaymentComputePolicyConfigured(), false);
    process.env.PREPAYMENT_COMPUTE_BUDGET_ENABLED = "true";
    process.env.PREPAYMENT_COMPUTE_WINDOW_SECONDS = "59";
    assert.equal(isPrepaymentComputePolicyConfigured(), false);
    assert.throws(
      () => readPrepaymentComputePolicy(),
      (error) => safeCode(error) === "PREPAYMENT_COMPUTE_CONFIGURATION_INVALID",
    );
    process.env.PREPAYMENT_COMPUTE_WINDOW_SECONDS = "3600";
    assert.deepEqual(readPrepaymentComputePolicy(), policy);
  } finally {
    if (saved.enabled === undefined) delete process.env.PREPAYMENT_COMPUTE_BUDGET_ENABLED;
    else process.env.PREPAYMENT_COMPUTE_BUDGET_ENABLED = saved.enabled;
    if (saved.window === undefined) delete process.env.PREPAYMENT_COMPUTE_WINDOW_SECONDS;
    else process.env.PREPAYMENT_COMPUTE_WINDOW_SECONDS = saved.window;
    if (saved.maximum === undefined) delete process.env.PREPAYMENT_COMPUTE_MAX_PROVIDER_INVOCATIONS;
    else process.env.PREPAYMENT_COMPUTE_MAX_PROVIDER_INVOCATIONS = saved.maximum;
  }
});

await check("every pipeline transport site is immediately preceded by the hook", () => {
  const pipeline = readText("lib/assessment/runtime/pipeline.ts");
  const invocationOffsets = [...pipeline.matchAll(/this\.transport\.invoke\(/gu)].map(
    (match) => match.index,
  );
  assert.equal(invocationOffsets.length, 2);
  for (const offset of invocationOffsets) {
    const prefix = pipeline.slice(Math.max(0, offset - 220), offset);
    assert.match(prefix, /await this\.beforeProviderInvocation\?\.\(/u);
  }
  const application = readText("lib/assessment/production/application.ts");
  assert.match(
    application,
    /executeAuthenticatedPrepayment[\s\S]*?this\.pipeline\([\s\S]*?this\.computeFence/u,
  );
  assert.match(
    application,
    /answerClarification[\s\S]*?this\.pipeline\([\s\S]*?this\.computeFence[\s\S]*?resumePreparation/u,
  );
  assert.equal((application.match(/claimComputeUnit\(/gu) ?? []).length, 0);
  assert.equal((application.match(/requireGlobalUnpaidComputePermit\(/gu) ?? []).length, 1);
  const globalMigration = readText("supabase/migrations/0029_f006_global_unpaid_compute.sql");
  assert.equal((globalMigration.match(/public\.claim_production_prepayment_compute_unit_v1\(/gu) ?? []).length, 1);
  const fulfillment = application.slice(
    application.indexOf("async fulfillAssessmentGrant"),
    application.indexOf("async resolveResult"),
  );
  assert.doesNotMatch(fulfillment, /computeFence|claimComputeUnit/u);
  const service = readText("lib/assessment/production/service.ts");
  const continuationStart = service.indexOf(
    "continueAuthenticatedProductionPreparation",
  );
  const continuationService = service.slice(
    continuationStart,
    service.indexOf("processProductionNotification", continuationStart),
  );
  assert.match(continuationService, /getFreshIdentity\(\)/u);
  assert.doesNotMatch(
    continuationService.match(/input: \{[\s\S]*?\}\)/u)?.[0] ?? "",
    /customerUserId/u,
  );
  const authRepository = readText("lib/customer-auth/supabase-repository.ts");
  const createContinuation = authRepository.slice(
    authRepository.indexOf("async createContinuation"),
    authRepository.indexOf("async validateContinuation"),
  );
  assert.ok(
    createContinuation.indexOf('"create_customer_auth_continuation_v1"') <
      createContinuation.indexOf(
        '"create_production_prepayment_auth_continuation_v1"',
      ),
  );
  assert.match(
    authRepository,
    /if \(!isPrepaymentComputeBudgetEnabled\(\)\) return null;/u,
  );
});

await check("0020 is append-only, atomic, service-only, and privacy-minimal", () => {
  const migration = readText(
    "supabase/migrations/0020_m2_c1_prepayment_compute_budget.sql",
  );
  assert.match(migration, /create table public\.production_prepayment_compute_budgets/u);
  assert.match(migration, /primary key \(customer_user_id, policy_version\)/u);
  assert.match(migration, /for update/u);
  assert.match(migration, /pg_advisory_xact_lock/u);
  assert.match(migration, /used_provider_invocation_units =[^;]*\+ 1/su);
  assert.match(migration, /security invoker/iu);
  assert.match(migration, /set search_path = ''/u);
  assert.match(migration, /grant execute[\s\S]*?to service_role/iu);
  assert.match(migration, /m2_b2_stripe_ingress/iu);
  const budgetTable = migration.match(
    /create table public\.production_prepayment_compute_budgets \([\s\S]*?\n\);/u,
  )?.[0];
  assert.ok(budgetTable);
  assert.doesNotMatch(
    budgetTable,
    /consultation|message|email|nickname|stripe|result|capability|token|ip_address/iu,
  );
});

console.log(`M2_C1_SOURCE_LOCAL_VERIFICATION=PASS checks=${checks}`);
