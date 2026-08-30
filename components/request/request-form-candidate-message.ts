export const MESSAGE_IMPACT_TOPIC_LABEL =
  "この文面がどう届くか知りたい" as const;

export const CANDIDATE_MESSAGE_REQUIRED_ERROR =
  "確認したい、送ろうとしている文面を入力してください。" as const;

export function candidateMessageRequired(
  selectedTopics: readonly string[],
) {
  return selectedTopics.includes(MESSAGE_IMPACT_TOPIC_LABEL);
}

export function validateCandidateMessage(
  selectedTopics: readonly string[],
  candidateMessage: string,
) {
  return candidateMessageRequired(selectedTopics) && !candidateMessage.trim()
    ? CANDIDATE_MESSAGE_REQUIRED_ERROR
    : null;
}
