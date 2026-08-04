# M2-P4-I3-R1-C1-R3-R2-E-R3 Review

<!-- M2-P4-I3-R1-C1-R3-R2-E-R3:BEGIN -->
- Package revision: `R1`
- Package baseline: `84ce1bce84f834c53bc46b5bb636ce77322da383`
- Aborted package Commit A: `b909bf3ad259bea0251cf2f81e7a40d9262ce211`
- Aborted disposition: `aborted_before_execution`; Provider calls `0`; marker `false`; authorization consumed `false`
- Replacement reason / changes: `runner_checked_nonexistent_active_loader_return_property` / `diagnostic_package_only`
- Product cases / Quality doctrine / Provider budget changed: `false / false / false`
- Status: `not_started`
- Branch: `test/m2-p4-i3-r1-c1-r3-r2-e-r3-r1-provider-product-diagnostic`
- Exact approved cases: `0/6` executed
- Provider calls expected / maximum / actual: `37 / 40 / 0`
- Replacement Commit A: pending
- Commit B: pending
- Evaluator self-tests / active-loader regression: `20/20 required / 7/7 required`
- Product Review: not started
- Product Owner Review: pending
- Provider quality established: false
- R4 authorized: false
- Migration 0005: unchanged and unapplied
- Active Service: unchanged
- Main: unchanged
<!-- M2-P4-I3-R1-C1-R3-R2-E-R3:END -->

The replacement frozen package will evaluate the unchanged exact six synthetic cases through the inactive v10 Pipeline with `FakeAssessmentRepository` and the real OpenAI Responses transport. The package validates the active v4 manifest separately and accepts the real loader return contract (`promptBundleVersion`, `schemaSetVersion`, and `definitions`) without requiring a nonexistent `catalogVersion`. No Supabase, migration application, Active Service switch, Runtime activation, R4, C2, PR, or main merge is authorized.
