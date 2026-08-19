import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { AssessmentApplication } from "../application.ts";
import { createOpaqueClarificationIdV1 } from "../clarification-evidence-v1.ts";
import { projectCustomerAssessmentExperienceV2 } from "../customer-assessment-experience-projection-v2.ts";
import { M2RuntimeError } from "../errors.ts";
import { FakeAssessmentRepository } from "../fakes.ts";
import {
  loadM2P4FinalProductRecoveryRuntimeStageCatalog,
  loadM2P4QualityReassessmentRuntimeStageCatalog,
  loadM2P4SentMessageDraftBoundaryRuntimeStageCatalog,
} from "../schema-catalog.ts";
import {
  RELATIONSHIP_VALUES,
  REQUESTED_TOPIC_VALUES,
  type AiStageTransport,
  type AssessmentExecutionResult,
  type AssessmentInput,
  type Eligibility,
  type FinalizeCompletedAssessmentRecord,
  type JsonObject,
  type StartStageRecord,
} from "../types.ts";
import {
  deriveControlledReviewQualityEvidence,
  exportControlledReviewStageAttempts,
  sanitizeControlledReviewEvidence,
  type ControlledReviewCaseEvidence,
  type ControlledReviewFinalDisposition,
} from "./m2-p4-v15-controlled-review-evidence.ts";
import {
  BudgetedControlledReviewTransport,
  ControlledReviewInvocationBudget,
  type ControlledReviewProviderHttpAttempt,
} from "./m2-p4-v15-controlled-review-transport.ts";

export const V1_D_CONTROLLED_PROVIDER_INPUTS_PATH =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-d/controlled-provider-inputs-v1.json";
export const V1_D_CONTROLLED_PROVIDER_INPUTS_SHA256 =
  "ab1d7b896086da002015a0a6d5cf1c1fb6eac3ffdc48e8410b44a892c1f9a20d";
export const V1_D_CONTROLLED_REVIEW_MODEL = "gpt-5.6-luna" as const;

export const V1_D_CONTROLLED_REVIEW_CASE_IDS = [
  "ordinary_reply_waiting",
  "administrative_reply_with_tone_concern_ready_candidate",
  "reply_waiting_with_usual_cadence",
  "draft_request_with_relationship_intent",
  "polite_thank_you_with_draft",
  "kansai_persona_draft",
  "alternative_tradeoff_applicable",
  "alternative_tradeoff_not_applicable",
  "one_clarification_answer_becomes_ready",
] as const;

type ExpectedInitialRoute =
  | "full_paid_ready_candidate"
  | "needs_one_clarifying_answer";

type ControlledReviewClarificationAuthority = {
  expected_target: "latest_contact_timing";
  answer_payload: JsonObject;
  expected_route_after_answer: "full_paid_ready_candidate";
  maximum_answers_total: 1;
  second_answer_allowed: false;
};

export type ControlledReviewInputCase = {
  fixture_id: (typeof V1_D_CONTROLLED_REVIEW_CASE_IDS)[number];
  fixed_clock: string;
  timezone: string;
  assessment_input: AssessmentInput;
  expected_initial_route: ExpectedInitialRoute;
  synthetic_only: true;
  human_pii: false;
  clarification: ControlledReviewClarificationAuthority | null;
};

export type ControlledReviewInputAuthority = {
  path: string;
  sha256: string;
  schemaVersion: "m2-p4-v1-d-controlled-provider-inputs-v1";
  model: typeof V1_D_CONTROLLED_REVIEW_MODEL;
  cases: ControlledReviewInputCase[];
};

type ControlledReviewTransportFactoryContext = {
  fixtureId: ControlledReviewInputCase["fixture_id"];
  nextGlobalHttpAttemptOrdinal: () => number;
  onHttpAttempt: (attempt: ControlledReviewProviderHttpAttempt) => Promise<void>;
};

export type ControlledReviewTransportFactory = (
  context: ControlledReviewTransportFactoryContext,
) => AiStageTransport;

export type ControlledReviewExecutorOptions = {
  repositoryRoot: string;
  selectedCaseIds: string[];
  transportFactory: ControlledReviewTransportFactory;
  expectedInputSha256?: string;
  onHttpAttempt?: (
    attempt: ControlledReviewProviderHttpAttempt,
  ) => void | Promise<void>;
  onCaseEvidence?: (
    evidence: ControlledReviewCaseEvidence,
  ) => void | Promise<void>;
};

export type ControlledReviewExecutorResult = {
  schemaVersion: "m2-p4-v1-d-controlled-review-executor-result-v1";
  model: typeof V1_D_CONTROLLED_REVIEW_MODEL;
  controlledInputSha256: string;
  selectedCaseIds: string[];
  complete: boolean;
  applicationStageInvocationCount: number;
  providerHttpAttemptCount: number;
  applicationStageInvocations: ReturnType<
    ControlledReviewInvocationBudget["snapshot"]
  >["applicationStageInvocations"];
  providerHttpAttempts: ControlledReviewProviderHttpAttempt[];
  cases: ControlledReviewCaseEvidence[];
  safeErrorCode: string | null;
};

function sha256(value: string | Buffer) {
  return createHash("sha256").update(value).digest("hex");
}

function invalidInputAuthority(): never {
  throw new M2RuntimeError("M2_V1D_REVIEW_INPUT_AUTHORITY_INVALID");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function exactKeys(
  value: Record<string, unknown>,
  required: readonly string[],
) {
  const actual = Object.keys(value).sort();
  const expected = [...required].sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) invalidInputAuthority();
}

function parseAssessmentInput(value: unknown): AssessmentInput {
  if (!isRecord(value)) invalidInputAuthority();
  exactKeys(value, [
    "currentSituation",
    "optionalMessage",
    "privacyAcknowledged",
    "relationship",
    "requestedTopics",
  ]);
  if (
    typeof value.currentSituation !== "string" ||
    value.currentSituation.trim().length === 0 ||
    (value.optionalMessage !== null && typeof value.optionalMessage !== "string") ||
    !RELATIONSHIP_VALUES.includes(
      value.relationship as (typeof RELATIONSHIP_VALUES)[number],
    ) ||
    !Array.isArray(value.requestedTopics) ||
    value.requestedTopics.length === 0 ||
    value.requestedTopics.some(
      (topic) =>
        !REQUESTED_TOPIC_VALUES.includes(
          topic as (typeof REQUESTED_TOPIC_VALUES)[number],
        ),
    ) ||
    new Set(value.requestedTopics).size !== value.requestedTopics.length ||
    value.privacyAcknowledged !== true
  ) {
    invalidInputAuthority();
  }
  return structuredClone(value) as AssessmentInput;
}

function parseClarification(
  value: unknown,
): ControlledReviewClarificationAuthority | null {
  if (value === null) return null;
  if (!isRecord(value)) invalidInputAuthority();
  exactKeys(value, [
    "answer_payload",
    "expected_route_after_answer",
    "expected_target",
    "maximum_answers_total",
    "second_answer_allowed",
  ]);
  if (
    value.expected_target !== "latest_contact_timing" ||
    value.expected_route_after_answer !== "full_paid_ready_candidate" ||
    value.maximum_answers_total !== 1 ||
    value.second_answer_allowed !== false ||
    !isRecord(value.answer_payload)
  ) {
    invalidInputAuthority();
  }
  return structuredClone(value) as ControlledReviewClarificationAuthority;
}

function parseInputCase(value: unknown): ControlledReviewInputCase {
  if (!isRecord(value)) invalidInputAuthority();
  exactKeys(value, [
    "assessment_input",
    "clarification",
    "expected_initial_route",
    "fixed_clock",
    "fixture_id",
    "human_pii",
    "synthetic_only",
    "timezone",
  ]);
  if (
    !V1_D_CONTROLLED_REVIEW_CASE_IDS.includes(
      value.fixture_id as ControlledReviewInputCase["fixture_id"],
    ) ||
    typeof value.fixed_clock !== "string" ||
    !Number.isFinite(Date.parse(value.fixed_clock)) ||
    typeof value.timezone !== "string" ||
    value.timezone.length === 0 ||
    ![
      "full_paid_ready_candidate",
      "needs_one_clarifying_answer",
    ].includes(value.expected_initial_route as string) ||
    value.synthetic_only !== true ||
    value.human_pii !== false
  ) {
    invalidInputAuthority();
  }
  return {
    fixture_id: value.fixture_id as ControlledReviewInputCase["fixture_id"],
    fixed_clock: value.fixed_clock,
    timezone: value.timezone,
    assessment_input: parseAssessmentInput(value.assessment_input),
    expected_initial_route: value.expected_initial_route as ExpectedInitialRoute,
    synthetic_only: true,
    human_pii: false,
    clarification: parseClarification(value.clarification),
  };
}

export async function loadControlledReviewInputAuthority(input: {
  repositoryRoot: string;
  expectedSha256?: string;
}): Promise<ControlledReviewInputAuthority> {
  const authorityPath = path.resolve(
    input.repositoryRoot,
    V1_D_CONTROLLED_PROVIDER_INPUTS_PATH,
  );
  const bytes = await readFile(authorityPath);
  const actualSha256 = sha256(bytes);
  if (
    actualSha256 !== V1_D_CONTROLLED_PROVIDER_INPUTS_SHA256 ||
    (input.expectedSha256 !== undefined &&
      actualSha256 !== input.expectedSha256)
  ) {
    invalidInputAuthority();
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(bytes.toString("utf8"));
  } catch {
    invalidInputAuthority();
  }
  if (!isRecord(parsed) || !Array.isArray(parsed.cases)) invalidInputAuthority();
  if (
    parsed.schema_version !== "m2-p4-v1-d-controlled-provider-inputs-v1" ||
    parsed.model !== V1_D_CONTROLLED_REVIEW_MODEL ||
    parsed.case_count !== 9 ||
    parsed.provider_execution_authorized !== false ||
    parsed.provider_execution_count !== 0 ||
    parsed.provenance !== "synthetic_controlled_review_input"
  ) {
    invalidInputAuthority();
  }
  const cases = parsed.cases.map(parseInputCase);
  if (
    JSON.stringify(cases.map((entry) => entry.fixture_id)) !==
      JSON.stringify(V1_D_CONTROLLED_REVIEW_CASE_IDS) ||
    cases.filter((entry) => entry.clarification !== null).length !== 1 ||
    cases.filter(
      (entry) => entry.expected_initial_route === "needs_one_clarifying_answer",
    ).length !== 1 ||
    cases.find((entry) => entry.clarification !== null)?.fixture_id !==
      "one_clarification_answer_becomes_ready"
  ) {
    invalidInputAuthority();
  }
  return {
    path: authorityPath,
    sha256: actualSha256,
    schemaVersion: "m2-p4-v1-d-controlled-provider-inputs-v1",
    model: V1_D_CONTROLLED_REVIEW_MODEL,
    cases,
  };
}

function deterministicUuidFactory(fixtureId: string, inputHash: string) {
  let ordinal = 0;
  return () => {
    ordinal += 1;
    const hex = sha256(`${fixtureId}:${inputHash}:uuid:${String(ordinal)}`);
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
  };
}

function deterministicClarificationId(fixtureId: string, inputHash: string) {
  const entropy = createHash("sha256")
    .update(`${fixtureId}:${inputHash}:clarification:v1`, "utf8")
    .digest();
  return createOpaqueClarificationIdV1(entropy);
}

function routeExpectedEligibility(route: ExpectedInitialRoute): Eligibility {
  return route === "full_paid_ready_candidate"
    ? "ready"
    : "needs_more_information";
}

function terminalDisposition(
  result: AssessmentExecutionResult,
): ControlledReviewFinalDisposition {
  switch (result.eligibility) {
    case "ready":
      return "ready";
    case "not_full_product_candidate":
      return "not_full_product_candidate";
    case "safety_blocked":
      return "safety_blocked";
    case "needs_more_information":
      return "route_mismatch";
  }
}

function safeErrorCode(error: unknown) {
  return error instanceof M2RuntimeError
    ? error.safeCode
    : "M2_STAGE_PROVIDER_FAILED";
}

function errorDisposition(error: unknown): ControlledReviewFinalDisposition {
  return safeErrorCode(error) === "M2_PRODUCT_QUALITY_REASSESSMENT_EXHAUSTED"
    ? "quality_reassessment_exhausted"
    : "technical_failure";
}

function emptyRoute(
  fixture: ControlledReviewInputCase,
): ControlledReviewCaseEvidence["route"] {
  return {
    fixtureId: fixture.fixture_id,
    expectedInitialRoute: fixture.expected_initial_route,
    initialEligibility: "technical_failure",
    initialRouteMatched: false,
    expectedClarificationTarget: fixture.clarification?.expected_target ?? null,
    actualClarificationTarget: null,
    clarificationAnswerCount: 0,
    resumedEligibility: null,
    finalDisposition: "technical_failure",
    safeErrorCode: null,
  };
}

export class V16ControlledReviewFakeAssessmentRepository extends FakeAssessmentRepository {
  override async startStage(record: StartStageRecord) {
    const run = this.runs.get(record.runId);
    const promptBundleVersion = run?.promptBundleVersion;
    if (
      record.attemptNumber === 2 &&
      promptBundleVersion === "prompt-bundle-runtime-v16.0.0" &&
      run !== undefined
    ) {
      // The immutable historical Fake repository recognizes the V15 bounded
      // reassessment identity only. Adapt that internal assertion for this
      // review-only V16 successor without changing the persisted run identity.
      run.promptBundleVersion = "prompt-bundle-runtime-v15.0.0";
      try {
        await super.startStage(record);
      } finally {
        run.promptBundleVersion = promptBundleVersion;
      }
      return;
    }
    await super.startStage(record);
  }

  override async finalizeCompletedAssessment(
    record: FinalizeCompletedAssessmentRecord,
  ) {
    const run = this.runs.get(record.runId);
    const promptBundleVersion = run?.promptBundleVersion;
    const hasRecoveredQualityFailure = [...this.stageRuns.values()].some(
      (stage) =>
        stage.runId === record.runId &&
        stage.stageId === "PB-06" &&
        stage.attemptNumber === 2,
    );
    if (
      hasRecoveredQualityFailure &&
      promptBundleVersion === "prompt-bundle-runtime-v16.0.0" &&
      run !== undefined
    ) {
      run.promptBundleVersion = "prompt-bundle-runtime-v15.0.0";
      try {
        await super.finalizeCompletedAssessment(record);
      } finally {
        run.promptBundleVersion = promptBundleVersion;
      }
      return;
    }
    await super.finalizeCompletedAssessment(record);
  }
}

async function executeCase(input: {
  fixture: ControlledReviewInputCase;
  inputHash: string;
  catalog: Awaited<
    ReturnType<typeof loadM2P4QualityReassessmentRuntimeStageCatalog>
  >;
  budget: ControlledReviewInvocationBudget;
  transportFactory: ControlledReviewTransportFactory;
  nextGlobalHttpAttemptOrdinal: () => number;
  onHttpAttempt: (attempt: ControlledReviewProviderHttpAttempt) => Promise<void>;
}) {
  const fixture = input.fixture;
  const repository =
    input.catalog.promptBundleVersion === "prompt-bundle-runtime-v16.0.0"
      ? new V16ControlledReviewFakeAssessmentRepository()
      : new FakeAssessmentRepository();
  const underlying = input.transportFactory({
    fixtureId: fixture.fixture_id,
    nextGlobalHttpAttemptOrdinal: input.nextGlobalHttpAttemptOrdinal,
    onHttpAttempt: input.onHttpAttempt,
  });
  const transport = new BudgetedControlledReviewTransport(
    fixture.fixture_id,
    input.budget,
    underlying,
  );
  const application = new AssessmentApplication({
    repository,
    transport,
    model: V1_D_CONTROLLED_REVIEW_MODEL,
    promptBundleVersion: input.catalog.promptBundleVersion,
    schemaSetVersion: input.catalog.schemaSetVersion,
    definitions: input.catalog.definitions,
    now: () => fixture.fixed_clock,
    uuid: deterministicUuidFactory(fixture.fixture_id, input.inputHash),
    clarificationId: () =>
      deterministicClarificationId(fixture.fixture_id, input.inputHash),
    timeZone: fixture.timezone,
  });
  const route = emptyRoute(fixture);
  let finalResult: AssessmentExecutionResult | null = null;
  try {
    const initial = await application.submit(
      structuredClone(fixture.assessment_input),
      `v1-d:${input.inputHash}:${fixture.fixture_id}`,
    );
    route.initialEligibility = initial.eligibility;
    route.initialRouteMatched =
      initial.eligibility === routeExpectedEligibility(fixture.expected_initial_route);
    if (!route.initialRouteMatched) {
      route.finalDisposition = "route_mismatch";
      route.safeErrorCode = "M2_V1D_REVIEW_ROUTE_MISMATCH";
      finalResult = initial;
    } else if (fixture.clarification === null) {
      if (initial.eligibility !== "ready") {
        route.finalDisposition = "route_mismatch";
        route.safeErrorCode = "M2_V1D_REVIEW_ROUTE_MISMATCH";
      } else {
        route.finalDisposition = "ready";
        finalResult = initial;
      }
    } else if (
      initial.eligibility !== "needs_more_information" ||
      initial.clarification === null
    ) {
      route.finalDisposition = "route_mismatch";
      route.safeErrorCode = "M2_V1D_REVIEW_ROUTE_MISMATCH";
      finalResult = initial;
    } else {
      route.actualClarificationTarget = initial.clarification.target;
      if (
        initial.clarification.target !== fixture.clarification.expected_target ||
        initial.clarification.maximumQuestionsTotal !== 1 ||
        initial.clarification.questionsRemaining !== 1
      ) {
        route.finalDisposition = "route_mismatch";
        route.safeErrorCode = "M2_V1D_REVIEW_ROUTE_MISMATCH";
        finalResult = initial;
      } else {
        route.clarificationAnswerCount = 1;
        const resumed = await application.answerClarification(
          initial.clarification.opaqueClarificationId,
          structuredClone(fixture.clarification.answer_payload),
        );
        route.resumedEligibility = resumed.eligibility;
        finalResult = resumed;
        if (resumed.eligibility !== "ready") {
          route.finalDisposition = "route_mismatch";
          route.safeErrorCode = "M2_V1D_REVIEW_ROUTE_MISMATCH";
        } else {
          route.finalDisposition = "ready";
        }
      }
    }
  } catch (error) {
    route.finalDisposition = errorDisposition(error);
    route.safeErrorCode = safeErrorCode(error);
  }

  const stageAttempts = exportControlledReviewStageAttempts(
    fixture.fixture_id,
    repository,
  );
  let finalDisposition =
    route.safeErrorCode === null && finalResult !== null
      ? terminalDisposition(finalResult)
      : route.finalDisposition;
  route.finalDisposition = finalDisposition;
  const readyResult =
    finalResult?.eligibility === "ready" && route.safeErrorCode === null
      ? finalResult
      : null;
  let customerProjection: ControlledReviewCaseEvidence["customerProjection"] =
    null;
  if (readyResult !== null) {
    try {
      customerProjection = projectCustomerAssessmentExperienceV2(
        readyResult,
        fixture.assessment_input.requestedTopics,
      );
    } catch (error) {
      finalDisposition = "technical_failure";
      route.finalDisposition = finalDisposition;
      route.safeErrorCode = safeErrorCode(error);
    }
  }
  const caseEvidence: ControlledReviewCaseEvidence = {
    fixtureId: fixture.fixture_id,
    syntheticOnly: true,
    humanPii: false,
    fixedClock: fixture.fixed_clock,
    timezone: fixture.timezone,
    assessmentInput: structuredClone(fixture.assessment_input),
    route,
    stageAttempts,
    qualityReassessment: deriveControlledReviewQualityEvidence(
      fixture.fixture_id,
      stageAttempts,
      finalDisposition,
    ),
    finalRuntimeReport:
      readyResult === null
        ? null
        : (structuredClone(readyResult.report) as unknown as JsonObject),
    customerProjection,
  };
  return sanitizeControlledReviewEvidence(caseEvidence);
}

export async function executeControlledProviderReview(
  options: ControlledReviewExecutorOptions,
): Promise<ControlledReviewExecutorResult> {
  if (
    options.selectedCaseIds.length === 0 ||
    new Set(options.selectedCaseIds).size !== options.selectedCaseIds.length ||
    options.selectedCaseIds.some(
      (fixtureId) =>
        !V1_D_CONTROLLED_REVIEW_CASE_IDS.includes(
          fixtureId as ControlledReviewInputCase["fixture_id"],
        ),
    )
  ) {
    throw new M2RuntimeError("M2_V1D_REVIEW_CASE_SELECTION_INVALID");
  }
  const authority = await loadControlledReviewInputAuthority({
    repositoryRoot: options.repositoryRoot,
    expectedSha256: options.expectedInputSha256,
  });
  const catalog = await loadM2P4QualityReassessmentRuntimeStageCatalog();
  if (
    catalog.catalogVersion !== "runtime-stage-catalog-v15.0.0" ||
    catalog.promptBundleVersion !== "prompt-bundle-runtime-v15.0.0" ||
    catalog.schemaSetVersion !== "pipeline-schema-runtime-v6.0.0" ||
    catalog.stageTopologyVersion !== "split-base-candidate-v1"
  ) {
    throw new M2RuntimeError("M2_V1D_REVIEW_RUNTIME_IDENTITY_INVALID");
  }

  const budget = new ControlledReviewInvocationBudget();
  const providerHttpAttempts: ControlledReviewProviderHttpAttempt[] = [];
  const cases: ControlledReviewCaseEvidence[] = [];
  let globalHttpAttemptOrdinal = 0;
  const nextGlobalHttpAttemptOrdinal = () => {
    globalHttpAttemptOrdinal += 1;
    return globalHttpAttemptOrdinal;
  };

  for (const fixtureId of options.selectedCaseIds) {
    const fixture = authority.cases.find((entry) => entry.fixture_id === fixtureId);
    if (!fixture) invalidInputAuthority();
    const caseEvidence = await executeCase({
      fixture,
      inputHash: authority.sha256,
      catalog,
      budget,
      transportFactory: options.transportFactory,
      nextGlobalHttpAttemptOrdinal,
      onHttpAttempt: async (attempt) => {
        const sanitized = sanitizeControlledReviewEvidence(attempt);
        providerHttpAttempts.push(sanitized);
        await options.onHttpAttempt?.(sanitized);
      },
    });
    cases.push(caseEvidence);
    await options.onCaseEvidence?.(caseEvidence);
    if (
      caseEvidence.route.safeErrorCode ===
      "M2_V1D_REVIEW_STAGE_BUDGET_EXCEEDED"
    ) {
      break;
    }
  }

  const budgetSnapshot = budget.snapshot();
  const complete = cases.every(
    (entry) =>
      entry.route.finalDisposition === "ready" &&
      entry.route.safeErrorCode === null,
  );
  const firstError = cases.find((entry) => entry.route.safeErrorCode !== null)
    ?.route.safeErrorCode;
  return sanitizeControlledReviewEvidence({
    schemaVersion: "m2-p4-v1-d-controlled-review-executor-result-v1",
    model: V1_D_CONTROLLED_REVIEW_MODEL,
    controlledInputSha256: authority.sha256,
    selectedCaseIds: [...options.selectedCaseIds],
    complete,
    applicationStageInvocationCount:
      budgetSnapshot.applicationStageInvocationCount,
    providerHttpAttemptCount: providerHttpAttempts.length,
    applicationStageInvocations: budgetSnapshot.applicationStageInvocations,
    providerHttpAttempts,
    cases,
    safeErrorCode: firstError ?? null,
  });
}

export async function executeControlledProviderReviewV16(
  options: ControlledReviewExecutorOptions,
): Promise<ControlledReviewExecutorResult> {
  if (
    options.selectedCaseIds.length === 0 ||
    new Set(options.selectedCaseIds).size !== options.selectedCaseIds.length ||
    options.selectedCaseIds.some(
      (fixtureId) =>
        !V1_D_CONTROLLED_REVIEW_CASE_IDS.includes(
          fixtureId as ControlledReviewInputCase["fixture_id"],
        ),
    )
  ) {
    throw new M2RuntimeError("M2_V1D_REVIEW_CASE_SELECTION_INVALID");
  }
  const authority = await loadControlledReviewInputAuthority({
    repositoryRoot: options.repositoryRoot,
    expectedSha256: options.expectedInputSha256,
  });
  const catalog =
    await loadM2P4SentMessageDraftBoundaryRuntimeStageCatalog();
  if (
    catalog.catalogVersion !== "runtime-stage-catalog-v16.0.0" ||
    catalog.promptBundleVersion !== "prompt-bundle-runtime-v16.0.0" ||
    catalog.schemaSetVersion !== "pipeline-schema-runtime-v6.0.0" ||
    catalog.stageTopologyVersion !== "split-base-candidate-v1"
  ) {
    throw new M2RuntimeError("M2_V1D_REVIEW_RUNTIME_IDENTITY_INVALID");
  }

  const budget = new ControlledReviewInvocationBudget();
  const providerHttpAttempts: ControlledReviewProviderHttpAttempt[] = [];
  const cases: ControlledReviewCaseEvidence[] = [];
  let globalHttpAttemptOrdinal = 0;
  const nextGlobalHttpAttemptOrdinal = () => {
    globalHttpAttemptOrdinal += 1;
    return globalHttpAttemptOrdinal;
  };

  for (const fixtureId of options.selectedCaseIds) {
    const fixture = authority.cases.find((entry) => entry.fixture_id === fixtureId);
    if (!fixture) invalidInputAuthority();
    const caseEvidence = await executeCase({
      fixture,
      inputHash: authority.sha256,
      catalog,
      budget,
      transportFactory: options.transportFactory,
      nextGlobalHttpAttemptOrdinal,
      onHttpAttempt: async (attempt) => {
        const sanitized = sanitizeControlledReviewEvidence(attempt);
        providerHttpAttempts.push(sanitized);
        await options.onHttpAttempt?.(sanitized);
      },
    });
    cases.push(caseEvidence);
    await options.onCaseEvidence?.(caseEvidence);
    if (
      caseEvidence.route.safeErrorCode ===
      "M2_V1D_REVIEW_STAGE_BUDGET_EXCEEDED"
    ) {
      break;
    }
  }

  const budgetSnapshot = budget.snapshot();
  const complete = cases.every(
    (entry) =>
      entry.route.finalDisposition === "ready" &&
      entry.route.safeErrorCode === null,
  );
  const firstError = cases.find((entry) => entry.route.safeErrorCode !== null)
    ?.route.safeErrorCode;
  return sanitizeControlledReviewEvidence({
    schemaVersion: "m2-p4-v1-d-controlled-review-executor-result-v1",
    model: V1_D_CONTROLLED_REVIEW_MODEL,
    controlledInputSha256: authority.sha256,
    selectedCaseIds: [...options.selectedCaseIds],
    complete,
    applicationStageInvocationCount:
      budgetSnapshot.applicationStageInvocationCount,
    providerHttpAttemptCount: providerHttpAttempts.length,
    applicationStageInvocations: budgetSnapshot.applicationStageInvocations,
    providerHttpAttempts,
    cases,
    safeErrorCode: firstError ?? null,
  });
}

export async function executeControlledProviderReviewV17(
  options: ControlledReviewExecutorOptions,
): Promise<ControlledReviewExecutorResult> {
  if (
    options.selectedCaseIds.length === 0 ||
    new Set(options.selectedCaseIds).size !== options.selectedCaseIds.length ||
    options.selectedCaseIds.some(
      (fixtureId) =>
        !V1_D_CONTROLLED_REVIEW_CASE_IDS.includes(
          fixtureId as ControlledReviewInputCase["fixture_id"],
        ),
    )
  ) {
    throw new M2RuntimeError("M2_V1D_REVIEW_CASE_SELECTION_INVALID");
  }
  const authority = await loadControlledReviewInputAuthority({
    repositoryRoot: options.repositoryRoot,
    expectedSha256: options.expectedInputSha256,
  });
  const catalog = await loadM2P4FinalProductRecoveryRuntimeStageCatalog();
  if (
    catalog.catalogVersion !== "runtime-stage-catalog-v17.0.0" ||
    catalog.promptBundleVersion !== "prompt-bundle-runtime-v17.0.0" ||
    catalog.schemaSetVersion !== "pipeline-schema-runtime-v6.0.0" ||
    catalog.stageTopologyVersion !== "split-base-candidate-v1"
  ) {
    throw new M2RuntimeError("M2_V1D_REVIEW_RUNTIME_IDENTITY_INVALID");
  }

  const budget = new ControlledReviewInvocationBudget();
  const providerHttpAttempts: ControlledReviewProviderHttpAttempt[] = [];
  const cases: ControlledReviewCaseEvidence[] = [];
  let globalHttpAttemptOrdinal = 0;
  const nextGlobalHttpAttemptOrdinal = () => {
    globalHttpAttemptOrdinal += 1;
    return globalHttpAttemptOrdinal;
  };

  for (const fixtureId of options.selectedCaseIds) {
    const fixture = authority.cases.find((entry) => entry.fixture_id === fixtureId);
    if (!fixture) invalidInputAuthority();
    const caseEvidence = await executeCase({
      fixture,
      inputHash: authority.sha256,
      catalog,
      budget,
      transportFactory: options.transportFactory,
      nextGlobalHttpAttemptOrdinal,
      onHttpAttempt: async (attempt) => {
        const sanitized = sanitizeControlledReviewEvidence(attempt);
        providerHttpAttempts.push(sanitized);
        await options.onHttpAttempt?.(sanitized);
      },
    });
    cases.push(caseEvidence);
    await options.onCaseEvidence?.(caseEvidence);
    if (
      caseEvidence.route.safeErrorCode ===
      "M2_V1D_REVIEW_STAGE_BUDGET_EXCEEDED"
    ) {
      break;
    }
  }

  const budgetSnapshot = budget.snapshot();
  const complete = cases.every(
    (entry) =>
      entry.route.finalDisposition === "ready" &&
      entry.route.safeErrorCode === null,
  );
  const firstError = cases.find((entry) => entry.route.safeErrorCode !== null)
    ?.route.safeErrorCode;
  return sanitizeControlledReviewEvidence({
    schemaVersion: "m2-p4-v1-d-controlled-review-executor-result-v1",
    model: V1_D_CONTROLLED_REVIEW_MODEL,
    controlledInputSha256: authority.sha256,
    selectedCaseIds: [...options.selectedCaseIds],
    complete,
    applicationStageInvocationCount:
      budgetSnapshot.applicationStageInvocationCount,
    providerHttpAttemptCount: providerHttpAttempts.length,
    applicationStageInvocations: budgetSnapshot.applicationStageInvocations,
    providerHttpAttempts,
    cases,
    safeErrorCode: firstError ?? null,
  });
}
