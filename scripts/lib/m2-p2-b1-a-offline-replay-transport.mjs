export function createOfflineReplayTransport(replayCatalog) {
  const byStage = new Map(
    replayCatalog.stages.map((entry) => [entry.stage_id, entry]),
  );
  return Object.freeze({
    kind: "offline_replay",
    invoke(stageRequest) {
      const entry = byStage.get(stageRequest.stage_id);
      if (!entry) {
        throw Object.assign(new Error("Stage is not in the replay catalog"), {
          stopCode: "B1A_UNAUTHORIZED_STAGE",
        });
      }
      return {
        transport_kind: "offline_replay",
        synthetic: true,
        actual_provider_output: false,
        response_id: `synthetic_${entry.stage_id.toLowerCase().replace("-", "_")}`,
        status: entry.synthetic_response_status,
        refusal: null,
        output_json: JSON.stringify(entry.synthetic_output),
        usage_reference: structuredClone(entry.synthetic_usage_reference),
        source_estimator_hash: entry.source_estimator_hash,
        source_contract_hash: entry.source_contract_hash,
      };
    },
  });
}
