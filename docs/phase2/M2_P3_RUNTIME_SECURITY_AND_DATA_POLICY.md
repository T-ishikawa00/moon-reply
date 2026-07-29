# M2-P3 Runtime Security and Data Policy

## 1. Classification

The M2-P3-A runtime is an internal development capability for synthetic data. It is not a public data-processing service and is not authorized for real-user or real-person information. M2-P3-A and M2-P3-A-R1 Runtime Security and Transaction Hardening are Human / ChatGPT accepted and complete.

## 2. Environment and secret boundary

Required server-only variables:

- `OPENAI_API_KEY`;
- `OPENAI_MODEL`;
- `SUPABASE_URL`;
- `SUPABASE_SECRET_KEY`;
- `M2_INTERNAL_RUNTIME_ENABLED`.

`OPENAI_MODEL` must equal `gpt-5.6-luna`. `M2_INTERNAL_RUNTIME_ENABLED` must equal exactly `true`. Missing, empty, or disallowed configuration fails closed.

Rules:

- values are never committed;
- `.env.local` is not created by this task and remains ignored;
- only names and safe descriptions appear in `.env.example`;
- no variable value, key prefix, key length, raw environment, raw header, or stack trace is logged or returned;
- live secret owners are fenced with `server-only`;
- no runtime secret uses a `NEXT_PUBLIC_` name;
- no browser Supabase or OpenAI client is created for M2-P3.

## 3. Route protections

The internal route:

- returns not found when production-disabled or feature-disabled;
- requires same-origin browser submission;
- rejects unknown body fields;
- limits body size and field lengths;
- requires a UUID idempotency key;
- requires explicit privacy acknowledgement;
- generates database identifiers on the server;
- returns only allowlisted safe error codes;
- sets `Cache-Control: no-store` and `X-Robots-Tag: noindex, nofollow`.

## 4. Provider minimization

OpenAI Responses requests use:

- `store: false`;
- `tools: []`;
- `stream: false`;
- `background: false`;
- `service_tier: default`;
- `truncation: disabled`;
- `reasoning.effort: low`;
- strict JSON Schema output;
- no `previous_response_id`;
- no conversation object.

Only the current Stage input and canonical developer Prompt are transmitted when a separately configured development runtime is actually enabled. M2-P3-A automated validation does not transmit either.

## 5. Database access

The Supabase binding uses the server-only secret key and disables auth persistence, URL session detection, and token refresh. All four runtime tables enable RLS. No `anon` or `authenticated` policy is created. Browser access is therefore not a supported path; all application access is through the internal Next.js server.

## 6. Persisted data

Allowed:

- bounded synthetic request fields;
- request/run/Stage identifiers and statuses;
- Stage output JSON;
- Prompt/Schema/request hashes and versions;
- provider response ID and returned model;
- usage, latency, and usage-derived cost estimate;
- final report and decision card;
- safe error code.

Prohibited:

- real-user data;
- API keys or Authorization headers;
- raw environment state;
- complete Prompt text in runtime rows;
- internal reasoning or chain of thought;
- raw provider error bodies;
- raw request headers or stack traces.

## 7. Failure behavior

There is no automatic retry, Repair, PB-07, or fallback model. Schema error, model mismatch, semantic rejection, provider error, or persistence error stops the run. A later Stage is never invoked after a failed Stage.

Final success is atomic. Report insertion, decision-card persistence, run completion, request completion, completion timestamp, final decision, and usage totals are committed in one fixed-parameter Postgres transaction. Report-insert or run-update failure rolls back every provisional success write. Duplicate finalization and concurrent idempotency conflicts fail safely. Request/run persistence occurs before PB-01, and every provider invocation is preceded by a persisted Stage-start row.

## 8. Dependency security status

- production-reachable high/critical vulnerabilities: `0`;
- direct Next.js high findings resolved by updating to `16.2.12`;
- remaining production-installed findings: `3`, classified as not reachable from M2 Runtime;
- remaining development-only findings: `9`;
- npm audit findings are documented rather than silently ignored; and
- no `npm audit fix --force` was used.

## 9. Retention and deletion

No production retention policy is authorized. Before any development project is populated, Human must define synthetic-data retention and deletion operations. Public retention, user deletion, access requests, and production privacy operations remain later milestones.
