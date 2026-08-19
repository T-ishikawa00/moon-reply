import { createHash } from "node:crypto";
import { lstat, mkdir, readdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { M2RuntimeError } from "../errors.ts";
import type { CustomerAssessmentExperienceProjectionV2 } from "../customer-assessment-experience-projection-v2.ts";
import type { FakeAssessmentRepository } from "../fakes.ts";
import type {
  AssessmentInput,
  Eligibility,
  JsonObject,
  JsonValue,
} from "../types.ts";
import type {
  ControlledReviewApplicationStageInvocation,
  ControlledReviewProviderHttpAttempt,
} from "./m2-p4-v15-controlled-review-transport.ts";

export const V1_D_CONTROLLED_EXECUTION_EVIDENCE_DIRECTORY =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-d/controlled-provider-executions";

export const V1_D_V16_CONTROLLED_REVIEW_EVIDENCE_RUNTIME_IDENTITY = {
  catalogVersion: "runtime-stage-catalog-v16.0.0",
  promptBundleVersion: "prompt-bundle-runtime-v16.0.0",
  schemaSetVersion: "pipeline-schema-runtime-v6.0.0",
  stageTopologyVersion: "split-base-candidate-v1",
  model: "gpt-5.6-luna",
} as const;

export const V1_D_V17_CONTROLLED_REVIEW_EVIDENCE_RUNTIME_IDENTITY = {
  catalogVersion: "runtime-stage-catalog-v17.0.0",
  promptBundleVersion: "prompt-bundle-runtime-v17.0.0",
  schemaSetVersion: "pipeline-schema-runtime-v6.0.0",
  stageTopologyVersion: "split-base-candidate-v1",
  model: "gpt-5.6-luna",
} as const;

export type ControlledReviewEvidenceRuntimeIdentity = {
  catalogVersion: string;
  promptBundleVersion: string;
  schemaSetVersion: string;
  stageTopologyVersion: string;
  model: string;
};

type SupportedControlledReviewEvidenceRuntimeIdentity =
  | typeof V1_D_V16_CONTROLLED_REVIEW_EVIDENCE_RUNTIME_IDENTITY
  | typeof V1_D_V17_CONTROLLED_REVIEW_EVIDENCE_RUNTIME_IDENTITY;

const V1_D_V16_CONTROLLED_REVIEW_EVIDENCE_FORMAT = {
  outputProvenance: "actual_v16_successor_output",
  routeResults: {
    fileName: "v16-route-results-v1.json",
    schemaVersion: "m2-p4-v1-d-v16-route-results-v1",
  },
  stageAttemptResults: {
    fileName: "v16-stage-attempt-results-v1.json",
    schemaVersion: "m2-p4-v1-d-v16-stage-attempt-results-v1",
  },
  customerProjections: {
    fileName: "v16-customer-projections-v1.json",
    schemaVersion: "m2-p4-v1-d-v16-customer-projections-v1",
  },
  qualityReassessmentResults: {
    fileName: "v16-quality-reassessment-results-v1.json",
    schemaVersion: "m2-p4-v1-d-v16-quality-reassessment-results-v1",
  },
} as const;

const V1_D_V17_CONTROLLED_REVIEW_EVIDENCE_FORMAT = {
  outputProvenance: "actual_v17_successor_output",
  routeResults: {
    fileName: "v17-route-results-v1.json",
    schemaVersion: "m2-p4-v1-d-v17-route-results-v1",
  },
  stageAttemptResults: {
    fileName: "v17-stage-attempt-results-v1.json",
    schemaVersion: "m2-p4-v1-d-v17-stage-attempt-results-v1",
  },
  customerProjections: {
    fileName: "v17-customer-projections-v1.json",
    schemaVersion: "m2-p4-v1-d-v17-customer-projections-v1",
  },
  qualityReassessmentResults: {
    fileName: "v17-quality-reassessment-results-v1.json",
    schemaVersion: "m2-p4-v1-d-v17-quality-reassessment-results-v1",
  },
} as const;

export function selectControlledReviewEvidenceFormatV1(
  runtimeIdentity: SupportedControlledReviewEvidenceRuntimeIdentity,
) {
  return runtimeIdentity.catalogVersion === "runtime-stage-catalog-v17.0.0"
    ? V1_D_V17_CONTROLLED_REVIEW_EVIDENCE_FORMAT
    : V1_D_V16_CONTROLLED_REVIEW_EVIDENCE_FORMAT;
}

export function validateControlledReviewEvidenceRuntimeIdentity(
  input: ControlledReviewEvidenceRuntimeIdentity,
): SupportedControlledReviewEvidenceRuntimeIdentity {
  const supported = [
    V1_D_V16_CONTROLLED_REVIEW_EVIDENCE_RUNTIME_IDENTITY,
    V1_D_V17_CONTROLLED_REVIEW_EVIDENCE_RUNTIME_IDENTITY,
  ].find(
    (candidate) =>
      input.catalogVersion === candidate.catalogVersion &&
      input.promptBundleVersion === candidate.promptBundleVersion &&
      input.schemaSetVersion === candidate.schemaSetVersion &&
      input.stageTopologyVersion === candidate.stageTopologyVersion &&
      input.model === candidate.model,
  );
  if (!supported) {
    throw new M2RuntimeError(
      "M2_V1D_REVIEW_EVIDENCE_RUNTIME_IDENTITY_UNSUPPORTED",
    );
  }
  return { ...supported };
}

function assertAuthorizationRuntimeIdentity(
  record: ControlledReviewAuthorizationRecord,
  runtimeIdentity: SupportedControlledReviewEvidenceRuntimeIdentity,
) {
  if (
    record.runtime_catalog_version !== runtimeIdentity.catalogVersion ||
    record.prompt_bundle_version !== runtimeIdentity.promptBundleVersion ||
    record.schema_set_version !== runtimeIdentity.schemaSetVersion ||
    record.stage_topology_version !== runtimeIdentity.stageTopologyVersion ||
    record.model !== runtimeIdentity.model
  ) {
    throw new M2RuntimeError(
      "M2_V1D_REVIEW_EVIDENCE_RUNTIME_IDENTITY_UNSUPPORTED",
    );
  }
}

export type ControlledReviewFinalDisposition =
  | "ready"
  | "not_full_product_candidate"
  | "safety_blocked"
  | "quality_reassessment_exhausted"
  | "technical_failure"
  | "route_mismatch";

export type ControlledReviewStageAttemptEvidence = {
  fixtureId: string;
  stageId: string;
  sequenceNumber: number;
  attemptNumber: number;
  status: "processing" | "completed" | "failed" | "skipped";
  requestHash: string;
  promptHash: string;
  schemaHash: string;
  requestedModel: string;
  returnedModel: string | null;
  usage: {
    inputTokens: number;
    cachedTokens: number;
    outputTokens: number;
    reasoningTokens: number;
  };
  latencyMs: number | null;
  outputJson: JsonObject | null;
  safeErrorCode: string | null;
  skipReason: string | null;
};

export type ControlledReviewQualityEvidence = {
  fixtureId: string;
  quality_reassessment_used: boolean;
  scope: "none" | "report_only" | "plan_and_report";
  attempt_2_stages: string[];
  attempt_3_present: false;
  final_disposition: ControlledReviewFinalDisposition;
};

export type ControlledReviewRouteEvidence = {
  fixtureId: string;
  expectedInitialRoute: string;
  initialEligibility: Eligibility | "technical_failure";
  initialRouteMatched: boolean;
  expectedClarificationTarget: string | null;
  actualClarificationTarget: string | null;
  clarificationAnswerCount: 0 | 1;
  resumedEligibility: Eligibility | null;
  finalDisposition: ControlledReviewFinalDisposition;
  safeErrorCode: string | null;
};

export type ControlledReviewCaseEvidence = {
  fixtureId: string;
  syntheticOnly: true;
  humanPii: false;
  fixedClock: string;
  timezone: string;
  assessmentInput: AssessmentInput;
  route: ControlledReviewRouteEvidence;
  stageAttempts: ControlledReviewStageAttemptEvidence[];
  qualityReassessment: ControlledReviewQualityEvidence;
  finalRuntimeReport: JsonObject | null;
  customerProjection: CustomerAssessmentExperienceProjectionV2 | null;
};

export type ControlledReviewAuthorizationRecord = {
  schema_version: "m2-p4-v1-d-controlled-provider-authorization-record-v1";
  execution_id: string;
  human_authorization_reference: string;
  authorized_snapshot: string;
  authorized_input_sha256: string;
  runtime_catalog_version:
    | "runtime-stage-catalog-v16.0.0"
    | "runtime-stage-catalog-v17.0.0";
  prompt_bundle_version:
    | "prompt-bundle-runtime-v16.0.0"
    | "prompt-bundle-runtime-v17.0.0";
  schema_set_version: "pipeline-schema-runtime-v6.0.0";
  stage_topology_version: "split-base-candidate-v1";
  model: "gpt-5.6-luna";
  authorized_case_ids: string[];
  authorization_timestamp: string;
  maximum_application_stage_invocations_per_case: 12;
  maximum_application_stage_invocations_total: 108;
  review_transport_max_retries: 0;
  synthetic_only: true;
  no_supabase: true;
  no_payment: true;
  no_production: true;
};

export type ControlledReviewEvidenceBundle = {
  executionId: string;
  complete: boolean;
  authorizationRecord: ControlledReviewAuthorizationRecord;
  applicationStageInvocations: ControlledReviewApplicationStageInvocation[];
  providerHttpAttempts: ControlledReviewProviderHttpAttempt[];
  cases: ControlledReviewCaseEvidence[];
  safeErrorCode: string | null;
};

const prohibitedKeys = new Set([
  "apiKey",
  "authorization",
  "chainOfThought",
  "chain_of_thought",
  "headers",
  "errorBody",
  "errorHeaders",
  "providerRequestId",
  "providerResponseId",
  "rawSdkError",
  "rawSdkErrorMessage",
  "reasoning",
  "requestIdFromProvider",
  "responseId",
  "response_id",
  "sdkError",
  "sdkErrorMessage",
]);

const prohibitedStringPatterns = [
  /\bsk-[A-Za-z0-9_-]{12,}\b/u,
  /\bresp_[A-Za-z0-9_-]+\b/u,
  /\breq_[A-Za-z0-9_-]+\b/u,
  /https?:\/\/api\.openai\.com/iu,
  /(?:SUPABASE_SERVICE_ROLE_KEY|OPENAI_API_KEY)\s*[:=]/u,
  /chain[-_\s]of[-_\s]thought/iu,
];

function assertSanitized(value: unknown, pathSegments: string[] = []) {
  if (typeof value === "string") {
    for (const pattern of prohibitedStringPatterns) {
      if (pattern.test(value)) {
        throw new M2RuntimeError("M2_V1D_REVIEW_EVIDENCE_PROHIBITED");
      }
    }
    return;
  }
  if (value === null || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((entry, index) =>
      assertSanitized(entry, [...pathSegments, String(index)]),
    );
    return;
  }
  for (const [key, entry] of Object.entries(value)) {
    if (prohibitedKeys.has(key) || /^provider(?:Request|Response)?Url$/u.test(key)) {
      throw new M2RuntimeError("M2_V1D_REVIEW_EVIDENCE_PROHIBITED");
    }
    assertSanitized(entry, [...pathSegments, key]);
  }
}

export function sanitizeControlledReviewEvidence<T>(value: T): T {
  const cloneWithOpaqueClarificationIdsHashed = (
    entry: unknown,
    key: string | null = null,
  ): unknown => {
    if (
      typeof entry === "string" &&
      (key === "source_identity" || key === "sourceIdentity") &&
      /^clarification:[A-Za-z0-9_-]+:answer:1$/u.test(entry)
    ) {
      return `clarification_source_sha256:${createHash("sha256").update(entry, "utf8").digest("hex")}`;
    }
    if (entry === null || typeof entry !== "object") return entry;
    if (Array.isArray(entry)) {
      return entry.map((item) => cloneWithOpaqueClarificationIdsHashed(item));
    }
    return Object.fromEntries(
      Object.entries(entry).map(([childKey, child]) => [
        childKey,
        cloneWithOpaqueClarificationIdsHashed(child, childKey),
      ]),
    );
  };
  const sanitized = cloneWithOpaqueClarificationIdsHashed(value) as T;
  assertSanitized(sanitized);
  return structuredClone(sanitized);
}

function stageUsage(stage: FakeAssessmentRepository["stageRuns"] extends Map<
  string,
  infer Value
>
  ? Value
  : never) {
  return (
    stage.completion?.usage ??
    stage.failure?.usage ??
    stage.usage ?? {
      inputTokens: 0,
      cachedTokens: 0,
      outputTokens: 0,
      reasoningTokens: 0,
    }
  );
}

export function exportControlledReviewStageAttempts(
  fixtureId: string,
  repository: FakeAssessmentRepository,
) {
  const evidence: ControlledReviewStageAttemptEvidence[] = [
    ...repository.stageRuns.values(),
  ].map((stage) => ({
    fixtureId,
    stageId: stage.stageId,
    sequenceNumber: stage.sequenceNumber,
    attemptNumber: stage.attemptNumber,
    status: stage.status,
    requestHash: stage.requestHash,
    promptHash: stage.promptHash,
    schemaHash: stage.schemaHash,
    requestedModel: stage.requestedModel,
    returnedModel:
      stage.completion?.returnedModel ?? stage.failure?.returnedModel ?? null,
    usage: structuredClone(stageUsage(stage)),
    latencyMs:
      stage.completion?.latencyMs ?? stage.failure?.latencyMs ?? stage.latencyMs ?? null,
    outputJson: structuredClone(
      stage.completion?.outputJson ?? stage.failure?.outputJson ?? null,
    ),
    safeErrorCode: stage.failure?.errorCode ?? stage.errorCode ?? null,
    skipReason:
      stage.status === "skipped"
        ? ((stage as typeof stage & { skipReason?: string }).skipReason ?? null)
        : null,
  }));
  if (evidence.some((stage) => stage.attemptNumber > 2)) {
    throw new M2RuntimeError("M2_V1D_REVIEW_ATTEMPT_3_PROHIBITED");
  }
  return sanitizeControlledReviewEvidence(evidence);
}

export function deriveControlledReviewQualityEvidence(
  fixtureId: string,
  stageAttempts: ControlledReviewStageAttemptEvidence[],
  finalDisposition: ControlledReviewFinalDisposition,
): ControlledReviewQualityEvidence {
  const attempt2Stages = stageAttempts
    .filter((stage) => stage.attemptNumber === 2)
    .map((stage) => stage.stageId);
  const scope =
    attempt2Stages.length === 0
      ? "none"
      : attempt2Stages.includes("PB-04")
        ? "plan_and_report"
        : "report_only";
  if (stageAttempts.some((stage) => stage.attemptNumber > 2)) {
    throw new M2RuntimeError("M2_V1D_REVIEW_ATTEMPT_3_PROHIBITED");
  }
  return {
    fixtureId,
    quality_reassessment_used: attempt2Stages.length > 0,
    scope,
    attempt_2_stages: attempt2Stages,
    attempt_3_present: false,
    final_disposition: finalDisposition,
  };
}

function humanReviewRecord(fixtureId: string, outputProvenance: string) {
  return {
    fixture_id: fixtureId,
    output_provenance: outputProvenance,
    routing_correct: "pending_human_review",
    no_padding: "pending_human_review",
    repeated_conclusion_absent: "pending_human_review",
    evidence_to_decision_chain_clear: "pending_human_review",
    action_usable: "pending_human_review",
    uncertainty_honest: "pending_human_review",
    emotional_understanding: "pending_human_review",
    simple_case_value: "pending_human_review",
    exact_draft_preserved: "pending_human_review",
    visual_shell_intact: "pending_human_review",
    plausibly_worth_jpy980: "pending_human_review",
    reviewer_notes: null,
    review_status: "pending_human_review",
  };
}

export function buildControlledReviewHumanReviewSheet(
  cases: ControlledReviewCaseEvidence[],
  runtimeIdentity: ControlledReviewEvidenceRuntimeIdentity,
) {
  const supportedRuntimeIdentity =
    validateControlledReviewEvidenceRuntimeIdentity(runtimeIdentity);
  const evidenceFormat = selectControlledReviewEvidenceFormatV1(supportedRuntimeIdentity);
  return {
    schema_version: "m2-p4-v1-d-human-product-review-sheet-v1",
    status: "pending_human_review",
    review_records: cases
      .filter((entry) => entry.customerProjection !== null)
      .map((entry) =>
        humanReviewRecord(
          entry.fixtureId,
          evidenceFormat.outputProvenance,
        ),
      ),
    automatic_product_judgments: 0,
  };
}

function summaryMarkdown(
  bundle: ControlledReviewEvidenceBundle,
  runtimeIdentity: SupportedControlledReviewEvidenceRuntimeIdentity,
) {
  return [
    "# V1-D Controlled Provider Review Execution",
    "",
    `- execution_id: ${bundle.executionId}`,
    `- runtime_catalog_version: ${runtimeIdentity.catalogVersion}`,
    `- prompt_bundle_version: ${runtimeIdentity.promptBundleVersion}`,
    `- schema_set_version: ${runtimeIdentity.schemaSetVersion}`,
    `- stage_topology_version: ${runtimeIdentity.stageTopologyVersion}`,
    `- model: ${runtimeIdentity.model}`,
    `- complete: ${String(bundle.complete)}`,
    `- selected_cases: ${String(bundle.cases.length)}`,
    `- application_stage_invocations: ${String(bundle.applicationStageInvocations.length)}`,
    `- provider_http_attempts: ${String(bundle.providerHttpAttempts.length)}`,
    `- safe_error_code: ${bundle.safeErrorCode ?? "none"}`,
    "- Human Product judgments: pending_human_review",
    "",
  ].join("\n");
}

async function exists(target: string) {
  try {
    await lstat(target);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
}

async function assertNoSymlinkAncestors(target: string, stopAt: string) {
  let cursor = target;
  while (cursor.length >= stopAt.length) {
    if (await exists(cursor)) {
      const stats = await lstat(cursor);
      if (stats.isSymbolicLink()) {
        throw new M2RuntimeError("M2_V1D_REVIEW_OUTPUT_PATH_INVALID");
      }
    }
    if (cursor === stopAt) break;
    const parent = path.dirname(cursor);
    if (parent === cursor) break;
    cursor = parent;
  }
}

function isStrictChild(target: string, allowedRoot: string) {
  const relative = path.relative(allowedRoot, target);
  return (
    relative.length > 0 &&
    relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}

export async function validateControlledReviewOutputDirectory(input: {
  repositoryRoot: string;
  outputDirectory: string;
  explicitlyAllowedReviewRoot?: string | null;
}) {
  const repositoryRoot = path.resolve(input.repositoryRoot);
  const outputDirectory = path.resolve(repositoryRoot, input.outputDirectory);
  const repositoryEvidenceRoot = path.resolve(
    repositoryRoot,
    V1_D_CONTROLLED_EXECUTION_EVIDENCE_DIRECTORY,
  );
  const allowedRoots = [repositoryEvidenceRoot];
  if (input.explicitlyAllowedReviewRoot) {
    const explicitRoot = path.resolve(input.explicitlyAllowedReviewRoot);
    if (
      explicitRoot === repositoryRoot ||
      isStrictChild(explicitRoot, repositoryRoot)
    ) {
      throw new M2RuntimeError("M2_V1D_REVIEW_OUTPUT_PATH_INVALID");
    }
    allowedRoots.push(explicitRoot);
  }
  const allowedRoot = allowedRoots.find((root) =>
    isStrictChild(outputDirectory, root),
  );
  if (!allowedRoot || outputDirectory === repositoryRoot) {
    throw new M2RuntimeError("M2_V1D_REVIEW_OUTPUT_PATH_INVALID");
  }
  await assertNoSymlinkAncestors(
    outputDirectory,
    path.parse(outputDirectory).root,
  );
  if (await exists(outputDirectory)) {
    const stats = await lstat(outputDirectory);
    if (!stats.isDirectory() || stats.isSymbolicLink()) {
      throw new M2RuntimeError("M2_V1D_REVIEW_OUTPUT_PATH_INVALID");
    }
    if ((await readdir(outputDirectory)).length > 0) {
      throw new M2RuntimeError("M2_V1D_REVIEW_OUTPUT_EXISTS");
    }
  }
  return { outputDirectory, allowedRoot };
}

export async function prepareControlledReviewOutputDirectory(input: {
  repositoryRoot: string;
  outputDirectory: string;
  explicitlyAllowedReviewRoot?: string | null;
}) {
  const validated = await validateControlledReviewOutputDirectory(input);
  await mkdir(validated.allowedRoot, { recursive: true });
  if (!(await exists(validated.outputDirectory))) {
    await mkdir(validated.outputDirectory, { recursive: false });
  }
  return validated.outputDirectory;
}

let atomicWriteOrdinal = 0;
async function writeAtomically(target: string, contents: string) {
  atomicWriteOrdinal += 1;
  const temporary = path.join(
    path.dirname(target),
    `.${path.basename(target)}.${String(process.pid)}.${String(atomicWriteOrdinal)}.tmp`,
  );
  await writeFile(temporary, contents, { encoding: "utf8", flag: "wx", mode: 0o600 });
  await rename(temporary, target);
}

export class ControlledReviewEvidenceJournal {
  private readonly providerHttpAttempts: ControlledReviewProviderHttpAttempt[] = [];
  private readonly cases: ControlledReviewCaseEvidence[] = [];
  private journalOrdinal = 0;
  private authorizationRecorded = false;
  private readonly outputDirectory: string;
  private readonly executionId: string;
  private readonly runtimeIdentity: SupportedControlledReviewEvidenceRuntimeIdentity;

  constructor(
    outputDirectory: string,
    executionId: string,
    runtimeIdentity: ControlledReviewEvidenceRuntimeIdentity,
  ) {
    this.outputDirectory = outputDirectory;
    this.executionId = executionId;
    this.runtimeIdentity =
      validateControlledReviewEvidenceRuntimeIdentity(runtimeIdentity);
  }

  private async writeJournal(status: "incomplete" | "complete", safeErrorCode: string | null) {
    this.journalOrdinal += 1;
    await writeAtomically(
      path.join(
        this.outputDirectory,
        `execution-journal-v1-${String(this.journalOrdinal).padStart(4, "0")}.json`,
      ),
      `${JSON.stringify(
        sanitizeControlledReviewEvidence({
          schema_version: "m2-p4-v1-d-controlled-review-journal-v1",
          execution_id: this.executionId,
          runtime_catalog_version: this.runtimeIdentity.catalogVersion,
          prompt_bundle_version: this.runtimeIdentity.promptBundleVersion,
          schema_set_version: this.runtimeIdentity.schemaSetVersion,
          stage_topology_version: this.runtimeIdentity.stageTopologyVersion,
          model: this.runtimeIdentity.model,
          status,
          provider_http_attempts: this.providerHttpAttempts,
          cases: this.cases,
          safe_error_code: safeErrorCode,
        }),
        null,
        2,
      )}\n`,
    );
  }

  async recordProviderHttpAttempt(attempt: ControlledReviewProviderHttpAttempt) {
    this.providerHttpAttempts.push(sanitizeControlledReviewEvidence(attempt));
    await this.writeJournal("incomplete", null);
  }

  async recordAuthorization(record: ControlledReviewAuthorizationRecord) {
    if (this.authorizationRecorded) {
      throw new M2RuntimeError("M2_V1D_REVIEW_EVIDENCE_WRITE_FAILED");
    }
    assertAuthorizationRuntimeIdentity(record, this.runtimeIdentity);
    const sanitized = sanitizeControlledReviewEvidence(record);
    await writeAtomically(
      path.join(this.outputDirectory, "authorization-record-v1.json"),
      `${JSON.stringify(sanitized, null, 2)}\n`,
    );
    this.authorizationRecorded = true;
    await this.writeJournal("incomplete", null);
  }

  async recordCase(caseEvidence: ControlledReviewCaseEvidence) {
    this.cases.push(sanitizeControlledReviewEvidence(caseEvidence));
    await this.writeJournal("incomplete", caseEvidence.route.safeErrorCode);
  }

  async markIncomplete(safeErrorCode: string) {
    await this.writeJournal("incomplete", safeErrorCode);
  }

  async finalize(bundle: ControlledReviewEvidenceBundle) {
    if (!this.authorizationRecorded) {
      throw new M2RuntimeError("M2_V1D_REVIEW_EVIDENCE_WRITE_FAILED");
    }
    const sanitized = sanitizeControlledReviewEvidence(bundle);
    assertAuthorizationRuntimeIdentity(
      sanitized.authorizationRecord,
      this.runtimeIdentity,
    );
    const evidenceFormat = selectControlledReviewEvidenceFormatV1(
      this.runtimeIdentity,
    );
    const files: Record<string, JsonValue | string> = {
      "provider-call-ledger-v1.json": {
        schema_version: "m2-p4-v1-d-provider-call-ledger-v1",
        application_stage_invocations: sanitized.applicationStageInvocations as unknown as JsonValue,
      },
      "provider-http-attempt-ledger-v1.json": {
        schema_version: "m2-p4-v1-d-provider-http-attempt-ledger-v1",
        provider_http_attempts: sanitized.providerHttpAttempts as unknown as JsonValue,
      },
      [evidenceFormat.routeResults.fileName]: {
        schema_version: evidenceFormat.routeResults.schemaVersion,
        routes: sanitized.cases.map((entry) => entry.route) as unknown as JsonValue,
      },
      [evidenceFormat.stageAttemptResults.fileName]: {
        schema_version: evidenceFormat.stageAttemptResults.schemaVersion,
        stage_attempts: sanitized.cases.flatMap((entry) => entry.stageAttempts) as unknown as JsonValue,
      },
      [evidenceFormat.customerProjections.fileName]: {
        schema_version: evidenceFormat.customerProjections.schemaVersion,
        projections: sanitized.cases
          .filter((entry) => entry.customerProjection !== null)
          .map((entry) => ({
            fixture_id: entry.fixtureId,
            output_provenance: evidenceFormat.outputProvenance,
            projection: entry.customerProjection,
          })) as unknown as JsonValue,
      },
      [evidenceFormat.qualityReassessmentResults.fileName]: {
        schema_version: evidenceFormat.qualityReassessmentResults.schemaVersion,
        results: sanitized.cases.map((entry) => entry.qualityReassessment) as unknown as JsonValue,
      },
      "human-product-review-sheet-v1.json": buildControlledReviewHumanReviewSheet(
        sanitized.cases,
        this.runtimeIdentity,
      ) as unknown as JsonValue,
      "provider-execution-summary-v1.md": summaryMarkdown(
        sanitized,
        this.runtimeIdentity,
      ),
    };
    for (const [fileName, value] of Object.entries(files)) {
      const contents =
        typeof value === "string" ? value : `${JSON.stringify(value, null, 2)}\n`;
      await writeAtomically(path.join(this.outputDirectory, fileName), contents);
    }
    await this.writeJournal(
      sanitized.complete ? "complete" : "incomplete",
      sanitized.safeErrorCode,
    );
  }
}
