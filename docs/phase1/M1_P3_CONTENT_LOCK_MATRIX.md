# M1-P3 Content Lock Matrix

## 1. Status and authority

- Task: `M1-P3 Reading Note Visual Excellence Specification`
- Status: `Draft completed; Human and ChatGPT review pending`
- Base commit: `7e02c5f38c37f0249b7b732fb1fc740a806f0562`
- Scope: documentation/design-only

This matrix defines two independent gates before any future Visual Excellence implementation: exact locks and semantic behavior assertions. It does not authorize fixture, application, or runtime changes. A mismatch is a stop condition, not permission to refresh the expected value. An exact hash proves byte/string equality only and must never be treated as proof that source behavior or user-facing meaning remains correct.

## 2. Exact-lock algorithms and equality forms

Four exact lock forms are used:

1. `scalar-utf8-sha256`: SHA-256 of the exact displayed Unicode string encoded as UTF-8, with no BOM, prefix, suffix, or trailing newline.
2. `source-slice-lf-sha256`: read the UTF-8 source file, normalize `CRLF` and bare `CR` to `LF`, extract the exact source slice from the named declaration marker through the named closing marker inclusive, and hash that slice with SHA-256. The recorded character count is the normalized slice length.
3. `fixture-object-diff-exact`: compare every named fixture/object owner and its containing file with the accepted base. The check passes only when the object-level assertion and `git diff --exit-code -- <exact paths>` both report no unauthorized mutation.
4. `rendered-string-exact`: assert that the rendered customer-facing string equals the locked Unicode scalar exactly at every named occurrence. Line wrapping and element boundaries may change only where the matrix explicitly allows them; paraphrase and normalization are not substitutes for equality.

Source-slice markers:

| Lock name | Start marker | End marker |
| --- | --- | --- |
| result normal | `const resultNormal001 = {` | `} as const satisfies ReviewReportFixture;` |
| public wait | `export const PUBLIC_SAMPLE_WAIT_CASE = {` | `} as const satisfies PublicSampleCase;` |
| public send | `export const PUBLIC_SAMPLE_SEND_CASE = {` | `} as const satisfies PublicSampleReportCase;` |
| public distance | `export const PUBLIC_SAMPLE_DISTANCE_CASE = {` | `} as const satisfies PublicSampleCase;` |
| Safety states | `export const REVIEW_SAFETY_STATES = {` | `} satisfies Record<string, ReviewSafetyState>;` |
| purchase confirmation | `const normalPurchaseConfirmation: ReviewPurchaseConfirmationFixture = {` | `};` |
| fixed product facts | `export const fixedProductFacts = [` | `] as const;` |
| unsupported cases | `export const unsupportedCaseCategories = [` | `] as const;` |

Do not hash formatted JSON produced by a new serializer. The source-slice method is intentionally independent of TypeScript evaluation and package installation.

## 3. Exact locks

The following table contains exact values and exact equality checks only. Where a row also has behavioral implications, those implications are verified independently in Section 4. Existing scalar and source-slice hashes remain authoritative; a hash of a summary sentence is not semantic evidence.

| Artifact | Route | Source file | Source object / field | Current exact value | SHA-256 or deterministic lock value | Exact lock type | Presentation changes allowed | Changes forbidden | Exact validation method |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Web and save source | `/review/result/result-normal-001`; `/review/save-report/result-normal-001` | `fixtures/review/reports.ts` | complete `resultNormal001` declaration | Entire fixed object, including IDs, consultation facts, judgment, letters, evidence, actions, draft, time plan, conditions, uncertainty, limitations, and metadata | `a313e2824593518f5fd5eddd4de8b8c37683c5c3bbe49d7669b7e92638542126` (`source-slice-lf`, 5,231 chars) | full object source lock | order of rendered elements, hierarchy, summary placement, typography, spacing, grouping, archetypes | any source-object edit, field removal/addition, wording or order change inside arrays, ID/schema change | recompute exact source slice; require expected hash and `git diff --exit-code -- fixtures/review/reports.ts` |
| Web fixed judgment | `/review/result/result-normal-001` | `fixtures/review/reports.ts` | `resultNormal001.judgmentLabel` | `今日は送らない方がいい` | `c87fe58e43ae8d87468d60450d326d2e651b03c338d8fcb20714e910ce91b291` | scalar text lock | repeat exact string in cover summary and detailed answer | paraphrase, intensify, soften, reverse, add certainty/probability | source assertion plus rendered-text exact equality at both locations |
| 保存用判断カード fixed judgment | `/review/save-report/result-normal-001` | `fixtures/review/reports.ts` | `resultNormal001.judgmentLabel` | `今日は送らない方がいい` | `c87fe58e43ae8d87468d60450d326d2e651b03c338d8fcb20714e910ce91b291` | scalar text lock | compact hierarchy and quick-reference recomposition | a different judgment, truncated meaning, or separate save-only conclusion | source assertion and rendered exact equality with Web |
| LP same-case preview judgment | `/#note` | `fixtures/review/reports.ts` via `app/page.tsx` | `preview.judgmentLabel` | `今日は送らない方がいい` | `c87fe58e43ae8d87468d60450d326d2e651b03c338d8fcb20714e910ce91b291` | scalar text lock | excerpt selection and preview layout | presenting the preview as a different result or changing the answer | source reference audit; rendered-text exact match |
| Public wait case | `/` different-case comparison | `fixtures/public/public-sample-cases.ts` | complete `PUBLIC_SAMPLE_WAIT_CASE` declaration | `sample-wait-001`; conclusion `今夜は送らず、明日以降に再判断する`; exact facts/actions/conditions/limits | `784e25504051ab9b0e238e9c70810f90f339005441d88e02577d9632e1262e91` (`source-slice-lf`, 949 chars) | full object source lock | display density, order, typography, grouping | case facts, ID, conclusion, action, timing, uncertainty changes | recompute slice and assert fixture file has no diff |
| Public wait conclusion | `/` | `fixtures/public/public-sample-cases.ts` | `PUBLIC_SAMPLE_WAIT_CASE.conclusion` | `今夜は送らず、明日以降に再判断する` | `8a67b8b408dde3de281605975c090aa97d8b45d94ccf01d94cd51aacf1f2cbbf` | scalar text lock | natural wrapping | shortening to a materially different judgment | scalar hash and exact rendered-text assertion |
| Public send case / full sample | `/`; `/sample-report` | `fixtures/public/public-sample-cases.ts` | complete `PUBLIC_SAMPLE_SEND_CASE` declaration | `sample-send-001`; conclusion, message, letter, actions, three-day direction, conditions, limits, disclosure | `3acd9f2d74463ba10f8cdf3436a7dd66504ecae083075e45eb86fc94ff7c83a3` (`source-slice-lf`, 2,222 chars) | full object source lock | shorter edited artifact composition using the same grammar | any case/report text, fact, judgment, ID, disclosure, or ordered-array change | recompute slice; require expected hash and no fixture diff |
| Public full-sample fixed judgment | `/sample-report` | `fixtures/public/public-sample-cases.ts` | `PUBLIC_SAMPLE_SEND_CASE.conclusion` | `今夜は短く返信してよい` | `cda9fe2062c0e55d1fb8b5bd69887f1d8fd525da18387ac660ec225cdc20b514` | scalar text lock | cover summary and answer presentation | wait/stop wording, added guarantee, stronger imperative | scalar hash; exact rendered-text assertion |
| Public full-sample disclosure | `/sample-report` | `fixtures/public/public-sample-cases.ts` | `PUBLIC_SAMPLE_SEND_CASE.report.fixedDisclosure` | `この全文見本は固定の架空ケースです。実在相談、購入者事例、レビュー、AI生成実績ではありません。` | `de7c0f96875ee9f473fe2d78e16aae42df5ee33998966bda605f1e5c15f1a7af` | scalar disclosure lock | placement and visual prominence may improve | deletion, abbreviation, implication of a real case/purchase/review/AI result | scalar hash and exact public rendered-text assertion |
| Public distance case | `/` different-case comparison | `fixtures/public/public-sample-cases.ts` | complete `PUBLIC_SAMPLE_DISTANCE_CASE` declaration | `sample-distance-001`; conclusion `こちらからの追加連絡を一度止める`; exact facts/actions/conditions/limits | `a3b1eb9df12abf3393906b1ca4da98000f471fc715632f030ab792baf760b08a` (`source-slice-lf`, 963 chars) | full object source lock | layout, hierarchy, responsive grouping | case facts, ID, conclusion, action, conditions, uncertainty changes | recompute slice and assert fixture file has no diff |
| Public distance conclusion | `/` | `fixtures/public/public-sample-cases.ts` | `PUBLIC_SAMPLE_DISTANCE_CASE.conclusion` | `こちらからの追加連絡を一度止める` | `69c66535528c3920260563477f43df6a67a95c45f0e8f026127bbf606bda7529` | scalar text lock | natural wrapping | soften to “wait” or turn into a guarantee | scalar hash and exact rendered-text assertion |
| Safety review-state object | `/review/request/**` | `fixtures/review/safety-states.ts` | complete `REVIEW_SAFETY_STATES` declaration | Seven exact state records, including names, fixture IDs, messages, actions, destinations, and `canReachConfirmation` values | `49f93126eb8448893c2065fa7232d0ade2d9bda17ee2949a8c4d50fb310d5d29` (`source-slice-lf`, 3,492 chars) | source-slice LF-normalized hash plus fixture/object diff | state presentation, spacing, hierarchy, non-color signals | any object, field, string, order, or continuation-flag mutation | recompute exact slice; require `git diff --exit-code -- fixtures/review/safety-states.ts` |
| Safety-before-payment scalar | purchase/request/legal surfaces | `lib/legal/review-content.ts` | `fixedProductFacts` entry labelled `Safety` | `安全確認を決済より前に行い、rejected と needs_review は初期MVPで購入不可` | `8d36beb99dfea8c513531dde7044e2ff94dd643258954f981945b686f4084ede` | scalar UTF-8 hash | explanatory order and visual treatment | scalar removal, abbreviation, or contradiction | recompute exact scalar hash and assert the exact source value; behavior is verified separately in Section 4 |
| Fixed product-fact registry | LP/legal/purchase/report surfaces | `lib/legal/review-content.ts` | complete `fixedProductFacts` declaration | service/category/product/price/unit/purchase/age/AI/method/non-guarantee/professional/Safety meanings | `9b63d8e80aa74b4262f753eaaaa7a2ed8f3e28f2a38934529a75bd07b24768e8` (`source-slice-lf`, 706 chars) | ordered registry source lock | presentation and repetition appropriate to context | fact/value edits, removal, contradiction | recompute slice; cross-route exact-value audit |
| Product name | all product surfaces | `lib/legal/review-content.ts`; purchase fixture | fixed product fact / `product.userFacingLabel` | `恋のメッセージ鑑定ノート` | `30ec625cb1be75273a07abc1fac2582f97bf36a0152de3762d62744f3807f404` | scalar product-name lock | typography and position | substitute formal name | scalar hash and source/rendered exact match |
| Long presentation name | Web/LP/purchase/comparison | purchase fixture and report UI | `product.included[0]` and labels | `Web鑑定ノート` | `60ca061b8ae285dff8c345b73401619e01dbe70e95705dae15c7a18c945c0830` | scalar product-name lock | typography and position | alternate formal long name | scalar hash and exact source/rendered match |
| Short presentation name | save/LP/purchase/comparison | purchase fixture and report UI | `product.included[1]` and labels | `保存用判断カード` | `a49675c69b4d2286e1ed0598904f1981262fec1f2fd23158788515326b2167cc` | scalar UTF-8 and rendered-string exact lock | in Checkpoint B / M1-I8-R1 only, align the saved-artifact title, report-comparison labels, Reading Note LP-preview labels, and customer-facing labels directly attached to a Reading Note artifact, within the exact mutation manifest | another formal name; unrelated body, fixture judgment, product-name, purchase/legal/request, or other copy changes | scalar hash; exact rendered-string assertions for named surfaces; manifest-scoped forbidden-term audit |
| Price | LP/purchase/legal | purchase fixture; `fixedProductFacts` | `product.price` | `税込980円` | `64ebe3457bc4aaf6f8d782733c11cbbfd563ddfb1e09a216a4fc88f6727b4f96` | scalar commercial lock | typography and grouping with unit | amount, tax treatment, discount, recurring price | scalar hash and cross-route exact-value search |
| Product unit | LP/purchase/legal | purchase fixture | `product.quantity` | `1相談 / 1鑑定ノート` | `29250189f7418c0571a67c06fb98eb3ae9dbe499f8b2df149dc1d19d457d23ca` | scalar commercial lock | line break around separator if meaning remains exact | quantity or subscription interpretation change | scalar hash and exact source assertion |
| Age | LP/request/purchase/legal | request fixture/form; `fixedProductFacts` | `adultConfirmed`; target-age value | `18歳以上` | `78cc97a99fe133f66562d307fc3d39f8a1ca1f8f71fc50cbd55881c83e54d4b5` | scalar eligibility lock | presentation and proximity to flow | lower age, optional status, DOB/ID-document requirement | scalar hash; source audit; invalid-age route remains fail closed |
| Purchase confirmation object | `/review/purchase/confirmation/normal-001` | `fixtures/review/purchase-confirmations.ts` | complete `normalPurchaseConfirmation` declaration | normal-only fixture; product facts; `not_started`; provider unselected; delivery unresolved | `05cbc1e3fd75e5687cda8211f3d0eb4f60e9278efb9caae9450898f510866458` (`source-slice-lf`, 602 chars) | full object source lock | hierarchy and artifact-preview alignment only in an authorized purchase-surface task | product/fact/state/provider/delivery/included-item edits in M1-I8-R1 | recompute slice; resolver tests; no purchase-fixture diff |
| Purchase-control text | `/review/purchase/confirmation/normal-001`; local request completion | `components/review/ReviewPurchaseConfirmation.tsx`; `components/request/RequestForm.tsx` | disabled-button visible text | `購入機能は現在準備中です` | `423281f6268a0a4394eb00af846ecf96cb5e5cc79406ca35149d503a9b78600a` | scalar UTF-8 and rendered-string exact lock | visual alignment with surrounding artifact system | alternate text or misleading success wording | exact scalar hash and rendered-string equality; disabled behavior is verified separately in Section 4 |
| Canonical category | LP/legal/purchase | purchase fixture; `fixedProductFacts` | `officialClassification` | `AIを活用した恋愛メッセージ分析・判断支援デジタルレポート` | `a38dcfc4e10cca96a68e2b7b541101a45a3e379aa2fe29020867df7bd667fe89` | scalar category lock | review/legal placement | fortune-telling/psychic category or provider-approval claim | scalar hash and exact source audit |
| AI-disclosure scalar | request/purchase/legal/report | `lib/legal/review-content.ts` | `fixedProductFacts` entry labelled `AI利用` | `AI利用を明示` | `84d6e431fbe9d3c6032a89a947d7c5925c222d7d1094794c92db8945a908a717` | scalar UTF-8 hash | hierarchy and concise repetition | exact scalar removal or substitution | recompute exact scalar hash; disclosure meaning and inactive runtime are verified separately in Section 4 |
| Non-guarantee scalar | LP/purchase/legal/report | `lib/legal/review-content.ts`; report fixture | `fixedProductFacts` entry labelled `非保証`; `fixedLimitationDisclaimer` remains inside the result object lock | `相手の本心、返信、復縁、未来または関係改善を保証しない` | `606dbf88f9dc613cd977c80dc156047e8f6aaf6175b7712b739d8249168b01db` plus result object lock | scalar UTF-8 plus source-slice lock | proximity, typography, grouping | exact scalar removal or substitution; report-disclaimer object drift | recompute scalar/source locks; non-guarantee meaning is verified separately in Section 4 |
| Unsupported-case category list | `/legal/unsupported-cases`; request Safety | `lib/legal/review-content.ts` | complete `unsupportedCaseCategories` declaration | Exact ordered 13-category source list | `5d30aa4447f10dd57a97d9981681e564fa58a91238cec3028e3e3b23d08f0737` (`source-slice-lf`, 365 chars) | source-slice LF-normalized hash plus exact rendered count/order | typography and grouping | source-list removal, addition, reordering, or wording drift | recompute slice; require no legal-content diff; assert exact rendered count and order |

## 4. Semantic behavior assertions

Every assertion below is evaluated against its named owners. These checks prove behavior or meaning and do not pass merely because a summary string or source slice has the expected hash.

| Assertion ID | Source files | Exact field / exported value / behavior owner | Required assertion | Prohibited condition | Validation method | Expected pass output |
| --- | --- | --- | --- | --- | --- | --- |
| `SEM-SAFETY-BEFORE-PAYMENT` | `lib/legal/review-content.ts`; `components/request/RequestForm.tsx`; `lib/safety/**` | `fixedProductFacts` Safety entry; `continueFromSafety`; `continueFromMemo`; `handleEmailSubmit` | Safety evaluation occurs before any purchase-confirmation state, and final submit revalidates input, Safety, and required acknowledgements | reaching purchase confirmation before Safety, or bypassing final revalidation through stale/deep-linked state | source-order assertion plus handler-level tests for every transition and final submit | `PASS semantic SEM-SAFETY-BEFORE-PAYMENT` |
| `SEM-NORMAL-ONLY` | `fixtures/review/safety-states.ts`; `lib/safety/classify.ts`; `components/request/RequestForm.tsx` | `REVIEW_SAFETY_STATES[*].canReachConfirmation`; `SafetyResult.classification`; continuation handlers | exactly one review state is continuation-enabled and only `normal_allowed` reaches ordinary confirmation | `needs_review`, `rejected`, or any other state reaches confirmation, purchase, or an ordinary report | assert exactly one `canReachConfirmation: true`; table-test every classification through all continuation handlers | `PASS semantic SEM-NORMAL-ONLY` |
| `SEM-FAIL-CLOSED` | `lib/safety/**`; `fixtures/review/safety-states.ts`; `components/request/RequestForm.tsx` | `classifySafetyInput`; `validateSafety`; `getReviewSafetyState`; final-submit guards | invalid, contradictory, missing-required-confirmation, and unknown review states stop or return an unavailable state without ordinary continuation | defaulting an unknown/invalid condition to normal, silently correcting contradiction, or rendering an ordinary report | table-driven negative cases plus resolver/handler assertions for no ordinary destination | `PASS semantic SEM-FAIL-CLOSED` |
| `SEM-AI-DISCLOSURE` | `lib/legal/review-content.ts`; `app/legal/ai-disclosure/page.tsx`; `components/request/RequestForm.tsx`; `fixtures/review/reports.ts` | `fixedProductFacts` AI entry; AI-disclosure page; request acknowledgement; `fixedLimitationDisclaimer` | intended future AI organization/analysis is disclosed while current M1 fixed-fixture/runtime inactivity remains explicit | hidden AI use, a claim of current AI execution, or a claim of training, generation, purchase, or delivery evidence | required-concept assertions across named owners plus prohibited-claim and runtime-integration audit | `PASS semantic SEM-AI-DISCLOSURE` |
| `SEM-NON-GUARANTEE` | `lib/legal/review-content.ts`; `fixtures/review/reports.ts`; `components/request/RequestForm.tsx`; `components/report/PublicSampleReport.tsx` | `fixedProductFacts` non-guarantee entry; `fixedLimitationDisclaimer`; acknowledgement and public limitation owners | no guarantee of the other person's mind, reply, reconciliation, future, or relationship improvement; no medical, psychological, or legal advice implication | certainty, outcome guarantee, professional-service substitution, or visual concealment of the limitation | named-concept assertions in source/rendered surfaces plus prohibited-claim audit; do not infer PASS from the scalar hash | `PASS semantic SEM-NON-GUARANTEE` |
| `SEM-UNSUPPORTED-CASES` | `lib/legal/review-content.ts`; `app/legal/unsupported-cases/page.tsx`; `lib/safety/**` | `unsupportedCaseCategories`; rendered category list; Safety classification rules | all 13 locked categories remain unsupported and cannot enter the ordinary Reading Note path | category omission/softening, ordinary continuation for a locked unsupported case, or invented/unverified emergency-contact content | exact count/order check plus table-driven classification and destination assertions | `PASS semantic SEM-UNSUPPORTED-CASES` |
| `SEM-PURCHASE-DISABLED` | `components/review/ReviewPurchaseConfirmation.tsx`; `components/request/RequestForm.tsx`; `fixtures/review/purchase-confirmations.ts` | native disabled buttons; absence of transaction handler; `normalPurchaseConfirmation.paymentStatus` | purchase remains visibly disabled, `not_started`, and incapable of invoking checkout or a provider | enabled purchase control, transaction handler, selected provider, misleading success, or checkout/network call | DOM/source assertion for native `disabled`; fixture-state assertion; handler/import/network audit | `PASS semantic SEM-PURCHASE-DISABLED` |
| `SEM-RUNTIME-INACTIVE` | `components/request/RequestForm.tsx`; `app/request/page.tsx`; `components/review/ReviewBanner.tsx`; `app/review/page.tsx`; `components/report/ReviewWebReport.tsx`; `components/report/ReviewSaveReport.tsx`; `components/report/ReportComparisonNavigation.tsx`; `package.json` | explicit inactive-runtime notices; absence of `app/api/**` and runtime owners for external send, persistence, payment, AI, email, or file generation | the current review implementation remains local/static and performs none of the listed runtime operations | API route, external request, persistence client, payment/AI/email integration, file generation, or wording that claims any operation occurred | prohibited-path/import/network/secret audit, named route-owner inspection, and production build | `PASS semantic SEM-RUNTIME-INACTIVE` |

## 5. Cover-summary rule

The Web and save cover summary is not a new content field. It must render the exact locked judgment:

```text
今夜の答え
今日は送らない方がいい
```

The public full sample must render:

```text
今夜の答え
今夜は短く返信してよい
```

Line wrapping and the label’s position may change. The answer string itself may not.

## 6. Required future validation output

Each authorized implementation checkpoint must record two separately labelled result sections.

`Exact locks` records:

- source commit;
- lock algorithm version (`M1-P3-lock-v1`);
- each expected and actual hash;
- pass/fail for every exact scalar and source-slice equality;
- pass/fail for each fixture/object diff;
- pass/fail for every named rendered-string equality; and
- `EXACT_LOCKS: PASS|FAIL`.

`Semantic behavior assertions` records, for every Section 4 row:

- assertion ID, named owners, validation method, and observed evidence;
- pass/fail for the required assertion and prohibited condition;
- customer-facing forbidden-term audit limited to the formal-name alignment manifest; and
- `SEMANTIC_ASSERTIONS: PASS|FAIL`.

The script prints `CONTENT_LOCK_GATE: PASS` only when `EXACT_LOCKS: PASS` and `SEMANTIC_ASSERTIONS: PASS`. Any mismatch prints the failing lock/assertion IDs, stops the checkpoint, and leaves this matrix unchanged.

## 7. Current gate

These locks are draft review material. Human and ChatGPT must accept M1-P3 before any implementation task may consume them. Acceptance of the matrix still does not authorize M1-I8-R1, M1-I9-R1, or M1-I12.
