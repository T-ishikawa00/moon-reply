# M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P6-I1-R2 Review

## Status

- Implementation status: `prepayment_safety_engine_local_hazard_isolation_corrected_pending_human_chatgpt_review`
- Fixed correction baseline: `f85545c89a5ebc324d2eabf7372f0302113eb0c3`
- Accepted Charter authority: P6-P0-R1 at `611eecbf1249b222588c979a37162872215c9182`
- Automated precision-correction verification: PASS
- Human / ChatGPT engine review: pending
- Payment, UI, public RequestForm, Provider, DB, Supabase, and Runtime activation: unchanged, unimplemented, or unauthorized as applicable
- Final JPY980 readiness: not established

## TECHNICAL

### Exact correction boundary

R2 updates exactly six existing paths: `prepayment-safety-rules-v1.ts`, the safety cases, offline results, capabilities, the dedicated verifier, and this review. The R1 ten-path commit remains intact. `prepayment-safety-types-v1.ts`, `prepayment-safety-identity-v1.ts`, `prepayment-safety-gate-v1.ts`, `purchase-state-machine-v1.ts`, the internal route, the accepted Charter, `RequestForm.tsx`, `lib/safety/**`, Package D, Runtime, Pipeline, service, Prompt, Catalog, Schema, evaluator, semantic disposition, payment, and DB/repository code remain unchanged.

The accepted Safety Engine precedence remains current urgent Safety, explicit unsafe requested assistance, primary professional judgment, material conflict or insufficient scope, and eligible delivery scope. R2 changes only deterministic content inspection; it creates no payment authority and does not change the purchase state machine.

### Latest inbound source and identity

`latestInboundMessage: string | null` is now a required top-level input key. `null` is allowed; a present value is outer-trimmed and limited to 1–2,000 Unicode code points. It represents the latest message actually received from the other person and remains distinct from `currentSituation` and the customer's outbound `optionalMessage` Candidate.

`createPrepaymentSafetyIdentityV1()` binds the inbound field as its own canonically normalized value. Unicode NFKC, CRLF-to-LF conversion, outer trimming, canonical JSON key ordering, and deterministic requested-topic ordering remain unchanged. Canonically equivalent inbound text preserves the hash; material inbound mutation changes it.

For `new_inbound_after_boundary`, a missing inbound source returns `needs_clarification` with `latest_inbound_message_required`; it cannot produce `eligible_scoped_reply`. The internal route retains every origin, content-type, byte-count, no-store, noindex, safe-error, and no-echo guard while increasing only the strict request ceiling to a 49,152-byte limit.

### Risk-local proposition ownership

Clear present-form self-harm, suicide, other-harm, or immediate physical-danger language continues to redirect urgently without requiring a time adverb such as `今` or `すぐ`. R2 finds local risk spans and suppression spans separately. A denial suppresses a current-Safety match only when it overlaps or locally governs that same match; a different current hazard remains urgent.

Unsafe-assistance inspection uses the same bounded ownership rule. A stopping expression can suppress the alternate-account, surveillance, ambush, or other unsafe proposition that it governs, but it cannot suppress another unsafe request before or after it. Ambiguous execution-versus-stopping ownership returns `needs_clarification` with `unsafe_execution_intent_required` instead of defaulting eligible.

Local segmentation distinguishes sentence boundaries, adversative constructions including `でも`, `ではなく`, and `一方で`, and Japanese or ASCII commas only when both sides look like independent predicates. It does not blindly split every comma: coordinated risk nouns with one shared stopping predicate remain one semantic unit. The engine still does not claim full semantic understanding.

### Boundary and scope evidence

Conservative boundary hints are read only from `currentSituation` and `latestInboundMessage`, never from the outbound Candidate. Explicit pause, no-contact, channel-restriction, and relationship-closure evidence that materially conflicts with the structured boundary returns `needs_clarification` with `boundary_state_conflict`; the engine does not rewrite the selected state.

For `business_only`, the practical-permission answers no longer suffice when the actual request or Candidate materially adds a personal invitation, romantic invitation, reconciliation request, affection escalation, or private meeting proposal. Obvious private mixing returns `needs_clarification`; explicit business-pretext circumvention remains `blocked_unsafe_assistance`. Ordinary isolated words such as `好き`, `会う`, or `ご飯` are not global rejection tokens.

For `new_inbound_after_boundary`, a narrative of the earlier boundary is expected and is not itself a contradiction; the latest inbound message is checked for the current pause, no-contact, restriction, or closure conflict. Scoped reply eligibility requires the inbound source, structured invitation and exact-subject answers, narrow deterministic reply evidence, no current boundary contradiction, no private expansion, and the existing scoped acknowledgement gate. The engine explicitly does not claim full semantic subject equivalence. When deterministic scope safety is not established, it returns `needs_clarification` rather than defaulting to scoped eligibility.

### Offline evidence

- Accepted Charter import and meaning: 42/42 PASS
- Existing additional engine cases: 36/36 PASS
- Existing classification and state total: 78/78 PASS
- New R1 precision cases: 30/30 PASS (minimum 21)
- Combined classification/state/R1 cases: 108/108 PASS
- New R2 local-hazard isolation cases: 20/20 PASS (minimum 12)
- Combined classification/state/R1/R2 cases: 128/128 PASS
- Existing decoder mutation and negative cases: 15/15 PASS
- New inbound decoder and identity regressions: 6/6 PASS
- Decision Policy regression: 40/40 PASS
- TypeScript typecheck: PASS
- ESLint: PASS
- Next.js production build: PASS
- `git diff --check`: PASS
- Active Runtime: v4; v12: inactive
- Payment implementation/session/authority: `false / false / false`
- Provider / DB / Supabase: `0 / 0 / 0`

Automated PASS establishes deterministic local contract behavior only. Human / ChatGPT review remains pending. It does not establish full semantic understanding, Provider quality, product acceptance, payment readiness, Runtime activation, or final JPY980 readiness.

## PLAIN-LANGUAGE

1. 「死にたいわけではない」と書いた後に「相手を殺したい」と続けた場合、前半の否定で後半まで安全扱いにはしません。後半を緊急案内へ回します。
2. 「別アカウントから連絡するつもりはない」と書いた後に、居場所の特定や別SNSでの連絡方法を求めた場合、後半の危険な依頼を止めます。
3. 句点だけでなく、独立した述語を分ける `、`、`,`、`でも`、`ではなく`、`一方で` も局所的な命題境界として扱います。
4. すべての読点を機械的に分割するわけではありません。「監視、追跡、尾行はしない」のように一つの否定が並列語全体を支配する表現は一つのまとまりとして扱います。
5. 「監視するのはやめたい、距離を置きたい」「別アカウントは使わない、連絡もしない」「死にたいわけではない、今は安全」の安全な例は安全のままです。
6. 危険な依頼と停止表現のどちらを否定しているか機械的に確定できない場合は、購入可能にせず `needs_clarification` に戻します。
7. 既存のCharter 42件、Engine 36件、R1 30件、Decoder 15件、identity 6件の意味は維持しています。
8. Gate、入力型、identity、内部API、購入状態、UI、決済、Provider、DB、Supabase、Runtimeは変更していません。
9. payment authorityは発行しておらず、Package E-B / E-Cも未承認です。
10. 次の工程は Human / ChatGPT engine review です。
