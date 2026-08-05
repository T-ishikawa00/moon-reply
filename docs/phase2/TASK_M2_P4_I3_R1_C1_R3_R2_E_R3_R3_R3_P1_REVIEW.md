# M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P1 Review

## Scope and authority

- Mode: READ-ONLY analysis / planning-only
- Branch: plan/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p1-v12-decomposition
- Exact baseline: 366b99b19ccf7f2aabe92fa760d07521de5e4104
- Expected parent: f0b5dff36b63a9deaf5f87f8825911b0510ac0b1
- Evidence Commit B: 9e9bf7d90740c1d00bfc4e282c85906744cd736c
- Package Commit A: 6eea601c99f18cbde62659140502d0456b0b505b
- main / origin-main: 61e33a10e195fad17e253a6b9719217e1992f273
- Exact planning scope: 11/11
- New / updated paths: 8 / 3
- Authority manifest: 44 files, each fixed by Git blob SHA, raw SHA-256, and byte count

Preflight passed before branch creation. HEAD equaled upstream and the exact baseline; worktree and stash were empty; Product Owner decision and v12 charter existed; Evidence Commit B remained an ancestor; frozen Review Packet 11/11, Evidence 10/10, Package 7/7, marker, and consumed authorization were unchanged; rerun_authorized remained false; main equaled origin/main. The Product Owner decision verifier passed 39/39.

## Architecture findings

### Runtime union and compatibility

AssessmentExecutionResult contains four material variants:

- legacy ready with report.schemaVersion=m2-p3-runtime-report-v1;
- split ready with report.schemaVersion=m2-p4-split-runtime-report-v1;
- safety_blocked with questionCodes and no Report;
- needs_more_information with questionCodes and no Report.

Catalogs v2 through v8 use legacy-six-v1 and return legacy ready results. Catalogs v9 through v11 use split-base-candidate-v1 and return split ready results. The active service still loads v4 and returns legacy ready; v9 through v11 remain inactive.

Overall compatibility result: legacy_only_compatible_split_ready_runtime_incompatible.

### Unsafe type narrowing

RuntimeAssessmentForm.isCompleted tests only eligibility=ready but declares the result to be legacy CompletedAssessment. Both legacy and split members use ready, so the predicate is false. payload.data is also cast without runtime validation, and persisted report_json is hydrated through another unchecked union cast.

SplitCompletedAssessment can reach RuntimeAssessmentNote. The first deterministic failure is decisionPlan.three_day_plan.length because split uses aftercare_plan. If that is patched in isolation, message_temperature=null is another unguarded failure. Static typecheck masks this runtime mismatch.

### Rendering

The required adapter mappings are:

- message_draft / recommended_message_draft → finalDraft;
- actions plus tonight plan entry → immediateAction;
- three_day_plan / aftercare_plan → phase-normalized plan;
- three_day_plan_commentary / aftercare_commentary → optional secondary detail;
- review_timing plus structured change_conditions → reassessment;
- nullable message_temperature and relationship_summary → explicit nullable projection fields.

The current draft surface is only a legacy blockquote. A split draft is silently omitted, and there is no explicit copy control.

### Presentation density

requestedTopics currently controls navigation and limited draft-absence copy, not section visibility. The renderer always exposes the full fixed section set and therefore turns internal evidence into customer-visible report sections regardless of semantic necessity.

Required separation:

1. complete internal audit model;
2. complete persisted Product report;
3. deterministic CustomerAssessmentProjection;
4. customer visual sections.

Structured audit fields must not be deleted merely to shorten the UI.

### Payment and Safety

Payment state is absent.

There is one internal assessment API route, no payment/checkout API route, no payment SDK, a fixture-only purchase preview, transactionState=not_started, provider=unselected, and disabled purchase controls.

No Safety-blocked request can currently reach payment because no request can reach payment. The public local UI also blocks non-normal states before purchase preview. This does not establish production pre-payment Safety because no payment integration exists.

Required future state sequence:

input
→ application-owned Safety eligibility
→ eligible purchase
→ payment
→ full Product generation/delivery

Blocked input must instead terminate at a separate nonjudgmental stop with no charge, Report, draft, workaround, later-contact plan, or hidden exception. While payment remains absent, eligible_payment_unavailable is the only truthful eligible terminal state.

## Architecture decision

Adopt:

Full structured report
→ deterministic CustomerAssessmentProjection
→ UI

The projection:

- preserves the original full report unchanged;
- performs no Provider call;
- invents no facts and rewrites no factual meaning;
- supports legacy and split explicitly;
- exposes exactly one normalized finalDraft, immediateAction, and reassessment field;
- handles nullable message temperature and relationship summary;
- uses requestedTopics plus validated source availability;
- never uses case IDs;
- uses semantic section selection instead of a fixed word-count rule;
- places optional detail behind secondary disclosure.

No additional presentation Provider stage is necessary. Package C may revise the existing PB-05 successor for content quality, but deterministic projection itself requires no generation.

## Packages A through F

- A — Runtime result normalization and customer projection
- B — Customer-facing note presentation
- C — PB-05 factual precision and anxiety-safe writing successor
- D — Deterministic evaluator and semantic-disposition successor
- E — Pre-payment Safety UX and payment gate
- F — Consolidated offline regression and successor package preparation

The machine-readable package plan fixes exact responsibility, prerequisites, proposed branch, pairwise-disjoint proposed paths, explicit non-goals, tests, acceptance gate, Provider-call requirement, and Human visual-review requirement for every package.

Provider calls are not required in any package as planned. Human visual review is mandatory for B, E, and the assembled Product view in F. Product Owner review of actual successor final outputs remains mandatory.

## Acceptance matrix

The 24-case offline matrix covers every required legacy/split/null/draft/Safety/Product/evaluator/payment case plus needs_more_information, send_now, current-direction contradiction, full-report immutability, and requestedTopics semantic selection.

Automated PASS never substitutes for Product Owner review.

## Capabilities

- status: v12_implementation_decomposition_ready_pending_human_chatgpt_review
- product_owner_charter_accepted: true
- runtime_output_compatibility_audited: true
- customer_projection_architecture_defined: true
- payment_safety_sequence_audited: true
- implementation_packages_defined: true
- v12_implementation_authorized: false
- provider_rerun_ready / authorized: false / false
- active_runtime_activated: false
- r4_authorized: false
- c2_authorized: false
- main_changed: false
- next_action: human_chatgpt_review_of_v12_implementation_decomposition

## Validation

The required gates are:

1. Dedicated P1 decomposition verifier
2. Frozen Product Owner decision verifier in its exact baseline context
3. Decision Policy verifier
4. typecheck
5. lint
6. build
7. git diff --check
8. final exact-scope and Git-state checks

Sequential validation result:

- Dedicated P1 decomposition verifier: PASS 43/43
- Product Owner decision verifier: PASS 39/39 in its required clean baseline/source-branch context
- Decision Policy: PASS 40/40; each decision 10/10; allowed-set violations 0; forbidden decisions 0; case-specific matching 0
- typecheck: PASS
- lint with max warnings 0: PASS
- production build: PASS; 28/28 static pages generated
- git diff --check: PASS; line-ending conversion warnings only
- final changed-path state before commit: exact 11/11; no generated next-env.d.ts change

The legacy Product Owner verifier was also invoked once in the primary worktree after the P1 files existed. Its 38 unchanged authority checks passed and only its pre-P1 exact-scope predicate failed, as expected, because it hard-codes the preceding Task's 11-path worktree. The same unchanged verifier passed 39/39 in a clean baseline clone. No old verifier or protected artifact was modified to bypass that predicate.

## Boundary

This Task performs Provider / DB / Supabase 0 / 0 / 0. It does not run the Provider runner or package-check and does not retry, repair, or fall back.

Runtime, Prompt, Catalog, Schema, evaluator, semantic disposition, UI, API route, payment, fixtures, migrations, Active Service, Active Runtime, main, R4, and C2 remain unchanged. PR, main merge, and force push are unauthorized.

No Package A through F implementation is authorized by this plan.
