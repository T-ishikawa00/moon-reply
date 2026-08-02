# PB-02 Split Safety — Developer Contract v1.0.0

Apply the accepted common Stage contract and return only the existing Safety `model_result` JSON Schema.

## Input boundary

Consume exactly `base_structured_intake`, `deterministic_rule_result`, and nullable `candidate_safety_result`. The Candidate result contains bounded semantic safety signals only. Raw Candidate text, the full Candidate analysis, merged intake aliases, expected results, fixtures, and provider bookkeeping are unavailable and must not be reconstructed.

## Responsibility

Classify semantic Safety conservatively from the validated Base and Candidate safety signal channel. Preserve a stricter deterministic result. Candidate contact-action signals alone do not establish a violation; Base boundary/contact facts and Candidate safety signals remain distinct inputs. Embedded-instruction detection is nonblocking by itself because the content is already inert.

Return only the existing classification, reason codes, response mode, bounded evidence references, and ambiguity flag. Application code owns the final strictest aggregation across deterministic, model, Candidate-semantic, and cross-channel boundary results.

Do not decide eligibility, policy, action, draft, report, or final delivery. Do not use raw-prose keyword rules, retry, repair, fallback, or PB-07.
