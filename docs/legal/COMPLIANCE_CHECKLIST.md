# COMPLIANCE_CHECKLIST.md

## Status

Internal planning draft.

This is not legal advice and is not approved for publication.

B2 Candidate status is `stripe_lane_b_legal_draft_finalization_candidate_ready_pending_human_chatgpt_review` on `2026-08-13`; Human + ChatGPT review / acceptance is `pending / pending`. Accepted policy decisions may be marked resolved, but implementation, evidence, private-value, and publication items remain open.

## Status Meaning

- [ ] Not started
- [~] Drafted / pending confirmation
- [x] Completed and evidenced

Never mark an item complete without evidence.

---

## Must Before Paid Launch

- [ ] 18+ product policy implemented
- [ ] Dedicated `私は18歳以上です` boolean self-attestation is required
- [ ] No age band, date of birth, or identity document is collected solely for age eligibility
- [ ] The form clearly states that the service is for users aged 18 or older
- [ ] Server-owned Purchase authority requires adult confirmation before real Payment
- [ ] Terms of Service published
- [ ] Privacy Policy published
- [ ] 特商法 disclosure published
- [ ] Refund Policy published
- [ ] AI disclosure published
- [ ] Unsupported-case policy published
- [ ] Contact method published
- [ ] Final payment confirmation screen implemented
- [ ] Price shown as tax-inclusive
- [ ] Payment timing/method displayed
- [ ] Delivery timing displayed
- [ ] Refund/cancellation terms displayed
- [ ] Operator disclosure method approved
- [ ] Payment provider approved the business category
- [ ] Safety check runs before payment
- [ ] Rejected safety cases cannot reach payment
- [ ] Delivery/recovery mailbox ownership verification is enforced before first or untrusted-session real Payment
- [ ] Trusted delivery/recovery verification state is server-authoritative and cannot be self-asserted by browser, client, or localStorage state
- [ ] Delivery/recovery email change or an invalid, expired, revoked, or unavailable trusted session requires reverification before real Payment
- [ ] Marketing email consent is optional and separate
- [ ] Result notification consent is distinguished from marketing
- [ ] Fake reviews/metrics prohibited
- [ ] AI provider payload excludes direct identifiers
- [ ] Data retention periods approved
- [ ] Data deletion request process documented
- [ ] Result-token expiry/revocation design approved
- [ ] Official support-resource links verified
- [ ] J-PlatPat search completed and recorded
- [ ] Current official-source legal, Privacy, and Customer-rights review completed and evidenced
- [ ] Actual implementation, Provider evidence, and final public wording reviewed for consistency
- [ ] Material legal obligations identified and either resolved or retained as explicit blockers
- [ ] Professional consultation, if used, recorded as optional escalation and not treated as a Paid Launch prerequisite

---

## Should Before Paid Launch

- [ ] Phone/address/full-name warning implemented
- [ ] Input pattern detection tested
- [ ] Result link revocation process tested
- [ ] Email correction/resend process designed
- [ ] Provider webhook retry policy reviewed
- [ ] Chargeback process documented
- [ ] AI prompt output guardrails tested
- [ ] Safety regression suite created
- [ ] Dependency audit reviewed

---

## Later

- [ ] Trademark filing decision
- [ ] Separate Cookie Policy
- [ ] Native app legal review
- [ ] Subscription legal review
- [ ] App-store billing review

Do not mark uncompleted items as completed.

---

## Internal Draft Preparation

- [x] Terms draft created
- [x] Privacy draft created
- [x] 特商法 draft created
- [x] Refund draft created
- [x] AI disclosure draft created
- [x] Unsupported-cases public draft created
- [x] Contact-page draft created
- [x] Operator decision register created
- [x] Cross-document consistency matrix created
- [x] Publication gate created
- [x] B2 Candidate legal-draft/spec alignment assembled with the exact 41-path manifest
- [ ] B2 Human + ChatGPT review and acceptance completed

These checks mean internal drafts exist. They do not mean publication approval.
