import { createHash } from "node:crypto";
import { M2RuntimeError } from "../../assessment/runtime/errors.ts";
import { loadM2P4FinalProductRecoveryRuntimeStageCatalog } from "../../assessment/runtime/schema-catalog.ts";
import { loadV19L5StageCatalog } from "../../assessment/runtime/v19-l5-stage-catalog.ts";
import { assertOpenAIStructuredOutputSchema, toOpenAiStructuredOutputSchema } from "../../assessment/runtime/openai-schema.ts";
import { normalizeProviderSchema } from "../../assessment/runtime/openai-schema-normalization.mjs";
import type { PaidRecoveryRepository } from "./paid-recovery.ts";

// Trusted operator application. Reuses the existing purchase/job/adjustment
// authorities; it cannot grant a purchase, clear finances, or reset a budget.
export class PaidRecoveryOperatorApplication {
  constructor(private readonly repository: PaidRecoveryRepository,
    private readonly now: () => string = () => new Date().toISOString()) {}

  inspect(jobId: string) { return this.repository.inspect(jobId); }

  async resume(input: { jobId: string; expectedReasonCode: string;
    operatorReference: string; configurationValidated: boolean }) {
    const inspected = await this.repository.inspect(input.jobId);
    if (!["manual_review", "completed"].includes(String(inspected.state)) || !inspected.reason_code ||
        inspected.next_attempt_at !== null || inspected.reason_code !== input.expectedReasonCode ||
        inspected.financial_review_required !== false || input.configurationValidated !== true) {
      throw new M2RuntimeError("PAID_RECOVERY_REVIEW_STATE_CONFLICT", 409);
    }
    const identity = inspected.runtime_identity as { promptBundleVersion?: string } | null;
    const bundle = identity?.promptBundleVersion;
    const loaded = bundle === "prompt-bundle-runtime-v17.0.0"
      ? await loadM2P4FinalProductRecoveryRuntimeStageCatalog()
      : bundle === "prompt-bundle-runtime-v23.0.0" ? await loadV19L5StageCatalog() : null;
    if (!loaded) throw new M2RuntimeError("PAID_RECOVERY_EXECUTOR_UNAVAILABLE", 503);
    const schemas = loaded.definitions.map((definition) => {
      const normalized = normalizeProviderSchema(toOpenAiStructuredOutputSchema(definition.outputSchema));
      assertOpenAIStructuredOutputSchema(normalized.schema);
      return { stageId: definition.stageId, promptHash: definition.promptHash,
        schemaHash: definition.schemaHash, providerSchema: normalized.schema };
    });
    const artifactHash = createHash("sha256").update(JSON.stringify({
      policy: "paid-recovery-operator-v1", schemas, bundle,
      inputHash: inspected.input_snapshot_sha256,
      authorityHash: inspected.purchase_ready_authority_sha256,
      configurationValidated: true,
    })).digest("hex");
    await this.repository.resume({ jobId: input.jobId, expectedReasonCode: input.expectedReasonCode,
      artifactHash, operatorReference: input.operatorReference, now: this.now() });
    return this.repository.inspect(input.jobId);
  }
}
