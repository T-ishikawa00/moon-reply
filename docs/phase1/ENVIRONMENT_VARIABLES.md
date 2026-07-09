# ENVIRONMENT_VARIABLES.md

## 0. Purpose

This document defines expected environment variables for the automated public MVP.

Do not create real secrets in the repository.

---

## 1. App

```text
NEXT_PUBLIC_APP_URL=
APP_ENV=
```

---

## 2. Supabase

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Notes:

- Service role key must never be exposed to client-side code.
- Use server-side only.

---

## 3. OpenAI

```text
OPENAI_API_KEY=
OPENAI_MODEL_JUDGMENT=
OPENAI_MODEL_DIAGNOSIS=
```

Notes:

- Judgment and diagnosis may use different models or settings.
- No API keys in repo.

---

## 4. Payment Provider

Provider-specific names may change.

```text
PAYMENT_PROVIDER=
PAYMENT_SECRET_KEY=
PAYMENT_PUBLIC_KEY=
PAYMENT_WEBHOOK_SECRET=
```

Possible providers:

- PAY.JP
- KOMOJU
- STORES
- Square

---

## 5. Email

Provider-specific names may change.

```text
EMAIL_PROVIDER=
EMAIL_API_KEY=
EMAIL_FROM_ADDRESS=
EMAIL_FROM_NAME=
```

Possible providers:

- Resend
- SendGrid
- Amazon SES
- Postmark

---

## 6. Security / Tokens

```text
RESULT_TOKEN_SECRET=
REQUEST_TOKEN_SECRET=
```

---

## 7. Development Flags

```text
ENABLE_MOCK_PAYMENT=
ENABLE_MOCK_AI=
ENABLE_EMAIL_LOG_ONLY=
ENABLE_HUMAN_QA_MODE=
```

---

## 8. Rules

- Do not commit `.env`
- Do not commit real secrets
- Use `.env.example` during implementation
- Keep public and server-only variables separated
