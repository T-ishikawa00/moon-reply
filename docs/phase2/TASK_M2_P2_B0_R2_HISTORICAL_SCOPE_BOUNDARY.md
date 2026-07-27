# M2-P2-B0-R2 Historical Estimator Scope Boundary Correction

## 1. Status

`AUTOMATED_PASS_PENDING_COMMIT`. M2-P2-B0-R2 corrects only the historical M2-P2-A exact-scope boundary. It does not authorize live execution, M2-P2-B1, API spend, main merge, or a pull request.

## 2. Triggering failure

The accepted M2-P2-A estimator gates passed except `M2_P2_A_EXACT_SCOPE_GATE`. The failure occurred only after the authorized M2-P2-B0 18-file working tree was added after M2-P2-A.

## 3. Human authorization

Human authorization fixes M2-P2-A as an immutable historical 16-file snapshot, preserves the uncommitted B0 18-file working tree, requires independent correction and B0 commits, permits a normal non-force feature-branch push, and prohibits reset, restore, clean, stash, rebase, force push, main merge, PR creation, B1 implementation, provider execution, and API spend.

## 4. Preserved B0 18-file working tree

The existing B0 working tree remains a separate exact manifest: 4 modified lifecycle documents and 14 added contract, policy, schema, preview, documentation, and local-only verifier/preparation files. None of these paths is added to the M2-P2-A historical scope.

## 5. Old verifier owner

In `scripts/verify-m2-zero-cost-estimator.mjs`, `verifyProhibitedImplementation()` owned the `M2_P2_A_EXACT_SCOPE_GATE` assertion. It consumed the mutation list returned by `taskMutations()`.

## 6. Incorrect old comparison boundary

`taskMutations()` ran `git diff --name-status e673d015ea7da1f6f1d6f00457014f07072d3011 --` and merged untracked paths from `git status --porcelain=v1 --untracked-files=all`.

That comparison used the M2-P1 foundation commit, not the accepted M2-P2-A historical range. `git diff <commit>` compared the named commit with the current working tree, so it incorporated later committed HEAD history plus tracked index and unstaged state. The additional status read incorporated untracked files. Consequently, valid later lifecycle commits and the uncommitted B0 manifest enlarged the supposed M2-P2-A scope.

## 7. Historical M2-P2-A base SHA

`deff429e45a411f0d6c6d5bd3f199adca994ebb5`

## 8. Historical M2-P2-A end SHA

`2e2e0cc4c57c46320d56aa986055f65187aa6aee`

## 9. Preserved 16-file evidence

The authoritative `git diff --name-status <base> <end> --` contains exactly:

| Status | Path |
| --- | --- |
| M | `docs/CODEX_HANDOFF.md` |
| M | `docs/CURRENT_FOCUS.md` |
| M | `docs/ROADMAP.md` |
| M | `docs/WBS.md` |
| A | `docs/phase2/M2_P2_A_STATIC_ESTIMATE_REPORT.md` |
| A | `docs/phase2/M2_P2_A_ZERO_COST_ESTIMATOR_SPEC.md` |
| A | `docs/phase2/TASK_M2_P2_A_REVIEW.md` |
| A | `evals/cost-estimator/README.md` |
| A | `evals/cost-estimator/estimator-config-v1.json` |
| A | `evals/cost-estimator/price-catalog-v1.json` |
| A | `evals/cost-estimator/reports/static-estimate-v1.json` |
| A | `evals/cost-estimator/scenario-catalog-v1.json` |
| A | `evals/cost-estimator/stage-size-profiles-v1.json` |
| A | `scripts/estimate-m2-static-costs.mjs` |
| A | `scripts/render-m2-dry-run-requests.mjs` |
| A | `scripts/verify-m2-zero-cost-estimator.mjs` |

The root breakdown is 7 `docs`, 6 `evals`, and 3 `scripts` files.

## 10. Separate B0 18-file evidence

`scripts/verify-m2-p2-b0-calibration-contract.mjs` owns the B0 manifest independently from the M2-P2-A verifier. Its fixed manifest requires exactly 18 authorized B0 paths and A/M statuses relative to `a757e7f28affe29a423ff817872a1a7f650a7fd2`. The fixed R2 three-file correction boundary is verified separately and excluded before the B0 manifest comparison.

## 11. No-wildcard/no-broad-allowlist policy

Neither verifier accepts a wildcard, directory prefix, current-tree-derived path, or arbitrary successor path. The historical verifier uses two hard-coded full commit SHAs and exact A/M/D path records. The B0 verifier uses its exact 18-file manifest and only the exact three R2 correction paths. B0 cannot amend or self-authorize the historical M2-P2-A snapshot.

## 12. Verifier correction

The estimator verifier parses `docs/phase2/M2_P2_A_HISTORICAL_SCOPE.json`, validates its immutable metadata and exact file records, verifies both commit objects and ancestry, and computes the authoritative scope only with:

```text
git diff --name-status deff429e45a411f0d6c6d5bd3f199adca994ebb5 2e2e0cc4c57c46320d56aa986055f65187aa6aee --
```

Current HEAD after the end commit is allowed but excluded. Index, unstaged, untracked, B0, R2, and later status documents are excluded from the historical diff.

## 13. New gates

- `M2_P2_A_HISTORICAL_SCOPE_CONTRACT_GATE` validates the immutable machine-readable contract.
- `M2_P2_A_HISTORICAL_SCOPE_HISTORY_GATE` validates commit existence, ancestry, the fixed historical diff, exact statuses, count, and root breakdown.
- `M2_P2_A_EXACT_SCOPE_GATE` passes only when both historical sub-gates pass.
- `M2_B0_EXACT_SCOPE_GATE` independently validates the exact B0 18-file manifest, fixed R2 correction boundary, and protected-path zero diffs.

## 14. Correction validation

The required suite passed while all B0 files remained uncommitted:

- deterministic B0 preparation: PASS, contract hash `c3dfdc5ec6cb503a8d91ed4080c8734c9af9c7bf944e1bb6b5798536bb6c38e2`, hard cap `USD 0.213223`;
- `M2_B0_EXACT_SCOPE_GATE`: PASS;
- `M2_P2_B0_CALIBRATION_CONTRACT_GATE`: PASS;
- both historical sub-gates, `M2_P2_A_EXACT_SCOPE_GATE`, and `M2_ZERO_COST_ESTIMATOR_GATE`: PASS;
- `M2_EVAL_FOUNDATION_GATE`: PASS;
- `CONTENT_LOCK_GATE` and `SAFETY_POLICY_GATE`: PASS;
- typecheck: PASS;
- lint: PASS with warning 0;
- production build: PASS; and
- `git diff --check`: PASS.

No live/provider/API action was part of validation. API calls, API key reads, and spend remained zero.

## 15. Correction commit boundary

The correction commit is limited to:

- `scripts/verify-m2-zero-cost-estimator.mjs`
- `docs/phase2/M2_P2_A_HISTORICAL_SCOPE.json`
- `docs/phase2/TASK_M2_P2_B0_R2_HISTORICAL_SCOPE_BOUNDARY.md`

The commit message is `fix: anchor M2-P2-A exact scope verification`. The B0 18 files must remain unstaged and uncommitted during this commit.

## 16. B0 resume condition

B0 may resume only after all correction and predecessor gates pass with the preserved B0 contract hash, hard-cap estimate, exact case/model/stage policy, zero external execution, zero secret read, and USD 0 spend. B0 remains a separate exact 18-file commit.

## 17. API/runtime prohibition

M2-P2-B0 is contract-only. Live execution is false. No network/provider executor, retry, Repair, fallback, PB-07, 14/70/holdout execution, real-user data, application/UI/package change, API key read, or API call is authorized. M2-P2-B1 remains unauthorized and not started.
