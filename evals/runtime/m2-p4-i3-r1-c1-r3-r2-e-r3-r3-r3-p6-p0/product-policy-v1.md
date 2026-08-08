# Pre-Payment Safety Product Charter v1

## Status and authority

- Task: `M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P6-P0`
- Status: `prepayment_safety_product_charter_pending_product_owner_review`
- Exact baseline: `1196e7d581e1e7d2b1f200eaa92de2477999f5bd`
- Scope: planning-only
- Product Owner review: pending
- Package E implementation authority: not created
- Payment-provider integration authority: not created
- Provider rerun authority: not created
- Active Runtime: v4; v12 remains inactive

This charter defines who may become a purchase candidate and who must receive a free stop before payment. It does not implement UI, API, payment, Runtime, Provider, database, or Supabase behavior. The unchanged Package D implementation is the accepted upstream dependency recorded for this planning package; this document does not rewrite Package D evidence or activate it in the service.

## Non-negotiable product principles

1. Safety and boundary verification occurs before purchase eligibility.
2. Unknown or conflicting boundary state never reaches payment.
3. A blocked state creates no payment session and no Provider call.
4. A blocked state creates no draft, Report, Projection, saved-for-later output, or workaround.
5. Client UI cannot authorize payment. Server-owned deterministic state is the only purchase authority.
6. Time passage alone never reopens contact. Unblocking alone never proves consent.
7. Another SNS, phone number, friend, workplace, or third party never becomes a workaround.
8. The stop experience is nonjudgmental but unambiguous.
9. The Product makes no legal conclusion and no diagnosis.
10. Purchase availability is a result of classification, never a substitute for classification.

## Exact classification states

The classification vocabulary contains exactly these six states.

| State | Meaning | Purchase eligibility |
| --- | --- | --- |
| `eligible_general` | No explicit no-contact, temporary pause, channel restriction, relationship closure, or unresolved boundary is known. | Candidate; server classification is still required. |
| `eligible_scoped_reply` | A prior restriction existed, but the other person later sent a new message that explicitly asks for or clearly invites a response. The reply must stay within that message's subject and scope; no broader permission or unrelated follow-up is inferred. | Candidate after clarification. |
| `eligible_business_only` | Private contact is not permitted, but necessary business, logistics, property, money, contract, or equivalent practical contact is explicitly permitted. | Candidate after explicit practical-scope confirmation. |
| `needs_clarification` | The answer is unknown or conflicting, a prior restriction and new inbound contact coexist, the permitted scope is unclear, or the user cannot tell whether a reply is invited. | False. If clarification cannot resolve the state, transition to `blocked_no_purchase`. |
| `blocked_no_purchase` | A boundary, unsupported scope, unresolved unknown, or attempted workaround requires a free stop. | False. |
| `urgent_safety_redirect` | Threat, coercion, immediate danger, stalking concern, violence, or equivalent urgent safety issue is selected. | False. No relationship draft or contact guidance. |

`eligible_business_only` is strictly practical. It permits no romance interpretation, personal invitation, relationship progression, emotional-pressure wording, or follow-up outside the explicitly permitted matter.

## Block reasons

`blocked_no_purchase` includes:

- `temporary_pause`
- `explicit_no_contact`
- `channel_restricted`
- `relationship_closed`
- `unresolved_unknown`
- `attempted_alternate_channel`
- `attempted_third_party_contact`
- `time_passage_only_reopening`
- `unblock_only_reopening`
- `required_contact_outside_supported_scope`

## Conservative MVP decisions pending Product Owner acceptance

### A. Temporary pause

“考える時間がほしい”, “落ち着いたら連絡する”, and “今日は一人にしてほしい” classify as `blocked_no_purchase`.

The Product must not charge JPY980 merely to tell the customer not to contact the other person. A free static stop and reassurance experience is preferred.

### B. Explicit no-contact, channel restriction, or relationship closure

These classify as `blocked_no_purchase`. No paid interpretation-only assessment is offered. The Product must not monetize continued fixation after an explicit boundary or closure.

### C. Business-only

`eligible_business_only` is available only when practical contact permission is explicit and the current request is entirely limited to that permitted matter. Personal content mixed into the request blocks purchase or requires clarification; it never inherits business permission.

### D. New inbound contact after a prior boundary

New inbound contact is never automatically eligible. It first enters `needs_clarification`. It may become `eligible_scoped_reply` only when the new message clearly invites or requires a response and the intended reply remains within that message's exact subject and scope.

### E. Time passage or unblocking

Neither condition reopens contact by itself. A new inbound message requires a new server-owned classification.

### F. Legal or professional disputes

Legal disputes, official notices, shared-property disputes, and contact requiring professional judgment are unsupported in the MVP. They classify as `blocked_no_purchase` with neutral direction to an appropriate official or professional channel. The Product does not provide legal advice.

## Purchase authority boundary

- The client supplies answers but cannot set an eligible state, `purchase_available`, or any payment state.
- Only server-owned deterministic classification may enter an eligible state.
- Only `eligible_general`, `eligible_scoped_reply`, and `eligible_business_only` may enter `purchase_available`.
- `needs_clarification`, `blocked_no_purchase`, and `urgent_safety_redirect` cannot create a payment session.
- Changes to request text, candidate text, requested topics, or boundary answers invalidate prior eligibility and return the request to `unassessed`.
- Browser back, refresh, an old tab, a copied URL, or a direct API request cannot bypass classification.
- A blocked state never transitions directly to an eligible state.
- Duplicate requests never create duplicate purchase authority.
- Payment-provider implementation is absent and remains out of scope.

## Product Owner review gate

The following five decisions remain pending final Product Owner review:

1. Temporary pause is a free stop, not a paid no-draft assessment.
2. Explicit boundary or closure receives no paid interpretation-only assessment.
3. Business-only is allowed only under strict practical scope.
4. New inbound contact can reopen only the exact invited scope.
5. Legal or professional disputes are unsupported in the MVP.

No Package E or payment implementation authority exists until all five decisions are accepted.

## Zero-operation record

- Provider calls: 0
- DB operations: 0
- Supabase operations: 0
- Payment sessions: 0
- Drafts, Reports, or Projections created by this package: 0
