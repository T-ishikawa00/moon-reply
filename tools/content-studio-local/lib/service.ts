import { AssessmentApplication } from "../../../lib/assessment/runtime/application.ts";
import { projectCustomerAssessmentExperienceV2 } from "../../../lib/assessment/runtime/customer-assessment-experience-projection-v2.ts";
import { asM2RuntimeError, M2RuntimeError } from "../../../lib/assessment/runtime/errors.ts";
import { FakeAssessmentRepository } from "../../../lib/assessment/runtime/fakes.ts";
import { evaluateJpy980ProductScopeV1 } from "../../../lib/assessment/runtime/jpy980-product-scope-validation-v1.ts";
import { OpenAiResponsesTransport } from "../../../lib/assessment/runtime/openai-transport.ts";
import { loadM2P4FinalProductRecoveryRuntimeStageCatalog } from "../../../lib/assessment/runtime/schema-catalog.ts";
import type {
  AiStageTransport,
  AssessmentExecutionResult,
  RequestedTopic,
  StageDefinition,
} from "../../../lib/assessment/runtime/types.ts";
import {
  toAssessmentInput,
  toPrepaymentSafetyInput,
} from "../../../lib/assessment/production/consultation.ts";
import { evaluatePrepaymentSafetyV1 } from "../../../lib/purchase/prepayment-safety-gate-v1.ts";
import {
  decodeLocalContentStudioActionV1,
  decodeLocalContentStudioRequestV1,
  type LocalContentStudioOutcomeV1,
} from "./contracts.ts";
import {
  CONTENT_STUDIO_LOCAL_MODEL,
  readLocalContentStudioEnvironment,
} from "./environment.ts";
import {
  LocalQualityDiagnosticCollector,
  LocalQualityDiagnosticTransport,
} from "./quality-diagnostics.ts";
import {
  BoundedLocalContentStudioSessionStore,
  type LocalContentStudioSession,
} from "./session-store.ts";

type V17Catalog = Readonly<{
  catalogVersion: string;
  promptBundleVersion: string;
  schemaSetVersion: string;
  stageTopologyVersion: string;
  definitions: StageDefinition[];
}>;

export type LocalContentStudioServiceOptions = Readonly<{
  transport: AiStageTransport;
  catalog: V17Catalog;
  store?: BoundedLocalContentStudioSessionStore;
  repositoryFactory?: () => FakeAssessmentRepository;
}>;

function validateCatalog(catalog: V17Catalog) {
  if (
    catalog.catalogVersion !== "runtime-stage-catalog-v17.0.0" ||
    catalog.promptBundleVersion !== "prompt-bundle-runtime-v17.0.0" ||
    catalog.schemaSetVersion !== "pipeline-schema-runtime-v6.0.0" ||
    catalog.stageTopologyVersion !== "split-base-candidate-v1"
  ) {
    throw new M2RuntimeError(
      "CONTENT_STUDIO_LOCAL_RUNTIME_IDENTITY_INVALID",
      503,
    );
  }
}

export class LocalContentStudioService {
  private readonly transport: AiStageTransport;
  private readonly catalog: V17Catalog;
  private readonly store: BoundedLocalContentStudioSessionStore;
  private readonly repositoryFactory: () => FakeAssessmentRepository;

  constructor(options: LocalContentStudioServiceOptions) {
    validateCatalog(options.catalog);
    this.transport = options.transport;
    this.catalog = options.catalog;
    this.store =
      options.store ?? new BoundedLocalContentStudioSessionStore();
    this.repositoryFactory =
      options.repositoryFactory ?? (() => new FakeAssessmentRepository());
  }

  private createApplication(
    repository: FakeAssessmentRepository,
    requestedTopics: readonly RequestedTopic[],
  ) {
    const qualityDiagnosticCollector = new LocalQualityDiagnosticCollector();
    const application = new AssessmentApplication({
      repository,
      transport: new LocalQualityDiagnosticTransport(
        this.transport,
        requestedTopics,
        qualityDiagnosticCollector,
      ),
      model: CONTENT_STUDIO_LOCAL_MODEL,
      promptBundleVersion: this.catalog.promptBundleVersion,
      schemaSetVersion: this.catalog.schemaSetVersion,
      definitions: this.catalog.definitions,
      timeZone: "Asia/Tokyo",
    });
    return { application, qualityDiagnosticCollector };
  }

  private finishResult(
    session: LocalContentStudioSession,
    result: AssessmentExecutionResult,
  ): LocalContentStudioOutcomeV1 {
    if (result.eligibility === "ready") {
      const projection = projectCustomerAssessmentExperienceV2(
        result,
        session.requestedTopics,
      );
      const diagnostic = session.qualityDiagnosticCollector.read();
      if (diagnostic?.disposition === "deliver_latest_valid_candidate") {
        this.store.finish(session.runHandle, "ready", null, diagnostic);
        return Object.freeze({
          status: "ready",
          runHandle: session.runHandle,
          diagnostic,
          projection,
        });
      }
      this.store.finish(session.runHandle, "ready");
      return Object.freeze({
        status: "ready",
        projection,
      });
    }
    if (result.eligibility === "needs_more_information") {
      if (!result.clarification) {
        throw new M2RuntimeError(
          "CONTENT_STUDIO_LOCAL_CLARIFICATION_RESULT_INVALID",
        );
      }
      this.store.finish(
        session.runHandle,
        "awaiting_clarification",
        result.clarification.opaqueClarificationId,
      );
      return Object.freeze({
        status: "needs_more_information",
        runHandle: session.runHandle,
        target: result.clarification.target,
        question: result.clarification.question,
        maximumQuestionsTotal: 1,
      });
    }
    this.store.finish(session.runHandle, "stopped");
    return Object.freeze({
      status: "stopped",
      reason:
        result.eligibility === "safety_blocked"
          ? "runtime_safety_blocked"
          : "runtime_not_full_product_candidate",
      reasonCodes: Object.freeze([...result.reasonCodes]),
    });
  }

  private finishQualityFailure(
    session: LocalContentStudioSession,
    error: M2RuntimeError,
  ): LocalContentStudioOutcomeV1 | null {
    const diagnostic = session.qualityDiagnosticCollector.read();
    if (
      error.safeCode !== "M2_PRODUCT_QUALITY_REASSESSMENT_EXHAUSTED" ||
      diagnostic?.attemptNumber !== 2 ||
      diagnostic.disposition !== "fail_closed"
    ) {
      return null;
    }
    this.store.finish(session.runHandle, "failed", null, diagnostic);
    return Object.freeze({
      status: "failed",
      runHandle: session.runHandle,
      errorCode: "M2_PRODUCT_QUALITY_REASSESSMENT_EXHAUSTED",
      diagnostic: Object.freeze({
        ...diagnostic,
        disposition: "fail_closed" as const,
      }),
    });
  }

  async generate(value: unknown): Promise<LocalContentStudioOutcomeV1> {
    const envelope = decodeLocalContentStudioRequestV1(value);
    const safety = evaluatePrepaymentSafetyV1(
      toPrepaymentSafetyInput(envelope.consultation),
    );
    if (!safety.purchaseGateSatisfied) {
      return Object.freeze({
        status: "stopped",
        reason: "prepayment_safety",
        reasonCodes: Object.freeze([
          ...safety.reasonCodes,
          ...safety.requiredClarificationCodes,
        ]),
      });
    }
    const productScope = evaluateJpy980ProductScopeV1(
      envelope.consultation,
    );
    if (!productScope.accepted) {
      return Object.freeze({
        status: "stopped",
        reason: "not_full_product_candidate",
        reasonCodes: Object.freeze([productScope.clarificationCode]),
      });
    }

    const assessmentInput = toAssessmentInput(envelope.consultation);
    const repository = this.repositoryFactory();
    const { application, qualityDiagnosticCollector } = this.createApplication(
      repository,
      assessmentInput.requestedTopics,
    );
    const session = this.store.create({
      application,
      repository,
      requestedTopics: assessmentInput.requestedTopics,
      qualityDiagnosticCollector,
    });
    try {
      const result = await application.submit(
        assessmentInput,
        session.idempotencyKey,
      );
      return this.finishResult(session, result);
    } catch (error) {
      const safe = asM2RuntimeError(error);
      const qualityFailure = this.finishQualityFailure(session, safe);
      if (qualityFailure !== null) return qualityFailure;
      this.store.fail(session.runHandle);
      throw safe;
    }
  }

  async answerClarification(
    value: unknown,
  ): Promise<LocalContentStudioOutcomeV1> {
    const envelope = decodeLocalContentStudioActionV1(value);
    const { session, clarificationId } = this.store.beginClarification(
      envelope.runHandle,
    );
    try {
      const result = await session.application.answerClarification(
        clarificationId,
        envelope.answer,
      );
      return this.finishResult(session, result);
    } catch (error) {
      const safe = asM2RuntimeError(error);
      const qualityFailure = this.finishQualityFailure(session, safe);
      if (qualityFailure !== null) return qualityFailure;
      this.store.fail(session.runHandle);
      throw safe;
    }
  }

  diagnosticSnapshot() {
    return this.store.snapshot();
  }
}

export async function createLocalContentStudioService(
  environment: Readonly<Record<string, string | undefined>> = process.env,
) {
  const localEnvironment = readLocalContentStudioEnvironment(environment);
  const catalog = await loadM2P4FinalProductRecoveryRuntimeStageCatalog();
  return new LocalContentStudioService({
    transport: new OpenAiResponsesTransport(localEnvironment.openAiApiKey),
    catalog,
  });
}

export async function createLocalContentStudioServiceWithTransport(
  transport: AiStageTransport,
  store?: BoundedLocalContentStudioSessionStore,
) {
  const catalog = await loadM2P4FinalProductRecoveryRuntimeStageCatalog();
  return new LocalContentStudioService({ transport, catalog, store });
}
