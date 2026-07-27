# Task M2-P2-B0 Review Record

## 1. Task identity

- Task: `M2-P2-B0 One-Case Paid Calibration Contract Foundation`
- Branch: `design/m2-p2-b0-calibration-contract`
- Base main SHA: `cadd019303247310623f582a505d5745c0186b30`
- Successor-tool correction commit: `a757e7f28affe29a423ff817872a1a7f650a7fd2`
- Required implementation commit: `docs: define one-case paid calibration contract`
- Historical boundary correction commit: `88b456622950622c35510f4b3b9d19abbd9ec8da`
- State: full automated validation passes; exact B0 implementation commit and normal feature-branch push pending; Human / ChatGPT acceptance pending

## 2. Authority

Authorized:

- one development case contract for `WAIT-003`;
- one cost-and-plumbing candidate, `gpt-5.6-luna`;
- PB-01 through PB-06, each at most once;
- exact future Responses request parameters;
- deterministic local budget and contract preparation;
- permanent local-only verification;
- documentation/status synchronization;
- two independent commits and normal feature-branch push.

Not authorized:

- API or network execution;
- API-key access;
- provider executor or live CLI;
- model-quality benchmark or product/baseline model selection;
- retry, Repair, fallback, 14-case, 70-case, or holdout execution;
- real-user data;
- application/runtime/UI/package/dependency changes;
- M2-P2-B1;
- main mutation, merge, rebase, force push, or PR creation.

## 3. Independent correction boundaries

The committed M2-P2-B0-R1 correction added only:

- `docs/phase2/TASK_M2_P2_B0_R1_SUCCESSOR_TOOL_ALLOWLIST.md`
- `scripts/verify-m2-eval-foundation.mjs`

It fixed the successor-tool allowlist with two exact optional paths and no wildcard, prefix family, or self-authorizing configuration. No B0 implementation file was included in that commit.

The committed and pushed M2-P2-B0-R2 correction added only:

- `scripts/verify-m2-zero-cost-estimator.mjs`
- `docs/phase2/M2_P2_A_HISTORICAL_SCOPE.json`
- `docs/phase2/TASK_M2_P2_B0_R2_HISTORICAL_SCOPE_BOUNDARY.md`

It anchors M2-P2-A exact-scope verification to the immutable historical range `deff429e45a411f0d6c6d5bd3f199adca994ebb5..2e2e0cc4c57c46320d56aa986055f65187aa6aee`. B0 paths are not part of that snapshot. The B0 verifier separately requires the exact R2 three-file boundary and exact B0 18-file manifest.

## 4. Exact B0 implementation manifest

New documents:

- `docs/phase2/M2_P2_B0_ONE_CASE_CALIBRATION_CONTRACT.md`
- `docs/phase2/M2_P2_B0_SECURITY_AND_BUDGET_POLICY.md`
- `docs/phase2/TASK_M2_P2_B0_REVIEW.md`

New machine-readable contract:

- `evals/calibration/README.md`
- `evals/calibration/one-case-contract-v1.json`
- `evals/calibration/stage-plan-v1.json`
- `evals/calibration/artifact-contract-v1.json`
- `evals/calibration/security-policy-v1.json`
- `evals/calibration/reports/contract-preview-v1.json`

New Schemas:

- `evals/calibration/schemas/one-case-contract.schema.json`
- `evals/calibration/schemas/stage-plan.schema.json`
- `evals/calibration/schemas/artifact-contract.schema.json`

New scripts:

- `scripts/prepare-m2-p2-b0-calibration-contract.mjs`
- `scripts/verify-m2-p2-b0-calibration-contract.mjs`

Modified status documents:

- `docs/ROADMAP.md`
- `docs/CURRENT_FOCUS.md`
- `docs/CODEX_HANDOFF.md`
- `docs/WBS.md`

Total B0 manifest: 18 files. Package and dependency changes: zero.

## 5. Contract summary

- case: `WAIT-003`, development, exact case hash registered
- candidate: `gpt-5.6-luna`
- product selected: false
- baseline selected: false
- provider calls: six maximum
- local deterministic steps: four
- PB-07: excluded
- reasoning effort: low
- total output cap: 20,500
- expected static conservative cost: USD 0.163123
- expected/recomputed hard cap: USD 0.213223
- preflight ceiling: USD 0.30
- future absolute Human ceiling: USD 1
- current authorization/spend: USD 0
- retry/Repair/fallback: false
- live execution: false

## 6. Automated gates

| Gate | Result |
| --- | --- |
| all 21 named `M2_B0_*` gates | `PASS` |
| `M2_B0_EXACT_SCOPE_GATE` | `PASS` |
| `M2_P2_B0_CALIBRATION_CONTRACT_GATE` | `PASS` |
| deterministic prepare | `PASS` |
| contract hash | `c3dfdc5ec6cb503a8d91ed4080c8734c9af9c7bf944e1bb6b5798536bb6c38e2` |
| recomputed hard-cap standard cost | `USD 0.213223` |
| `M2_P2_A_HISTORICAL_SCOPE_CONTRACT_GATE` | `PASS` |
| `M2_P2_A_HISTORICAL_SCOPE_HISTORY_GATE` | `PASS` |
| `M2_P2_A_EXACT_SCOPE_GATE` | `PASS` |
| `M2_ZERO_COST_ESTIMATOR_GATE` | `PASS` |
| `M2_EVAL_FOUNDATION_GATE` | `PASS` |
| `CONTENT_LOCK_GATE` | `PASS` |
| `SAFETY_POLICY_GATE` | `PASS` |
| typecheck | `PASS` |
| lint | `PASS`, warning 0 after removing one unused local variable |
| build | `PASS` — 28 static/SSG pages generated |
| `git diff --check` | `PASS` |

M2-P2-B0-R2 resolves the prior false failure at the correct seam. The verifier now compares only the fixed accepted M2-P2-A commit range and ignores current HEAD after the historical end, index, unstaged, untracked, B0, and later lifecycle files. The parent exact-scope gate passes only when both historical sub-gates pass.

B0 remains independently bounded. Its exact-scope gate filters only the fixed R2 three-file correction manifest, requires exactly the authorized B0 18-file manifest, and requires zero protected-path diffs. No wildcard, prefix, or self-authorizing successor scope was added.

## 7. Prohibited-scope audit

- OpenAI API/provider/runtime network calls: zero
- provider executor: zero
- secret reads: zero
- API spend: USD 0
- live authorization: false
- application/UI diff: zero
- package diff: zero
- accepted fixture/Schema/Prompt/hash diff: zero
- M2-P2-A report diff: zero
- holdout data: zero
- real-user data: zero

## 8. Known limitations

- Model availability and authorization for the local project are unverified.
- No provider has validated the pre-registered request contract.
- Static byte/token estimates are not actual tokenizer or provider usage.
- Actual input, cached input, output, reasoning, total usage, latency, refusal, and returned model ID remain unknown.
- USD values are estimates, not final billed cost.
- No model-quality, development, holdout, stability, or Human product-quality result exists.

## 9. Next Human gate

Commit and normally push the exact B0 18-file implementation manifest. After that mechanical publication step, the next gate is Human / ChatGPT review and acceptance of the fixed B0 contract. Automated PASS is not provider validation, model-quality evidence, live authorization, or Human acceptance.

Any future B1 still requires a new, separately committed Human approval binding the exact approved contract hash, `WAIT-003`, `gpt-5.6-luna`, PB-01 through PB-06, and the USD 1 absolute ceiling.

No live execution is authorized by this record.
