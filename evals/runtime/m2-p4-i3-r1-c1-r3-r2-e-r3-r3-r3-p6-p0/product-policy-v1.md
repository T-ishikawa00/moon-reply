# Pre-Payment Safety and Assistance-Intent Product Charter v1

## Status and authority

- Task: `M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P6-P0-R1`
- Status: `prepayment_safety_intent_charter_rewritten_pending_human_chatgpt_review`
- Exact baseline: `30e762e1f3d17f2a007b7f7f92d3ba91e01b861e`
- Scope: planning-only correction
- Product Owner direction: accepted
- Detailed Human / ChatGPT Charter review: pending
- Package E implementation authority: not created
- Payment-provider integration authority: not created
- Provider rerun authority: not created
- Active Runtime: v4; v12 remains inactive

This charter decides whether Moon Reply may provide the requested kind of assistance before purchase. It does not implement UI, API, payment, Runtime, Provider, database, or Supabase behavior. The unchanged Package D implementation remains accepted and protected.

## Superseded P6-P0 decisions

The following state-only decisions are explicitly superseded.

1. **OLD-01 — SUPERSEDED:** `temporary_pause => blocked_no_purchase`. **NEW:** a temporary pause may become `eligible_pause_assessment` when the requested assistance is safe and boundary-respecting.
2. **OLD-02 — SUPERSEDED:** explicit no-contact, channel restriction, or relationship closure receives no paid interpretation-only assessment. **NEW:** these states may become `eligible_boundary_support_only` when the requested assistance respects the boundary.
3. **OLD-03 — SUPERSEDED:** any legal or professional context is blocked. **NEW:** only a primary output requiring professional legal, medical, clinical, financial, contractual, or equivalent judgment is unsupported. Separable nonprofessional emotional organization may remain eligible.

The correction does not weaken the enduring boundaries: business-only remains strictly practical; a new inbound reply remains limited to the explicitly invited subject; time passage and unblocking never reopen contact; alternate channels and third parties are never workarounds.

## Safety Gate and Decision Engine

The **Safety Gate** decides whether Moon Reply may provide the requested kind of assistance. It classifies unsafe execution assistance, urgent current Safety, unsupported professional judgment, clarification needs, and an eligible delivery scope.

The **Decision Engine** decides the normal Product direction after the Safety Gate permits assistance: send, reply, wait, or pause additional contact. `wait_and_reassess` and `pause_additional_contact` are valid Product outcomes, not reasons to block purchase.

A paid Product may intentionally contain no current message draft. Product value is the complete individualized assessment note: observed facts, bounded uncertainty, reasons, direction, immediate self-directed action, reassurance, reassessment conditions, and calm closure.

## Two-axis classification model

Every classification must compare both axes and the actual normalized request content. Boundary state alone never decides purchase eligibility.

### A. `contact_boundary_state`

The exact values are:

1. `no_restriction_known`
2. `temporary_pause`
3. `explicit_no_contact`
4. `channel_restricted`
5. `relationship_closed`
6. `business_only`
7. `new_inbound_after_boundary`
8. `unknown`
9. `urgent_safety`

Temporary-pause examples include “考える時間がほしい”, “落ち着いたら連絡する”, and “今日は一人にしてほしい”.

### B. `requested_assistance_goal`

The exact values are:

1. `understand_and_organize`
2. `decide_send_wait_or_pause`
3. `draft_within_current_permission`
4. `recontact_or_overcome_boundary`
5. `alternate_channel_or_third_party`
6. `monitor_track_or_manipulate`
7. `professional_judgment`
8. `urgent_safety_help`

The server must compare structured answers with normalized request text and the optional normalized Candidate. A safe selected option never overrides explicit unsafe requested content.

## Safety disposition and eligible delivery scope

The exact Safety dispositions are:

1. `eligible`
2. `needs_clarification`
3. `blocked_unsafe_assistance`
4. `urgent_safety_redirect`
5. `unsupported_professional_request`

The exact eligible delivery scopes are:

1. `general`
2. `pause_assessment`
3. `boundary_support_only`
4. `scoped_reply`
5. `business_only`

The derived purchase classifications are exactly:

- `eligible_general`
- `eligible_pause_assessment`
- `eligible_boundary_support_only`
- `eligible_scoped_reply`
- `eligible_business_only`
- `needs_clarification`
- `blocked_unsafe_assistance`
- `urgent_safety_redirect`
- `unsupported_professional_request`

## Eligible classification contracts

### `eligible_general`

Use when no relevant restriction is known, the requested assistance is within normal Product scope, and no unsafe assistance, urgent Safety, or professional judgment is requested. Normal Decision Engine behavior remains available.

### `eligible_pause_assessment`

Use when `contact_boundary_state=temporary_pause` and the goal is emotional organization, deciding whether to send/wait/pause, or an ordinary draft request that can safely become a no-draft assessment. Circumvention, alternate contact, monitoring, manipulation, threat, or pressure requests remain blocked.

- Current message draft: unavailable.
- Time-only later-contact plan: forbidden.
- Valid directions: `wait_and_reassess` or `pause_additional_contact`.
- Reassessment may rely only on an observable new event, explicit permission, or new inbound contact.
- The full individualized assessment note remains available.

### `eligible_boundary_support_only`

Use when the boundary is `explicit_no_contact`, `channel_restricted`, or `relationship_closed` and the requested assistance respects it—for example, organizing the situation or the customer's feelings, deciding how to stop contacting, understanding why no message should be sent, or choosing a self-directed next step.

- Draft, recontact strategy, countdown, alternate channel, third-party contact, reconciliation promise, and hidden-state certainty: forbidden.
- Time passage never restores permission.
- Future new inbound contact requires a full new classification.
- The assessment note may contain observed facts, uncertainty, emotional organization, a boundary-respecting direction, immediate self-directed action, and calm closure.

If the customer asks to overcome or bypass the boundary, classify `blocked_unsafe_assistance`.

### `eligible_scoped_reply`

Use only when a prior boundary existed, the other person later sent a new inbound message that explicitly asks for or clearly invites a reply, the planned reply stays within that exact subject and scope, and no broader permission is inferred.

### `eligible_business_only`

Use only when practical contact is explicitly permitted, the current request is entirely practical, and no private, romantic, emotional-pressure, or relationship-progression content is mixed into the requested message. A separate request for boundary-respecting emotional organization may instead qualify for `eligible_boundary_support_only`; it does not inherit permission to send private content.

## Unsafe assistance block

`blocked_unsafe_assistance` applies when the requested assistance would perform, optimize, justify, or conceal boundary circumvention; use another account, SNS, number, workplace, address, or third party; repeatedly contact after refusal; monitor, track, locate, surveil, or obtain non-public personal information; impersonate or deceive; threaten, blackmail, intimidate, coerce, create guilt or fear, or threaten harm to force a response; pursue revenge, harassment, or humiliation; or use practical contact as a pretext for private contact.

Mentioning past unsafe behavior does not by itself block support. A current request for help stopping, respecting the boundary, disengaging, or finding appropriate support may be `eligible_boundary_support_only` or `urgent_safety_redirect`, depending on current urgency. Classify the requested assistance, not the person's identity; do not label the customer a stalker, criminal, or dangerous person.

## Urgent Safety

`urgent_safety_redirect` applies to current self-harm or suicide risk, a current threat to harm another person, violence, immediate danger, coercive control with current danger, or an equivalent urgent condition. Purchase eligibility is false.

Allowed output is static urgent-safety copy, general safety-resource guidance, encouragement to contact a trusted person or appropriate emergency/professional support when relevant, and a payment-not-charged statement. Relationship strategy, contact draft, reconciliation plan, invented location-specific numbers, diagnosis, and legal conclusion are forbidden.

Ordinary romantic uncertainty, sadness, waiting, or fear of rejection is not urgent Safety unless current information indicates a real urgent condition.

## Professional request boundary

`unsupported_professional_request` applies when the primary requested output requires legal judgment or document drafting, medical or clinical diagnosis/treatment, contractual interpretation, financial or debt judgment, official dispute strategy, or equivalent licensed/professional judgment. Purchase eligibility is false.

The mere presence of a legal, medical, financial, or contract context does not block emotional organization. If the request can be cleanly limited to feelings, already permitted communication, nonprofessional personal organization, and no professional conclusion, clarification may produce the applicable eligible scope. No professional advice may be inferred.

## Pre-purchase disclosures and attestation

Before `eligible_pause_assessment` may reach `purchase_available`, the customer must acknowledge:

> 鑑定結果によっては、
> 「今は送らない」という判断になり、
> 送信文案が表示されない場合があります。
>
> その場合も、
> 理由・今の動き方・見直す条件を
> 鑑定ノートとしてお返しします。

Before `eligible_boundary_support_only` may reach `purchase_available`, the customer must acknowledge:

> この鑑定では、
> 相手への連絡文案や再接触方法は提供しません。
>
> 確認できる事実、
> 気持ちの整理、
> 相手の境界を尊重した今後の方向性を
> 鑑定ノートとしてお返しします。

`eligible_scoped_reply` requires acknowledgement that output is limited to the new inbound subject and creates no broader permission. `eligible_business_only` requires acknowledgement that output is limited to the permitted practical subject and excludes private or romantic content.

Every eligible classification also requires `attestation_confirmed=true` before `purchase_available`:

> この鑑定を、
> 相手から示された拒否や連絡制限を回避する方法、
> 監視・追跡、
> 脅しや強い圧力を使う方法として
> 利用しないことを確認します。

An acknowledgement or attestation does not override unsafe content, urgent Safety, or professional-scope exclusion; it is not proof of truthfulness. The server always recomputes classification.

## Output contracts

- `eligible_general`: normal assessment, direction, draft when supported, action, reassessment, and Customer Assessment Note.
- `eligible_pause_assessment`: full no-draft assessment, explanation, immediate self-directed action, observable reassessment condition, and reassurance; no current draft, time-only plan, alternate contact, or workaround.
- `eligible_boundary_support_only`: full boundary-respecting note, observed facts, uncertainty, emotional organization, self-directed action, and calm closure; no draft, recontact plan, countdown, alternate/third-party contact, guarantee, or hidden-state certainty.
- `blocked_unsafe_assistance`: static refusal, brief boundary-respecting redirection, and payment-not-charged statement only; no draft, report, Projection, Provider-generated assessment, unsafe method, workaround, or optimization.
- `urgent_safety_redirect`: static urgent copy, general safety-resource guidance, and payment-not-charged statement only; no relationship strategy, draft, report, or Projection.
- `unsupported_professional_request`: static scope explanation, nonprofessional-scope clarification option, and payment-not-charged statement only; no professional advice/document, report, or Projection.

## Server-owned eligibility identity

The server binds eligibility to a canonical identity containing normalized request text, normalized Candidate text or null, authoritative requested topics, `contact_boundary_state`, `requested_assistance_goal`, every clarification answer, the applicable delivery-scope acknowledgement, `attestation_confirmed`, and Safety policy version. The server computes the hash; a client-generated authority hash is forbidden.

Any bound-field change revokes eligibility and `purchase_available`, returns the request to `unassessed`, and rejects stale tabs or copied URLs. Time passage and unblocking never change classification by themselves; new inbound contact requires full reclassification.

## Product Owner direction

**PRODUCT OWNER DIRECTION: ACCEPTED**

Accepted principles:

1. Temporary pause is a valid paid no-draft assessment.
2. Explicit no-contact, channel restriction, or relationship closure may receive paid boundary-support-only assessment.
3. Unsafe circumvention, monitoring, manipulation, coercion, harassment, or equivalent execution assistance is blocked before payment.
4. Urgent current Safety is redirected before payment.
5. Professional judgment is unsupported, while separable emotional organization may remain eligible.
6. Business-only remains strictly practical.
7. New inbound reply remains strictly scoped.
8. The paid Product is the individualized assessment note, not a guarantee that a draft will be present.

Detailed Human / ChatGPT Charter review remains pending. Package E and payment implementation remain unauthorized.

## Zero-operation record

- Provider calls: 0
- DB operations: 0
- Supabase operations: 0
- Payment sessions: 0
- Drafts, Reports, or Projections created by this package: 0
