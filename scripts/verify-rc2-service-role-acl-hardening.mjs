import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const acceptedFoundationBase =
  "8bf6c4e9c0a860b48826708676f0abe7c4395714";
const migration0013 =
  "supabase/migrations/0013_rc2_service_role_acl_hardening.sql";

const applicationTables = [
  "assessment_requests",
  "assessment_runs",
  "assessment_stage_runs",
  "assessment_reports",
  "assessment_clarifications",
  "production_preparations",
  "production_purchases",
  "production_assessment_grants",
  "production_logical_assessments",
  "production_customer_deliveries",
  "production_result_credentials",
  "production_notification_outbox",
  "production_email_verification_challenges",
  "production_verified_email_authorities",
  "production_trusted_email_sessions",
  "production_preparation_email_bindings",
  "production_purchase_intents",
  "production_payment_attempts",
  "production_verified_payments",
  "production_stripe_event_ledger",
  "production_fulfillment_jobs",
  "production_payment_adjustment_ledger",
];

const expectedPrivileges = new Map(
  applicationTables.map((table) => [table, []]),
);

for (const table of [
  "assessment_requests",
  "assessment_runs",
  "assessment_stage_runs",
  "assessment_clarifications",
  "production_preparations",
  "production_assessment_grants",
  "production_logical_assessments",
  "production_result_credentials",
  "production_notification_outbox",
  "production_email_verification_challenges",
  "production_verified_email_authorities",
  "production_trusted_email_sessions",
  "production_preparation_email_bindings",
  "production_purchase_intents",
  "production_payment_attempts",
  "production_verified_payments",
  "production_stripe_event_ledger",
  "production_fulfillment_jobs",
]) {
  expectedPrivileges.set(table, ["insert", "select", "update"]);
}

for (const table of [
  "assessment_reports",
  "production_purchases",
  "production_customer_deliveries",
]) {
  expectedPrivileges.set(table, ["insert", "select"]);
}

const immutableMigrationBlobs = new Map([
  [
    "supabase/migrations/0002_m2_p3_runtime_vertical_slice.sql",
    "5457adba613e39861fa9ceca6b39b2534ed46e37",
  ],
  [
    "supabase/migrations/0003_m2_p3_atomic_finalization.sql",
    "3a2442acb000d6fb109d77a56d7b62600265f6c1",
  ],
  [
    "supabase/migrations/0004_m2_p4_candidate_source_isolation.sql",
    "e3c42330d8e024a888fe8fd417e853ee1afad73c",
  ],
  [
    "supabase/migrations/0005_m2_p4_directional_guidance_runtime.sql",
    "d3c01e8d5a157dfbdc15b2333f1df01969a84cf7",
  ],
  [
    "supabase/migrations/0006_m2_p4_jpy980_clarification_lifecycle.sql",
    "0a3206022a9eeac3b963460eea5820fd87510043",
  ],
  [
    "supabase/migrations/0007_m2_p4_jpy980_semantic_depth_runtime_identity.sql",
    "1962c483f0b89cadc579dee8e6d39f9ba9067bae",
  ],
  [
    "supabase/migrations/0008_m2_p4_jpy980_semantic_quality_runtime_identity.sql",
    "936ec63bbfa3af22d3c09b999ba0000c696781d5",
  ],
  [
    "supabase/migrations/0009_m2_p4_jpy980_quality_reassessment.sql",
    "f6c906812ba03dc2b4a50151b7f268abd1042d04",
  ],
  [
    "supabase/migrations/0010_rc1_production_fulfillment_core.sql",
    "8b5bd5b02ca7756299049cf6215af299ace69e3c",
  ],
  [
    "supabase/migrations/0011_rc2_production_payment_delivery.sql",
    "70dc2c62631de6f1a81e5257eb076f45c4078565",
  ],
  [
    "supabase/migrations/0012_rc2_activation_database_hardening.sql",
    "1d2e9f911eaf0a3e246314a151d9c58201137fc3",
  ],
]);

const immutableQ0V17Blobs = new Map([
  [
    "components/runtime/CustomerAssessmentNote.tsx",
    "ee3fcf5cd3c0d164d292ab5165522aebafdb0473",
  ],
  [
    "lib/assessment/runtime/pipeline.ts",
    "206f2dd397dc098ece86c1414dd9c19c89ffd835",
  ],
  [
    "lib/assessment/runtime/change-condition-grounding-v4.ts",
    "9da403b99a3ef263af12f7b8633e902b22f99f6d",
  ],
  [
    "lib/assessment/runtime/semantic-disposition-v7.ts",
    "88c208afc55ad368386e15535cf92fe87beabf8b",
  ],
  [
    "scripts/verify-m2-p4-q0-final-reassessment-semantics.mjs",
    "39c4571da4312ca8e72c8af9d025864c457770ca",
  ],
]);

function gitText(args) {
  return execFileSync(
    "git.exe",
    ["-c", "safe.directory=C:/projects/moon-reply", ...args],
    { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
  ).trim();
}

function readText(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function workingBlob(relativePath) {
  return gitText(["hash-object", `--path=${relativePath}`, "--", relativePath]);
}

function assertBlobMap(expected) {
  for (const [relativePath, blob] of expected) {
    assert.equal(existsSync(path.join(root, relativePath)), true, relativePath);
    assert.equal(workingBlob(relativePath), blob, relativePath);
  }
}

function sourceFiles(relativeDirectory) {
  const absoluteDirectory = path.join(root, relativeDirectory);
  const paths = [];
  for (const entry of readdirSync(absoluteDirectory)) {
    const relativePath = path.join(relativeDirectory, entry);
    const absolutePath = path.join(root, relativePath);
    if (statSync(absolutePath).isDirectory()) {
      paths.push(...sourceFiles(relativePath));
    } else if (/\.(?:ts|tsx|js|mjs)$/u.test(entry)) {
      paths.push(relativePath);
    }
  }
  return paths;
}

function normalizedStatements(source) {
  return source
    .split(";")
    .map((statement) => statement.replace(/--[^\n]*/gu, " "))
    .map((statement) => statement.replace(/\s+/gu, " ").trim().toLowerCase())
    .filter(Boolean);
}

function tableNames(statement) {
  return [...statement.matchAll(/public\.([a-z0-9_]+)/gu)].map(
    (match) => match[1],
  );
}

let checks = 0;
const failures = [];

async function check(name, callback) {
  try {
    await callback();
    checks += 1;
    console.log(`PASS ${String(checks).padStart(2, "0")} ${name}`);
  } catch (error) {
    failures.push({ name, error });
    console.error(`FAIL ${name}`);
    console.error(error instanceof Error ? error.message : error);
  }
}

await check("0013 exists and is one explicit transaction", () => {
  assert.equal(existsSync(path.join(root, migration0013)), true);
  const source = readText(migration0013);
  assert.equal((source.match(/^begin;$/gmu) ?? []).length, 1);
  assert.equal((source.match(/^commit;$/gmu) ?? []).length, 1);
  assert.ok(source.indexOf("begin;") < source.lastIndexOf("commit;"));
});

await check("accepted migrations 0002 through 0012 are byte-authoritative", () => {
  assertBlobMap(immutableMigrationBlobs);
});

await check("0013 names the exact 22-table authority set", () => {
  const source = readText(migration0013);
  const revoke = normalizedStatements(source).find((statement) =>
    statement.startsWith("revoke all privileges on table "),
  );
  assert.ok(revoke);
  assert.deepEqual(
    [...new Set(tableNames(revoke))].sort(),
    [...applicationTables].sort(),
  );
  assert.match(revoke, / from public, anon, authenticated, service_role$/u);
});

await check("0013 encodes the exact narrowed service-role matrix", () => {
  const source = readText(migration0013);
  const actual = new Map(applicationTables.map((table) => [table, []]));
  const grants = normalizedStatements(source).filter((statement) =>
    statement.startsWith("grant "),
  );
  for (const statement of grants) {
    assert.match(statement, / to service_role$/u);
    const match = /^grant (.+?) on table (.+) to service_role$/u.exec(statement);
    assert.ok(match);
    const privileges = match[1].split(",").map((entry) => entry.trim()).sort();
    for (const table of tableNames(match[2])) {
      assert.equal(actual.has(table), true, table);
      assert.deepEqual(actual.get(table), []);
      actual.set(table, privileges);
    }
  }
  for (const table of applicationTables) {
    assert.deepEqual(actual.get(table), expectedPrivileges.get(table), table);
  }
});

await check("no service-role destructive or broad table grant exists", () => {
  const grants = normalizedStatements(readText(migration0013)).filter(
    (statement) => statement.startsWith("grant "),
  );
  for (const statement of grants) {
    assert.doesNotMatch(statement, /\b(?:delete|truncate|references|trigger)\b/u);
    assert.doesNotMatch(statement, /^grant all(?: privileges)?\b/u);
  }
});

await check("all public application roles are explicitly revoked first", () => {
  const source = readText(migration0013);
  assert.match(
    source,
    /revoke all privileges on table[\s\S]+?from public, anon, authenticated, service_role;/u,
  );
  assert.ok(
    source.indexOf("revoke all privileges on table") <
      source.indexOf("grant select, insert, update on table"),
  );
});

await check("future table defaults are tied to the proven creator role", () => {
  const source = readText(migration0013);
  assert.match(source, /count\(distinct relation\.relowner\)/u);
  assert.match(source, /object_creator_role <> current_user::name/u);
  for (const role of ["public", "anon", "authenticated", "service_role"]) {
    assert.match(
      source,
      new RegExp(
        `alter default privileges for role %I in schema public revoke all privileges on tables from ${role}`,
        "u",
      ),
    );
  }
  const defaultPrivilegeCommands = [
    ...source.matchAll(/'alter default privileges[^']+'/giu),
  ].map((match) => match[0]);
  assert.equal(defaultPrivilegeCommands.length, 4);
  for (const command of defaultPrivilegeCommands) {
    assert.match(command, /\brevoke all privileges on tables\b/iu);
    assert.equal(/\bgrant\b/iu.test(command), false);
  }
  assert.doesNotMatch(source, /for role (?:postgres|supabase_admin)\b/iu);
});

await check("RLS remains enabled for all 22 tables", () => {
  const source = readText(migration0013);
  for (const table of applicationTables) {
    assert.match(
      source,
      new RegExp(
        `alter table public\\.${table} enable row level security;`,
        "u",
      ),
    );
  }
  assert.doesNotMatch(source, /disable row level security/iu);
});

await check("verified-payment row-lock authority and immutability coexist", () => {
  assert.deepEqual(expectedPrivileges.get("production_verified_payments"), [
    "insert",
    "select",
    "update",
  ]);
  const migration0012 = readText(
    "supabase/migrations/0012_rc2_activation_database_hardening.sql",
  );
  assert.match(
    migration0012,
    /grant update on table public\.production_verified_payments to service_role;/u,
  );
  assert.match(
    migration0012,
    /create trigger reject_rc2_verified_payment_mutation_v1[\s\S]*?before update on public\.production_verified_payments/u,
  );
});

await check("further narrowing is backed by accepted Runtime operations", () => {
  const sql = [
    readText("supabase/migrations/0010_rc1_production_fulfillment_core.sql"),
    readText("supabase/migrations/0011_rc2_production_payment_delivery.sql"),
    readText("supabase/migrations/0012_rc2_activation_database_hardening.sql"),
  ].join("\n");
  assert.match(sql, /insert into public\.production_purchases\b/iu);
  assert.match(sql, /from public\.production_purchases\b/iu);
  assert.doesNotMatch(sql, /update public\.production_purchases\b/iu);
  assert.match(
    sql,
    /insert into public\.production_verified_email_authorities\b/iu,
  );
  assert.match(
    sql,
    /from public\.production_verified_email_authorities[\s\S]{0,180}?for update/iu,
  );
  assert.deepEqual(
    expectedPrivileges.get("production_verified_email_authorities"),
    ["insert", "select", "update"],
  );
  assert.doesNotMatch(
    sql,
    /(?:select[\s\S]{0,160}?from|insert into|update|delete from)\s+public\.production_payment_adjustment_ledger\b/iu,
  );
  const runtimeSource = [...sourceFiles("app"), ...sourceFiles("lib")]
    .map(readText)
    .join("\n");
  assert.doesNotMatch(runtimeSource, /production_payment_adjustment_ledger/u);
});

await check("V17 and Q0 remain byte-authoritative", () => {
  assertBlobMap(immutableQ0V17Blobs);
});

await check("package exposes the exact offline verifier entrypoint", () => {
  const packageJson = JSON.parse(readText("package.json"));
  assert.equal(
    packageJson.scripts["verify:rc2:acl-hardening"],
    "node scripts/verify-rc2-service-role-acl-hardening.mjs",
  );
});

await check("production Runtime change is the exact Foundation surface", () => {
  const trackedChanges = gitText([
    "diff",
    "--name-only",
    acceptedFoundationBase,
    "--",
    "app",
    "components",
    "lib",
  ])
    .split(/\r?\n/u)
    .filter(Boolean);
  const untrackedChanges = gitText([
    "ls-files",
    "--others",
    "--exclude-standard",
    "--",
    "app",
    "components",
    "lib",
  ])
    .split(/\r?\n/u)
    .filter(Boolean);
  assert.deepEqual(
    [...new Set([...trackedChanges, ...untrackedChanges])].sort(),
    [
      "app/account/account.module.css",
      "app/account/page.tsx",
      "app/account/results/[deliveryId]/page.tsx",
      "app/api/auth/callback/route.ts",
      "app/api/auth/continuations/route.ts",
      "app/api/auth/email-otp/request/route.ts",
      "app/api/auth/email-otp/verify/route.ts",
      "app/api/auth/google/start/route.ts",
      "app/api/auth/logout/route.ts",
      "app/api/payments/checkout/route.ts",
      "app/api/payments/status/route.ts",
      "app/purchase/auth/continue/page.tsx",
      "app/request/page.tsx",
      "components/account/AccountLogoutButton.tsx",
      "components/payment/AuthenticatedCheckoutButton.tsx",
      "components/request/RequestForm.tsx",
      "lib/assessment/production/supabase-repository.ts",
      "lib/customer-auth/application.ts",
      "lib/customer-auth/cookies.ts",
      "lib/customer-auth/crypto.ts",
      "lib/customer-auth/environment.ts",
      "lib/customer-auth/fakes.ts",
      "lib/customer-auth/request-security.ts",
      "lib/customer-auth/route-response.ts",
      "lib/customer-auth/service.ts",
      "lib/customer-auth/supabase-provider.ts",
      "lib/customer-auth/supabase-repository.ts",
      "lib/customer-auth/types.ts",
      "lib/payment/production/application.ts",
      "lib/payment/production/fakes.ts",
      "lib/payment/production/service.ts",
      "lib/payment/production/supabase-repository.ts",
      "lib/payment/production/types.ts",
      "lib/supabase/admin.ts",
      "lib/supabase/client.ts",
      "lib/supabase/cookie-policy.ts",
      "lib/supabase/env.ts",
      "lib/supabase/proxy.ts",
      "lib/supabase/server.ts",
    ],
  );
});

await check("no production activation claim is introduced", () => {
  const runbook = readText(
    "docs/payment/RC2_PRODUCTION_ACTIVATION_RUNBOOK.md",
  );
  const currentFocus = readText("docs/CURRENT_FOCUS.md");
  const wbs = readText("docs/WBS.md");
  const handoff = readText("docs/CODEX_HANDOFF.md");
  assert.match(runbook, /Production Payment(?::| is) inactive/iu);
  assert.match(currentFocus, /Still NOT complete: production Payment/iu);
  assert.match(wbs, /PRIVATE RELEASE READY[\s\S]*?Public Launch/iu);
  assert.match(handoff, /Still inactive\/unperformed:/iu);
  const docs = [runbook, currentFocus, wbs, handoff].join("\n");
  assert.equal(
    /Production Payment active\s*(?:=|:)\s*(?:true|yes)|Stripe connected\s*(?:=|:)\s*(?:true|yes)|Public Launch\s*(?:=|:)\s*(?:true|yes)/iu.test(
      docs,
    ),
    false,
  );
});

if (failures.length > 0) {
  console.error(
    `RC2_SERVICE_ROLE_ACL_HARDENING: FAIL ${failures.length}/${checks + failures.length}`,
  );
  process.exitCode = 1;
} else {
  console.log(
    `RC2_SERVICE_ROLE_ACL_HARDENING: PASS ${checks}/${checks}; external operations 0`,
  );
}
