import { ReviewRequestState, UnknownReviewRequestState } from "@/components/review/ReviewRequestState";
import { getReviewSafetyState, REVIEW_SAFETY_STATES } from "@/fixtures/review/safety-states";

export function generateStaticParams() {
  return Object.keys(REVIEW_SAFETY_STATES).map((stateId) => ({ stateId }));
}

export default async function ReviewRequestStatePage({ params }: { params: Promise<{ stateId: string }> }) {
  const { stateId } = await params;
  const state = getReviewSafetyState(stateId);
  return state ? <ReviewRequestState state={state} /> : <UnknownReviewRequestState />;
}
