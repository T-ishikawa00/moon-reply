# LEGAL_SOURCE_REGISTER.md

## Status

Internal research register.

Planning draft.

This is not legal advice.

Every source must be rechecked before public launch.

No professional legal review, payment-provider approval, or trademark clearance is recorded by this register.

---

## Japanese Consumer / Commerce Sources

### 特定商取引法ガイド

Authority:

- 消費者庁 / 特定商取引法ガイド

URL:

- https://www.no-trouble.caa.go.jp/what/mailorder/

Use for:

- 通信販売の表示事項
- 最終確認画面
- 返品・解除条件
- 電子メール広告
- 事業者情報

Research note:

- Source URL checked on 2026-07-10
- Recheck the current statute, regulations, and official guidance before launch

### 消費者契約法

Authority:

- 消費者庁

URL:

- https://www.caa.go.jp/policies/policy/consumer_system/consumer_contract_act/

Use for:

- 不当勧誘
- 不安を利用した購入誘導
- 免責条項
- 消費者契約の取消し・無効

Research note:

- Source URL checked on 2026-07-10
- Final interpretation and contract wording require professional review

### 個人情報保護法・ガイドライン

Authority:

- 個人情報保護委員会

URL:

- https://www.ppc.go.jp/personalinfo/legal/

Use for:

- 個人情報
- 委託先
- 国外移転
- 安全管理
- 削除・開示対応

Research note:

- Source URL checked on 2026-07-10
- Recheck the applicable law, guidelines, Q&A, and provider processing facts before launch

---

## AI Provider Sources

### OpenAI enterprise privacy

URL:

- https://openai.com/enterprise-privacy/

Research note:

- Source URL checked on 2026-07-10
- This source alone does not establish the exact retention behavior of a future 月の返事 API configuration

### OpenAI business terms

URL:

- https://openai.com/policies/business-terms/

Research note:

- Source URL checked on 2026-07-10
- On that date, the URL redirected to the OpenAI Services Agreement
- Recheck the controlling agreement for the exact product and account before launch

### OpenAI API data controls

URL:

- https://platform.openai.com/docs/models/default-usage-policies-by-endpoint

Use for:

- Endpoint-specific storage behavior
- Abuse-monitoring and application-state distinctions
- Account/project data-control settings
- Retention verification after the exact endpoint is selected

Rules:

- Do not state a fixed retention period until current API documentation and account settings are verified
- Do not state that data is never retained
- Do not send email addresses or unnecessary direct identifiers to the AI provider
- Verify the exact product/API endpoint before launch

---

## Payment Sources

### Stripe restricted businesses

URL:

- https://stripe.com/jp/legal/restricted-businesses

Current project decision:

- Stripe is not the default provider
- Do not implement without written category review

Research note:

- Source URL checked on 2026-07-10
- No category approval has been obtained

### PAY.JP

URL:

- Official provider documents and inquiry response must be recorded before implementation

Status:

- Inquiry candidate
- Not approved yet

### KOMOJU

Status:

- Inquiry candidate
- Not approved yet

### STORES / Square / Other Providers

Status:

- Secondary inquiry candidates
- Not approved yet

---

## Trademark

### J-PlatPat

URL:

- https://www.j-platpat.inpit.go.jp/

Required action:

- Search `月の返事` before public launch
- Record search date, classes, results, and screenshots/references
- Do not claim trademark clearance until actually performed

Current status:

- No trademark search is recorded by Task 18A
- No trademark clearance is claimed

---

## Professional Review Required

Professional review is recommended for:

- Privacy policy foreign-transfer / processor wording
- Terms limitation-of-liability wording
- Refund policy wording
- 特商法 operator disclosure method
- Final payment-provider category classification

Do not add unofficial blogs as controlling sources.

They may be listed only as secondary notes if clearly labeled, but primary official sources should control.
