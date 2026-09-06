// F004 deployment-gap handoff only. The database reserves at most one untouched
// notification per minute globally. Once a new sender claims it, the existing
// notification lifecycle owns all send outcomes; this lane never retries sends.
export type NotificationCutoverRecoveryClaim = Readonly<{ jobId: string }>;

async function bounded<T>(operation: (signal: AbortSignal) => Promise<T>) {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve().then(() => operation(controller.signal)),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(new Error("NOTIFICATION_CUTOVER_HANDOFF_DEFERRED"));
        }, 3_000);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

export async function runNotificationCutoverRecovery(input: {
  claim: (signal: AbortSignal) => Promise<NotificationCutoverRecoveryClaim | null>;
  enqueue: (jobId: string) => Promise<unknown>;
}) {
  try {
    const claim = await bounded(input.claim);
    if (!claim) return { status: "idle" as const };
    // An unknown enqueue is safe: the DB reservation expires in five minutes.
    // Duplicate worker events converge on the existing v3 notification claim.
    await bounded(() => input.enqueue(claim.jobId));
    return { status: "enqueued" as const };
  } catch {
    // Leave the durable pending row intact, including when the runtime precedes
    // its migration. Do not interrupt ordinary paid fulfillment dispatch.
    return { status: "deferred" as const };
  }
}
