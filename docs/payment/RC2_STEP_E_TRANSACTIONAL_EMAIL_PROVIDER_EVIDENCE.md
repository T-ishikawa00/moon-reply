# RC-2 Production Activation Step E — Transactional Email Provider Evidence

Status: `RC-2 Production Activation Step E Transactional Email Provider Implementation implemented_pending_human_chatgpt_review`

This evidence is sanitized. It contains no API key, Customer address, verification code from a real request, result capability, provider response, remote identifier, or Customer payload.

## 1. Authority and boundary

- Dependency Security Remediation acceptance commit: `243e8655098ba9e0972e0e1efd68f83fbc2ded30`.
- Accepted dependency release: `release/private-ready` at `243e8655098ba9e0972e0e1efd68f83fbc2ded30`.
- Step E branch: `task/rc2-resend-email-provider`, created from that exact release.
- `main`: unchanged at `61e33a10e195fad17e253a6b9719217e1992f273`.
- Scope: server-only Resend implementation and offline readiness evidence only.
- Resend API/account action, real Email, Supabase remote operation, migration apply, Stripe API/Dashboard, Payment, webhook, OpenAI Provider, Netlify deploy, runtime flag transition, remote secret change, DNS, PR, main merge, and Public Launch: `0`.

## 2. Dependency and environment contract

- Resend Node SDK: exact stable `6.20.0` in both manifest and lock; no range, canary, preview, override, or audit suppression.
- Production and full npm audit: `0 vulnerabilities`.
- Provider selector: exact `TRANSACTIONAL_EMAIL_PROVIDER=resend` only.
- Generic server-only values: `EMAIL_API_KEY`, `EMAIL_FROM_ADDRESS`, and `EMAIL_FROM_NAME`.
- No provider-specific API-key alias or secondary provider selector was introduced.
- `.env.example` keeps the provider `unconfigured`, all production activation flags `false`, and all three values blank.
- Missing/unsafe Resend configuration fails closed with the existing safe `PAYMENT_CONFIGURATION_INVALID` code. Unknown provider values remain `TRANSACTIONAL_EMAIL_PROVIDER_UNSUPPORTED`.

## 3. Adapter architecture and idempotency

- `ResendTransactionalEmailAdapterV1` is in the focused `server-only` provider module `lib/payment/production/resend-transactional-email.ts`.
- The existing `TransactionalEmailAdapterV1`, `sendMailboxVerification`, and `sendAssessmentResult` contract is unchanged.
- Production construction instantiates `Resend` only after configuration validation. A narrow injected client seam permits deterministic offline proof without a Provider request.
- Every send passes the existing `request.messageIdempotencyKey` unchanged as the Resend SDK `idempotencyKey`; no second delivery identity is generated.
- One adapter invocation performs at most one client send. There is no hidden provider retry.
- Success requires a non-empty bounded provider message ID and returns only `{ providerMessageReference }`. Error bodies, headers, status, and other provider internals are not returned.

## 4. Sender and Customer-content controls

- Sender address uses the existing normalized email syntax validator.
- Sender display name is normalized, non-empty, bounded to 80 Unicode code points, and rejects control characters and unsafe mailbox delimiters. CR/LF injection is rejected.
- Verification content is Japanese and limited to the `月の返事` identity, the exact eight-digit code, expiration in Japan time, input guidance, and a do-not-share warning. It contains no consultation or assessment content.
- Result content is Japanese and limited to the `月の返事` identity, 鑑定ノート readiness, the protected HTTPS result capability URL, expiry/access guidance, and a do-not-share warning. It contains no consultation text, Candidate message, assessment body, decision, or relationship detail.
- Verification code and result URL remain in separate templates. Both text and minimal HTML are sent.
- Recipient, code, result URL, full payload, and Provider response are never logged by the adapter or service wiring.

## 5. Failure semantics and offline proof

- Mailbox Provider failure, thrown transport error, invalid/empty provider ID, and unknown response state map to `EMAIL_VERIFICATION_DELIVERY_FAILED`.
- Result Provider failure and transport ambiguity map to `RESULT_EMAIL_DELIVERY_FAILED`.
- Existing application challenge-failure state and RC-1 notification credential revocation/outbox retry paths are unchanged; unknown delivery is never converted into success.
- Focused verifier: `verify:rc2:email-provider` PASS `14/14`.
- The injected fake proves recipient, sender, subject, text/HTML, exact idempotency forwarding, template separation, provider ID mapping, one-call failure behavior, safe errors, invalid configuration rejection, absence of embedded credentials, and false activation defaults.
- No actual Resend call is made by the verifier or any Step E task action.

Official SDK semantics used by the implementation:

- Send response/message ID: <https://resend.com/docs/api-reference/emails/send-email>
- Node SDK idempotency option: <https://resend.com/docs/dashboard/emails/idempotency-keys>

## 6. Regression and integrity evidence

- `verify:rc2`: PASS `48/48`.
- `verify:rc1`: PASS `14/14`.
- `verify:rc2:activation-preflight`: PASS `15/15`.
- `verify:rc2:stepb`: PASS `18/18`.
- `verify:rc2:acl-hardening`: PASS `14/14`.
- `verify:rc2:email-provider`: PASS `14/14`.
- Typecheck: PASS.
- Lint with zero warnings: PASS.
- Next `16.3.0` production build: PASS; static generation `38/38`; route inventory unchanged.
- Git diff checks: PASS.
- Migrations `0002..0013`: byte-identical to the accepted dependency release.
- V17 and Q0 authority: unchanged.

The Step D ACL verifier previously required every `app/components/lib` path to be unchanged from Step C. Step E necessarily changes production email wiring. Its structural gate now pins the only permitted Runtime delta from the accepted Step E base to exactly `lib/payment/production/service.ts` plus `lib/payment/production/resend-transactional-email.ts`; all other Runtime paths remain rejected.

## 7. Activation ceiling and exact next action

This task establishes implementation readiness only. Resend account/domain/sender verification, API key provisioning, real Email, deliverability review, runtime activation, Stripe connection, webhook, actual Payment, monitoring/rehearsal, RC-3, PRIVATE RELEASE READY, and Public Launch remain incomplete or false.

Exact next Human action: review Step E. If accepted, separately authorize Resend account/sender configuration and the first bounded email test. Do not configure Stripe or send a real email under this task.
