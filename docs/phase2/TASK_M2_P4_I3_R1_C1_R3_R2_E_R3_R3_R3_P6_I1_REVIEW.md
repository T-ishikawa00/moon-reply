# M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P6-I1 Review

## Status

- Implementation status: `prepayment_safety_engine_implemented_pending_human_chatgpt_review`
- Fixed baseline: `611eecbf1249b222588c979a37162872215c9182`
- Product Owner Charter authority: accepted P6-P0-R1
- Automated implementation verification: PASS
- Human / ChatGPT engine review: pending
- Payment, UI, public RequestForm, Provider, DB, Supabase, Runtime activation: not implemented and not authorized by this package
- Final JPY980 readiness: not established

## TECHNICAL

### Implemented boundary

This package adds exactly twelve new paths. It implements a deterministic, server-owned pre-payment Safety classifier; canonical eligibility-input identity; pure purchase-state transitions; an offline contract/case package; and a guarded internal API. It does not modify the accepted Charter, Package D, `lib/safety/**`, `RequestForm.tsx`, Runtime, Pipeline, Provider, schemas, evaluator, semantic disposition, customer delivery, or repositories.

The classifier consumes the Charter's exact two-axis vocabulary:

- `contact_boundary_state`: 9 values
- `requested_assistance_goal`: 8 values
- Safety disposition: 5 values
- eligible delivery scope: 5 values
- derived classification: 9 values

The enforced precedence is current urgent Safety, explicit unsafe requested assistance, primary professional judgment, material conflict or insufficient scope, and finally eligible delivery-scope classification. Attestation and safe structured choices do not override higher-priority evidence.

### Deterministic inspection

Inspection is local and phrase-level across `currentSituation`, the separate optional Candidate, and structured answers. There is no LLM or Provider call and no claim of full semantic understanding. Explicit execution phrasing is separated from historical, negated, stopping, and ambiguous phrasing. Ambiguity yields bounded `requiredClarificationCodes`; one complete clarification submission is representable, and unresolved material uncertainty remains `needs_clarification`.

The new rules preserve explicit coverage for current self-harm or suicide risk, harm to another person, current violence or danger, coercion, stalking or ambush, surveillance and location discovery, doxxing, deception, revenge or harassment, channel or third-party circumvention, illegal assistance, third-party secret exploitation, and minor-related romantic, sexual, or meeting assistance. The legacy `lib/safety` classifier is neither reused unchanged nor modified.

### Identity and purchase state

`createPrepaymentSafetyIdentityV1()` applies Unicode NFKC, CRLF-to-LF conversion, outer trimming, canonical JSON key ordering, and deterministic requested-topic ordering before SHA-256 UTF-8 hashing. Request and Candidate remain separate. The API returns only `eligibilityInputHash`; it returns no canonical text, raw input, secret, purchase token, session, or payment authority.

The pure fourteen-state machine allows only the five eligible classification states with satisfied gates and a current hash to reach `purchase_available`. A material input change or stale hash returns to `unassessed`. Time passage and unblocking are not transitions. New inbound contact requires full reclassification. Payment creation rejects locally with `PAYMENT_NOT_IMPLEMENTED`, and `payment_completed` cannot be produced.

### Internal API

`POST /api/internal/purchase-eligibility` uses the Node.js runtime and forced dynamic rendering. It is unavailable in production and uses the existing `M2_INTERNAL_RUNTIME_ENABLED` availability check. It requires same-origin JSON, enforces a 24,576-byte limit and exact decoder allowlist, responds with `no-store` and `X-Robots-Tag: noindex, nofollow`, returns ordinary classifications with HTTP 200, and exposes only safe local error codes for malformed requests.

The route imports or calls no Provider, OpenAI, DB, Supabase, payment, Runtime service, or repository implementation. Provider / DB / Supabase: `0 / 0 / 0`.

### Offline evidence

- Accepted Charter import and meaning: 42/42 PASS
- Additional engine cases: 36/36 PASS
- Classification and state total: 78/78 PASS (minimum 62)
- Decoder mutation and negative cases: 15/15 PASS
- Decision Policy regression: 40/40 PASS
- TypeScript typecheck: PASS
- ESLint: PASS
- Next.js production build: PASS
- `git diff --check`: PASS
- Active Runtime: v4
- v12: inactive
- Payment implementation/session/authority: `false / false / false`

Automated PASS establishes the local contract and regression evidence only. It does not complete Human / ChatGPT engine review, authorize payment or Provider execution, connect UI or LUNA, activate Runtime, or establish final JPY980 readiness.

## PLAIN-LANGUAGE

1. 今回の判定エンジンは、支払いの前に「この依頼へ安全に提供できる支援の範囲」をサーバー側で同じ入力なら同じ結果になるよう判定します。
2. 「少し距離を置きたい」「今日は一人にしてほしい」といった一時的な距離置きだけを理由に購入を止めません。安全な依頼なら、送信文案なしの鑑定として扱えます。
3. 拒否やブロックの回避、別アカウント、第三者経由、監視・追跡、脅し、嫌がらせなど、危険な支援要求は支払い前に止めます。
4. 「ログイン」「居場所」「未成年」「暴力」「脅迫」などの単語が一つ出ただけでは自動拒否しません。実行を求めている表現か、過去の話・否定・やめたい意思かを明示的なフレーズ単位で分けます。
5. 実行意図や現在の危険性を決められない場合は、勝手に購入可能へ進めず、決められた追加確認にします。確認後も不明なら `needs_clarification` のままです。
6. 古い `lib/safety` のSafety判定をそのまま再利用していません。既存のSafety資産も変更していません。
7. 入力を実質的に変えると資格hashも変わり、古い画面や古いhashでは購入可能状態へ進めません。表記上同じと扱える正規化だけは同じhashになります。
8. 今回は決済権限、決済セッション、支払い用トークンを一切発行しません。`purchaseGateSatisfied` は決済が存在するという意味ではありません。
9. UI、公開RequestForm、LUNA、Provider、DB、Supabase、Runtimeにはまだつないでいません。
10. 次の工程は Human / ChatGPT engine review です。自動検証PASSと、人による製品判断・JPY980準備完了は別です。
