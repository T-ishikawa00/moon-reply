# M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P6-I1-R1 Review

## Status

- Implementation status: `prepayment_safety_engine_precision_corrected_pending_human_chatgpt_review`
- Fixed correction baseline: `c94e780a13e319873618e95412b48275d289970e`
- Accepted Charter authority: P6-P0-R1 at `611eecbf1249b222588c979a37162872215c9182`
- Automated precision-correction verification: PASS
- Human / ChatGPT engine review: pending
- Payment, UI, public RequestForm, Provider, DB, Supabase, and Runtime activation: unchanged, unimplemented, or unauthorized as applicable
- Final JPY980 readiness: not established

## TECHNICAL

### Exact correction boundary

R1 updates exactly ten existing paths: the three pre-payment input/rule/identity modules, the guarded internal route, four offline evidence files, the dedicated verifier, and this review. `prepayment-safety-gate-v1.ts`, `purchase-state-machine-v1.ts`, the accepted Charter, `RequestForm.tsx`, `lib/safety/**`, Package D, Runtime, Pipeline, service, Prompt, Catalog, Schema, evaluator, semantic disposition, and DB/repository code remain unchanged.

The accepted Safety Engine structure and precedence remain current urgent Safety, explicit unsafe requested assistance, primary professional judgment, material conflict or insufficient scope, and eligible delivery scope. The correction closes four content-inspection gaps without creating payment authority or changing the purchase state machine.

### Latest inbound source and identity

`latestInboundMessage: string | null` is now a required top-level input key. `null` is allowed; a present value is outer-trimmed and limited to 1–2,000 Unicode code points. It represents the latest message actually received from the other person and remains distinct from `currentSituation` and the customer's outbound `optionalMessage` Candidate.

`createPrepaymentSafetyIdentityV1()` binds the inbound field as its own canonically normalized value. Unicode NFKC, CRLF-to-LF conversion, outer trimming, canonical JSON key ordering, and deterministic requested-topic ordering remain unchanged. Canonically equivalent inbound text preserves the hash; material inbound mutation changes it.

For `new_inbound_after_boundary`, a missing inbound source returns `needs_clarification` with `latest_inbound_message_required`; it cannot produce `eligible_scoped_reply`. The internal route retains every origin, content-type, byte-count, no-store, noindex, safe-error, and no-echo guard while increasing only the strict request ceiling to a 49,152-byte limit.

### Current Safety and proposition-local unsafe intent

Clear present-form self-harm, suicide, other-harm, or immediate physical-danger language now redirects urgently without requiring a time adverb such as `今` or `すぐ`. Strong historical/non-current framing and explicit denial are evaluated separately. Generic stopping language cannot suppress a present Safety signal, so `自殺したいけど、やめたい` remains urgent. Standalone `前に` is not treated as historical evidence.

Unsafe execution inspection now operates at local sentence or proposition boundaries. A local denial or stopping statement can prevent that proposition from being blocked, but it cannot cancel a separate unsafe proposition. No global negation whitelist is used.

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

Automated PASS establishes deterministic local contract behavior only. Human / ChatGPT review remains pending. It does not establish Provider quality, product acceptance, payment readiness, Runtime activation, or final JPY980 readiness.

## PLAIN-LANGUAGE

1. 「死にたい」「消えたい」「自分を傷つけたい」「相手を殺したい」など、現在形で明確な危険が書かれていれば、`今`という単語がなくても支払い前に緊急案内へ切り替えます。
2. 過去の話や明確な否定は別に扱います。ただし「自殺したいけど、やめたい」のような現在の危険を、一般的な「やめたい」で打ち消しません。
3. 「監視はやめたい」という安全な一文があっても、別の一文で第三者経由の連絡方法を求めていれば、その危険な依頼は止めます。
4. 選択欄で「制限なし」を選んでも、受信文や状況説明に「連絡しないで」「一人にして」「ブロックした」「関係を終えたい」と明記されていれば、自動的に購入可能にはしません。
5. 新しい受信があったという選択だけでは不十分です。実際の最新受信文がなければ追加確認にします。
6. 業務連絡だけ許可されている場合、業務文に食事の誘い・復縁・恋愛的な提案を混ぜると追加確認になります。業務を口実にする回避依頼は従来どおり拒否します。
7. 境界後の返信は、受信文が返信を求め、返信案が狭い内容に収まり、既存の確認事項も満たす場合だけ購入ゲートを通れます。
8. 単語だけで意味全体を理解したとは主張しません。機械的に安全な範囲を確認できなければ `needs_clarification` に戻します。
9. 最新受信文を実質的に変えると資格hashも変わりますが、Unicode表記・改行・外側空白だけが正規化上同じなら同じhashです。
10. Gate、購入状態、UI、決済、Provider、DB、Supabase、Runtimeは変更していません。次の工程は Human / ChatGPT engine review です。
