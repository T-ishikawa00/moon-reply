# External Holdout Contract

Status: holdout data is intentionally absent from the repository.

- Expected active holdout count: **15**.
- Holdout case data is external-only and must not be committed.
- A future authorized runner may receive an external path such as `MOON_REPLY_HOLDOUT_PATH`; M2-P1 does not create or read that environment variable.
- Holdout content is not routinely disclosed to prompt authors, CodeX, or agents working on development prompts.
- An exposed holdout case is retired and replaced with a previously unseen case.
- A counterfactual group must not cross the development and holdout splits.
- The repository may retain only holdout version metadata, expected count, and an external dataset hash after a separately authorized run.
- The repository must never retain raw holdout consultation text, oracle content, or case-level holdout payloads.

The holdout split is a final-gate asset. Development regression uses only the 70 committed development cases.
