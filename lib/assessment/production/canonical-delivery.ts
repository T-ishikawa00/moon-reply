import { timingSafeEqual } from "node:crypto";
import {
  decodeCustomerAssessmentExperienceProjectionV2,
  type CustomerAssessmentExperienceProjectionV2,
} from "../runtime/customer-assessment-experience-projection-v2.ts";
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
): CustomerAssessmentExperienceProjectionV2 {
  let projection: CustomerAssessmentExperienceProjectionV2;
  try {
    projection = decodeCustomerAssessmentExperienceProjectionV2(
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
