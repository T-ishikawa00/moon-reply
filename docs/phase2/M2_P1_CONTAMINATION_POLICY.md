# M2-P1 Contamination Policy

## Purpose

This policy separates prompt-development data from final-gate holdout data and prevents expected answers from entering provider inputs.

## Development split

- Count: 70
- Storage: repository-visible
- Uses: prompt improvement, validator development, debugging, and continuous regression
- Oracle: committed for offline scoring
- Model input: oracle and evaluation metadata removed

Development performance is necessary evidence but not an unbiased final estimate.

## Holdout split

- Expected count: 15
- Storage: external-only
- Disclosure: not routinely shown to prompt authors, CodeX, or agents
- Use: final gate only
- Transfer: future authorized external path
- Repository data: version, expected count, and external aggregate hash only

No holdout case content, input, oracle, title, reference draft, or case-level metadata is committed.

## Exposure and retirement

A holdout case is exposed when its content or expected outcome becomes available to routine prompt development, implementation agents, or model-tuning work.

On exposure:

1. mark the case retired externally;
2. stop using it for final-gate claims;
3. replace it with an unseen case;
4. ensure the replacement has a new never-reused ID; and
5. update external version/count/hash metadata after Human review.

## Counterfactual and contrast-set isolation

A counterfactual group cannot cross development and holdout. If one member is development-visible, every member of that group belongs outside the active holdout.

Every case also belongs to one or more machine-readable contrast sets. Build an undirected graph in which cases are connected when they share either a counterfactual group ID or a contrast-set ID. Split assignment is atomic at the resulting connected-component level. A connected component cannot cross development and holdout.

The repository catalog contains development identities only. External holdout curation must reject any reused case ID, group ID, contrast-set ID, or externally known component membership that connects to development.

## Oracle protection

The provider-facing projection excludes:

- oracle;
- expected labels or decisions;
- reference drafts;
- required and forbidden assessment meanings;
- question expectations;
- material gap codes; and
- counterfactual and contrast-set metadata.

Prompts must not contain case IDs, case titles, source consultation bodies, reference drafts, or case-specific expected outputs. The permanent verifier checks the committed prompt bundle for leakage.

## Oracle change protocol

An oracle change requires:

1. Human review;
2. written factual or policy rationale;
3. counterfactual-group impact review;
4. dataset SemVer bump;
5. changelog; and
6. manifest hash refresh.

A model error, low score, or inconvenient gate is not a valid rationale by itself.

## Run evidence

Evaluation run manifests may contain case IDs and result metadata but not raw full consultation text or provider-payload oracle data. Logs must not include API keys or secrets.

## Breach response

If oracle or holdout leakage is detected:

1. fail the contamination gate;
2. invalidate affected evaluation claims;
3. stop candidate acceptance;
4. identify exposed cases and prompt/run versions;
5. retire affected holdout cases externally; and
6. require Human approval before rerun.

M2-P1 performs no holdout access or provider run.
