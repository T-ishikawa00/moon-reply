# M2-P3-A-R1 Dependency Security and Runtime Hardening Review

## Decision

The production audit still reports three high package records. None is reachable from the M2 runtime's accepted inputs or enabled application features. There is no unresolved production-reachable high or critical finding.

`next` and `eslint-config-next` were updated from `16.2.10` to `16.2.12`. This removes four direct Next.js high advisories present in the initial audit. No forced PostCSS or sharp override, major upgrade, downgrade, or `npm audit fix` action was used.

The dependency-classification gate is eligible to pass. Human / ChatGPT acceptance remains on hold. This review does not authorize live Supabase setup, live OpenAI execution, main merge, production release, or public runtime enablement.

## Audit evidence

The required commands were run sequentially before remediation and again after the targeted patch update:

1. `npm.cmd audit --omit=dev --json`
2. `npm.cmd audit --json`
3. `npm.cmd ls --depth=0`

Final package-level audit counts:

| Scope | High | Critical | Total |
| --- | ---: | ---: | ---: |
| Production (`--omit=dev`) | 3 | 0 | 3 |
| All dependencies | 12 | 0 | 12 |

Exact required package status:

| Package | Installed | Status | Provenance |
| --- | --- | --- | --- |
| `openai` | `7.1.0` | direct production dependency | added by M2-P3-A |
| `ajv` | `8.20.0` | direct production dependency | added by M2-P3-A |
| `@supabase&#x2F;supabase-js` | `2.110.2` | direct production dependency | pre-existing in baseline `72d4121ff4ad0682bcafbeed4f72f6491e697ffa` |
| `next` | `16.2.12` | direct production dependency | pre-existing; patched by R1 |
| `react` | `19.2.7` | direct production dependency | pre-existing |

## Remediated direct Next.js findings

The initial production audit found four direct high advisories against `next@16.2.10`. All four list `16.2.11` as the first patched line and are resolved by `16.2.12`.

| Advisory | Affected functionality | M2 reachability before remediation |
| --- | --- | --- |
| `GHSA-6gpp-xcg3-4w24` | middleware/proxy bypass with Turbopack and one locale | not reachable: no middleware/proxy or i18n configuration |
| `GHSA-m99w-x7hq-7vfj` | Server Action denial of service | not reachable: no Server Action or `use server` code |
| `GHSA-89xv-2m56-2m9x` | custom-server Server Action SSRF | not reachable: no custom server or Server Action |
| `GHSA-p9j2-gv94-2wf4` | attacker-controlled rewrite destination SSRF | not reachable: `next.config.ts` defines no rewrites |

The remediation was a non-major patch update. Its acceptability is conditional on the complete sequential validation suite.

## Unresolved high package records

The table records every high package entry from the final full audit. Wrapper packages inherit the root `brace-expansion` finding; they are not independent application-runtime vulnerabilities.

| Package | Direct/path | Scope and classification | Affected / patched availability | Reachability and safe remediation |
| --- | --- | --- | --- | --- |
| `@eslint/config-array@0.21.2` | transitive through `eslint -> minimatch -> brace-expansion` | development-only | npm proposes `eslint@10.8.0` major | lint-only; upgrade the coordinated ESLint toolchain, breaking: yes |
| `@eslint/eslintrc@3.3.5` | transitive through `eslint -> minimatch -> brace-expansion` | development-only | npm proposes `eslint@10.8.0` major | lint-only; coordinated toolchain upgrade, breaking: yes |
| `brace-expansion@1.1.16,5.0.7` | transitive through ESLint and TypeScript-ESLint | development-only | `5.0.8` patches 5.x; no patched 1.x; npm proposes ESLint 10 | no application glob input; parent upgrade required, breaking: yes |
| `eslint@9.39.4` | direct dev dependency; transitive root cause | development-only | npm proposes `10.8.0` major | invoked only by `npm run lint`; coordinated upgrade, breaking: yes |
| `eslint-config-next@16.2.12` | direct dev dependency through lint plugins | development-only | npm proposes incompatible `0.2.4` downgrade | reject downgrade; await current-line fix, breaking: yes |
| `eslint-plugin-import@2.32.0` | transitive through `eslint-config-next` | development-only | npm reports a fix but no compatible newer installed-line leaf resolution | lint-only; consume parent refresh, breaking risk: yes |
| `eslint-plugin-jsx-a11y@6.10.2` | transitive through `eslint-config-next` | development-only | npm proposes incompatible config downgrade | lint-only; await parent refresh, breaking: yes |
| `eslint-plugin-react@7.37.5` | transitive through `eslint-config-next` | development-only | npm proposes incompatible config downgrade | lint-only; await parent refresh, breaking: yes |
| `minimatch@3.1.5,10.2.5` | transitive through ESLint paths | development-only | npm proposes ESLint 10; nested 10.x can receive `brace-expansion@5.0.8` through a parent refresh | no runtime import; coordinated parent upgrades, breaking: yes |
| `next@16.2.12` | direct; aggregate via `postcss@8.4.31` and `sharp@0.34.5` | production-installed but not runtime-reachable | npm proposes unsafe `next@9.3.3` downgrade; no supported 16.2.x removes both children | retain current Next; adopt a supported future release after full validation, breaking currently: yes |
| `postcss@8.4.31,8.5.16` | transitive through Next and Tailwind | production-installed but not runtime-reachable | `8.5.12+` patches `GHSA-6g55-p6wh-862q`; `8.5.18+` patches `GHSA-r28c-9q8g-f849`; Next pins `8.4.31` | only trusted repository CSS is built; no request, upload, Stage output, or API supplies CSS/source maps; do not override Next's exact dependency, breaking currently: yes |
| `sharp@0.34.5` | transitive through Next | production-installed but not runtime-reachable | `0.35.0+`, outside Next's declared `^0.34.5` range | no `next/image`, image config, image source, upload, or M2 image input; wait for supported Next range, breaking currently: yes |

The detailed machine-neutral dependency paths and classifications are in `evals/runtime/m2-p3-a-dependency-audit-summary-v1.json`.

## Atomic finalization design

Migration `0003_m2_p3_atomic_finalization.sql` adds one fixed-parameter Postgres function, `public.finalize_completed_assessment`. One RPC now performs:

- assessment report and decision-card insertion;
- run status, `completed_at`, final decision, returned model, and final usage totals update;
- parent request completion update.

The function locks the processing run, inserts the report, updates the run, and updates the request in one database transaction. Any exception rolls back every write. Duplicate or non-processing finalization is rejected. The implementation uses no dynamic SQL.

Security behavior is explicit:

- `SECURITY INVOKER`;
- `search_path = ''` with fully qualified table names;
- execute privilege revoked from `PUBLIC`, `anon`, and `authenticated`;
- execute granted only to `service_role`;
- all four existing tables retain RLS;
- the RPC exists only in the server-only repository and no browser database client is added.

The committed `0002_m2_p3_runtime_vertical_slice.sql` migration was not rewritten.

## Rollback and provider-stop evidence

The dedicated fake repository performs finalization against snapshots and restores all state on injected failure. The verifier covers:

1. report, decision card, run, request, completion timestamp, decision, and totals commit together;
2. report-insert failure leaves no report and no completed run;
3. run-update failure removes the provisional report and leaves no completed run;
4. duplicate finalization returns `M2_FINALIZATION_STATE_CONFLICT` and creates no duplicate report;
5. pipeline output is the safe `M2_FINALIZATION_PERSISTENCE_FAILED` code;
6. both finalization failure cases stop after the six already-completed Stages and make no additional provider call.

After transaction rollback, the existing failure path deliberately marks the processing run and request failed. `failRun` is constrained to processing rows so it cannot overwrite an already committed completion after an ambiguous client-side RPC failure.

## Runtime consistency review

- Two concurrent submissions with the same idempotency key produce one persisted request/run and one six-Stage provider execution. The competitor is rejected with safe HTTP 409 semantics.
- PostgreSQL unique violation `23505` is mapped to idempotency conflict only when the error identifies `idempotency_key`; unrelated unique failures remain database failures.
- An existing in-progress request is rejected, not returned.
- An existing ready/completed request is returned with `duplicate: true` and no additional AI run.
- A failed request cannot reuse the same idempotency key. Deliberate resubmission is allowed only with a new key, making the operator/user intent explicit.
- Request creation and run creation must succeed before PB-01. Every provider Stage call is preceded by a persisted processing Stage-start row.
- PB-06 cannot run after PB-05 failure.
- `safety_blocked` and `needs_more_information` stop after PB-03 and never create a final report.
- No retry, Repair/PB-07, fallback, queue, or background execution was added.

## Typeless-package warning review

The dedicated verifier's `MODULE_TYPELESS_PACKAGE_JSON` warning came from Node directly importing the TypeScript ESM files under `lib/assessment/runtime`. It was isolated to tooling; Next.js application execution was not the source.

The exact package boundary now has `lib/assessment/runtime/package.json` with `"type": "module"`. The root `package.json` module type was not changed. This removes the verifier warning without broadening module semantics across the application.

## Validation and acceptance boundary

The final verdict must come from the exact sequential validation commands in the task instruction. Automated PASS does not constitute Human / ChatGPT acceptance, Supabase migration application, a live smoke test, main merge, or release.

Recorded execution budget remains:

- actual OpenAI calls: `0`;
- actual Supabase calls: `0`;
- API spend: `USD 0`.
