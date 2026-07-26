# Task M2-P1-R2 Acceptance Manifest Boundary Correction

## 1. Triggering failure

The authorized M2-P1 acceptance synchronization preserved nine uncommitted status/review-document changes. `M2_EXACT_MANIFEST_GATE` then failed because the verifier compared the R1 starting commit to the current working tree, producing 44 changed files and 17 documentation files instead of the accepted R1 snapshot of 42 changed files and 15 documentation files.

## 2. Historical versus lifecycle mutation distinction

The M2-P1-R1 exact mutation manifest is a historical record of the accepted R1 implementation range. Later acceptance and lifecycle documentation belongs to separately bounded work and must neither rewrite nor expand that historical record.

## 3. Incorrect old comparison boundary

The previous verifier used the R1 starting commit as the lower bound but omitted a committed upper bound. Git therefore included the current index, working tree, and later uncommitted documentation in the R1 comparison.

## 4. Accepted base SHA

The accepted R1 historical base is `432dbc76b79483616ee5fa4364e7bbc4d5d1dee7`.

## 5. Accepted end SHA

The accepted R1 implementation endpoint is `c56f597d0491482995c4afa6fb64cf148dd66345`.

## 6. Preserved 42-file manifest

The R1 manifest remains unchanged at 42 files: 5 added, 37 modified, 0 deleted, with root counts `ai: 13`, `docs: 15`, `evals: 13`, and `scripts: 1`. Its file list and A/M/D statuses remain unchanged.

## 7. Preserved acceptance working tree

The nine authorized acceptance documents remain modified and uncommitted during the R2 correction. No reset, restore, clean, stash, deletion, or rollback is used.

## 8. Verifier correction

The canonical manifest now declares an immutable historical commit range. The verifier validates exact scope fields, full commit SHAs, commit existence, base-to-end ancestry, and end-to-current-HEAD ancestry. It compares both the 42-file R1 snapshot and the 57-file accepted foundation snapshot only against committed history ending at `c56f597d0491482995c4afa6fb64cf148dd66345`.

## 9. No contract weakening

The correction does not remove file, count, root-breakdown, or A/M/D checks. It continues to detect missing or unexpected historical paths, wrong statuses, wrong totals, malformed scope, missing commits, and non-ancestor ranges. Current and future work remains subject to independent task-specific scope gates.

## 10. Validation

Status: PASS on 2026-07-26 with the nine authorized acceptance documents still modified and uncommitted.

- `M2_EXACT_MANIFEST_SCOPE_GATE`: PASS
- `M2_EXACT_MANIFEST_HISTORY_GATE`: PASS
- `M2_EXACT_MANIFEST_GATE`: PASS
- `M2_EVAL_FOUNDATION_GATE`: PASS
- `CONTENT_LOCK_GATE`: PASS
- `SAFETY_POLICY_GATE`: PASS
- typecheck: PASS
- lint: PASS, warning 0
- build: PASS, 28 static/SSG pages generated
- `git diff --check`: PASS

## 11. Correction commit boundary

The correction commit may contain exactly:

- `scripts/verify-m2-eval-foundation.mjs`;
- `docs/phase2/M2_P1_EXACT_MUTATION_MANIFEST.json`; and
- `docs/phase2/TASK_M2_P1_R2_ACCEPTANCE_MANIFEST_BOUNDARY.md`.

The correction commit message is `fix: anchor M2-P1 exact manifest verification`.

## 12. Acceptance resume condition

Acceptance synchronization may resume only after every correction gate passes, the correction commit contains exactly the three authorized files, the nine acceptance documents remain uncommitted, and the correction commit is a direct child of `c56f597d0491482995c4afa6fb64cf148dd66345`.

M2-P2 planning and every provider, model, database, authentication, payment, email, API, server-action, UI, and runtime implementation remain unauthorized.
