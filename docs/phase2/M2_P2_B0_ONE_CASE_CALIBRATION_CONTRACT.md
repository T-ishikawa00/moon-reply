# M2-P2-B0 One-Case Paid Calibration Contract

## 1. Status and authority

- Task: `M2-P2-B0 One-Case Paid Calibration Contract Foundation`
- Foundation main SHA: `cadd019303247310623f582a505d5745c0186b30`
- Contract version: `one-case-calibration-contract-v1.0.0`
- Accepted implementation commit: `cf75679f2d116132f7519256cd762ba1a51a0af9`
- State: contract implemented; automated validation and Human / ChatGPT final review complete; accepted and complete
- Current API spend authorization: USD 0
- Live execution: unauthorized
- M2-P2-B1: unauthorized and not started

This is a zero-cost, local-only contract foundation. It implements no HTTP request, provider executor, API-key access, database, authentication, payment, email, API route, server action, UI, application runtime, or deployment.

The first possible paid calibration is not a model-quality benchmark. Its only purposes are to calibrate accepted static token/cost estimates, provider compatibility, usage reporting, and Stage plumbing.

## 2. Fixed case

The only registered case is `WAIT-003`.

- source: `evals/development/wait-and-reassess.json`
- split: `development`
- dataset: `eval-development-v1.0.0`
- dataset hash: `9960f91c0e4eb0009bca6be7834437d56195c0e5682f5e679530cdb7df64d0e8`
- case hash: `578e02bbdc20542ea4e2aeb274ac78901d0240e3ac0cee66d13148741b89a2c2`
- oracle: local-only and prohibited from every provider payload
- holdout data: prohibited
- real-user data: prohibited

The verifier requires `WAIT-003` to exist exactly once in both its source file and the development index.

## 3. Candidate identity and non-selection

The future calibration candidate is:

- provider: `openai`
- API family: `responses`
- requested model: `gpt-5.6-luna`
- role: `cost_and_plumbing_calibration_candidate`
- selected for product: `false`
- selected for baseline: `false`
- live execution authorized: `false`

Luna availability and authorization for the local OpenAI project are not verified. A future B1 must stop if the requested model is unavailable or unauthorized. No fallback model is allowed, and no automatic switch to Terra or Sol is allowed.

A future B1 must record the returned model ID separately from the requested model. No alias or snapshot behavior is assumed. Candidate registration is not product-model selection and does not establish model quality.

## 4. Exact Stage sequence

Each Stage or local step may run at most once:

1. `PB-01 Structure`
2. `PB-02 Safety Semantic`
3. `PB-03 Eligibility`
4. local deterministic Safety aggregation
5. local deterministic Decision Policy
6. `PB-04 Decision Planning`
7. deterministic plan validation
8. `PB-05 Report Writing`
9. deterministic report validation
10. `PB-06 Semantic Validation`

Provider calls occur only at PB-01 through PB-06: six calls maximum. The four application-owned deterministic steps are not provider calls. PB-07 Repair is excluded.

Transport retry, Schema retry, Repair, fallback, automatic continuation after a failed Stage, 14-case execution, 70-case execution, holdout execution, and real-user execution are all prohibited.

## 5. Future Responses request contract

Every registered provider Stage references the exact common request contract in `evals/calibration/stage-plan-v1.json`:

- endpoint: `/v1/responses`
- `store: false`
- `tools: []`
- `stream: false`
- `background: false`
- `service_tier: default`
- `truncation: disabled`
- `reasoning.effort: low`
- reasoning summary request: false
- `text.format.type: json_schema`
- strict Schema adherence: true

The future request must omit `previous_response_id`, conversation state, web search, file search, code interpreter, prompt-cache key, prompt-cache retention, user tracking, and a Safety identifier for this fixed development fixture. No web, file, code, or other tool use is allowed.

B0 neither implements nor executes this request.

## 6. Output caps

| Stage | `max_output_tokens` |
| --- | ---: |
| PB-01 | 4000 |
| PB-02 | 800 |
| PB-03 | 700 |
| PB-04 | 4500 |
| PB-05 | 8000 |
| PB-06 | 2500 |

The total provider output cap is 20,500 tokens. A Stage cannot borrow another Stage's unused cap. `max_output_tokens` is the provider response's total output budget, including reasoning usage.

## 7. Static estimate linkage

The contract links, without modifying, the accepted M2-P2-A estimator:

- estimator report file hash: `847750046139642988b5f230d717b36c0384b4ca7715c6b30af1886ce3ede771`
- accepted generated-report projection hash: `0e79050e8f44d91b2329e92e97fd91b833c0a37bda397bb16b20132beb4ec84f`
- Prompt manifest hash: `abcc37aac3d461ff2fc310c08708a3e26c5d658eb081cf2f4241529ca4accdb0`
- Schema-set hash: `1bdb2a124d00fdb094296099d6cf5e9a3493910083f648cd804021ac64f22818`
- price snapshot hash: `731b7ae22346149c49bf7c792d99bcb70c87d0af7739a5a12670b0330d16c430`

The prepare script recomputes exact local-envelope bytes, LOW/CENTRAL/HIGH input estimates, the conservative-profile HIGH input estimate, configured output-cap ceiling, standard conservative cost, and standard hard-cap cost. It relies on neither Batch nor cache savings.

## 8. Preflight and post-Stage gates

Before a future first call, B1 must prove:

- exact contract hash;
- exact case hash;
- exact Prompt hashes;
- exact Schema hashes;
- exact price-snapshot hash;
- exact requested model;
- predicted hard ceiling at or below USD 0.30;
- explicit separate Human approval;
- exact USD 1 absolute approval ceiling;
- API key presence in the process environment; and
- no display of the API-key value.

After every future provider Stage:

- response status is `completed`;
- refusal is absent;
- a required output message exists;
- JSON parses;
- Schema validation passes;
- usage exists;
- returned model ID and latency are recorded;
- cumulative usage-derived cost estimate is recorded; and
- the deterministic owning-Stage gate passes.

Failure stops the run immediately. No synthetic continuation may fill a missing live result.

## 9. Immediate stop conditions

Stop on:

- API or transport failure;
- timeout;
- incomplete response;
- refusal;
- missing usage;
- invalid JSON;
- Schema failure;
- Safety failure;
- oracle leakage;
- unallowed decision;
- hallucinated fact;
- Stage-gate failure; or
- budget-guard failure.

There is no retry, Repair, fallback, or automatic continuation.

## 10. Human approval lock

The immutable B0 state is:

```text
live_execution_authorized: false
paid_run_completed: false
api_spend_usd: 0
```

No B0 config or command can switch it to true. Future B1 requires all of:

- a separately committed Human approval record;
- exact approved contract hash;
- exact approved case;
- exact approved model;
- exact approved Stage list;
- exact approved USD 1 ceiling;
- an explicit live CLI flag; and
- an exact one-time local confirmation value.

Absence of any condition requires a stop before network access. B0 implements no live CLI.

## 11. Deterministic preview and contract hash

`scripts/prepare-m2-p2-b0-calibration-contract.mjs` writes `evals/calibration/reports/contract-preview-v1.json`. The preview records:

- foundation SHA and contract version;
- contract, case, dataset, Prompt, Schema, estimator-report, and price hashes;
- candidate and non-selection state;
- Stage sequence and provider/local counts;
- reasoning setting and output caps;
- exact envelope sizes and token bands;
- conservative and hard-cap cost estimates;
- USD 0 current authorization, USD 1 future ceiling, and USD 0.30 preflight ceiling;
- no retry, Repair, fallback, or automatic continuation;
- live authorization false and B1 unauthorized;
- Security and artifact requirements; and
- all immediate stop conditions.

The contract hash is the SHA-256 of the fixed ordered sequence `relative_path + ":" + canonical_file_sha256 + "\n"` across the seven contract and Schema source files. The generated preview is excluded from that source set, avoiding self-reference. Repeated prepare runs from unchanged sources must be byte-identical.

## 12. Boundary

M2-P2-B0 creates an accepted contract only. Contract acceptance does not establish provider compatibility, model quality, actual token usage, actual API cost, Human product quality, or live readiness. `USD 0.213223` remains a deterministic static hard-cap estimate, not actual spend.
