# M2-P1 Implementation Plan

## Status

M2-P1 foundation implementation is complete on its dedicated branch when all automated gates pass. Human / ChatGPT review remains pending. This plan does not authorize any later step.

## Completed M2-P1 scope

1. Confirm exact clean base and create the dedicated branch.
2. Read current roadmap, status, M1 closure, product, fixture, and Safety owners.
3. Materialize the canonical 70 development cases into seven files.
4. Create a stable case index and external-only holdout contract.
5. Draft nine JSON Schema 2020-12 files.
6. Draft seven stage prompts and seven shared prompt assets.
7. Compute prompt hashes and record the bundle manifest.
8. Draft decision, dataset, schema, prompt, scoring, versioning, and contamination policies.
9. Create an evaluation version manifest with per-file and aggregate hashes.
10. Add a Node-built-ins-only permanent verifier.
11. Synchronize current status without changing Milestone 1 closure.
12. Run all required M2, M1, typecheck, lint, build, diff, and prohibited-scope gates.
13. Commit and push only after every required gate passes.

## Candidate future sequence — not authorized

### A. Human foundation review

Review the 70 oracles, counterfactual groups, schemas, prompts, gates, retry draft, manifests, and exact diff. Record corrections or acceptance.

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

Automated PASS is not Human or model-quality acceptance.
