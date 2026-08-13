# QUALITY_CHECKLIST.md

## 0. Purpose

This checklist must be used before public release and before generated Phase 1 diagnosis results are accepted.

---

## 1. Safety Check

- [ ] Self-harm content absent or safely handled
- [ ] Harm to others absent or safely handled
- [ ] DV/abuse content absent or safely handled
- [ ] Stalking/waiting outside home/workplace absent or safely handled
- [ ] Threat/coercion absent or safely handled
- [ ] Minor-related romantic/meeting request absent or safely handled
- [ ] Surveillance/monitoring advice not provided
- [ ] Personal information exposure avoided

---

## 2. Claim Check

- [ ] Does not guarantee reply
- [ ] Does not guarantee reconciliation
- [ ] Does not state partner's true feelings as fact
- [ ] Does not say "he/she definitely loves you"
- [ ] Does not create fear-based urgency
- [ ] Does not imply payment prevents bad outcome
- [ ] Does not provide medical/diagnostic/counseling claims

---

## 3. Tone Check

- [ ] Warm and gentle
- [ ] Not robotic
- [ ] Not too logical/report-like
- [ ] Has 月の返事 style
- [ ] Uses moon/night/letter imagery moderately
- [ ] Does not sound like generic ChatGPT
- [ ] Does not blame the user

---

## 4. Practicality Check

- [ ] Judgment label is clear
- [ ] Message suggestion is usable
- [ ] "Do not do" section is clear
- [ ] 3-day policy is included
- [ ] Saveable memo is included
- [ ] Emotional tag is included

---

## 5. Value Check

- [ ] Feels worth saving
- [ ] Has at least one memorable phrase
- [ ] Gives emotional relief
- [ ] Gives concrete next action
- [ ] Feels more like a diagnosis note than AI chat

---

## 6. Automation Readiness Check

- [ ] Current server-owned purchase eligibility is required and only `purchaseGateSatisfied=true` can proceed to payment
- [ ] Clarification, unsafe, urgent, unsupported professional-assistance, invalid, contradictory, unknown, and technical-error conditions fail closed
- [ ] Waiting, not-sending-now, temporary pause, and boundary-respecting support are not automatically disqualifying when separate assistance eligibility remains valid
- [ ] Browser, client, route, and localStorage state cannot establish Purchase authority
- [ ] The required adult-confirmation boolean is enforced by server-owned Purchase authority; no eligibility-only age band, DOB, or identity document is required
- [ ] Payment success is required before generation
- [ ] AI judgment is generated before full diagnosis
- [ ] Result page is created after generation
- [ ] Result URL is protected by an unguessable token or equivalent
- [ ] Email notification is sent or logged in development
- [ ] Dangerous cases are not given normal romantic diagnosis
- [ ] Failed generation is handled safely
- [ ] No test data appears in public
