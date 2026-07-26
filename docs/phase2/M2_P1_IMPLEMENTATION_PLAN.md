# M2-P1 Implementation Plan

## Status

M2-P1 foundation implementation and M2-P1-R1 integrity hardening are implemented, automatically validated, Human / ChatGPT accepted, and complete. The accepted foundation implementation commit is `c56f597d0491482995c4afa6fb64cf148dd66345`. M2-P1-R2 Acceptance Manifest Boundary Correction is implemented and validated at `e859b4cdfc0efa03d3372784ea34f4abb61bee9d`; it changes no accepted foundation asset or policy. This plan does not authorize M2-P2 planning or any later implementation step.

## Completed M2-P1 scope

1. Confirm exact clean base and create the dedicated branch.
2. Read current roadmap, status, M1 closure, product, fixture, and Safety owners.
3. Materialize the canonical 70 development cases into seven files.
4. Create a stable case index and external-only holdout contract.
5. Create nine JSON Schema 2020-12 foundation contracts.
6. Create PB-01 through PB-07 and nine shared prompt assets.
7. Compute prompt hashes and record the bundle manifest.
8. Draft decision, dataset, schema, prompt, scoring, versioning, and contamination policies.
9. Create an evaluation version manifest with per-file and aggregate hashes.
10. Add a Node-built-ins-only permanent verifier.
11. Synchronize current status without changing Milestone 1 closure.
12. Run all required M2, M1, typecheck, lint, build, diff, and prohibited-scope gates.
13. Commit and push only after every required gate passes.
14. Add strict counterfactual IDs and many-to-many contrast sets without changing any pre-existing input or oracle value.
15. Pre-register the immutable 20-case Human review sample.
16. Make retry semantics and PB-01 through PB-07 stage contracts machine-readable.
17. Record all-disabled runtime capabilities and reconcile the authoritative Git mutation manifest.
18. Complete Human / ChatGPT final review and record M2-P1 and M2-P1-R1 acceptance.
19. Anchor the immutable 42-file R1 manifest to its accepted historical commit range without including later lifecycle documentation.

## Future sequence — not authorized

### A. M2-P2 planning gate

M2-P2 planning has not started. Any application-owned policy, runner, model-evaluation, holdout, database, UI, API, or runtime scope requires a separate planning decision and explicit Human authorization.

### B. Application-owned policy implementation

Implement deterministic Safety aggregation, eligibility, allowed-decision policy, validation disposition, and retry ceiling. This must be independently scoped and tested. It must not call a provider merely because policy code exists.

### C. Offline development runner

Implement minimized model-input projection, structured output validation, versioned run manifests, cost accounting, refusal handling, and development-only execution. Provider, API family, model, and credentials require explicit authorization.

### D. Model evaluation

Run G0–G4 and stability on the development split. Compare candidates under recorded execution profiles. Do not alter oracles to improve scores.

### E. External holdout and Human quality gate

Use the 15-case external holdout without committing case data. Complete the 20-case Human rubric and record evidence separately.

### F. Internal vertical-slice integration

Only after acceptance, separately authorize real AI, real database, renderer assembly, internal UI, recovery, and internal delivery. Production payment, production email, authentication, and public release remain out of scope for Milestone 2 target.

## Stop conditions

Stop before mutation when:

- required scope needs a root outside the authorized manifest;
- an oracle or Human direction is ambiguous in a way that changes product policy;
- holdout content would enter the repository;
- a schema requires a forbidden probability or confidence field;
- prompts require case-specific expected answers;
- runtime code would import foundation assets;
- any provider, database, payment, email, auth, UI, or deployment action is needed; or
- required validation cannot pass without weakening a gate.

## Validation sequence

```powershell
node scripts/verify-m2-eval-foundation.mjs
node scripts/verify-m1-content-locks.mjs
node scripts/verify-m1-safety-policy.mjs
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
git diff --check
```

Automated PASS alone is not Human or model-quality acceptance. M2-P1 foundation acceptance is established by the separate explicit Human / ChatGPT final decision; no model-quality, holdout-performance, or Human product-quality result is claimed.
