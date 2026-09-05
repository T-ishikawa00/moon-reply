# Moon Reply Authority Router

These repository-scoped Agent Instructions route work to existing Project Documents. They do not replace those documents or grant execution authority.

## Current task and state

- Follow the current Human-authorized task scope, prohibitions, protected paths, and required checks. Preserve unrelated work. If completion requires out-of-scope changes, stop and report instead of widening scope.
- Establish the checkout, branch, HEAD, and worktree state before assessing source. Use [CURRENT_FOCUS](docs/CURRENT_FOCUS.md) as the current-state starting point and [CODEX_HANDOFF](docs/CODEX_HANDOFF.md) for evidence navigation. Both contain historical material: verify the date, SHA, and scope of each relevant record. A branch name or a `Current` / `Active` heading alone is not current authority.
- Keep source state, verifier results, Human acceptance, deployed state, and live external facts separate. Observe external state only within the authorized task scope; report unverified external status as `UNKNOWN`.

## Project Document routes

Read the applicable references; do not copy their rule bodies into Agent Instructions.

| Topic | Existing Project Documents |
| --- | --- |
| Overview | [README](README.md) |
| Planning and Product | [ROADMAP](docs/ROADMAP.md), [PRODUCT_SPEC](docs/PRODUCT_SPEC.md), [SERVICE_POSITIONING](docs/SERVICE_POSITIONING.md) |
| Safety and AI guardrails | [SAFETY_POLICY](docs/SAFETY_POLICY.md), [CRISIS_AND_UNSUPPORTED_CASES_POLICY](docs/safety/CRISIS_AND_UNSUPPORTED_CASES_POLICY.md), [AI_PROMPT_GUARDRAILS](docs/ai/AI_PROMPT_GUARDRAILS.md) |
| Payment and monetization | [PAYMENT_CHARTER](docs/payment/PAYMENT_CHARTER.md), [PAYMENT_PLATFORM_MONETIZATION_STRATEGY](docs/payment/PAYMENT_PLATFORM_MONETIZATION_STRATEGY.md) |
| Customer identity and ownership | [CUSTOMER_IDENTITY_AUTHORITY_V1](docs/auth/CUSTOMER_IDENTITY_AUTHORITY_V1.md) |

Use applicable accepted rules and their documented successor boundaries. A draft, proposal, or historical status is not an accepted current contract. If sources conflict, report the conflict; do not infer permission or silently rewrite Project Documents to resolve it.

## Historical material and Human approval

- Dated or SHA-scoped records describe the recorded task, not standing authorization for current work. Historical, superseded, or completed tasks and consumed one-time authorizations cannot authorize a new task or rerun. Preserve historical evidence.
- The global approval boundary remains in force: external writes, migrations, deployments, secret operations, destructive Git actions, and comparable high-impact actions require explicit Human approval. Existing approval remains valid only for its original operation, target, scope, and unconsumed conditions.
- Tool access, configured permissions, Skills, roadmap entries, and passed checks do not grant additional authority. Honor local-only, read-only, and no-external-operation constraints, including limits on remote reads and artifact-producing checks.
