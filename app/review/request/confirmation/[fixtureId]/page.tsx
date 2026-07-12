import { ReviewRequestConfirmation } from "@/components/review/ReviewRequestConfirmation";
import { UnknownReviewRequestState } from "@/components/review/ReviewRequestState";
import { getRequestFixture } from "@/fixtures/review/requests";

const confirmationAllowlist = { "normal-001": "request-normal-001" } as const;

export function generateStaticParams() {
  return Object.keys(confirmationAllowlist).map((fixtureId) => ({ fixtureId }));
}

export default async function ReviewRequestConfirmationPage({ params }: { params: Promise<{ fixtureId: string }> }) {
  const { fixtureId } = await params;
  const requestId = confirmationAllowlist[fixtureId as keyof typeof confirmationAllowlist];
  const fixture = requestId ? getRequestFixture(requestId) : undefined;
  return fixture ? <ReviewRequestConfirmation fixture={fixture} /> : <UnknownReviewRequestState />;
}
