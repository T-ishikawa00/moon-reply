import {
  CANDIDATE_ENVELOPE_STATES,
  type CandidateAnalysisV1,
  type CandidateEnvelopeV1,
  type CandidateSafetySignalsV1,
} from "./contracts/split-stage-contracts-v1.ts";
import { validateBaseSourceIntegrityV1 } from "./base-source-integrity-v1.ts";
import { validateCandidateSourceIntegrityV1 } from "./candidate-source-integrity-v1.ts";
import type { JsonObject } from "./types.ts";

export const SPLIT_ANALYSIS_ENVELOPE_VERSION =
  "m2-p4-split-analysis-envelope-v1" as const;

export type CandidateLaneV1 = Readonly<{
  candidate_envelope: CandidateEnvelopeV1;
  candidate_safety_result: CandidateSafetySignalsV1 | null;
}>;

export type SplitAnalysisEnvelopeV1 = Readonly<{
  base_structured_intake: JsonObject;
  base_legacy_view: JsonObject;
  candidate_envelope: CandidateEnvelopeV1;
  candidate_safety_result: CandidateSafetySignalsV1 | null;
}>;

function validatedCandidateLane(lane: CandidateLaneV1): CandidateLaneV1 {
  validateCandidateSourceIntegrityV1({
    candidateEnvelope: lane.candidate_envelope,
    candidateSafetyResult: lane.candidate_safety_result,
  });
  return structuredClone(lane);
}

export function buildAbsentCandidateLaneV1(): CandidateLaneV1 {
  return validatedCandidateLane({
    candidate_envelope: structuredClone(CANDIDATE_ENVELOPE_STATES.absent),
    candidate_safety_result: null,
  });
}

export function buildAvailableCandidateLaneV1(
  candidateAnalysis: CandidateAnalysisV1,
  candidateSafetyResult: CandidateSafetySignalsV1,
): CandidateLaneV1 {
  validateCandidateSourceIntegrityV1({
    candidateAnalysis,
    candidateSafetyResult,
  });
  return validatedCandidateLane({
    candidate_envelope: {
      presence: CANDIDATE_ENVELOPE_STATES.available.presence,
      analysis_status: CANDIDATE_ENVELOPE_STATES.available.analysis_status,
      safety_status: CANDIDATE_ENVELOPE_STATES.available.safety_status,
      analysis: structuredClone(candidateAnalysis),
    },
    candidate_safety_result: structuredClone(candidateSafetyResult),
  });
}

export function buildAnalysisUnavailableSafetyAvailableCandidateLaneV1(
  candidateSafetyResult: CandidateSafetySignalsV1,
): CandidateLaneV1 {
  validateCandidateSourceIntegrityV1({ candidateSafetyResult });
  return validatedCandidateLane({
    candidate_envelope: structuredClone(
      CANDIDATE_ENVELOPE_STATES.analysis_unavailable_safety_available,
    ),
    candidate_safety_result: structuredClone(candidateSafetyResult),
  });
}

export function buildSafetyUnavailableCandidateLaneV1(): CandidateLaneV1 {
  return validatedCandidateLane({
    candidate_envelope: structuredClone(
      CANDIDATE_ENVELOPE_STATES.safety_unavailable,
    ),
    candidate_safety_result: null,
  });
}

export function buildSplitAnalysisEnvelopeV1({
  baseStructuredIntake,
  baseLegacyView,
  candidateLane,
}: Readonly<{
  baseStructuredIntake: JsonObject;
  baseLegacyView: JsonObject;
  candidateLane: CandidateLaneV1;
}>): SplitAnalysisEnvelopeV1 {
  validateBaseSourceIntegrityV1({
    groundedBaseOutput: baseStructuredIntake,
    baseLegacyView,
  });
  validateCandidateSourceIntegrityV1({
    candidateEnvelope: candidateLane.candidate_envelope,
    candidateSafetyResult: candidateLane.candidate_safety_result,
  });

  const splitEnvelope: SplitAnalysisEnvelopeV1 = {
    base_structured_intake: structuredClone(baseStructuredIntake),
    base_legacy_view: structuredClone(baseLegacyView),
    candidate_envelope: structuredClone(candidateLane.candidate_envelope),
    candidate_safety_result: structuredClone(
      candidateLane.candidate_safety_result,
    ),
  };
  validateCandidateSourceIntegrityV1({
    splitAnalysisEnvelope: splitEnvelope,
  });
  return splitEnvelope;
}
