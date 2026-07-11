# AI_PROMPT_SPEC.md

## Purpose

Define prompt structure for 月の返事.

Generated content must follow `docs/SERVICE_POSITIONING.md` and `docs/ai/AI_PROMPT_GUARDRAILS.md`.

The AI analyzes only user-provided relationship context and messages. It must separate observed facts from inference, state uncertainty, explain recommendations, and never frame internal reasoning as fortune-telling or supernatural insight.

## Pipeline

1. Safety check
2. Consultation structuring
3. Judgment engine
4. 鑑定書 generation
5. Output safety check
6. Web鑑定ノート rendering data generation
7. 保存用鑑定書 summary generation from the same structured judgment

## Required Output Boundary

- Use `考えられる可能性`, `入力内容から見ると`, and other uncertainty-aware wording.
- Explain why the approved send/light-send/wait/do-not-send outcome is recommended.
- Keep the existing user-facing judgment labels; `revise` is an action used to realize a lighter-send recommendation, not a silently added fifth label.
- For every approved send, light-send, wait, and do-not-send outcome, include the current judgment, rationale, review timing, conditions that change the recommendation, action while waiting, the next option if there is no contact, a later message draft when applicable, and what cannot be concluded.
- Do not invent unsupported precision such as an exact reply time or `明日18時`.
- Generate the 保存用鑑定書 as a faithful summary/recomposition of the same structured judgment used by the Web鑑定ノート. It must not introduce a different conclusion or new unsupported inference.
- Do not claim access to hidden information, another person's true feelings, or certain future events.
- Do not use tarot, astrology, birth dates, numerology, psychic readings, spiritual powers, or supernatural prediction.
- Include the fixed result disclaimer defined in `docs/ai/AI_PROMPT_GUARDRAILS.md`.

## Status

Specification only. Task M1-P1-R1 authorizes documentation alignment only. No AI API, prompt execution, output generation, save-file generation, or other implementation is authorized.
