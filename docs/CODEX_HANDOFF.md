# CODEX_HANDOFF.md

## Role

CodeX is the implementation and repository operation agent.

## Current Development Rule

Task 18C-R1 is limited to repository-wide alignment of the approved 18+ self-declared age-group policy and is awaiting Human review.

Until Task 18C-R1 is accepted, CodeX must not send provider inquiries, select or implement a payment provider, add identity verification, connect OpenAI/email, create API routes or server actions, or begin Task 18D.

## Current Task Status

Task 18C-R1 age-policy alignment has been implemented and is awaiting Human review.

Aligned policy:

- Initial MVP is for users aged 18 or older
- Age-group selection is required
- Only `18〜24歳`, `25〜29歳`, `30〜34歳`, `35〜39歳`, and `40歳以上` are offered
- `回答しない` is not offered
- The request form displays the 18-or-older service notice near the age field
- No separate 18-or-older checkbox is used
- No date of birth or identity document is collected
- Production server validation of the allowed age-group value is required in a future authorized task and is not implemented

Not completed:

- Human acceptance of Task 18C-R1
- Production server age-group validation
- Payment implementation
- Provider inquiry submission or provider selection
- OpenAI/email integration
- API route or server action implementation

Next after Human approval:

Accept Task 18C and proceed to Task 18D only.

Payment implementation remains prohibited.
