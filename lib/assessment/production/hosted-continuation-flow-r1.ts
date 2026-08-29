import type {
  HostedContinuationActionV1,
  HostedContinuationResponseV1,
} from "./hosted-continuation-contract-r1.ts";
import type { PublicPreparationOutcome } from "./types.ts";

export type HostedContinuationTerminalV1 =
  | Readonly<{ kind: "outcome"; outcome: PublicPreparationOutcome }>
  | Readonly<{ kind: "failed" }>
  | Readonly<{ kind: "authentication_required" }>
  | Readonly<{ kind: "stalled" }>
  | Readonly<{ kind: "cancelled" }>;

type HostedContinuationFlowOptionsV1 = Readonly<{
  request: (
    action: HostedContinuationActionV1,
  ) => Promise<HostedContinuationResponseV1>;
  wait: (milliseconds: number) => Promise<void>;
  isCancelled: () => boolean;
  onTransientFailure: (failed: boolean) => void;
  recheckDelayMilliseconds: number;
  maximumStatusChecks: number;
}>;

type HostedContinuationStatusV1 = Extract<
  HostedContinuationResponseV1,
  { kind: "status" }
>["status"];

function stoppedOutcome(
  status: HostedContinuationStatusV1,
): PublicPreparationOutcome | null {
  if (status === "not_full_product_candidate" || status === "safety_blocked") {
    return { status };
  }
  return null;
}

function terminalFromStatus(
  response: Extract<HostedContinuationResponseV1, { kind: "status" }>,
): HostedContinuationTerminalV1 | null {
  if (response.status === "authentication_required") {
    return { kind: "authentication_required" };
  }
  if (response.status === "failed") return { kind: "failed" };
  const outcome = stoppedOutcome(response.status);
  return outcome ? { kind: "outcome", outcome } : null;
}

export async function runHostedContinuationFlowV1(
  options: HostedContinuationFlowOptionsV1,
): Promise<HostedContinuationTerminalV1> {
  let executionAttempted = false;
  let flowActive = true;
  try {
    for (
      let statusChecks = 0;
      statusChecks < options.maximumStatusChecks;
      statusChecks += 1
    ) {
      if (options.isCancelled()) return { kind: "cancelled" };
      let observed: HostedContinuationResponseV1;
      try {
        observed = await options.request("status");
        if (options.isCancelled()) return { kind: "cancelled" };
        options.onTransientFailure(false);
      } catch {
        if (options.isCancelled()) return { kind: "cancelled" };
        options.onTransientFailure(true);
        await options.wait(options.recheckDelayMilliseconds);
        continue;
      }

      if (observed.kind === "outcome") {
        return { kind: "outcome", outcome: observed.outcome };
      }
      const terminal = terminalFromStatus(observed);
      if (terminal) return terminal;
      if (
        observed.status === "purchase_ready" ||
        observed.status === "awaiting_clarification"
      ) {
        try {
          const resolved = await options.request("resolve");
          if (options.isCancelled()) return { kind: "cancelled" };
          if (resolved.kind === "outcome") {
            return { kind: "outcome", outcome: resolved.outcome };
          }
          const resolvedTerminal = terminalFromStatus(resolved);
          if (resolvedTerminal) return resolvedTerminal;
        } catch {
          if (options.isCancelled()) return { kind: "cancelled" };
          options.onTransientFailure(true);
        }
        await options.wait(options.recheckDelayMilliseconds);
        continue;
      }
      if (!executionAttempted) {
        executionAttempted = true;
        void options.request("execute").catch(() => {
          executionAttempted = false;
          if (flowActive && !options.isCancelled()) {
            options.onTransientFailure(true);
          }
        });
      }
      await options.wait(options.recheckDelayMilliseconds);
    }
    return options.isCancelled() ? { kind: "cancelled" } : { kind: "stalled" };
  } finally {
    flowActive = false;
  }
}
