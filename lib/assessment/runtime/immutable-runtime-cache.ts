export type ImmutableRuntimeCacheLookup<T> = {
  cacheHit: boolean;
  cacheState: "miss" | "pending" | "ready";
  value: Promise<T>;
};

export class ImmutableRuntimeCache<T> {
  private readonly entries = new Map<
    string,
    { state: "pending" | "ready"; value: Promise<T> }
  >();

  getOrInitialize(
    cacheKey: string,
    initialize: () => Promise<T>,
  ): ImmutableRuntimeCacheLookup<T> {
    const cached = this.entries.get(cacheKey);
    if (cached) {
      return {
        cacheHit: cached.state === "ready",
        cacheState: cached.state,
        value: cached.value,
      };
    }

    const pending = Promise.resolve().then(initialize);
    const entry = { state: "pending" as const, value: pending };
    this.entries.set(cacheKey, entry);
    void pending.then(
      () => {
        if (this.entries.get(cacheKey) === entry) {
          this.entries.set(cacheKey, { state: "ready", value: pending });
        }
      },
      () => {
        if (this.entries.get(cacheKey) === entry) {
          this.entries.delete(cacheKey);
        }
      },
    );
    return {
      cacheHit: false,
      cacheState: "miss",
      value: pending,
    };
  }
}
