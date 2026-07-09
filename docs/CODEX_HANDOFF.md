# CODEX_HANDOFF.md

## Role

CodeX is the implementation and repository operation agent.

## Current Development Rule

CodeX must not implement the product until the implementation plan is approved.

Current allowed scope:

- Documentation
- Validation templates
- Prompt specs
- Safety specs
- Evaluation sheets
- LP copy drafts
- Forms and questionnaires
- Evaluation package templates
- Formatting real evaluator responses provided by Human
- One-page LP implementation plan
- Automated MVP foundation implementation plan
- File structure proposal
- Environment variable plan
- Staged implementation WBS

Current forbidden scope:

- package.json creation until approved
- src/, app/, or pages/ creation until approved
- Full app implementation
- Database implementation
- Payment API implementation
- AI API implementation
- Email API implementation
- Authentication
- Native app
- Subscription system
- Coin/point system
- User dashboard
- Fabricating real consultation cases
- Fabricating external evaluation results
- Fabricating evaluator feedback
- Fabricating sales results
- Filling evaluation results without real responses

## Current Task Status

Phase 1 MVP direction has been corrected.

The MVP is not semi-manual at public launch.

Development may use manual/mock/QA modes, but the public MVP target is automated normal diagnosis flow.

Public MVP target:

LP → self-hosted request form → safety check → payment → AI judgment → AI full diagnosis → result page → email notification → feedback.

Next step is an implementation plan, not immediate coding.

CodeX must not create package.json, src/, app/, pages/, database, API integrations, login, or payment implementation until the implementation plan is approved.

Allowed next scope:

- one-page LP implementation plan
- automated MVP foundation implementation plan
- file structure proposal
- environment variable plan
- staged implementation WBS

## Next Expected Task

Create implementation plan for the one-page LP and automated MVP foundation.
