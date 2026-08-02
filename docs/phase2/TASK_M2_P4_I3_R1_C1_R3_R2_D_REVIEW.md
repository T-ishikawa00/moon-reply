# M2-P4-I3-R1-C1-R3-R2-D Review

## Status

- Task: `M2-P4-I3-R1-C1-R3-R2-D`
- Status: `human_chatgpt_accepted_complete`
- Human / ChatGPT result: `OFFLINE COUNTERFACTUAL ACCEPTED COMPLETE`
- Offline Counterfactual accepted: `true`
- Accepted implementation commit: `8b9b4a4dff2992483266a3fb9bbc80b183091b2e`
- Immutable implementation snapshot: `9d2bd94a2629d97197c6ffbb0608ec573b9b824a..8b9b4a4dff2992483266a3fb9bbc80b183091b2e` (`10/10` exact paths; working tree excluded)
- Baseline: `9d2bd94a2629d97197c6ffbb0608ec573b9b824a`
- Branch: `test/m2-p4-i3-r1-c1-r3-r2-d-counterfactual-regression`
- Exact implementation scope: `10/10`
- Acceptance synchronization exact scope: `6/6`
- Non-sync evidence blobs unchanged: `4/4`
- Runner: `m2-p4-i3-r1-c1-r3-r2-d-offline-runner-v1`
- Candidate ready for Provider diagnostic: `true`
- Candidate ready for isolated E2E: `false`
- R3-R2-E ready / authorized: `true / false`
- R4 / C2 authorized: `false / false`

Human / ChatGPT accepts the immutable offline Counterfactual, legitimate-overlap, and historical six-stage regression evidence. This acceptance establishes only the offline structural boundary. It does not modify or activate Runtime, Prompt, Schema, Catalog, Pipeline, Service, migration, application, or UI code.

## Source authority

- Planning content: `212720bba2ebb805da9ef701d645359a6bd470a7`
- Planning acceptance: `7a4e5d3187e1731d677cc5aa19c23acdeb535ed8`
- Accepted C implementation: `7e09b540220eac3b0afb91bc9cfb822cc0ab632d`
- C acceptance / D baseline: `9d2bd94a2629d97197c6ffbb0608ec573b9b824a`
- Source Counterfactual Contract SHA-256: `a9690fdb2427e64b4edf0793ee5a1e9b85278b8e3f49f6ce6c331835fa6ee503`
- Copied cases SHA-256: `a9690fdb2427e64b4edf0793ee5a1e9b85278b8e3f49f6ce6c331835fa6ee503`

The copied cases are byte-identical to the accepted Planning Contract. The source Counterfactual Contract and Architecture Contract remain blob-identical to accepted Planning.

## Counterfactual inputs

Shared Base input:

- `current_situation`: `架空人物Aには、架空人物Bから業務日程を確認する質問が届いており、Aはまだ返信していません。質問に具体的な曜日や時刻は記載されていません。Aは業務目的だけの丁寧な短文で返信するかを相談しています。`
- `relationship`: `work_or_school`
- `requested_topics`: `decide_send_or_wait`, `draft_message`

Variants:

- Candidate A: `承知しました。CANDIDATE_SENTINEL_A_R3R2_7F19`
- Candidate B: `承知しました。CANDIDATE_SENTINEL_B_R3R2_4C82`
- Candidate null: `null`

Exactly one synthetic raw Base output was deep-cloned into A, B, and null execution. Fake Stage calls are evidence-only and are not external Provider calls.

## Shared Base evidence

- Base Request SHA-256: `9a95499937b754745db7a34c390367277536a42aa8615dfa84a1a9bb04f3ae0c`
- Shared raw Base output SHA-256: `fd03557f6c02c9efdfc01423b8fae2a9ed7635db30b4787f0fbe0e554995973c`
- Grounded Base Intake SHA-256: `09a7e8fcbcbe6c95eb8ea589168746d7df338da72775ebcce4f140d6ad82bfed`
- Base Legacy View SHA-256: `09a7e8fcbcbe6c95eb8ea589168746d7df338da72775ebcce4f140d6ad82bfed`
- Shared raw Base reuse: `3`
- A/B/null Base Request: byte-identical
- A/B/null grounded Base Intake: byte-identical
- A/B/null Base Legacy View: byte-identical
- Sentinel A count on every Base surface: `0`
- Sentinel B count on every Base surface: `0`
- `input:optional_message` Base source refs: `0`
- null Candidate PB-01C calls: `0`; persisted Stage status: `skipped`

## Gate and mutant results

- Counterfactual hard gates: `14/14 PASS`
- Negative mutants: `7/7 rejected as required`
- Legitimate literal overlap: `PASS`
- Production Source Integrity in overlap replay: `PASS`
- Arbitrary Candidate-literal Production rejection: absent
- Registered Sentinel count in overlap Base surfaces: `0`

The seven independent mutations cover the Base optional key, Base Timeline Sentinel, PB-02 raw Candidate, PB-03 Candidate Analysis, null PB-01C call, Base optional source ref, and arbitrary-literal false positive.

## Historical six-stage regression

- Active loader: `loadM2P4ProductQualityRuntimeStageCatalog`
- Active Catalog: `runtime-stage-catalog-v4.0.0`
- Topology: `legacy-six-v1`
- Stage order: `PB-01 / PB-02 / PB-03 / PB-04 / PB-05 / PB-06`
- `LEGACY-READY-001`: `PASS`
- `LEGACY-SAFETY-BLOCKED-001`: `PASS`
- `LEGACY-PB05-FAIL-STOPS-PB06-001`: `PASS`
- `LEGACY-DUPLICATE-READY-001`: `PASS`
- Historical regression: `4/4 PASS`
- Ready Runtime Report SHA-256: `71ff60b160f4b32972f00557f3422c02f8832daa5e02a23c55d1d4d35a9c4383`
- Ready Decision Card SHA-256: `7b1cff9d17b61c6173e18af771445f5d2c319d6be289dde9198a561c49f3937a`
- Runtime Report / Decision Card: deep-equal to independently constructed expected values
- PB-01C in legacy definitions or calls: `0`

## Invocation and operation evidence

- Fake split Stage invocations: `20` (`PB-01 3`, `PB-01C 2`, `PB-02 3`, `PB-03 3`, `PB-04 3`, `PB-05 3`, `PB-06 3`)
- Fake legacy Stage invocations: `20` (`PB-01 4`, `PB-02 4`, `PB-03 4`, `PB-04 3`, `PB-05 3`, `PB-06 2`)
- External Provider calls: `0`
- DB operations: `0`
- Supabase operations: `0`
- Real-user data: `0`
- Holdout use: `0`
- Migration application: `false`

## Protected assets

- D non-sync evidence blobs: `4/4 unchanged` from accepted implementation commit `8b9b4a4dff2992483266a3fb9bbc80b183091b2e`
- Accepted Planning blobs: `5/5 unchanged`
- Accepted A implementation blobs: `4/4 unchanged`
- Accepted B non-sync implementation blobs: `7/7 unchanged`
- Accepted C non-sync implementation blobs: `17/17 unchanged`
- Active v4 supporting, Prompt, and Schema assets: `19/19 unchanged from D baseline`
- Active Service: unchanged
- Active Runtime: unchanged and not activated
- `main` / `origin/main`: `61e33a10e195fad17e253a6b9719217e1992f273`, unchanged
- Migration `0004`: unchanged and unapplied

## Immutable implementation manifest

1. `evals/runtime/m2-p4-i3-r1-c1-r3-r2-d/counterfactual-cases-v1.json`
2. `evals/runtime/m2-p4-i3-r1-c1-r3-r2-d/counterfactual-results-v1.json`
3. `evals/runtime/m2-p4-i3-r1-c1-r3-r2-d/historical-regression-manifest-v1.json`
4. `evals/runtime/m2-p4-i3-r1-c1-r3-r2-d/capabilities-v1.json`
5. `scripts/lib/m2-p4-i3-r1-c1-r3-r2-d-offline-runner-v1.mjs`
6. `scripts/verify-m2-p4-i3-r1-c1-r3-r2-d-counterfactual.mjs`
7. `docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_D_REVIEW.md`
8. `docs/CURRENT_FOCUS.md`
9. `docs/WBS.md`
10. `docs/CODEX_HANDOFF.md`

This immutable historical snapshot is exactly `9d2bd94a2629d97197c6ffbb0608ec573b9b824a..8b9b4a4dff2992483266a3fb9bbc80b183091b2e`; it excludes the working tree.

## Exact acceptance-sync manifest

1. `evals/runtime/m2-p4-i3-r1-c1-r3-r2-d/capabilities-v1.json`
2. `docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_D_REVIEW.md`
3. `scripts/verify-m2-p4-i3-r1-c1-r3-r2-d-counterfactual.mjs`
4. `docs/CURRENT_FOCUS.md`
5. `docs/WBS.md`
6. `docs/CODEX_HANDOFF.md`

The four non-sync evidence blobs remain content-identical to accepted implementation commit `8b9b4a4dff2992483266a3fb9bbc80b183091b2e`: the cases, committed result, historical manifest, and offline runner. This `6/6` synchronization does not extend or rewrite the immutable `10/10` implementation snapshot.

## Validation

- Offline runner: `PASS`
- Accepted implementation verifier result: `PASS_47_CHECKS`
- Acceptance-aware dedicated verifier: `PASS` (`54` checks including the retained original `47`)
- Decision Policy: `40/40 PASS`
- Typecheck: `PASS`
- Lint: `PASS`, warnings `0`
- Build: `PASS`
- `git diff --check`: `PASS`

Validated sequentially:

1. `node scripts/lib/m2-p4-i3-r1-c1-r3-r2-d-offline-runner-v1.mjs --check`
2. `node scripts/verify-m2-p4-i3-r1-c1-r3-r2-d-counterfactual.mjs`
3. `node evals/quality/m2-p4-i1/verify-decision-policy.mjs`
4. `npm run typecheck`
5. `npm run lint`
6. `npm run build`
7. `git diff --check`

## Acceptance boundary

This evidence establishes offline Candidate source isolation, A/B/null Base invariance, legitimate-overlap no-false-positive behavior, and legacy-six regression only. It does not establish Luna semantic quality, Provider quality, live DB compatibility, isolated E2E readiness, or Runtime activation.

Human / ChatGPT acceptance is complete. R3-R2-E is ready but unauthorized and was not started. R4, C2, Provider execution, migration application, Supabase access, Runtime activation, PR creation, and main integration remain unauthorized. `main` remains `61e33a10e195fad17e253a6b9719217e1992f273`.
