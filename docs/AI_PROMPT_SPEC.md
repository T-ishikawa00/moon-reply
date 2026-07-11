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
6. Save summary generation

## Required Output Boundary

- Use `考えられる可能性`, `入力内容から見ると`, and other uncertainty-aware wording.
- Explain why send/wait/revise/do-not-send is recommended.
- Do not claim access to hidden information, another person's true feelings, or certain future events.
- Do not use tarot, astrology, birth dates, numerology, psychic readings, spiritual powers, or supernatural prediction.
- Include the fixed result disclaimer defined in `docs/ai/AI_PROMPT_GUARDRAILS.md`.

## Status

Specification only. No AI API implementation is authorized by Task 18C-R2.
