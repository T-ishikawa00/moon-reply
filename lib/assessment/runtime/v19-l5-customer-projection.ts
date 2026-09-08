import { M2RuntimeError } from "./errors.ts";
import type { V19L5Result } from "./v19-l5-application.ts";

export type V19L5MessageProjection = {
  kind: "message_edit" | "message_composition";
  opening: string;
  draft: string;
  explanation: string;
  closing: string;
};

/** A separate message surface avoids pretending that an edit is a wait decision.
 * Only validated final Customer text crosses this local preview boundary. */
export function projectV19L5Message(result: V19L5Result): V19L5MessageProjection {
  if (result.schemaVersion !== "v19-l5-local-result-v1" || result.finalState !== "completed" ||
      result.answerMode !== "message_only" || !result.messageResult || result.stopFinding !== null ||
      result.decisionResult !== null) throw new M2RuntimeError("V19_L5_CUSTOMER_PROJECTION_INVALID");
  const { plan, content } = result.messageResult;
  const projection: V19L5MessageProjection = {
    kind: plan.original_text.length > 0 ? "message_edit" : "message_composition",
    opening: content.opening, draft: plan.revised_text, explanation: content.edit_reason, closing: content.closing,
  };
  if (Object.values(projection).some(text => typeof text !== "string" || !text.trim())) {
    throw new M2RuntimeError("V19_L5_CUSTOMER_PROJECTION_INVALID");
  }
  return projection;
}
