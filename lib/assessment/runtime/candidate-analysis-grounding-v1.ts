import {
  type CandidateAnalysisV1,
  type CandidateProviderInputV1,
  type CandidateProviderOutputV1,
  type CandidateSafetySignalsV1,
} from "./contracts/split-stage-contracts-v1.ts";
import { validateCandidateSourceIntegrityV1 } from "./candidate-source-integrity-v1.ts";
import { M2RuntimeError } from "./errors.ts";
import type { JsonObject } from "./types.ts";

export const CANDIDATE_ANALYSIS_GROUNDING_VERSION =
  "m2-p4-candidate-analysis-grounding-v1" as const;

export type CandidateAnalysisGroundingResultV1 = Readonly<{
  candidate_analysis: CandidateAnalysisV1;
  candidate_safety_result: CandidateSafetySignalsV1;
}>;

export function projectCandidateProviderInputV1(
  optionalMessage: string,
): CandidateProviderInputV1 {
  if (
    typeof optionalMessage !== "string" ||
    optionalMessage.trim().length === 0
  ) {
    throw new M2RuntimeError("M2_CANDIDATE_SOURCE_INTEGRITY_FAILED");
  }
  const projected = {
    optional_message: optionalMessage,
    candidate_metadata: {
      message_owner: "user",
      message_status: "unsent_candidate",
    },
  } as const;
  validateCandidateSourceIntegrityV1({ candidateProviderInput: projected });
  return projected;
}

export function groundCandidateAnalysisV1(
  rawCandidateProviderOutput: JsonObject,
): CandidateAnalysisGroundingResultV1 {
  validateCandidateSourceIntegrityV1({
    rawCandidateProviderOutput,
  });
  const raw = rawCandidateProviderOutput as unknown as CandidateProviderOutputV1;
  const style = raw.candidate_style_profile;
  const intent = raw.candidate_communicative_intent;
  const language = raw.candidate_language_expression;
  const safety = raw.candidate_safety_signals;

  return {
    candidate_analysis: {
      candidate_style_profile: {
        register: style.register,
        sentence_length: style.sentence_length,
        sentence_ending: style.sentence_ending,
        punctuation: style.punctuation,
        emoji_usage: style.emoji_usage,
        exclamation_usage: style.exclamation_usage,
        softness: style.softness,
        directness: style.directness,
        invitation_style: style.invitation_style,
        reply_pressure: style.reply_pressure,
      },
      candidate_communicative_intent: {
        gratitude_strength: intent.gratitude_strength,
        apology_strength: intent.apology_strength,
        question_count: intent.question_count,
        invitation_presence: intent.invitation_presence,
        invitation_specificity: intent.invitation_specificity,
        affection_strength: intent.affection_strength,
        commitment_strength: intent.commitment_strength,
        response_pressure: intent.response_pressure,
        boundary_strength: intent.boundary_strength,
        conversation_closure: intent.conversation_closure,
        practical_requirement: [...intent.practical_requirement],
      },
      candidate_language_expression: {
        primary_language: language.primary_language,
        mixed_languages: [...language.mixed_languages],
        dialect_or_regional_expression:
          language.dialect_or_regional_expression,
        intentional_nonstandard_expression:
          language.intentional_nonstandard_expression,
        possible_typo: language.possible_typo,
      },
    },
    candidate_safety_result: {
      untrusted_embedded_instruction_detected:
        safety.untrusted_embedded_instruction_detected,
      signal_codes: [...safety.signal_codes],
    },
  };
}
