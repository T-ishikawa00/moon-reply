# M1_UI_STATE_MATRIX.md

## 0. Status and Rules

- Task M1-P1 planning artifact aligned by Task M1-P1-R1; both await final Human review
- Implementation not authorized
- All review data is deterministic fixture/mock data
- `needs_review` and `rejected` cannot reach purchase or an ordinary report
- Unknown/error states fail closed
- No state sends, saves, pays, calls AI, sends email, or writes analytics
- Every `/review/**` state shows `審査用プレビュー｜実際の決済・送信は行われません` with accessible detail `この画面は架空データを使用しています。AI生成、メール配信、データ保存も動作しません。`

## 1. State Matrix

| State ID | Route/screen | Trigger | Data source | User message | Primary action | Secondary action | Can continue | Can reach purchase | Can view report | Review inspection method | Safety/privacy notes | Implementation slice |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| M1-S01 | `/` LP default | Direct visit | Existing static product content | Product, AI use, 税込980円, single/no-renewal conditions, Web/save outputs, limits, and payment-unavailable status | `鑑定ノートを依頼する` | `サンプル鑑定書を見る` | Yes, to review form | No direct purchase | Sample only | Direct route | Vertical LP; separate `/request`; no fake metrics/reviews/free-complete/ad/active-payment claim | M1-I1 |
| M1-S02 | `/request` empty | Initial form load | Browser-local empty state | `今の状況を入力してください`; 18+ and no-PII notice | Begin input | Return to LP / review hub | Yes, by entering valid data | No | No | Direct route | Nothing is sent or stored | M1-I2 |
| M1-S03 | `/request` validation error | Missing/invalid required field | Browser-local validation | `入力内容を確認してください` plus field errors | Correct first invalid field | Return to review hub | Only after correction | No | No | Submit empty/invalid local form; review checklist | Errors associated to fields; no data leaves browser | M1-I2 |
| M1-S04 | `/review/request/normal-allowed` | Normal fixture selected | `request-normal-001` | `通常鑑定の確認に進める内容です` with fixture label | Review request summary | Edit fixture/form | Yes, to request confirmation | Eventually, via confirmation | Fixture result separately; not generated | Review hub link | Not a purchase or server safety result | M1-I2 |
| M1-S05 | `/review/request/needs-review` | Review-risk fixture | `request-needs-review-001` | `通常鑑定の前に慎重な確認が必要です`; initial MVP stops | Return/edit request | Unsupported cases / contact review | No forward continuation | No | No | Review hub link | Non-judgmental; no normal message suggestion or false emergency claim | M1-I2 |
| M1-S06 | `/review/request/rejected` | Reject-risk fixture | `request-rejected-001` | `月の返事の通常鑑定として扱えません` | Return/edit request | Unsupported cases / contact review | No | No | No | Review hub link | No unsafe advice, unverified hotline, or romance encouragement | M1-I2 |
| M1-S07 | `/review/request/contradictory-selection` | Danger choice plus `上記には当てはまらない` | `request-contradictory-001` | `安全確認の選択を見直してください` | Return to safety section | Review hub | Only after correction | No | No | Review hub link | Correctable input conflict, not emergency classification | M1-I2 |
| M1-S08 | `/review/request/invalid-age` | Under-18 or non-allowlisted age fixture | `request-invalid-age-001` | `月の返事は18歳以上の方を対象としています` | Return to age field | Return to LP | No until allowed self-declared group | No | No | Review hub link | Do not request DOB or identity document | M1-I2 |
| M1-S09 | `/review/request/missing-consent` | One or more required consents absent | `request-missing-consent-001` | `必要な同意事項を確認してください` | Return to consent section | Open relevant legal pages | Only after consent | No | No | Review hub link | Marketing consent is not required consent | M1-I2 |
| M1-S10 | `/review/request/confirmation/normal-001` | Normal fixture after valid form/safety state | `request-normal-001` | `入力内容を確認してください`; fixture/non-send notice | Continue to review purchase confirmation | Edit request/age/email | Yes | Not yet; next is payment-free confirmation | No | Review hub / M1-S04 | Blocked fixture IDs are rejected before render | M1-I2 |
| M1-S11 | `/review/purchase/confirmation/normal-001` | Normal confirmed fixture | Request fixture plus mock purchase metadata | Product, 税込980円, quantity, AI, limits, safety, delivery timing unresolved | Review unavailable purchase status | Edit / legal links | No transaction | Screen only; no payment action | No | Review hub / M1-S10 | Uses `.invalid` email; no provider/card fields | M1-I3 |
| M1-S12 | Purchase-unavailable panel on M1-S11 | Confirmation page rendered in M1 | Static review metadata | `購入機能は現在準備中です` | Return to request/review hub | Open legal/support info | No | No | No | Visible on M1-S11 | Disabled/non-button; no handler, success, event, or mock charge | M1-I3 |
| M1-S13 | `/sample-report` | LP or review-hub link | `sample-report-g001` | `架空ケースによるサービス説明用サンプル` | Return to request explanation | Compare fixture result | Yes, navigation only | No | Sample only | Direct route | No real customer, purchase, testimonial, or AI run | M1-I4 |
| M1-S14 | `/review/result/result-normal-001` | Fixture result selected | `result-normal-001`, fixed judgment `今日は送らない方がいい` | `審査用fixture`; production-shaped Web鑑定ノート with one complete do-not-send recommendation | Return to review hub | Compare save report / sample / legal info | Navigation only | No | Yes, fixture only | Review hub link | One fixed normal label; readable fixture ID; no token, PII, DB, AI, purchase, email | M1-I4 |
| M1-S21 | `/review/save-report/result-normal-001` | Save presentation selected for the normal result fixture | Save view of `result-normal-001`, same fixed judgment | `審査用fixture`; A4-oriented 保存用鑑定書 preview; no generated file | Return to review hub | Compare Web result / sample / legal info | Navigation only | No | Yes, fixture preview only | Review hub and M1-S14 link | Same one judgment as Web; not screenshot/compressed Web; no PDF/image/download/copy/share/DB/AI/purchase/email | M1-I4 |
| M1-S15 | `/legal` and `/legal/*` review state | Legal/footer/confirmation link | Review-safe representation of internal drafts | `審査用ドラフト表示・公開承認前` | Open selected legal page | Return to previous page | Navigation only | No | N/A | Direct links and review hub | Unresolved facts withheld/status-labeled; raw TBD not presented as final | M1-I5 |
| M1-S16 | `/contact` review state | Contact/legal/safety link | Contact draft structure only | `お問い合わせ機能と連絡先はMilestone 2で確定します` | Return to legal index | Return home/review hub | Navigation only | No | N/A | Direct route | No form, `mailto:`, invented address, SLA, or data collection | M1-I5 |
| M1-S17 | `/review/error/missing-fixture` | Unknown fixture ID | Static error metadata | `指定された審査用fixtureは存在しません` | Return to review hub | Return home | No | No | No | Enter invalid allowlist slug | Do not reflect unsafe raw ID or silently substitute data | M1-I4 |
| M1-S18 | Loading placeholder within review result | Component preview only | Static skeleton | `審査用表示を準備しています` | None | Return to review hub | N/A | No | No until static preview ends | Review hub component/state link | No artificial network delay or hidden fetch | M1-I4 |
| M1-S19 | `/review/error/unavailable-report` | Explicit unavailable fixture state | Static error metadata | `審査用レポートを表示できません` | Return to review hub | Contact review | No | No | No | Review hub link | Do not claim retry job, AI failure record, or email delivery | M1-I4 |
| M1-S20 | `/review/request/unknown-error` / general review error | Missing/unknown state or local exception preview | `request-error-001` or static error metadata | `状態を確認できません。購入には進めません` | Retry locally / return to form | Review hub | No forward continuation | No | No | Review hub link | Fail closed; never infer `normal_allowed` | M1-I2 / M1-I6 |

## 2. Route Transition Rules

```text
/
├─ /request
│  ├─ inline empty / validation / consent / safety state
│  └─ review-only normal path → /review/request/confirmation/normal-001
├─ /sample-report
├─ /legal/*
└─ /contact

/review
├─ /review/request/normal-allowed
│  └─ /review/request/confirmation/normal-001
│     └─ /review/purchase/confirmation/normal-001
├─ /review/request/needs-review ──X purchase/report
├─ /review/request/rejected ─────X purchase/report
├─ /review/request/contradictory-selection ──X forward
├─ /review/request/invalid-age ───────────────X forward
├─ /review/request/missing-consent ───────────X forward
├─ /review/request/unknown-error ─────────────X forward
├─ /review/result/result-normal-001
├─ /review/save-report/result-normal-001
└─ /review/error/*
```

`X` means the route must not expose a forward link, button, keyboard action, redirect, or hidden client navigation to purchase or ordinary report content.

## 3. Review Evidence Expectations

For each state, the implementing slice must capture:

- exact URL and visible state ID;
- desktop and phone screenshot;
- primary/secondary action destinations;
- keyboard focus order for interactive states;
- proof that prohibited actions are absent;
- proof that review/fixture labeling is visible before the main action; and
- network observation confirming no API, DB, payment, AI, email, or analytics request.

No evidence is claimed by this planning document.
