# MVP_SCOPE.md

## 0. Purpose

Phase 1 MVP is an automated public MVP for one-shot paid diagnosis.

The goal is not to build the complete app.

The goal is to validate whether real users will pay for a single 月の返事 diagnosis while the normal public diagnosis flow completes automatically.

---

## 1. Corrected MVP Definition

Phase 1 MVP is an automated public MVP for one-shot paid diagnosis.

Development may use manual, mock, and QA modes.

Public MVP must automate the normal diagnosis flow:

LP → request form → safety check → payment → AI judgment → AI full diagnosis → result page → email notification → feedback.

Manual delivery is not the target public MVP.

Manual QA is allowed during development and controlled beta, but normal public diagnosis should not require human work for every order.

---

## 2. User-facing Experience

The user experience should feel like:

1. User lands on 月の返事 LP
2. User understands the service
3. User reads sample diagnosis/copy
4. User decides to request a diagnosis
5. User fills in a self-hosted request form
6. Safety screening runs before payment
7. User pays ¥980 only if normal diagnosis is allowed
8. Payment success triggers AI judgment and full diagnosis generation
9. User receives a result page URL by email
10. User can save or revisit the diagnosis
11. User is asked for feedback

---

## 3. MVP Price

Initial price:

- ¥980 per diagnosis

Rules:

- 1相談 = 1鑑定書
- No coin/point system
- No subscription in Phase 1
- No upsell after payment
- No fear-based continuation push

---

## 4. In Scope

In scope for the public MVP:

- One-page LP
- Self-hosted diagnosis request form
- Safety screening before payment
- Payment provider integration or approved payment success verification
- Payment success handling
- AI judgment generation
- AI full diagnosis generation
- Result page
- Email notification with result URL
- Feedback collection
- Metrics tracking
- Quality checklist
- Safety and refund notes
- Operational runbook

---

## 5. Out of Scope

Out of scope:

- Login
- User account
- My page
- Partner-specific notebooks
- Diagnosis history
- Subscription
- Coin/point system
- Native app
- Full admin panel

---

## 6. MVP Success Criteria

Primary success criteria:

- Paid orders: 10 or more within validation window
- Refund requests: 1 or less
- At least 3 users say they want to save the result or read it again
- At least 2 users show repeat intent
- "ChatGPT is enough" is not the dominant feedback
- Normal diagnosis flow works without human intervention

Secondary signals:

- Safety screening catches dangerous cases
- Payment flow is not confusing
- Result generation quality is close to G001/G002/G003
- Result page feels like a diagnosis note, not generic AI chat
- Email result delivery works
- ¥980 is not universally rejected

---

## 7. MVP Failure Criteria

No-Go or major iterate if:

- LP traffic is enough but paid orders are 0-2
- Most users say ChatGPT is enough
- Users do not understand what they are paying for
- Payment flow breaks repeatedly
- AI result quality is unstable
- Safety screening fails dangerous cases
- Refunds or complaints are high
- Payment provider cannot be used for this category
