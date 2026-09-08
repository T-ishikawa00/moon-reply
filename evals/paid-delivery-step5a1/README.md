# STEP 5A-1 — B1 / B2 local release-blocker work

Start: `codex/guidance-quality-final-v19-l5` at
`3a873b5a67e1d30592cb41e812d1ca39943d966a`.
This record does not reconsider STEP 1, STEP 2 Human PASS, STEP 3 or STEP 4.

## B1 — reproduced; additional schema scope pending

No Production selector, runtime, prompt, schema asset or migration SQL has been
changed. B1 is **not resolved** and no new release candidate is approved.

The actual `createProductionAssessmentApplication()` factory, without any
synthetic-authority option, was exercised against isolated PostgreSQL with only
external Auth/Stripe/OpenAI/notification boundaries controlled. The path includes
Production anonymous admission, authenticated continuation and binding, Customer
and global compute RPCs, authenticated Checkout and verified-payment persistence.
The new purchase still receives bundle v17 / schema v6, rather than v23 / v9.

Final diagnostic receipt:
[baseline reproduction](b1/baseline-reproduction-60874023-ba15-409d-b4bf-a3c4ae1ddcd3/receipt.json).
Its overall disposition is `EXPECTED_B1_FAILURE_REPRODUCED`, **not B1 PASS**.
Earlier UUID directories are retained development diagnostics.

Two further dependencies were reproduced with real local PostgreSQL:

- A real persisted v23/v9 initial run is rejected by the existing
  `finalize_purchase_ready_assessment_v1` RPC with
  `M2_PREPARATION_FINALIZATION_CONFLICT`. Its version predicates accept V17 only.
- A valid clarification record using `original_message` is rejected by
  `assessment_clarifications_target`; the same fixture with the existing
  `requested_message_tone` target succeeds in a rolled-back positive control.

The diagnostic also verifies anonymous Provider calls remain zero, synthetic
selection/grants are rejected, customer/continuation ownership and adult guards
remain enforced, and Customer/global cap failures preserve consumed units while
releasing returned-response concurrency slots. It does not substitute these
baseline results for the required post-fix S01/S08/S10/S12/S13/S14 equivalents.

The proposed additive SQL and runtime bridge are documented in
[B1 schema dependency proposal](../../docs/payment/STEP5A1_B1_SCHEMA_DEPENDENCY.md).
An explicit scope question is pending for
`0036_v19_l5_production_preparation_compatibility.sql` and its official gate
registration. Existing 0033–0035 bytes remain unchanged. A clarification must not
be converted into a technical failure, a different question target or a V17
fallback. The prepare-only answer bridge must not invoke paid stages before
payment, and clarified authority must bind the accepted answer to the immutable
initial request.

## B2 — PASS

The canonical release entry remains
`scripts/verify-remediation-migration-privileges.mjs`; no alternative bypass gate
was introduced. [B2 report](b2/README.md) binds the final 30-check receipt and the
offline execution log. The A–L matrix, empty and populated upgrades, direct
non-superuser installer, owner/RPC/table/column/RLS/extension dependencies, and
negative fixtures all pass. Existing suites also pass 79 functional checks and
112 runtime permission probes. Source and SQL hashes were independently checked
after the final run.

Local B2 commit:
`2d86fd0c22ec47e223153d6ab68405228ff492ef`
(`test: register paid recovery migrations in canonical release gate`).
Four verifier/contract source files changed; Production runtime, migration SQL
and package configuration did not change. Later evidence/diagnostic packaging
does not change the tested gate implementation.

## Common checks and preservation

[Local check record](local-checks.json): typecheck and offline build PASS;
Production/source lint PASS with zero warnings. Whole-checkout lint is **not
PASS**: unchanged evaluation bundles and `.tmp` contain 59 existing unused-variable
warnings, with zero errors. Their files and ESLint policy have not been modified
or suppressed to produce a green result.

[Preflight](preflight.json) verifies all 4,801 protected artifact hashes.
`C:/tmp/mrexp-e98` and `C:/tmp/mrexp-ea4` remain preserved. No destructive Git
operation, Production read/write, real Provider/payment/notification call,
environment-file change, remote migration, push or deployment has been performed
in this task.

## STEP 5A readiness

**NOT READY.** Until B1 is implemented and its required integration regressions
pass, there is no candidate suitable for Production release authorization.
The requested post-local-PASS external read-only recheck has not been entered;
the previous owner/ACL, financial reconciliation, hosted drain and natural
scheduler execution UNKNOWNs are not claimed resolved.
