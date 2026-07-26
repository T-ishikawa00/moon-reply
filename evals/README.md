# M2-P1 Evaluation Foundation

Status: development evaluation assets drafted and automatically verifiable; Human / ChatGPT review pending.

This directory contains the repository-visible development split for M2-P1. It is a quality-engineering asset, not product runtime data. Nothing under `evals/**` is imported by the application, sent to a model, persisted to a database, or used to authorize delivery.

## Development split

The canonical development dataset is `eval-development-v1.0.0` and contains exactly 70 cases:

| File | Purpose | Count |
| --- | --- | ---: |
| `development/reply-now.json` | reply to an incoming meaningful message | 10 |
| `development/send-now.json` | initiate for a clear, low-pressure reason | 10 |
| `development/wait-and-reassess.json` | wait and reassess | 10 |
| `development/pause-additional-contact.json` | stop additional contact | 10 |
| `development/needs-more-information.json` | material information gaps | 8 |
| `development/safety-blocked.json` | Safety-blocked controls | 13 |
| `development/benign-safety-controls.json` | benign false-positive controls | 9 |
| **Total** |  | **70** |

`development/index.json` preserves stable ordering and maps every case ID to its source file and expected top-level outcomes. `version-manifest.json` owns file hashes and the aggregate development-dataset hash. Text hashes use UTF-8 with CRLF normalized to LF (`sha256-utf8-lf`) so the gate is stable across operating-system checkout conventions.

## Oracle isolation

Each repository fixture includes a Human-owned `oracle` for offline scoring. A future model-input projection must remove `oracle`, expected outcomes, reference drafts, evaluation-only required meanings, forbidden claims, and counterfactual metadata before any provider request is constructed. The permanent verifier creates that projection in memory and asserts that the oracle is absent.

`required_reasoning_meanings` describes externally assessable rationale meaning. It is not a request for private chain-of-thought. A reference draft is a semantic evaluation aid, not an exact-string oracle.

## Case governance

- Case IDs are immutable, unique, and never reused.
- Every committed case has `dataset_split = development`.
- Oracle changes require Human review, a written rationale, a counterfactual check, a dataset version bump, and a changelog entry.
- Model failure alone is not grounds to change an oracle.
- Counterfactual groups stay within one split.
- Development cases may be used for prompt improvement and continuous regression.

## Holdout boundary

Holdout cases are external-only. See `holdout/README.md`. No holdout case content belongs in this repository.

## Validation

Run:

```powershell
node scripts/verify-m2-eval-foundation.mjs
```

The verifier uses Node built-ins only, performs no network or provider call, and validates foundation integrity rather than model quality.
