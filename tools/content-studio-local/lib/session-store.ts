import { randomUUID } from "node:crypto";

import type { AssessmentApplication } from "../../../lib/assessment/runtime/application.ts";
import { M2RuntimeError } from "../../../lib/assessment/runtime/errors.ts";
import { FakeAssessmentRepository } from "../../../lib/assessment/runtime/fakes.ts";
import type { RequestedTopic } from "../../../lib/assessment/runtime/types.ts";
import type {
  LocalQualityDiagnosticCollector,
  LocalQualityDiagnosticV1,
} from "./quality-diagnostics.ts";

export type LocalContentStudioSessionState =
  | "generating"
  | "awaiting_clarification"
  | "ready"
  | "stopped"
  | "failed";

export type LocalContentStudioSession = {
  readonly runHandle: string;
  readonly idempotencyKey: string;
  readonly repository: FakeAssessmentRepository;
  readonly application: AssessmentApplication;
  readonly requestedTopics: readonly RequestedTopic[];
  readonly qualityDiagnosticCollector: LocalQualityDiagnosticCollector;
  readonly createdAtMs: number;
  updatedAtMs: number;
  state: LocalContentStudioSessionState;
  clarificationId: string | null;
};

type SessionStoreOptions = Readonly<{
  maximumSessions?: number;
  maximumConcurrentExecutions?: number;
  sessionTtlMs?: number;
  now?: () => number;
  uuid?: () => string;
}>;

const DEFAULT_MAXIMUM_SESSIONS = 8;
const DEFAULT_MAXIMUM_CONCURRENT_EXECUTIONS = 1;
const DEFAULT_SESSION_TTL_MS = 2 * 60 * 60 * 1_000;

export class BoundedLocalContentStudioSessionStore {
  private readonly sessions = new Map<string, LocalContentStudioSession>();
  private readonly terminalDiagnostics = new Map<
    string,
    Readonly<{
      diagnostic: LocalQualityDiagnosticV1;
      recordedAtMs: number;
    }>
  >();
  private readonly maximumSessions: number;
  private readonly maximumConcurrentExecutions: number;
  private readonly sessionTtlMs: number;
  private readonly now: () => number;
  private readonly uuid: () => string;

  constructor(options: SessionStoreOptions = {}) {
    this.maximumSessions =
      options.maximumSessions ?? DEFAULT_MAXIMUM_SESSIONS;
    this.maximumConcurrentExecutions =
      options.maximumConcurrentExecutions ??
      DEFAULT_MAXIMUM_CONCURRENT_EXECUTIONS;
    this.sessionTtlMs = options.sessionTtlMs ?? DEFAULT_SESSION_TTL_MS;
    this.now = options.now ?? Date.now;
    this.uuid = options.uuid ?? randomUUID;
    if (
      !Number.isInteger(this.maximumSessions) ||
      this.maximumSessions < 1 ||
      this.maximumSessions > 32 ||
      !Number.isInteger(this.maximumConcurrentExecutions) ||
      this.maximumConcurrentExecutions < 1 ||
      this.maximumConcurrentExecutions > 2 ||
      !Number.isSafeInteger(this.sessionTtlMs) ||
      this.sessionTtlMs < 60_000 ||
      this.sessionTtlMs > 24 * 60 * 60 * 1_000
    ) {
      throw new M2RuntimeError(
        "CONTENT_STUDIO_LOCAL_STORE_CONFIGURATION_INVALID",
        500,
      );
    }
  }

  private activeExecutionCount() {
    return [...this.sessions.values()].filter(
      (session) => session.state === "generating",
    ).length;
  }

  private prune() {
    const now = this.now();
    for (const [id, session] of this.sessions) {
      if (
        session.state !== "generating" &&
        now - session.updatedAtMs >= this.sessionTtlMs
      ) {
        this.sessions.delete(id);
      }
    }
    for (const [runHandle, record] of this.terminalDiagnostics) {
      if (now - record.recordedAtMs >= this.sessionTtlMs) {
        this.terminalDiagnostics.delete(runHandle);
      }
    }
  }

  private retainTerminalDiagnostic(
    runHandle: string,
    diagnostic: LocalQualityDiagnosticV1,
  ) {
    if (this.terminalDiagnostics.size >= this.maximumSessions) {
      const oldest = [...this.terminalDiagnostics.entries()].sort(
        ([, left], [, right]) => left.recordedAtMs - right.recordedAtMs,
      )[0];
      if (oldest) this.terminalDiagnostics.delete(oldest[0]);
    }
    this.terminalDiagnostics.set(runHandle, {
      diagnostic: structuredClone(diagnostic),
      recordedAtMs: this.now(),
    });
  }

  private evictOldestInactive() {
    const candidate = [...this.sessions.values()]
      .filter((session) =>
        ["ready", "stopped", "failed"].includes(session.state),
      )
      .sort((left, right) => left.updatedAtMs - right.updatedAtMs)[0];
    if (candidate) this.sessions.delete(candidate.runHandle);
  }

  create(input: {
    application: AssessmentApplication;
    repository: FakeAssessmentRepository;
    requestedTopics: readonly RequestedTopic[];
    qualityDiagnosticCollector: LocalQualityDiagnosticCollector;
  }) {
    this.prune();
    if (
      this.activeExecutionCount() >= this.maximumConcurrentExecutions
    ) {
      throw new M2RuntimeError("CONTENT_STUDIO_LOCAL_BUSY", 429);
    }
    if (this.sessions.size >= this.maximumSessions) {
      this.evictOldestInactive();
    }
    if (this.sessions.size >= this.maximumSessions) {
      throw new M2RuntimeError("CONTENT_STUDIO_LOCAL_SESSION_LIMIT", 429);
    }
    const now = this.now();
    const session: LocalContentStudioSession = {
      runHandle: this.uuid(),
      idempotencyKey: this.uuid(),
      repository: input.repository,
      application: input.application,
      requestedTopics: Object.freeze([...input.requestedTopics]),
      qualityDiagnosticCollector: input.qualityDiagnosticCollector,
      createdAtMs: now,
      updatedAtMs: now,
      state: "generating",
      clarificationId: null,
    };
    this.sessions.set(session.runHandle, session);
    return session;
  }

  get(runHandle: string) {
    this.prune();
    const session = this.sessions.get(runHandle);
    if (!session) {
      throw new M2RuntimeError("CONTENT_STUDIO_LOCAL_SESSION_NOT_FOUND", 404);
    }
    return session;
  }

  beginClarification(runHandle: string) {
    const session = this.get(runHandle);
    if (
      session.state !== "awaiting_clarification" ||
      session.clarificationId === null
    ) {
      throw new M2RuntimeError(
        "CONTENT_STUDIO_LOCAL_CLARIFICATION_STATE_INVALID",
        409,
      );
    }
    if (
      this.activeExecutionCount() >= this.maximumConcurrentExecutions
    ) {
      throw new M2RuntimeError("CONTENT_STUDIO_LOCAL_BUSY", 429);
    }
    session.state = "generating";
    session.updatedAtMs = this.now();
    return {
      session,
      clarificationId: session.clarificationId,
    };
  }

  finish(
    runHandle: string,
    state: Exclude<LocalContentStudioSessionState, "generating">,
    clarificationId: string | null = null,
    diagnostic: LocalQualityDiagnosticV1 | null = null,
  ) {
    const session = this.get(runHandle);
    if (session.state !== "generating") {
      throw new M2RuntimeError("CONTENT_STUDIO_LOCAL_SESSION_STATE_INVALID", 409);
    }
    session.state = state;
    session.clarificationId = clarificationId;
    session.updatedAtMs = this.now();
    if (state === "ready" || state === "stopped" || state === "failed") {
      this.sessions.delete(runHandle);
      if (diagnostic !== null) {
        this.retainTerminalDiagnostic(runHandle, diagnostic);
      }
    }
  }

  fail(runHandle: string) {
    this.sessions.delete(runHandle);
  }

  readTerminalDiagnostic(runHandle: string) {
    this.prune();
    const record = this.terminalDiagnostics.get(runHandle);
    return record === undefined
      ? null
      : (structuredClone(record.diagnostic) as LocalQualityDiagnosticV1);
  }

  snapshot() {
    this.prune();
    return Object.freeze({
      sessionCount: this.sessions.size,
      terminalDiagnosticCount: this.terminalDiagnostics.size,
      activeExecutionCount: this.activeExecutionCount(),
      maximumSessions: this.maximumSessions,
      maximumConcurrentExecutions: this.maximumConcurrentExecutions,
    });
  }
}
