# M2-P1 Versioning Policy

## Canonical versions

| Component | Version |
| --- | --- |
| decision policy | `decision-policy-v1.0.0` |
| pipeline schemas | `pipeline-schema-v1.0.0` |
| prompt bundle | `prompt-bundle-v1.0.0` |
| validator | `validator-v1.0.0` |
| Safety policy | `safety-policy-v1.0.0` |
| development dataset | `eval-development-v1.0.0` |
| report renderer contract | `report-renderer-v1.0.0` |
| retry policy | `retry-policy-v1.0.0` |
| stage contracts | `stage-contracts-v1.0.0` |
| contrast-set catalog | `contrast-set-catalog-v1.0.0` |
| Human review sample | `human-review-sample-v1.0.0` |

These versions identify logical artifacts. A Git SHA identifies the repository state, while file hashes identify canonical UTF-8 text content.

## Semantic versioning

### Major

Increment major for:

- decision meaning or priority change;
- Safety meaning or aggregation change;
- removal of a required field;
- incompatible enum or nullability change;
- chapter or product responsibility change; or
- scoring hard-gate change.

### Minor

Increment minor for:

- a new case;
- a backward-compatible field;
- a new deterministic or semantic validator;
- a new forbidden expression or finding code;
- an additive approved question; or
- a backward-compatible response mode.

### Patch

Increment patch for:

- typo correction;
- explanation clarity;
- non-semantic reference-draft edit;
- document organization; or
- metadata correction with no behavioral meaning change.

An oracle outcome change is never classified as a mere patch.

## Coupled changes

Changes may require multiple version bumps:

- decision-policy change may require prompt, dataset, validator, and schema review;
- schema change may require prompt and renderer review;
- Safety change requires Safety cases, benign controls, prompt, and validator review;
- dataset oracle change requires counterfactual review and dataset bump;
- renderer ownership change requires report schema and prompt review.

The change record must state why each coupled component did or did not bump.

M2-P1-R1 is pre-acceptance hardening of an unreleased draft. Existing `v1.0.0` component identifiers remain stable because no Human-accepted or runtime-consumed baseline exists; hashes and the R1 task identity record the exact revision. Any post-acceptance equivalent change must follow the SemVer rules above.

## Model identity

Requested model alias and returned model ID are distinct fields in an evaluation run manifest. Neither is a prompt-bundle version. A provider may return a different concrete identifier than requested; both values must be retained.

M2-P1 selects no model.

## Hashes

Prompt and evaluation manifests store lowercase SHA-256 of UTF-8 file content after normalizing CRLF to LF. The algorithm identifier is `sha256-utf8-lf`. This preserves the exact repository text contract across Windows and Unix checkouts without changing content meaning. Hashes are recomputed after final content.

The aggregate development-dataset hash is calculated over the ordered sequence:

`relative_path + ":" + canonical_file_sha256 + "\n"`

for every file listed in the evaluation manifest.

## Timestamp

Generated timestamps are evidence metadata and do not affect component SemVer. A manifest-only timestamp refresh is not justified unless corresponding bytes or evidence changed.

## Release and acceptance

A version may be drafted and automatically validated without being Human-accepted. Record these states separately:

- drafted;
- automatically validated;
- Human / ChatGPT review pending;
- Human accepted;
- runtime authorized; and
- released.

M2-P1 ends at automatically validated foundation with review pending.
