# M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P6-P0 Review

## Status

`prepayment_safety_product_charter_pending_product_owner_review`

This is a planning-only Pre-Payment Safety Product Charter. It decides how purchase candidacy must be classified before any future Package E or payment implementation. It does not implement UI, API, payment, Runtime, Provider, database, or Supabase behavior.

## Technical result

- Exact baseline: `1196e7d581e1e7d2b1f200eaa92de2477999f5bd`
- Exact scope: 8/8 new files
- Upstream dependency: unchanged Package D implementation recorded as accepted for this planning package
- Classification vocabulary: exact 6/6
- Decision matrix: 18/18 required cases
- Eligible classifications: `eligible_general`, `eligible_scoped_reply`, `eligible_business_only`
- Non-purchase classifications: `needs_clarification`, `blocked_no_purchase`, `urgent_safety_redirect`
- Purchase authority: server-owned deterministic classification only
- Active Runtime: v4
- v12: inactive
- Payment-provider implementation: absent
- Provider / DB / Supabase: `0 / 0 / 0`
- Product Owner review: pending
- Package E implementation: unauthorized
- Payment-provider integration: unauthorized
- JPY980 readiness: not established

The prior P5-R2 7/7 correction and protected Package D, Runtime, Pipeline, Service, Prompt, Catalog, Schema, evaluator, and semantic-disposition assets remain unchanged. This package does not retroactively edit prior evidence.

## Product policy

Safety and boundary verification precedes purchase eligibility. Unknown or conflicting answers cannot reach payment. A blocked state creates no payment session, Provider call, draft, Report, Projection, saved-for-later output, or workaround. Client UI has no authority to set eligibility or purchase availability.

Time passage and unblocking never reopen contact by themselves. Another SNS, phone number, friend, workplace, or third party is not a workaround. Stop copy must be neutral and direct, without accusation, diagnosis, legal judgment, threat, or moral lecture.

## Classification decisions

| Classification | Purchase treatment | Mandatory boundary |
| --- | --- | --- |
| `eligible_general` | Purchase candidate | No known no-contact, pause, channel restriction, closure, or unresolved boundary. |
| `eligible_scoped_reply` | Candidate after clarification | A new inbound message explicitly invites a reply and the reply stays within its exact subject and scope. |
| `eligible_business_only` | Candidate after explicit scope confirmation | Practical permission is explicit and the request contains only the permitted practical matter. |
| `needs_clarification` | No purchase | Unknown, conflict, conditional permission, or unclear invitation must be resolved first. |
| `blocked_no_purchase` | Free stop | Known boundary, unresolved unknown, unsupported matter, or workaround attempt. |
| `urgent_safety_redirect` | Free safety redirect | No relationship draft or contact strategy. |

## Customer question flow

The primary screen title is `決済前の安全確認`. The customer selects one of nine exact current-contact states. `business_only` always requires explicit confirmation of both practical permission and a request limited entirely to the practical subject. `new_inbound_after_boundary` always starts at `needs_clarification`; both an explicit reply invitation and an in-scope intended reply are required.

Unknown or conflicting answers remain non-purchase. If clarification cannot resolve them, the result is `blocked_no_purchase`.

## Free stop experience

Common heading:

> 今回は、ここで鑑定を止めます

Common body:

> 現在の情報では、相手の境界を尊重するため、
> 月の返事では連絡文案や、
> 連絡を再開するための方法を提案できません。

Payment statement:

> この画面では決済は発生しません。

Reason-specific copy exists for temporary pause, explicit no-contact, channel restriction, relationship closure, unresolved unknown, unsupported required contact, and urgent safety redirect. The urgent copy prioritizes safety without inventing a location-specific contact.

## Purchase state machine

The planned server-owned states are:

`unassessed` → `collecting_boundary_answer` → classification or clarification → one of the three eligible classifications → `purchase_available` → future `payment_pending` → future `payment_completed`.

Only the three eligible classifications can enter `purchase_available`. `needs_clarification`, `blocked_no_purchase`, and `urgent_safety_redirect` cannot create a payment session. Any mutation to request text, candidate text, requested topics, or boundary answers invalidates prior eligibility and returns the changed request to `unassessed`.

Browser back, refresh, an old tab, a copied URL, a direct API request, and duplicate submission cannot bypass server revalidation or manufacture purchase authority. The payment transitions are policy definitions only; no payment implementation exists.

## Independent product-risk assessment

The highest abuse surface is `business_only`. A checkbox is not evidence of scope; future implementation must classify the actual request and fail closed when personal or relationship content is mixed in. The second-highest risk is a new inbound message after a prior refusal: receipt of a message is not consent to discuss unrelated topics. Both controls therefore require server-owned, input-bound eligibility that is invalidated on mutation.

The charter is commercially defensible because it refuses to charge JPY980 for a result whose only safe output is “do not contact.” However, this policy is not implementation-ready until the Product Owner resolves all five open decisions below. Treating this document as payment authority before that review would be a governance failure.

## Open Product Owner review items

All five items remain pending final review:

1. Temporary pause is a free stop, not a paid no-draft assessment.
2. Explicit boundary or closure receives no paid interpretation-only assessment.
3. Business-only is allowed only under strict practical scope.
4. New inbound contact can reopen only the exact invited scope.
5. Legal or professional disputes are unsupported in the MVP.

No implementation authority is created until these five decisions are accepted.

## Plain-language summary

1. **誰が決済へ進めるか** — 制限が知られていない人、明確に返信を求める新着連絡へその用件だけ返す人、明示的に許可された実務用件だけを扱う人の3分類だけが、サーバー判定後に購入候補になります。
2. **誰が無料で止まるか** — 一時停止、明確な連絡拒否、ブロック等の手段制限、関係終了、不明状態の未解決、別経路や第三者の利用、時間経過や解除だけによる再開、専門判断が必要な案件、緊急安全案件は決済前に無料で止まります。
3. **なぜ一時的な距離置きも課金しないか** — 安全に出せる結論が「今は追加連絡しない」だけなら、その結論を伝えるためにJPY980を請求するのは不適切だからです。
4. **business-onlyをどう制限するか** — 実務連絡の許可が明示され、今回の依頼がその実務用件だけに完全に限定される場合に限ります。恋愛解釈、個人的誘い、関係進展、感情的圧力、範囲外の追送は認めません。
5. **過去の拒絶後に新着連絡が来た場合の扱い** — 自動的には再開しません。返信が明確に求められていることと、その新着用件だけに返すことの両方を確認した場合に限り、限定返信の候補になります。
6. **まだ実装していないこと** — UI、API、決済、決済セッション、Runtime接続、Provider実行、DB/Supabase、Package E/F、R4、C2は実装・実行・承認していません。
7. **次にProduct Ownerが判断する5項目** — 一時停止を無料停止にすること、明確な境界への有料解釈を出さないこと、business-onlyの厳格範囲、新着連絡の限定再開、法的・専門案件をMVP対象外にすることです。

## Authority boundary

`product_owner_review_complete=false`, `package_e_implementation_authorized=false`, `payment_provider_integration_authorized=false`, `provider_rerun_authorized=false`, `active_runtime_activated=false`, `package_f_authorized=false`, `r4_authorized=false`, `c2_authorized=false`, and `final_jpy980_readiness_established=false`.

No PR, main merge, or force push is authorized by this package.
