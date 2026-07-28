export const NETWORK_INTERLOCK = Object.freeze({
  execution_mode: "network_blocked_provider_adapter_test",
  live_execution_authorized: false,
  paid_run_authorized: false,
  network_executor_bound: false,
  secret_provider_bound: false,
  actual_provider_calls: 0,
  api_spend_usd: 0,
  required_stop_code: "LIVE_EXECUTION_NOT_AUTHORIZED",
});

export function evaluateNetworkInterlock() {
  return {
    allowed: false,
    stop_code: NETWORK_INTERLOCK.required_stop_code,
    lock: NETWORK_INTERLOCK,
  };
}
