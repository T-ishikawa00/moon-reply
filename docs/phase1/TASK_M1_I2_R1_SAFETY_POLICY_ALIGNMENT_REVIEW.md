# Task M1-I2-R1 Safety Policy Enforcement Alignment Review

## 1. Status

- Task ID: `M1-I2-R1`
- Task name: `Safety Policy Enforcement Alignment`
- Base commit: `6858352ceccc266c4e4e939507575cabbda49fc0`
- Branch: `fix/m1-i2-r1-safety-policy-alignment`
- Status: Human-accepted; implementation and automated validation complete
- Accepted implementation commit: `23ee6f3b98837e48628b59b41eab811da627e730`
- Prototype status: the previous M1-P3-R1 hard stop is resolved; coded visual prototype implementation may resume and is still zero before that work starts

## 2. Triggering semantic failure

The M1-P3-R1 preflight found that the exact locked 13 `unsupportedCaseCategories` labels did not all map to their required fail-closed Safety classifications. Confirmed failures were category 5 (home/workplace visit), 6 (threat/coercion), 10 (doxxing), 12 (illegal conduct), and 13 (third-party secret).

`SEM-UNSUPPORTED-CASES` is a required gate. It was not waived, removed, or converted into a hash-only check.

## 3. Root cause

- Structured Safety flags rejected only the existing flag vocabulary.
- Free-text detection used simple whitespace-stripped substring matching without NFKC normalization.
- Japanese inflection, particles, alternate expressions, and selected negation forms were not covered.
- No `illegal_conduct` or `third_party_secret` reason code/rule existed.
- `NONE_SAFETY_FLAG` plus previously undetected free text could therefore return `normal_allowed`.
- The shared `shouldBlockNormalConfirmation` result still blocked only `reject`, despite the accepted M1 rule that every non-`normal_allowed` result stops ordinary confirmation.

This is an implementation coverage gap, not a defect in the accepted inspection or the locked unsupported-case list.

## 4. Human authorization

Human originally authorized only this bounded Safety correction, its permanent regression verifier, the named status/review documents, one dedicated-branch commit, and push to that branch. Human subsequently accepted implementation commit `23ee6f3b98837e48628b59b41eab811da627e730`, authorized fast-forward synchronization to `main`, and continued the separate M1-P3-R1 coded visual prototype authorization. Canonical UI or Reading Note changes, Checkpoint A, Checkpoint B, M1-I9-R1, M1-I12, Milestone 1 acceptance, and Milestone 2 remain unauthorized.

## 5. Required 13-category mapping

| # | Locked category | Classification | Reason | Result |
| --- | --- | --- | --- | --- |
| 1 | 自分を傷つけたい気持ちがある相談 | `rejected` | `self_harm` | PASS |
| 2 | 相手を傷つけたい気持ちがある相談 | `rejected` | `harm_others` | PASS |
| 3 | DV、暴力、強い恐怖または虐待を含む相談 | `needs_review` | `dv_abuse_fear` | PASS |
| 4 | 待ち伏せを考えている相談 | `rejected` | `waiting_or_ambush` | PASS |
| 5 | 相手の家や職場へ行こうとしている相談 | `rejected` | `stalking_or_visit` | PASS |
| 6 | 脅迫または強要を含む相談 | `rejected` | `threat_or_coercion` | PASS |
| 7 | 相手を監視しようとする相談 | `rejected` | `surveillance` | PASS |
| 8 | 相手のアカウントへの不正ログインまたはログイン確認を含む相談 | `rejected` | `surveillance` | PASS |
| 9 | 相手の居場所を確認または追跡しようとする相談 | `rejected` | `surveillance` | PASS |
| 10 | 本名、住所その他の個人情報を晒そうとする相談 | `rejected` | `doxxing` | PASS |
| 11 | 未成年との不適切な恋愛または面会を進める相談 | `rejected` | `minor_related` | PASS |
| 12 | 違法行為を含み、または助長する相談 | `rejected` | `illegal_conduct` | PASS |
| 13 | 第三者の秘密情報を含む相談 | `rejected` | `third_party_secret` | PASS |

Every result above blocks normal confirmation, including category 3 `needs_review`.

## 6. Files changed

- `lib/safety/types.ts`
- `lib/safety/rules.ts`
- `lib/safety/classify.ts`
- `scripts/verify-m1-safety-policy.mjs`
- `docs/CURRENT_FOCUS.md`
- `docs/CODEX_HANDOFF.md`
- `docs/WBS.md`
- `docs/phase1/IMPLEMENTATION_WBS.md`
- `docs/phase1/M1_IMPLEMENTATION_SLICES.md`
- `docs/phase1/TASK_M1_I2_R1_SAFETY_POLICY_ALIGNMENT_REVIEW.md`

`lib/safety/index.ts` required no change.

## 7. New reason codes

- `illegal_conduct`
- `third_party_secret`

Existing reason-code meanings, classifications, and severity levels were not changed.

## 8. Free-text coverage

The classifier now applies NFKC, lowercase, and whitespace normalization before matching. Coverage was added only for targeted visit/approach, threat/coercion, doxxing, illegal-conduct, and third-party-secret phrases. A bounded excluded-phrase mechanism removes named benign negations before positive matching; no standalone wide rule for `違法`, `秘密`, `職場`, or similar broad words was added.

Natural-language verification:

| Domain | Example | Expected | Result |
| --- | --- | --- | --- |
| `stalking_or_visit` | 今から相手の家へ行こうと思っています | `rejected` | PASS |
| `stalking_or_visit` | 相手の職場に押しかけようと考えています | `rejected` | PASS |
| `threat_or_coercion` | 言うことを聞かせるために脅迫したい | `rejected` | PASS |
| `threat_or_coercion` | 断っても従わせるつもりです | `rejected` | PASS |
| `doxxing` | 相手の本名を公開するつもりです | `rejected` | PASS |
| `doxxing` | 住所をネットに晒そうと思います | `rejected` | PASS |
| `illegal_conduct` | 違法な方法を使う手順を知りたい | `rejected` | PASS |
| `illegal_conduct` | 犯罪を手伝う相談です | `rejected` | PASS |
| `third_party_secret` | 第三者の秘密情報を使う内容です | `rejected` | PASS |
| `third_party_secret` | 他人の秘密情報を含む相談です | `rejected` | PASS |

## 9. Structured flag preservation

All ten existing `SAFETY_SELECTED_FLAGS` retain their existing `normal` / `review` / `reject` classification, severity, and reason-code mapping. The verifier executes the real `classifySafetyInput` for every structured flag. `needs_review` remains a review classification but now truthfully reports that normal confirmation is blocked.

## 10. Normal and negative controls

| Input | Expected | Result |
| --- | --- | --- |
| 相手の職場が忙しいと聞きました | `normal_allowed` | PASS |
| 個人情報を入力しないようにしたいです | `normal_allowed` | PASS |
| 違法ではないか不安です | `normal_allowed` | PASS |
| 第三者の秘密は入力しません | `normal_allowed` | PASS |
| 家に行く予定はありません | `normal_allowed` | PASS |
| 返信のタイミングを落ち着いて考えたいです | `normal_allowed` | PASS |

## 11. Permanent verifier

`scripts/verify-m1-safety-policy.mjs`:

- compiles and executes the actual TypeScript classifier and actual `unsupportedCaseCategories` export;
- uses the repository's existing TypeScript compiler without adding a package;
- compiles into a unique OS temporary directory and removes it in `finally`;
- verifies the locked source-slice SHA-256 and character count;
- verifies exact categories, natural-language variants, benign controls, all structured flags, a normal control, and contradictory selection; and
- exits `0` only when the complete task gate passes, otherwise prints the case ID, expected value, actual value, and observed reason codes and exits `1`.

## 12. Exact lock status

- Lock: `unsupportedCaseCategories` complete source slice
- Algorithm: source-slice LF-normalized SHA-256
- Expected/actual length: `365` / `365`
- Expected/actual SHA-256: `5d30aa4447f10dd57a97d9981681e564fa58a91238cec3028e3e3b23d08f0737` / `5d30aa4447f10dd57a97d9981681e564fa58a91238cec3028e3e3b23d08f0737`
- Result: PASS

No expected hash was refreshed. `docs/phase1/M1_P3_CONTENT_LOCK_MATRIX.md` was not changed.

## 13. Semantic assertion status

- `SEM-UNSUPPORTED-CASES`: PASS
- Evidence: all 13 locked source labels classify to the required state/reason and every non-normal state reports normal confirmation blocked.
- Waiver: none

This task does not claim to rerun unrelated M1-P3 semantic assertions.

## 14. Typecheck

`npm.cmd run typecheck`: PASS

## 15. Lint

`npm.cmd run lint`: PASS with zero warnings.

## 16. Build

`npm.cmd run build`: PASS. Next.js generated all 28 static/SSG pages. This is terminal evidence only, not Browser or Human visual evidence.

## 17. Prohibited-scope audit

- `app/**`: no diff
- `components/**`: no diff
- `fixtures/**`: no diff
- `package.json` and `package-lock.json`: no diff
- `supabase/**`: no diff
- `docs/phase1/M1_P3_CONTENT_LOCK_MATRIX.md`: no diff
- Canonical UI, Reading Note, LP, Request Form UI, Legal UI, Figma, and prototype route: no change
- Browser and screenshot use: none

## 18. Human acceptance

Human accepted M1-I2-R1 at implementation commit `23ee6f3b98837e48628b59b41eab811da627e730`. Automated evidence remains distinct from that Human decision. No visual acceptance is claimed because no visual surface changed and Browser/screenshot use was prohibited.

## 19. Next gate

The separately governed M1-P3-R1 coded visual prototype may resume from its prior stopped state and implementation zero. Checkpoint A, Checkpoint B, M1-I9-R1, M1-I12, Milestone 1 acceptance, and Milestone 2 remain unauthorized.
