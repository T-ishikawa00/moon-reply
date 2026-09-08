import { CustomerAssessmentNote } from "./CustomerAssessmentNote";
import { V19L5MessageAssessmentNote } from "./V19L5MessageAssessmentNote";
import type { PaidCanonicalProjection } from "@/lib/assessment/production/recovery-candidate";

// Rendering follows the immutable, verified delivery contract. This does not
// select a candidate for new purchases.
export function PaidAssessmentNote({ projection }: { projection: PaidCanonicalProjection }) {
  return projection.projectionSchemaVersion === "v19-l5-message-projection-v1"
    ? <V19L5MessageAssessmentNote projection={projection} />
    : <CustomerAssessmentNote projection={projection} />;
}
