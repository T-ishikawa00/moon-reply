const opaqueSecretMarker = Symbol("moon-reply-b1b1-opaque-secret");

export const SECRET_PROVIDER_CONTRACT = Object.freeze({
  interface_only: true,
  live_implementation_present: false,
  resolve_method: "resolveSecret",
  future_source_type: "future_process_environment",
  serializable: false,
});

export function markOpaqueSecretValue(value) {
  return Object.freeze({
    [opaqueSecretMarker]: true,
    unwrapForFutureExecutor() {
      return value;
    },
    toJSON() {
      throw new Error("Opaque runtime secret values are non-serializable");
    },
  });
}

export function validateSecretReceipt(receipt) {
  if (
    !receipt ||
    typeof receipt !== "object" ||
    receipt.available !== true ||
    receipt.source_type !== SECRET_PROVIDER_CONTRACT.future_source_type ||
    receipt.secret_value?.[opaqueSecretMarker] !== true
  ) {
    throw Object.assign(new Error("Injected secret receipt is invalid"), {
      stopCode: "SECRET_RECEIPT_INVALID",
    });
  }
  return true;
}
