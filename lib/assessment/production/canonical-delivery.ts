import { timingSafeEqual } from "node:crypto";
import {
  decodeCustomerAssessmentExperienceProjectionV2,
} from "../runtime/customer-assessment-experience-projection-v2.ts";
import type { PaidCanonicalProjection, PaidMessageProjection } from "./recovery-candidate.ts";
import { M2RuntimeError } from "../runtime/errors.ts";
import { hashProductionSnapshot } from "./capabilities.ts";

const sha256Pattern = /^[0-9a-f]{64}$/u;

function integrityFailure(): never {
  throw new M2RuntimeError(
    "PRODUCTION_CANONICAL_DELIVERY_INTEGRITY_FAILED",
    503,
  );
}

export function decodeAndVerifyProductionCanonicalProjection(
  value: unknown,
  persistedHash: unknown,
): PaidCanonicalProjection {
  let projection: PaidCanonicalProjection;
  try {
    const candidate = value as Partial<PaidMessageProjection> | null;
    if (candidate?.projectionSchemaVersion === "v19-l5-message-projection-v1") {
      if (Object.keys(candidate).sort().join(",") !== ["projectionSchemaVersion", "kind", "opening", "draft", "explanation", "closing"].sort().join(",") ||
        !["message_edit", "message_composition"].includes(candidate.kind ?? "") ||
        [candidate.opening, candidate.draft, candidate.explanation, candidate.closing].some(text => typeof text !== "string" || !text.trim())) integrityFailure();
      projection = structuredClone(candidate) as PaidMessageProjection;
    } else projection = decodeCustomerAssessmentExperienceProjectionV2(
      structuredClone(value),
    );
  } catch {
    integrityFailure();
  }
  if (
    typeof persistedHash !== "string" ||
    !sha256Pattern.test(persistedHash)
  ) {
    integrityFailure();
  }
  const actualHash = hashProductionSnapshot(projection);
  const actualBytes = Buffer.from(actualHash, "hex");
  const persistedBytes = Buffer.from(persistedHash, "hex");
  if (
    actualBytes.length !== persistedBytes.length ||
    !timingSafeEqual(actualBytes, persistedBytes)
  ) {
    integrityFailure();
  }
  return projection;
}
