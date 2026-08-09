# M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P6-I1-R3 Review

## Status

- Implementation status: `prepayment_safety_engine_temporal_hazard_ownership_corrected_pending_human_chatgpt_review`
- Fixed correction baseline: `2c7d1d7a428ab1d87d6013b7168944f8953d0ebd`
- Accepted Charter authority: P6-P0-R1 at `611eecbf1249b222588c979a37162872215c9182`
- Automated precision-correction verification: PASS
- Human / ChatGPT engine review: pending
- Payment, UI, public RequestForm, Provider, DB, Supabase, and Runtime activation: unchanged, unimplemented, or unauthorized as applicable
- Final JPY980 readiness: not established

## TECHNICAL

### Exact correction boundary

R3 updates exactly six existing paths: `prepayment-safety-rules-v1.ts`, the safety cases, offline results, capabilities, the dedicated verifier, and this review. The R2 six-path correction and R1 ten-path correction remain intact. `prepayment-safety-types-v1.ts`, `prepayment-safety-identity-v1.ts`, `prepayment-safety-gate-v1.ts`, `purchase-state-machine-v1.ts`, the internal route, the accepted Charter, `RequestForm.tsx`, `lib/safety/**`, Package D, Runtime, Pipeline, service, Prompt, Catalog, Schema, evaluator, semantic disposition, payment, and DB/repository code remain unchanged.

The accepted Safety Engine precedence remains current urgent Safety, explicit unsafe requested assistance, primary professional judgment, material conflict or insufficient scope, and eligible delivery scope. R3 changes only deterministic content inspection; it creates no payment authority and does not change the purchase state machine.

### Latest inbound source and identity

`latestInboundMessage: string | null` is now a required top-level input key. `null` is allowed; a present value is outer-trimmed and limited to 1–2,000 Unicode code points. It represents the latest message actually received from the other person and remains distinct from `currentSituation` and the customer's outbound `optionalMessage` Candidate.

`createPrepaymentSafetyIdentityV1()` binds the inbound field as its own canonically normalized value. Unicode NFKC, CRLF-to-LF conversion, outer trimming, canonical JSON key ordering, and deterministic requested-topic ordering remain unchanged. Canonically equivalent inbound text preserves the hash; material inbound mutation changes it.

For `new_inbound_after_boundary`, a missing inbound source returns `needs_clarification` with `latest_inbound_message_required`; it cannot produce `eligible_scoped_reply`. The internal route retains every origin, content-type, byte-count, no-store, noindex, safe-error, and no-echo guard while increasing only the strict request ceiling to a 49,152-byte limit.

### Risk-local temporal hazard ownership

Clear present-form self-harm, suicide, other-harm, or immediate physical-danger language continues to redirect urgently without requiring a time adverb such as `今` or `すぐ`. R3 identifies risk spans and historical/non-current context spans separately. Historical wording suppresses a Safety match only when it overlaps or deterministically governs that same risk. It is not a proposition-wide waiver: a separate current hazard in the same sentence remains urgent.

Unsafe-assistance inspection applies the same temporal ownership rule. A historical alternate-account, surveillance, or ambush desire is not blocked solely because its lexical form also matches an explicit unsafe pattern. A historical action mention is likewise nonblocking when the current request is stopping or boundary-respecting. By contrast, `今やりたい`, `またやりたい`, a current location request, or a current third-party contact request remains blocking even when historical context appears earlier.

R2 denial and stopping ownership remains unchanged. Denials and stopping expressions still suppress only the risk they govern, and sentence, adversative, and independent comma boundaries still isolate separate hazards. If text explicitly leaves historical-versus-current ownership unresolved, the engine returns `needs_clarification` with `unsafe_execution_intent_required`; it does not default eligible. The engine still does not claim full semantic understanding.

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
- Existing R2 local-hazard isolation cases: 20/20 PASS (minimum 12)
- Combined classification/state/R1/R2 cases: 128/128 PASS
- New R3 temporal-hazard ownership cases: 16/16 PASS (minimum 12)
- Combined classification/state/R1/R2/R3 cases: 144/144 PASS
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

Automated PASS establishes deterministic local contract behavior only. Human / ChatGPT review of R3 remains pending. It does not establish full semantic understanding, Provider quality, product acceptance, payment readiness, Runtime activation, or final JPY980 readiness.

## PLAIN-LANGUAGE

1. 「以前は死にたいと思っていた。今は安全」は、過去の危険だけを理由に緊急扱いしません。
2. 同じ文に「以前は死にたい」と「今は相手を殺したい」があれば、過去表現で現在の他害リスクを隠さず、緊急案内へ回します。
3. 「過去に自傷があり、今は死にたい」のように読点で続く場合も、現在の危険を緊急扱いします。
4. 「以前は別アカウントから連絡したいと思っていた」「昔は待ち伏せしたいと思っていた」だけなら、過去の意思を現在の実行依頼として止めません。
5. ただし、続けて居場所の特定や第三者経由の連絡方法を求めた場合は、現在の危険な依頼を止めます。
6. 「昔もやったし、またやりたい」「以前から考えていて、今やりたい」は、現在の実行意思が明示されるためブロックします。
7. 過去の話か現在の話か機械的に確定できない場合は、購入可能にせず `needs_clarification` に戻します。
8. 既存のCharter 42件、Engine 36件、R1 30件、R2 20件、Decoder 15件、identity 6件の意味は維持しています。R3は16件を追加し、分類系は144/144です。
9. Gate、入力型、identity、内部API、購入状態、UI、決済、Provider、DB、Supabase、Runtimeは変更していません。payment authorityは未発行で、Package E-B / E-Cも未承認です。
10. 次の工程は R3 Human / ChatGPT engine review です。
