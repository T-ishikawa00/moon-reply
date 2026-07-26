import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
export const repositoryRoot = path.resolve(scriptDirectory, "..");

const promptRoot = "ai/prompts";
const stageContractPath = "ai/prompts/shared/stage-contracts-v1.json";
const promptManifestPath = "ai/prompts/prompt-bundle.manifest.json";
const stageProfilePath =
  "evals/cost-estimator/stage-size-profiles-v1.json";
const estimatorConfigPath =
  "evals/cost-estimator/estimator-config-v1.json";

const sharedAssetsByStage = {
  "PB-01": [
    "shared/common-stage-contract.md",
    "shared/stage-contracts-v1.json",
    "shared/retry-policy-v1.json",
  ],
  "PB-02": [
    "shared/common-stage-contract.md",
    "shared/stage-contracts-v1.json",
    "shared/retry-policy-v1.json",
    "shared/safety-reason-codes-v1.json",
  ],
  "PB-03": [
    "shared/common-stage-contract.md",
    "shared/stage-contracts-v1.json",
    "shared/retry-policy-v1.json",
    "shared/question-library-v1.json",
  ],
  "PB-04": [
    "shared/common-stage-contract.md",
    "shared/stage-contracts-v1.json",
    "shared/retry-policy-v1.json",
    "shared/decision-labels-v1.json",
    "shared/forbidden-claims-v1.json",
  ],
  "PB-05": [
    "shared/common-stage-contract.md",
    "shared/stage-contracts-v1.json",
    "shared/retry-policy-v1.json",
    "shared/brand-voice-v1.md",
    "shared/forbidden-claims-v1.json",
    "shared/report-field-constraints-v1.json",
  ],
  "PB-06": [
    "shared/common-stage-contract.md",
    "shared/stage-contracts-v1.json",
    "shared/retry-policy-v1.json",
    "shared/forbidden-claims-v1.json",
  ],
  "PB-07": [
    "shared/common-stage-contract.md",
    "shared/stage-contracts-v1.json",
    "shared/retry-policy-v1.json",
    "shared/brand-voice-v1.md",
    "shared/forbidden-claims-v1.json",
    "shared/report-field-constraints-v1.json",
  ],
};

function absolute(relativePath) {
  return path.join(repositoryRoot, ...relativePath.split("/"));
}

export function readText(relativePath) {
  return readFileSync(absolute(relativePath), "utf8").replaceAll(
    "\r\n",
    "\n",
  );
}

export function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function clone(value) {
  return structuredClone(value);
}

function compactJson(value) {
  return JSON.stringify(value);
}

function repeatedText(label, scale) {
  return Array.from(
    { length: scale },
    (_, index) => `${label}${String(index + 1)}`,
  ).join("。");
}

function factIds(count) {
  return Array.from(
    { length: count },
    (_, index) => `F${String(index + 1).padStart(3, "0")}`,
  );
}

function syntheticStructuredIntake(profile) {
  const count = profile.collection_scale;
  const ids = factIds(count);
  return {
    schema_version: "pipeline-schema-v1.0.0",
    relationship_stage: "ambiguous",
    user_goal: "decide_send_or_wait",
    timeline: Array.from({ length: count }, (_, index) => ({
      event_id: `E${String(index + 1).padStart(3, "0")}`,
      sequence: index + 1,
      actor: index % 2 === 0 ? "user" : "other_person",
      statement: repeatedText("合成時系列", profile.text_scale),
      source_refs: ["input:current_situation"],
    })),
    boundaries: [],
    context: Array.from({ length: count }, (_, index) => ({
      context_id: `C${String(index + 1).padStart(3, "0")}`,
      kind: "message_state",
      statement: repeatedText("合成文脈", profile.text_scale),
      source_refs: ["input:current_situation"],
    })),
    observed_facts: ids.map((id) => ({
      fact_id: id,
      statement: repeatedText("合成観測事実", profile.text_scale),
      source_refs: ["input:current_situation"],
      support: "explicit",
    })),
    user_assumptions: Array.from({ length: count }, (_, index) => ({
      item_id: `A${String(index + 1).padStart(3, "0")}`,
      statement: repeatedText("合成仮定", profile.text_scale),
      source_refs: ["input:current_situation"],
    })),
    user_emotions: Array.from({ length: count }, (_, index) => ({
      item_id: `M${String(index + 1).padStart(3, "0")}`,
      statement: repeatedText("合成感情", profile.text_scale),
      source_refs: ["input:current_situation"],
    })),
    material_unknowns: Array.from({ length: count }, (_, index) => ({
      unknown_code: `synthetic_unknown_${index + 1}`,
      description: repeatedText("合成不明点", profile.text_scale),
      material_to: ["decision"],
    })),
    safety_signals: [],
    untrusted_embedded_instructions_detected: false,
  };
}

function syntheticSafetyModelResult() {
  return {
    classification: "normal_allowed",
    reason_codes: ["normal"],
    response_mode: "none",
    evidence_refs: [],
    ambiguity_present: false,
  };
}

function syntheticAggregateSafetyResult() {
  return {
    classification: "normal_allowed",
    reason_codes: ["normal"],
    response_mode: "none",
    aggregation_rule: "strictest_classification_wins",
    normal_flow_allowed: true,
  };
}

function syntheticDeterministicSafetyResult() {
  return {
    classification: "normal_allowed",
    reason_codes: ["normal"],
    response_mode: "none",
  };
}

function syntheticEligibilityResult() {
  return {
    schema_version: "pipeline-schema-v1.0.0",
    eligibility: "ready",
    question_codes: [],
    material_gap_codes: [],
    normal_flow_allowed: true,
    payment_allowed: true,
    report_generation: "allowed",
  };
}

function syntheticDecisionPolicyResult() {
  return {
    schema_version: "pipeline-schema-v1.0.0",
    policy_version: "decision-policy-v1.0.0",
    allowed_decisions: [
      "reply_now",
      "send_now",
      "wait_and_reassess",
      "pause_additional_contact",
    ],
    disallowed_decisions: [],
    follow_up_exception: "none",
    message_draft_policy: "required_now",
    later_draft_mode: null,
    pause_reason_code: null,
    resume_policy: null,
  };
}

function syntheticDecisionPlan(profile) {
  const count = profile.collection_scale;
  const ids = factIds(count);
  return {
    schema_version: "pipeline-schema-v1.0.0",
    selected_decision: "reply_now",
    decision_reason_fact_ids: ids,
    possible_interpretations: Array.from({ length: count }, () => ({
      statement: repeatedText("合成可能性", profile.text_scale),
      supporting_fact_ids: ids,
      epistemic_status: "possibility_only",
    })),
    actions_to_take: Array.from({ length: count }, (_, index) =>
      repeatedText(`合成実行事項${index + 1}`, profile.text_scale),
    ),
    actions_to_avoid: Array.from({ length: count }, (_, index) =>
      repeatedText(`合成回避事項${index + 1}`, profile.text_scale),
    ),
    message_draft: {
      text: repeatedText("合成返信案", profile.text_scale),
      policy: "required_now",
      use_timing: "now",
    },
    three_day_plan: [
      {
        day: "tonight",
        action: repeatedText("合成今夜行動", profile.text_scale),
        avoid: repeatedText("合成今夜回避", profile.text_scale),
      },
      {
        day: "next_day",
        action: repeatedText("合成翌日行動", profile.text_scale),
        avoid: repeatedText("合成翌日回避", profile.text_scale),
      },
      {
        day: "day_three",
        action: repeatedText("合成三日目行動", profile.text_scale),
        avoid: repeatedText("合成三日目回避", profile.text_scale),
      },
    ],
    change_conditions: Array.from({ length: count }, () => ({
      condition: repeatedText("合成変更条件", profile.text_scale),
      resulting_direction: "wait_and_reassess",
    })),
    review_timing: {
      when: repeatedText("合成再確認時点", profile.text_scale),
      trigger_fact_ids: ids,
    },
    material_unknowns: Array.from({ length: count }, (_, index) =>
      repeatedText(`合成重要不明点${index + 1}`, profile.text_scale),
    ),
    limitations: Array.from({ length: count }, (_, index) =>
      repeatedText(`合成限界${index + 1}`, profile.text_scale),
    ),
  };
}

function syntheticReportContent(profile) {
  const count = profile.collection_scale;
  const ids = factIds(count);
  const paragraph = (label) =>
    repeatedText(label, Math.max(2, profile.text_scale));
  return {
    schema_version: "pipeline-schema-v1.0.0",
    cover_line: paragraph("合成表紙文"),
    short_letter: Array.from(
      { length: Math.max(2, count) },
      () => paragraph("合成短い手紙"),
    ),
    decision_reason_summary: paragraph("合成判断理由"),
    relationship_summary: paragraph("合成関係整理"),
    observed_fact_commentary: ids.map((id) => ({
      fact_id: id,
      commentary: paragraph("合成事実コメント"),
    })),
    possible_interpretations: Array.from(
      { length: Math.max(2, count) },
      () => paragraph("合成可能性説明"),
    ),
    anxiety_reframe: Array.from({ length: Math.min(3, count) }, () =>
      paragraph("合成不安整理"),
    ),
    message_temperature: {
      softness: paragraph("合成柔らかさ"),
      affection: paragraph("合成親しさ"),
      pressure: paragraph("合成圧力"),
      adjustment: paragraph("合成調整"),
    },
    action_rationales: Array.from({ length: count }, () =>
      paragraph("合成行動理由"),
    ),
    message_draft_context: paragraph("合成文面文脈"),
    three_day_plan_commentary: [
      paragraph("合成今夜解説"),
      paragraph("合成翌日解説"),
      paragraph("合成三日目解説"),
    ],
    change_condition_commentary: Array.from({ length: count }, () =>
      paragraph("合成変更条件解説"),
    ),
    unknowns_commentary: Array.from({ length: count }, () =>
      paragraph("合成不明点解説"),
    ),
    closing_lines: Array.from(
      { length: Math.max(2, count) },
      () => paragraph("合成結び"),
    ),
  };
}

function syntheticValidationResult() {
  return {
    schema_version: "pipeline-schema-v1.0.0",
    validation_mode: "semantic_findings_only",
    deterministic_checks: [],
    semantic_checks: [],
    final_disposition: null,
    repair_strategy: null,
    failed_codes: [],
  };
}

export function buildSyntheticProfiles() {
  const source = readJson(stageProfilePath);
  return Object.fromEntries(
    Object.entries(source.synthetic_profiles).map(([profileName, profile]) => {
      const outputs = {
        "PB-01": syntheticStructuredIntake(profile),
        "PB-02": syntheticSafetyModelResult(profile),
        "PB-03": syntheticEligibilityResult(profile),
        "PB-04": syntheticDecisionPlan(profile),
        "PB-05": syntheticReportContent(profile),
        "PB-06": syntheticValidationResult(profile),
        "PB-07": syntheticReportContent(profile),
      };
      return [
        profileName,
        {
          metadata: {
            profile_name: profileName,
            synthetic: true,
            actual_model_output: false,
            oracle_derived: false,
            deterministic: true,
            personal_data: false,
            holdout_data: false,
            description: profile.description,
          },
          outputs,
        },
      ];
    }),
  );
}

export function resolveJsonPointer(document, pointer) {
  if (pointer === null) return document;
  if (typeof pointer !== "string" || !pointer.startsWith("#/")) {
    return undefined;
  }
  let current = document;
  for (const encodedPart of pointer.slice(2).split("/")) {
    const part = encodedPart.replaceAll("~1", "/").replaceAll("~0", "~");
    if (
      !current ||
      typeof current !== "object" ||
      !Object.hasOwn(current, part)
    ) {
      return undefined;
    }
    current = current[part];
  }
  return current;
}

function sameValue(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function typeMatches(value, type) {
  if (type === "null") return value === null;
  if (type === "array") return Array.isArray(value);
  if (type === "object") {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }
  if (type === "integer") return Number.isInteger(value);
  if (type === "number") return typeof value === "number" && Number.isFinite(value);
  return typeof value === type;
}

export function validateJsonSchema(
  value,
  schema,
  rootSchema = schema,
  pathName = "$",
) {
  const errors = [];
  const validate = (item, rule, itemPath) => {
    if (rule === true || rule === undefined) return [];
    if (rule === false) return [`${itemPath}: schema is false`];
    if (rule.$ref) {
      const resolved = resolveJsonPointer(rootSchema, rule.$ref);
      return resolved
        ? validate(item, resolved, itemPath)
        : [`${itemPath}: unresolved ref ${rule.$ref}`];
    }

    const localErrors = [];
    if (Object.hasOwn(rule, "const") && !sameValue(item, rule.const)) {
      localErrors.push(`${itemPath}: const mismatch`);
    }
    if (
      Array.isArray(rule.enum) &&
      !rule.enum.some((candidate) => sameValue(item, candidate))
    ) {
      localErrors.push(`${itemPath}: enum mismatch`);
    }
    if (rule.type) {
      const types = Array.isArray(rule.type) ? rule.type : [rule.type];
      if (!types.some((type) => typeMatches(item, type))) {
        localErrors.push(`${itemPath}: expected ${types.join("|")}`);
        return localErrors;
      }
    }

    if (Array.isArray(rule.allOf)) {
      for (const branch of rule.allOf) {
        localErrors.push(...validate(item, branch, itemPath));
      }
    }
    if (Array.isArray(rule.oneOf)) {
      const passing = rule.oneOf.filter(
        (branch) => validate(item, branch, itemPath).length === 0,
      ).length;
      if (passing !== 1) localErrors.push(`${itemPath}: oneOf matched ${passing}`);
    }
    if (rule.if) {
      const conditionalPass = validate(item, rule.if, itemPath).length === 0;
      const selected = conditionalPass ? rule.then : rule.else;
      if (selected) localErrors.push(...validate(item, selected, itemPath));
    }

    if (typeof item === "string") {
      if (rule.minLength !== undefined && item.length < rule.minLength) {
        localErrors.push(`${itemPath}: shorter than minLength`);
      }
      if (rule.maxLength !== undefined && item.length > rule.maxLength) {
        localErrors.push(`${itemPath}: longer than maxLength`);
      }
      if (rule.pattern && !new RegExp(rule.pattern, "u").test(item)) {
        localErrors.push(`${itemPath}: pattern mismatch`);
      }
    }
    if (typeof item === "number") {
      if (rule.minimum !== undefined && item < rule.minimum) {
        localErrors.push(`${itemPath}: below minimum`);
      }
      if (rule.maximum !== undefined && item > rule.maximum) {
        localErrors.push(`${itemPath}: above maximum`);
      }
    }
    if (Array.isArray(item)) {
      if (rule.minItems !== undefined && item.length < rule.minItems) {
        localErrors.push(`${itemPath}: fewer than minItems`);
      }
      if (rule.maxItems !== undefined && item.length > rule.maxItems) {
        localErrors.push(`${itemPath}: more than maxItems`);
      }
      if (
        rule.uniqueItems === true &&
        new Set(item.map((entry) => compactJson(entry))).size !== item.length
      ) {
        localErrors.push(`${itemPath}: duplicate array entries`);
      }
      if (Array.isArray(rule.prefixItems)) {
        rule.prefixItems.forEach((entryRule, index) => {
          if (index < item.length) {
            localErrors.push(
              ...validate(item[index], entryRule, `${itemPath}[${index}]`),
            );
          }
        });
        if (rule.items === false && item.length > rule.prefixItems.length) {
          localErrors.push(`${itemPath}: additional items prohibited`);
        }
      } else if (rule.items && rule.items !== false) {
        item.forEach((entry, index) => {
          localErrors.push(
            ...validate(entry, rule.items, `${itemPath}[${index}]`),
          );
        });
      }
    }
    if (
      item !== null &&
      typeof item === "object" &&
      !Array.isArray(item)
    ) {
      for (const required of rule.required ?? []) {
        if (!Object.hasOwn(item, required)) {
          localErrors.push(`${itemPath}.${required}: required`);
        }
      }
      const properties = rule.properties ?? {};
      for (const [key, child] of Object.entries(item)) {
        if (Object.hasOwn(properties, key)) {
          localErrors.push(
            ...validate(child, properties[key], `${itemPath}.${key}`),
          );
        } else if (rule.additionalProperties === false) {
          localErrors.push(`${itemPath}.${key}: additional property`);
        }
      }
    }
    return localErrors;
  };
  errors.push(...validate(value, schema, pathName));
  return errors;
}

export function loadFoundation() {
  const promptManifest = readJson(promptManifestPath);
  const stageContracts = readJson(stageContractPath);
  const stageProfiles = readJson(stageProfilePath);
  const estimatorConfig = readJson(estimatorConfigPath);
  const index = readJson("evals/development/index.json");
  const caseFiles = new Map();
  const cases = new Map();
  for (const entry of index.cases) {
    if (!caseFiles.has(entry.source_file)) {
      caseFiles.set(
        entry.source_file,
        readJson(`evals/development/${entry.source_file}`),
      );
    }
    const item = caseFiles
      .get(entry.source_file)
      .find((candidate) => candidate.case_id === entry.case_id);
    cases.set(entry.case_id, item);
  }
  return {
    promptManifest,
    stageContracts,
    stageProfiles,
    estimatorConfig,
    index,
    cases,
    syntheticProfiles: buildSyntheticProfiles(),
  };
}

export function outputSchemaForStage(foundation, stageId) {
  const contract = foundation.stageContracts.stages.find(
    (stage) => stage.stage_id === stageId,
  );
  if (!contract) throw new Error(`Unknown stage: ${stageId}`);
  const root = readJson(contract.output_schema.schema_path);
  const resolved = resolveJsonPointer(
    root,
    contract.output_schema.schema_pointer,
  );
  if (!resolved) throw new Error(`Output schema did not resolve: ${stageId}`);
  return {
    contract,
    root,
    resolved,
    sourcePath: contract.output_schema.schema_path,
    pointer: contract.output_schema.schema_pointer,
  };
}

function stageProfile(foundation, stageId) {
  const profile = foundation.stageProfiles.stages.find(
    (stage) => stage.stage_id === stageId,
  );
  if (!profile) throw new Error(`Missing stage size profile: ${stageId}`);
  return profile;
}

function promptAsset(foundation, stageId) {
  const asset = foundation.promptManifest.assets.find(
    (candidate) => candidate.asset_id === stageId,
  );
  if (!asset) throw new Error(`Missing prompt asset: ${stageId}`);
  return asset;
}

function syntheticBundle(foundation, profileName) {
  const bundle = foundation.syntheticProfiles[profileName];
  if (!bundle) throw new Error(`Unknown synthetic profile: ${profileName}`);
  return bundle;
}

function localStagePayload({
  foundation,
  stageId,
  item,
  profileName,
  repairMode,
}) {
  const bundle = syntheticBundle(foundation, profileName);
  const outputs = bundle.outputs;
  const syntheticUpstream = (artifacts) => ({
    profile: clone(bundle.metadata),
    artifacts,
  });
  const aggregate = syntheticAggregateSafetyResult();
  const policy = syntheticDecisionPolicyResult();

  if (stageId === "PB-01") {
    return {
      bounded_consultation_input: clone(item.input),
    };
  }
  if (stageId === "PB-02") {
    return {
      deterministic_safety_result: syntheticDeterministicSafetyResult(),
      synthetic_upstream: syntheticUpstream({
        structured_intake: clone(outputs["PB-01"]),
      }),
    };
  }
  if (stageId === "PB-03") {
    return {
      aggregate_safety_result: aggregate,
      synthetic_upstream: syntheticUpstream({
        structured_intake: clone(outputs["PB-01"]),
      }),
    };
  }
  if (stageId === "PB-04") {
    return {
      aggregate_safety_result: aggregate,
      application_decision_policy_result: policy,
      synthetic_upstream: syntheticUpstream({
        structured_intake: clone(outputs["PB-01"]),
        eligibility_result: clone(outputs["PB-03"]),
      }),
    };
  }
  if (stageId === "PB-05") {
    return {
      synthetic_upstream: syntheticUpstream({
        structured_intake: clone(outputs["PB-01"]),
        validated_decision_plan: clone(outputs["PB-04"]),
      }),
    };
  }
  if (stageId === "PB-06") {
    return {
      aggregate_safety_result: aggregate,
      application_decision_policy_result: policy,
      synthetic_upstream: syntheticUpstream({
        structured_intake: clone(outputs["PB-01"]),
        candidate_decision_plan: clone(outputs["PB-04"]),
        candidate_report_content: clone(outputs["PB-05"]),
      }),
    };
  }
  if (stageId === "PB-07") {
    const mode = repairMode ?? "targeted_repair";
    if (!["targeted_repair", "full_regeneration"].includes(mode)) {
      throw new Error(`Invalid repair mode: ${mode}`);
    }
    return {
      repair_mode: mode,
      mutable_json_paths: [
        "$.short_letter[0]",
        "$.decision_reason_summary",
      ],
      approved_semantic_findings: [
        {
          finding_code: "REPETITION",
          severity: "minor",
          json_path: "$.short_letter[0]",
          evidence_refs: ["policy:synthetic_profile"],
          detail: "Synthetic stress-only repair finding.",
        },
      ],
      aggregate_safety_result: aggregate,
      eligibility_result: clone(outputs["PB-03"]),
      application_decision_policy_result: policy,
      synthetic_upstream: syntheticUpstream({
        structured_intake: clone(outputs["PB-01"]),
        validated_decision_plan: clone(outputs["PB-04"]),
        candidate_report_content: clone(outputs["PB-05"]),
      }),
    };
  }
  throw new Error(`Unsupported stage: ${stageId}`);
}

export function renderStageEnvelope({
  foundation = loadFoundation(),
  stageId,
  caseId,
  profileName = "nominal",
  repairMode = null,
  scenarioId = "manual-dry-run",
  variant = "base",
  oracleUsedForRoutingOnly = false,
}) {
  const item = foundation.cases.get(caseId);
  if (!item) throw new Error(`Unknown case: ${caseId}`);
  const asset = promptAsset(foundation, stageId);
  const schema = outputSchemaForStage(foundation, stageId);
  const sizeProfile = stageProfile(foundation, stageId);
  const developerPromptPath = `${promptRoot}/${asset.relative_path}`;
  const sharedPaths = sharedAssetsByStage[stageId];
  const stagePayload = localStagePayload({
    foundation,
    stageId,
    item,
    profileName,
    repairMode,
  });
  const input = [
    {
      role: "developer",
      content: [
        {
          type: "input_text",
          name: asset.asset_id,
          text: readText(developerPromptPath),
        },
      ],
    },
    ...sharedPaths.map((relativePath) => ({
      role: "developer",
      content: [
        {
          type: "input_text",
          name: relativePath,
          text: readText(`${promptRoot}/${relativePath}`),
        },
      ],
    })),
    {
      role: "user",
      content: [
        {
          type: "input_text",
          name: "stage_input_payload",
          text: compactJson(stagePayload),
        },
      ],
    },
  ];
  return {
    envelope_contract: "moon-reply-canonical-local-request-envelope-draft-v1",
    provider_validated: false,
    live_api_request: false,
    request: {
      model: foundation.estimatorConfig.model_placeholder,
      store: false,
      tools: [],
      input,
      text: {
        format: {
          type: "json_schema",
          name: `${stageId.toLowerCase().replace("-", "_")}_output`,
          strict: true,
          schema: clone(schema.resolved),
        },
      },
      stage_configuration: {
        stage_id: stageId,
        temperature: null,
        top_p: null,
        max_output_tokens: sizeProfile.configured_output_cap_tokens,
        streaming: false,
      },
    },
    local_metadata: {
      scenario_id: scenarioId,
      case_id: caseId,
      stage_id: stageId,
      variant,
      synthetic_profile: profileName,
      synthetic_upstream_present: stageId !== "PB-01",
      repair_mode: stageId === "PB-07" ? repairMode : null,
      oracle_used_for_routing_only: oracleUsedForRoutingOnly,
      oracle_in_request_payload: false,
      actual_model_output: false,
      execution_authorized: false,
    },
  };
}

export function measureText(text) {
  return {
    utf8_bytes: Buffer.byteLength(text, "utf8"),
    unicode_code_points: [...text].length,
    characters: text.length,
    line_count: text.length === 0 ? 0 : text.split("\n").length,
  };
}

export function measureValue(value) {
  const serialized = compactJson(value);
  return {
    ...measureText(serialized),
    serialized_json_characters: serialized.length,
  };
}

function findSyntheticArtifacts(stagePayload) {
  return stagePayload.synthetic_upstream?.artifacts ?? {};
}

export function envelopeSizeBreakdown(envelope) {
  const stageId = envelope.local_metadata.stage_id;
  const caseId = envelope.local_metadata.case_id;
  const developerPart = envelope.request.input[0].content[0].text;
  const sharedParts = envelope.request.input
    .slice(1, -1)
    .map((entry) => entry.content[0].text);
  const userPayload = JSON.parse(
    envelope.request.input.at(-1).content[0].text,
  );
  const item = loadFoundation().cases.get(caseId);
  const promptParts = [developerPart, ...sharedParts];
  const promptMetrics = promptParts.map(measureText);
  const schemaSource = outputSchemaForStage(loadFoundation(), stageId);
  const schemaSerialized = compactJson(envelope.request.text.format.schema);
  return {
    stage_id: stageId,
    case_id: caseId,
    synthetic_profile: envelope.local_metadata.synthetic_profile,
    developer_prompt_bytes: Buffer.byteLength(developerPart, "utf8"),
    shared_prompt_bytes: sharedParts.reduce(
      (sum, text) => sum + Buffer.byteLength(text, "utf8"),
      0,
    ),
    static_prompt_bytes: promptMetrics.reduce(
      (sum, metrics) => sum + metrics.utf8_bytes,
      0,
    ),
    static_prompt_unicode_code_points: promptMetrics.reduce(
      (sum, metrics) => sum + metrics.unicode_code_points,
      0,
    ),
    static_prompt_line_count: promptMetrics.reduce(
      (sum, metrics) => sum + metrics.line_count,
      0,
    ),
    schema_bytes: Buffer.byteLength(schemaSerialized, "utf8"),
    schema_source_file_bytes: Buffer.byteLength(
      readText(schemaSource.sourcePath),
      "utf8",
    ),
    fixture_request_input_bytes: Buffer.byteLength(
      compactJson(item.input),
      "utf8",
    ),
    synthetic_upstream_bytes: Buffer.byteLength(
      compactJson(findSyntheticArtifacts(userPayload)),
      "utf8",
    ),
    stage_input_payload_bytes: Buffer.byteLength(
      compactJson(userPayload),
      "utf8",
    ),
    request_serialized: measureValue(envelope.request),
    full_serialized_envelope: measureValue(envelope),
  };
}

export function validateSyntheticProfiles(foundation = loadFoundation()) {
  const results = [];
  for (const [profileName, bundle] of Object.entries(
    foundation.syntheticProfiles,
  )) {
    for (const stageId of Object.keys(bundle.outputs)) {
      const schema = outputSchemaForStage(foundation, stageId);
      const errors = validateJsonSchema(
        bundle.outputs[stageId],
        schema.resolved,
        schema.root,
      );
      results.push({
        profile_name: profileName,
        stage_id: stageId,
        valid: errors.length === 0,
        errors,
      });
    }
  }
  return results;
}

function isDirectExecution() {
  return (
    typeof process.argv[1] === "string" &&
    path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
  );
}

if (isDirectExecution()) {
  const foundation = loadFoundation();
  const validation = validateSyntheticProfiles(foundation);
  if (validation.some((result) => !result.valid)) {
    for (const result of validation.filter((item) => !item.valid)) {
      console.error(
        `SYNTHETIC_PROFILE_FAIL: ${result.profile_name} ${result.stage_id} ${result.errors.join("; ")}`,
      );
    }
    process.exitCode = 1;
  } else {
    for (const stageId of [
      "PB-01",
      "PB-02",
      "PB-03",
      "PB-04",
      "PB-05",
      "PB-06",
    ]) {
      const envelope = renderStageEnvelope({
        foundation,
        stageId,
        caseId: "WAIT-003",
        profileName: "nominal",
        scenarioId: "single-case-full-pipeline",
      });
      const sizes = envelopeSizeBreakdown(envelope);
      console.log(
        `${stageId}: request_bytes=${sizes.request_serialized.utf8_bytes}; envelope_bytes=${sizes.full_serialized_envelope.utf8_bytes}`,
      );
    }
    for (const repairMode of ["targeted_repair", "full_regeneration"]) {
      const envelope = renderStageEnvelope({
        foundation,
        stageId: "PB-07",
        caseId: "WAIT-003",
        profileName: "conservative",
        repairMode,
        scenarioId: "development-70-repair-stress",
        variant: repairMode,
      });
      const sizes = envelopeSizeBreakdown(envelope);
      console.log(
        `PB-07/${repairMode}: request_bytes=${sizes.request_serialized.utf8_bytes}; envelope_bytes=${sizes.full_serialized_envelope.utf8_bytes}`,
      );
    }
    console.log("M2_DRY_RUN_RENDER_GATE: PASS");
    console.log("M2_DRY_RUN_ORACLE_ISOLATION_GATE: PASS");
    console.log("M2_SYNTHETIC_PROFILE_GATE: PASS");
    console.log(
      "No live or provider-validated API request was created. No API call was made.",
    );
  }
}
