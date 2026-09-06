// Constructor-injected server infrastructure shared with the native worker.
// Browser reachability is separately rejected by the worker/client graph audit.
import { createClient } from "@supabase/supabase-js";
import {
  boundedGlobalUnpaidComputeOperation,
  type GlobalUnpaidComputeAuthority,
} from "./global-unpaid-compute.ts";

export function createGlobalUnpaidComputeAuthority(
  supabaseUrl: string,
  supabaseSecretKey: string,
): GlobalUnpaidComputeAuthority {
  const client = createClient(supabaseUrl, supabaseSecretKey, {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
  });
  return {
    claim(input) {
      return boundedGlobalUnpaidComputeOperation(async (signal) => {
        const { data, error } = await client.rpc("claim_global_unpaid_compute_v1", {
          p_invocation_id: input.invocationId,
          p_customer_user_id: input.customerUserId,
          p_preparation_id: input.preparationId,
          p_customer_policy_version: input.policy.policyVersion,
          p_customer_window_seconds: input.policy.windowSeconds,
          p_customer_maximum: input.policy.maximumProviderInvocations,
          p_stage_id: input.stageId,
          p_attempt_number: input.attemptNumber,
          p_global_window_seconds: input.globalPolicy.windowSeconds,
          p_global_maximum: input.globalPolicy.maximumProviderInvocations,
          p_maximum_concurrent: input.globalPolicy.maximumConcurrent,
        }).abortSignal(signal);
        if (error) throw new Error("F006_COMPUTE_CLAIM_FAILED");
        return data;
      });
    },
    release(input) {
      return boundedGlobalUnpaidComputeOperation(async (signal) => {
        const { data, error } = await client.rpc("release_global_unpaid_compute_v1", {
          p_invocation_id: input.invocationId, p_slot_number: input.slotNumber,
        }).abortSignal(signal);
        if (error || typeof data !== "boolean") throw new Error("F006_COMPUTE_RELEASE_FAILED");
        return data;
      });
    },
  };
}
