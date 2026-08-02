# M2-P4-I3-R1-C1-R3-R2-D Review

## Status

- Task: `M2-P4-I3-R1-C1-R3-R2-D`
- Status: `offline_counterfactual_passed_pending_human_chatgpt_review`
- Baseline: `9d2bd94a2629d97197c6ffbb0608ec573b9b824a`
- Branch: `test/m2-p4-i3-r1-c1-r3-r2-d-counterfactual-regression`
- Exact scope: `10/10`
- Runner: `m2-p4-i3-r1-c1-r3-r2-d-offline-runner-v1`
- Human / ChatGPT review: pending
- R3-R2-E: unauthorized

This Slice creates offline test and evidence assets only. It does not modify or activate Runtime, Prompt, Schema, Catalog, Pipeline, Service, migration, application, or UI code.

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

- Accepted Planning blobs: `5/5 unchanged`
- Accepted A implementation blobs: `4/4 unchanged`
- Accepted B non-sync implementation blobs: `7/7 unchanged`
- Accepted C non-sync implementation blobs: `17/17 unchanged`
- Active v4 supporting, Prompt, and Schema assets: `19/19 unchanged from D baseline`
- Active Service: unchanged
- Active Runtime: unchanged and not activated
- `main` / `origin/main`: `61e33a10e195fad17e253a6b9719217e1992f273`, unchanged
- Migration `0004`: unchanged and unapplied

## Validation

- Offline runner: `PASS`
- Dedicated verifier: `PASS` (`47` checks)
- Decision Policy: `40/40 PASS`
- Typecheck: `PASS`
- Lint: `PASS`, warnings `0`
- Build: `PASS`
- `git diff --check`: `PASS`

## Acceptance boundary

This evidence establishes offline Candidate source isolation and legacy-six regression only. It does not establish Luna quality, Provider quality, live DB compatibility, isolated E2E readiness, or Runtime activation. R3-R2-E, R4, C2, PR, and main merge remain unauthorized.
