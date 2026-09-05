import {
  shouldAutomaticallyPoll,
  type CustomerPurchaseStatus,
  type CustomerResultPath,
} from "./purchase-status-contract.ts";

export type PurchaseStatusPollPolicy = Readonly<{
  requestTimeoutMs: number;
  steadyPollDelayMs: number;
  backoffBaseMs: number;
  maximumDelayMs: number;
  jitterRatio: number;
  maximumTransientRetries: number;
  maximumTemporaryProblemRetries: number;
  maximumAutomaticRequests: number;
}>;

export const DEFAULT_PURCHASE_STATUS_POLL_POLICY: PurchaseStatusPollPolicy = {
  requestTimeoutMs: 15_000,
  steadyPollDelayMs: 2_500,
  backoffBaseMs: 1_500,
  maximumDelayMs: 30_000,
  jitterRatio: 0.2,
  maximumTransientRetries: 8,
  maximumTemporaryProblemRetries: 8,
  maximumAutomaticRequests: 120,
};

export function purchaseStatusBackoffDelay(
  failureCount: number,
  policy: PurchaseStatusPollPolicy,
  randomValue: number,
) {
  const safeFailureCount = Math.max(1, Math.floor(failureCount));
  const exponential = Math.min(
    policy.maximumDelayMs,
    policy.backoffBaseMs * 2 ** (safeFailureCount - 1),
  );
  const boundedRandom = Math.min(1, Math.max(0, randomValue));
  const jitterMultiplier =
    1 + policy.jitterRatio * (boundedRandom * 2 - 1);
  return Math.max(
    1,
    Math.min(policy.maximumDelayMs, Math.round(exponential * jitterMultiplier)),
  );
}

type RecoveryState = Readonly<{
  requestFailed: boolean;
  recoveryExhausted: boolean;
}>;

type PurchaseStatusPollerOptions = {
  fetchStatus(signal: AbortSignal): Promise<CustomerPurchaseStatus>;
  onStatus(status: CustomerPurchaseStatus): void;
  onRecoveryState(state: RecoveryState): void;
  onNavigate(resultPath: CustomerResultPath): void;
  policy?: PurchaseStatusPollPolicy;
  random?: () => number;
  setTimer?: (callback: () => void, delayMs: number) => unknown;
  clearTimer?: (handle: unknown) => void;
};

export class PurchaseStatusPoller {
  private readonly options: PurchaseStatusPollerOptions;
  private readonly policy: PurchaseStatusPollPolicy;
  private readonly random: () => number;
  private readonly setTimer: (
    callback: () => void,
    delayMs: number,
  ) => unknown;
  private readonly clearTimer: (handle: unknown) => void;
  private active = false;
  private inFlight = false;
  private redirected = false;
  private timer: unknown = null;
  private abortController: AbortController | null = null;
  private automaticRequestCount = 0;
  private transientFailureCount = 0;
  private temporaryProblemCount = 0;

  constructor(options: PurchaseStatusPollerOptions) {
    this.options = options;
    this.policy = options.policy ?? DEFAULT_PURCHASE_STATUS_POLL_POLICY;
    this.random = options.random ?? Math.random;
    this.setTimer =
      options.setTimer ??
      ((callback, delayMs) => globalThis.setTimeout(callback, delayMs));
    this.clearTimer =
      options.clearTimer ??
      ((handle) => globalThis.clearTimeout(handle as ReturnType<typeof setTimeout>));
  }

  async start() {
    if (this.active) return;
    this.active = true;
    await this.request(false);
  }

  async manualRefresh() {
    if (!this.active || this.inFlight || this.redirected) return;
    this.clearScheduledRequest();
    this.automaticRequestCount = 0;
    this.transientFailureCount = 0;
    this.temporaryProblemCount = 0;
    this.options.onRecoveryState({
      requestFailed: false,
      recoveryExhausted: false,
    });
    await this.request(true);
  }

  stop() {
    this.active = false;
    this.clearScheduledRequest();
    this.abortController?.abort();
    this.abortController = null;
    this.inFlight = false;
  }

  private clearScheduledRequest() {
    if (this.timer !== null) {
      this.clearTimer(this.timer);
      this.timer = null;
    }
  }

  private schedule(delayMs: number) {
    if (!this.active || this.redirected) return;
    this.clearScheduledRequest();
    this.timer = this.setTimer(() => {
      this.timer = null;
      void this.request(false);
    }, delayMs);
  }

  private exhaust(requestFailed: boolean) {
    this.clearScheduledRequest();
    this.options.onRecoveryState({
      requestFailed,
      recoveryExhausted: true,
    });
  }

  private async request(manual: boolean) {
    if (!this.active || this.inFlight || this.redirected) return;
    if (
      !manual &&
      this.automaticRequestCount >= this.policy.maximumAutomaticRequests
    ) {
      this.exhaust(false);
      return;
    }

    this.inFlight = true;
    if (!manual) this.automaticRequestCount += 1;
    const abortController = new AbortController();
    this.abortController = abortController;
    let timedOut = false;
    let deadlineTimer: unknown = null;
    let onAbort: () => void = () => undefined;
    // Race the entire status read (including its body) so even an uncooperative
    // transport cannot retain the browser's request fence after cancellation.
    const cancelled = new Promise<never>((_, reject) => {
      onAbort = () => {
        if (deadlineTimer !== null) this.clearTimer(deadlineTimer);
        deadlineTimer = null;
        reject(new Error("PURCHASE_STATUS_REQUEST_ABORTED"));
      };
      abortController.signal.addEventListener("abort", onAbort, { once: true });
      deadlineTimer = this.setTimer(() => {
        timedOut = true;
        abortController.abort();
      }, this.policy.requestTimeoutMs);
    });
    try {
      const status = await Promise.race([
        this.options.fetchStatus(abortController.signal),
        cancelled,
      ]);
      if (
        !this.active ||
        this.abortController !== abortController ||
        abortController.signal.aborted
      ) return;

      this.transientFailureCount = 0;
      this.options.onRecoveryState({
        requestFailed: false,
        recoveryExhausted: false,
      });
      this.options.onStatus(status);

      if (status.status === "completed") {
        if (!this.redirected) {
          this.redirected = true;
          this.options.onNavigate(status.resultPath);
        }
        return;
      }

      if (!shouldAutomaticallyPoll(status)) return;

      if (status.status === "temporary_problem") {
        this.temporaryProblemCount += 1;
        if (
          this.temporaryProblemCount >
          this.policy.maximumTemporaryProblemRetries
        ) {
          this.exhaust(false);
          return;
        }
        this.schedule(
          purchaseStatusBackoffDelay(
            this.temporaryProblemCount,
            this.policy,
            this.random(),
          ),
        );
        return;
      }

      this.temporaryProblemCount = 0;
      if (
        this.automaticRequestCount >= this.policy.maximumAutomaticRequests
      ) {
        this.exhaust(false);
        return;
      }
      this.schedule(this.policy.steadyPollDelayMs);
    } catch {
      if (
        !this.active ||
        this.abortController !== abortController ||
        (abortController.signal.aborted && !timedOut)
      ) {
        return;
      }
      this.transientFailureCount += 1;
      this.options.onRecoveryState({
        requestFailed: true,
        recoveryExhausted: false,
      });
      if (
        this.transientFailureCount > this.policy.maximumTransientRetries ||
        this.automaticRequestCount >= this.policy.maximumAutomaticRequests
      ) {
        this.exhaust(true);
        return;
      }
      this.schedule(
        purchaseStatusBackoffDelay(
          this.transientFailureCount,
          this.policy,
          this.random(),
        ),
      );
    } finally {
      if (deadlineTimer !== null) this.clearTimer(deadlineTimer);
      abortController.signal.removeEventListener("abort", onAbort);
      if (this.abortController === abortController) {
        this.abortController = null;
        this.inFlight = false;
      }
    }
  }
}
