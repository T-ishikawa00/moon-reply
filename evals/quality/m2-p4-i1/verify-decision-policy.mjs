import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { selectDecisionPolicy } from "./decision-policy-v2.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "../../..");
const schemaPath = path.join(scriptDirectory, "decision-facts.schema.json");
const fixturesPath = path.join(
  scriptDirectory,
  "decision-facts-fixtures-v1.json",
);
const policyPath = path.join(scriptDirectory, "decision-policy-v2.mjs");
const verifierPath = fileURLToPath(import.meta.url);

const decisions = [
  "reply_now",
  "send_now",
  "wait_and_reassess",
  "pause_additional_contact",
];
const relationshipStages = [
  "dating",
  "in_relationship",
  "ambiguous",
  "former_partner",
  "matching_app",
  "friend",
  "work_or_school",
  "other",
  "unknown",
];
const selectedRequests = [
  "decide_send_or_wait",
  "message_impact",
  "draft_message",
  "relationship",
  "next_three_days",
  "organize_emotions",
];
const messageSenders = ["user", "other_person", "none", "unknown"];
const messageKinds = [
  "question",
  "schedule_coordination",
  "apology",
  "thanks_or_followup",
  "practical_information",
  "invitation",
  "closure_or_boundary",
  "social_acknowledgement",
  "other",
  "none",
  "unknown",
];
const responseExpectations = ["reasonable", "optional", "none", "unknown"];
const userReplyStates = [
  "not_replied",
  "replied",
  "not_applicable",
  "unknown",
];
const cadenceRelations = [
  "within_usual",
  "beyond_usual",
  "unknown",
  "not_applicable",
];
const boundaryKinds = [
  "none",
  "no_contact",
  "temporary_distance",
  "blocked_or_restricted",
  "relationship_closed",
  "unknown",
];
const boundaryStatuses = ["none", "explicit", "unknown"];
const practicalReasonKinds = [
  "none",
  "schedule_coordination",
  "factual_correction",
  "promised_information",
  "logistics",
  "thank_you",
  "initial_apology",
  "single_invitation",
  "unknown",
];
const deadlines = ["none", "same_day", "next_day", "later", "unknown"];
const followUpExceptions = [
  "none",
  "material_factual_correction",
  "same_day_schedule_change",
  "next_day_schedule_change",
  "promised_required_information",
  "safety_necessary_contact",
];
const reasonCodeByDecision = {
  reply_now: "unanswered_meaningful_message",
  send_now: "clear_low_pressure_reason",
  wait_and_reassess: "waiting_preferred",
  pause_additional_contact: null,
};
const developmentSpecs = [
  {
    sourceFile: "evals/development/reply-now.json",
    prefix: "REPLY",
    decision: "reply_now",
  },
  {
    sourceFile: "evals/development/send-now.json",
    prefix: "SEND",
    decision: "send_now",
  },
  {
    sourceFile: "evals/development/wait-and-reassess.json",
    prefix: "WAIT",
    decision: "wait_and_reassess",
  },
  {
    sourceFile: "evals/development/pause-additional-contact.json",
    prefix: "PAUSE",
    decision: "pause_additional_contact",
  },
];

const failures = [];
let allowedSetViolations = 0;
let forbiddenDecisions = 0;
let caseSpecificMatching = 0;
const categoryPasses = new Map(decisions.map((decision) => [decision, 0]));

function fail(caseId, invariant) {
  failures.push({ caseId, invariant });
}

function parseJson(filePath, invariant) {
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch {
    fail("-", invariant);
    return undefined;
  }
}

function sameValues(actual, expected) {
  if (!Array.isArray(actual) || actual.length !== expected.length) return false;
  const actualSorted = [...actual].sort();
  const expectedSorted = [...expected].sort();
  return actualSorted.every(
    (value, index) => value === expectedSorted[index],
  );
}

function hasExactKeys(value, expectedKeys) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  return sameValues(Object.keys(value), expectedKeys);
}

function isUniqueEnumArray(value, allowed) {
  return (
    Array.isArray(value) &&
    new Set(value).size === value.length &&
    value.every((item) => allowed.indexOf(item) >= 0)
  );
}

function isIntegerOrNull(value, minimum, maximum = Number.POSITIVE_INFINITY) {
  return (
    value === null ||
    (Number.isInteger(value) && value >= minimum && value <= maximum)
  );
}

function validateSchemaContract(schema, schemaSource) {
  if (!schema) return;
  if (
    schema.$schema !== "https://json-schema.org/draft/2020-12/schema" ||
    schema.type !== "object" ||
    schema.additionalProperties !== false ||
    !sameValues(schema.required, [
      "schema_version",
      "relationship_stage",
      "selected_requests",
      "latest_direct_message",
      "contact_state",
      "boundary_state",
      "practical_reason",
      "information_state",
    ]) ||
    schema.properties?.schema_version?.const !==
      "m2-p4-decision-facts-v1"
  ) {
    fail("-", "schema_root_contract");
  }

  const expectedEnums = [
    [schema.properties?.relationship_stage?.enum, relationshipStages],
    [schema.properties?.selected_requests?.items?.enum, selectedRequests],
    [
      schema.properties?.latest_direct_message?.properties?.sender?.enum,
      messageSenders,
    ],
    [
      schema.properties?.latest_direct_message?.properties?.kind?.enum,
      messageKinds,
    ],
    [
      schema.properties?.latest_direct_message?.properties
        ?.response_expectation?.enum,
      responseExpectations,
    ],
    [
      schema.properties?.latest_direct_message?.properties?.user_reply_state
        ?.enum,
      userReplyStates,
    ],
    [
      schema.properties?.contact_state?.properties?.usual_cadence_relation
        ?.enum,
      cadenceRelations,
    ],
    [
      schema.properties?.boundary_state?.properties?.kind?.enum,
      boundaryKinds,
    ],
    [
      schema.properties?.boundary_state?.properties?.status?.enum,
      boundaryStatuses,
    ],
    [
      schema.properties?.practical_reason?.properties?.kind?.enum,
      practicalReasonKinds,
    ],
    [
      schema.properties?.practical_reason?.properties?.deadline?.enum,
      deadlines,
    ],
  ];
  if (
    expectedEnums.some(([actual, expected]) => !sameValues(actual, expected)) ||
    schema.properties?.selected_requests?.uniqueItems !== true
  ) {
    fail("-", "schema_enum_contract");
  }

  const expectedObjectRequirements = new Map([
    [
      schema,
      [
        "schema_version",
        "relationship_stage",
        "selected_requests",
        "latest_direct_message",
        "contact_state",
        "boundary_state",
        "practical_reason",
        "information_state",
      ],
    ],
    [
      schema.properties?.latest_direct_message,
      [
        "sender",
        "kind",
        "response_expectation",
        "user_reply_state",
        "sns_signal_only",
      ],
    ],
    [
      schema.properties?.contact_state,
      [
        "unanswered_user_message_count",
        "elapsed_since_latest_user_message_minutes",
        "usual_cadence_relation",
        "proposed_message_present",
      ],
    ],
    [
      schema.properties?.boundary_state,
      ["kind", "status", "repeated_unanswered_contact"],
    ],
    [
      schema.properties?.practical_reason,
      ["kind", "active", "deadline"],
    ],
    [schema.properties?.information_state, ["complete_for_decision"]],
  ]);
  for (const [objectSchema, required] of expectedObjectRequirements) {
    if (
      objectSchema?.type !== "object" ||
      objectSchema.additionalProperties !== false ||
      !sameValues(objectSchema.required, required)
    ) {
      fail("-", "schema_strict_object_contract");
      break;
    }
  }

  const unansweredCount =
    schema.properties?.contact_state?.properties
      ?.unanswered_user_message_count?.oneOf?.[0];
  const elapsed =
    schema.properties?.contact_state?.properties
      ?.elapsed_since_latest_user_message_minutes?.oneOf?.[0];
  if (
    unansweredCount?.type !== "integer" ||
    unansweredCount.minimum !== 0 ||
    unansweredCount.maximum !== 20 ||
    elapsed?.type !== "integer" ||
    elapsed.minimum !== 0 ||
    schema.properties?.information_state?.properties?.complete_for_decision
      ?.const !== true
  ) {
    fail("-", "schema_numeric_and_const_contract");
  }

  const prohibitedProperties = [
    "\"confidence\"",
    "\"probability\"",
    "\"romantic_interest\"",
    "\"romantic-interest\"",
  ];
  if (prohibitedProperties.some((value) => schemaSource.indexOf(value) >= 0)) {
    fail("-", "schema_prohibited_scoring_fields");
  }
}

function validateFacts(facts, caseId) {
  const rootKeys = [
    "schema_version",
    "relationship_stage",
    "selected_requests",
    "latest_direct_message",
    "contact_state",
    "boundary_state",
    "practical_reason",
    "information_state",
  ];
  if (!hasExactKeys(facts, rootKeys)) {
    fail(caseId, "facts_root_shape");
    return false;
  }

  let valid = true;
  const check = (condition, invariant) => {
    if (!condition) {
      valid = false;
      fail(caseId, invariant);
    }
  };

  check(
    facts.schema_version === "m2-p4-decision-facts-v1",
    "facts_schema_version",
  );
  check(
    relationshipStages.indexOf(facts.relationship_stage) >= 0,
    "facts_relationship_stage",
  );
  check(
    isUniqueEnumArray(facts.selected_requests, selectedRequests),
    "facts_selected_requests",
  );

  const message = facts.latest_direct_message;
  check(
    hasExactKeys(message, [
      "sender",
      "kind",
      "response_expectation",
      "user_reply_state",
      "sns_signal_only",
    ]),
    "facts_latest_direct_message_shape",
  );
  if (message && typeof message === "object") {
    check(messageSenders.indexOf(message.sender) >= 0, "facts_message_sender");
    check(messageKinds.indexOf(message.kind) >= 0, "facts_message_kind");
    check(
      responseExpectations.indexOf(message.response_expectation) >= 0,
      "facts_response_expectation",
    );
    check(
      userReplyStates.indexOf(message.user_reply_state) >= 0,
      "facts_user_reply_state",
    );
    check(
      typeof message.sns_signal_only === "boolean",
      "facts_sns_signal_only",
    );
  }

  const contact = facts.contact_state;
  check(
    hasExactKeys(contact, [
      "unanswered_user_message_count",
      "elapsed_since_latest_user_message_minutes",
      "usual_cadence_relation",
      "proposed_message_present",
    ]),
    "facts_contact_state_shape",
  );
  if (contact && typeof contact === "object") {
    check(
      isIntegerOrNull(contact.unanswered_user_message_count, 0, 20),
      "facts_unanswered_count",
    );
    check(
      isIntegerOrNull(contact.elapsed_since_latest_user_message_minutes, 0),
      "facts_elapsed_minutes",
    );
    check(
      cadenceRelations.indexOf(contact.usual_cadence_relation) >= 0,
      "facts_cadence_relation",
    );
    check(
      typeof contact.proposed_message_present === "boolean",
      "facts_proposed_message",
    );
  }

  const boundary = facts.boundary_state;
  check(
    hasExactKeys(boundary, [
      "kind",
      "status",
      "repeated_unanswered_contact",
    ]),
    "facts_boundary_state_shape",
  );
  if (boundary && typeof boundary === "object") {
    check(
      boundaryKinds.indexOf(boundary.kind) >= 0,
      "facts_boundary_kind",
    );
    check(
      boundaryStatuses.indexOf(boundary.status) >= 0,
      "facts_boundary_status",
    );
    check(
      typeof boundary.repeated_unanswered_contact === "boolean",
      "facts_repeated_contact",
    );
    check(
      boundary.status !== "explicit" ||
        (boundary.kind !== "none" && boundary.kind !== "unknown"),
      "facts_explicit_boundary_kind",
    );
    check(
      boundary.status !== "none" || boundary.kind === "none",
      "facts_nonboundary_kind",
    );
  }

  const practical = facts.practical_reason;
  check(
    hasExactKeys(practical, ["kind", "active", "deadline"]),
    "facts_practical_reason_shape",
  );
  if (practical && typeof practical === "object") {
    check(
      practicalReasonKinds.indexOf(practical.kind) >= 0,
      "facts_practical_kind",
    );
    check(typeof practical.active === "boolean", "facts_practical_active");
    check(deadlines.indexOf(practical.deadline) >= 0, "facts_deadline");
    check(
      practical.active
        ? practical.kind !== "none" && practical.kind !== "unknown"
        : practical.kind === "none" && practical.deadline === "none",
      "facts_practical_consistency",
    );
  }

  check(
    hasExactKeys(facts.information_state, ["complete_for_decision"]),
    "facts_information_state_shape",
  );
  check(
    facts.information_state?.complete_for_decision === true,
    "facts_complete_for_decision",
  );
  return valid;
}

function expectedFollowUpException(facts) {
  const practical = facts.practical_reason;
  if (!practical.active) return "none";
  if (practical.kind === "factual_correction") {
    return "material_factual_correction";
  }
  if (practical.kind === "promised_information") {
    return "promised_required_information";
  }
  if (
    practical.kind === "schedule_coordination" &&
    practical.deadline === "same_day"
  ) {
    return "same_day_schedule_change";
  }
  if (
    practical.kind === "schedule_coordination" &&
    practical.deadline === "next_day"
  ) {
    return "next_day_schedule_change";
  }
  return "none";
}

function expectedPauseState(facts) {
  const boundary = facts.boundary_state;
  const explicit =
    boundary.status === "explicit" &&
    boundary.kind !== "none" &&
    boundary.kind !== "unknown";
  if (explicit) {
    return {
      pauseReasonCode: boundary.kind,
      resumePolicy:
        boundary.kind === "temporary_distance"
          ? "other_initiated_only"
          : "explicit_permission_required",
      reasonCode: "explicit_boundary",
    };
  }
  if (boundary.repeated_unanswered_contact) {
    return {
      pauseReasonCode: "repeated_unanswered_contact",
      resumePolicy: "other_initiated_only",
      reasonCode: "repeated_unanswered_contact",
    };
  }
  return {
    pauseReasonCode: null,
    resumePolicy: null,
    reasonCode: null,
  };
}

function validatePolicyResult(result, entry) {
  const caseId = entry.case_id;
  const resultKeys = [
    "schema_version",
    "policy_version",
    "allowed_decisions",
    "disallowed_decisions",
    "follow_up_exception",
    "message_draft_policy",
    "later_draft_mode",
    "pause_reason_code",
    "resume_policy",
    "reason_codes",
  ];
  if (!hasExactKeys(result, resultKeys)) {
    fail(caseId, "policy_result_shape");
    allowedSetViolations += 1;
    return;
  }

  if (
    result.schema_version !== "m2-p4-decision-policy-result-v1" ||
    result.policy_version !== "decision-policy-v2.0.0"
  ) {
    fail(caseId, "policy_result_version");
  }

  const allowedValid =
    Array.isArray(result.allowed_decisions) &&
    result.allowed_decisions.length === 1 &&
    decisions.indexOf(result.allowed_decisions[0]) >= 0;
  if (!allowedValid) {
    fail(caseId, "allowed_decisions_singleton");
    allowedSetViolations += 1;
    return;
  }

  const selected = result.allowed_decisions[0];
  if (selected !== entry.expected_decision) {
    fail(caseId, "exact_decision");
    forbiddenDecisions += 1;
  } else {
    categoryPasses.set(selected, categoryPasses.get(selected) + 1);
  }

  const disallowedValid =
    Array.isArray(result.disallowed_decisions) &&
    result.disallowed_decisions.length === 3 &&
    result.disallowed_decisions.every(
      (item) =>
        hasExactKeys(item, ["decision", "reason_codes"]) &&
        decisions.indexOf(item.decision) >= 0 &&
        item.decision !== selected &&
        Array.isArray(item.reason_codes) &&
        item.reason_codes.length > 0 &&
        new Set(item.reason_codes).size === item.reason_codes.length &&
        item.reason_codes.every(
          (reasonCode) =>
            typeof reasonCode === "string" && reasonCode.length > 0,
        ),
    ) &&
    new Set(result.disallowed_decisions.map((item) => item.decision)).size ===
      3 &&
    decisions
      .filter((decision) => decision !== selected)
      .every((decision) =>
        result.disallowed_decisions.some(
          (item) => item.decision === decision,
        ),
      );
  if (!disallowedValid) {
    fail(caseId, "disallowed_decisions_remaining_three");
    forbiddenDecisions += 1;
  }
  if (
    result.disallowed_decisions.some(
      (item) => item.decision === entry.expected_decision,
    )
  ) {
    fail(caseId, "expected_decision_disallowed");
    forbiddenDecisions += 1;
  }

  const expectedDraftPolicy =
    selected === "pause_additional_contact"
      ? "not_allowed"
      : selected === "wait_and_reassess"
        ? "later_only"
        : "required_now";
  const expectedLaterMode =
    selected === "wait_and_reassess"
      ? entry.facts.contact_state.proposed_message_present
        ? "defer_until_reassessment"
        : "candidate_can_be_prepared"
      : null;
  if (
    result.message_draft_policy !== expectedDraftPolicy ||
    result.later_draft_mode !== expectedLaterMode
  ) {
    fail(caseId, "message_draft_policy_consistency");
  }

  const pauseState = expectedPauseState(entry.facts);
  if (
    selected === "pause_additional_contact"
      ? result.pause_reason_code !== pauseState.pauseReasonCode ||
        result.resume_policy !== pauseState.resumePolicy
      : result.pause_reason_code !== null || result.resume_policy !== null
  ) {
    fail(caseId, "pause_reason_resume_consistency");
  }

  if (
    followUpExceptions.indexOf(result.follow_up_exception) < 0 ||
    result.follow_up_exception !==
      (selected === "send_now"
        ? expectedFollowUpException(entry.facts)
        : "none")
  ) {
    fail(caseId, "follow_up_exception_consistency");
  }

  const expectedReasonCode =
    selected === "pause_additional_contact"
      ? pauseState.reasonCode
      : reasonCodeByDecision[selected];
  if (
    !Array.isArray(result.reason_codes) ||
    result.reason_codes.length !== 1 ||
    result.reason_codes[0] !== expectedReasonCode ||
    !result.disallowed_decisions.every(
      (item) =>
        item.reason_codes.length === 1 &&
        item.reason_codes[0] === expectedReasonCode,
    )
  ) {
    fail(caseId, "reason_code_consistency");
  }
}

const schemaSource = readFileSync(schemaPath, "utf8");
const policySource = readFileSync(policyPath, "utf8");
const verifierSource = readFileSync(verifierPath, "utf8");
const schema = parseJson(schemaPath, "schema_json_parse");
const fixtures = parseJson(fixturesPath, "fixtures_json_parse");

validateSchemaContract(schema, schemaSource);

const developmentCases = [];
for (const spec of developmentSpecs) {
  const sourcePath = path.join(
    repositoryRoot,
    ...spec.sourceFile.split("/"),
  );
  const entries = parseJson(sourcePath, "development_json_parse");
  if (!Array.isArray(entries)) {
    fail("-", "development_case_array");
    continue;
  }
  const expectedIds = Array.from(
    { length: 10 },
    (_, index) => `${spec.prefix}-${String(index + 1).padStart(3, "0")}`,
  );
  if (
    !entries.every(
      (entry, index) =>
        entry.case_id === expectedIds[index] &&
        entry.oracle?.primary_decision === spec.decision,
    )
  ) {
    fail("-", "development_stable_order_and_oracle");
  }
  for (const entry of entries) {
    developmentCases.push({
      ...entry,
      sourceFile: spec.sourceFile,
    });
  }
}

if (!Array.isArray(fixtures)) {
  fail("-", "fixtures_array");
} else {
  if (fixtures.length !== 40) fail("-", "fixtures_total_40");
  if (new Set(fixtures.map((entry) => entry.case_id)).size !== 40) {
    fail("-", "fixture_ids_unique_40");
  }

  const expectedStableIds = developmentCases.map((entry) => entry.case_id);
  const fixtureIds = fixtures.map((entry) => entry.case_id);
  if (
    expectedStableIds.length !== fixtureIds.length ||
    !expectedStableIds.every((caseId, index) => caseId === fixtureIds[index])
  ) {
    fail("-", "fixture_development_id_stable_order");
  }

  for (const spec of developmentSpecs) {
    const count = fixtures.filter(
      (entry) =>
        typeof entry.case_id === "string" &&
        entry.case_id.startsWith(`${spec.prefix}-`),
    ).length;
    if (count !== 10) fail("-", `fixture_category_${spec.prefix}_10`);
  }

  const developmentById = new Map(
    developmentCases.map((entry) => [entry.case_id, entry]),
  );
  for (const entry of fixtures) {
    const caseId =
      typeof entry?.case_id === "string" ? entry.case_id : "-";
    if (
      !hasExactKeys(entry, [
        "case_id",
        "source_file",
        "expected_decision",
        "facts",
      ])
    ) {
      fail(caseId, "fixture_entry_shape");
      continue;
    }
    const source = developmentById.get(caseId);
    if (!source) {
      fail(caseId, "fixture_id_in_development");
      continue;
    }
    if (entry.source_file !== source.sourceFile) {
      fail(caseId, "fixture_source_file");
    }
    if (entry.expected_decision !== source.oracle?.primary_decision) {
      fail(caseId, "fixture_expected_decision_oracle");
    }
    if (validateFacts(entry.facts, caseId)) {
      const policyResult = selectDecisionPolicy(entry.facts);
      validatePolicyResult(policyResult, entry);
    }
  }

  const staticForbiddenMarkers = [
    "currentSituation",
    "current_situation",
    "case_id",
    "caseId",
    "reference_draft",
    "oracle",
    "RegExp",
    "String.match",
    "String.includes",
    ".match(",
    ".includes(",
    "/",
  ];
  const fixtureIdentityValues = developmentCases.flatMap((entry) => [
    entry.case_id,
    entry.title,
    entry.input?.current_situation,
    entry.message_draft_constraints?.reference_draft,
  ]);
  for (const marker of [...staticForbiddenMarkers, ...fixtureIdentityValues]) {
    if (
      typeof marker === "string" &&
      marker.length > 0 &&
      policySource.indexOf(marker) >= 0
    ) {
      caseSpecificMatching += 1;
    }
  }
  for (const character of policySource) {
    const code = character.codePointAt(0);
    if (
      (code >= 0x3040 && code <= 0x30ff) ||
      (code >= 0x3400 && code <= 0x9fff)
    ) {
      caseSpecificMatching += 1;
      break;
    }
  }
  if (caseSpecificMatching > 0) {
    fail("-", "policy_case_specific_matching");
  }
}

const importSpecifiers = [
  ...verifierSource.matchAll(/\bfrom\s+"([^"]+)"/gu),
].map((match) => match[1]);
const permittedImports = new Set([
  "node:fs",
  "node:path",
  "node:url",
  "./decision-policy-v2.mjs",
]);
const environmentAccessToken = ["process", "env"].join(".");
const networkCallToken = ["fetch", "("].join("");
if (
  importSpecifiers.some((specifier) => !permittedImports.has(specifier)) ||
  policySource.indexOf("import ") >= 0 ||
  policySource.indexOf(environmentAccessToken) >= 0 ||
  policySource.indexOf(networkCallToken) >= 0
) {
  fail("-", "network_db_env_or_package_access");
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`FAIL | ${failure.caseId} | ${failure.invariant}`);
  }
  process.exitCode = 1;
} else {
  console.log("M2_P4_I1_TYPED_POLICY: PASS");
  console.log("total: 40/40");
  console.log(`reply_now: ${categoryPasses.get("reply_now")}/10`);
  console.log(`send_now: ${categoryPasses.get("send_now")}/10`);
  console.log(
    `wait_and_reassess: ${categoryPasses.get("wait_and_reassess")}/10`,
  );
  console.log(
    `pause_additional_contact: ${categoryPasses.get(
      "pause_additional_contact",
    )}/10`,
  );
  console.log(`allowed_set_violations: ${allowedSetViolations}`);
  console.log(`forbidden_decisions: ${forbiddenDecisions}`);
  console.log(`case_specific_matching: ${caseSpecificMatching}`);
  console.log("openai_calls: 0");
  console.log("db_operations: 0");
  console.log("holdout_use: 0");
}
