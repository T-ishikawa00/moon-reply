import { M2RuntimeError } from "./errors.ts";
import type {
  ActionContextV1,
  ContactConstraintPolicyV1,
  DecisionPolicyResultV2,
  JsonObject,
  UserContactConstraintV1,
} from "./types.ts";

export const RUNTIME_AUTHORITY_V1_VERSION =
  "m2-p4-runtime-authority-v1" as const;

type DateTimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function invalid(): never {
  throw new M2RuntimeError("M2_RUNTIME_AUTHORITY_INVALID");
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function zonedParts(instantMs: number, timeZone: string): DateTimeParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    calendar: "iso8601",
    numberingSystem: "latn",
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const selected = new Map(
    formatter
      .formatToParts(new Date(instantMs))
      .filter(({ type }) => type !== "literal")
      .map(({ type, value }) => [type, Number(value)]),
  );
  const parts = {
    year: selected.get("year"),
    month: selected.get("month"),
    day: selected.get("day"),
    hour: selected.get("hour"),
    minute: selected.get("minute"),
    second: selected.get("second"),
  };
  if (Object.values(parts).some((value) => !Number.isInteger(value))) invalid();
  return parts as DateTimeParts;
}

function localDateTimeToInstant(
  target: DateTimeParts,
  timeZone: string,
): number {
  const targetAsUtc = Date.UTC(
    target.year,
    target.month - 1,
    target.day,
    target.hour,
    target.minute,
    target.second,
  );
  let candidate = targetAsUtc;
  for (let iteration = 0; iteration < 8; iteration += 1) {
    const observed = zonedParts(candidate, timeZone);
    const observedAsUtc = Date.UTC(
      observed.year,
      observed.month - 1,
      observed.day,
      observed.hour,
      observed.minute,
      observed.second,
    );
    const correction = targetAsUtc - observedAsUtc;
    candidate += correction;
    if (correction === 0) break;
  }
  const verified = zonedParts(candidate, timeZone);
  if (
    verified.year !== target.year ||
    verified.month !== target.month ||
    verified.day !== target.day ||
    verified.hour !== target.hour ||
    verified.minute !== target.minute ||
    verified.second !== target.second
  ) {
    invalid();
  }
  return candidate;
}

function canonicalTimeZone(timeZone: string) {
  if (typeof timeZone !== "string" || timeZone.trim() === "") invalid();
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone,
    }).resolvedOptions().timeZone;
  } catch {
    return invalid();
  }
}

export function createActionContextV1({
  trustedNowIso,
  timeZone,
}: {
  trustedNowIso: string;
  timeZone: string;
}): ActionContextV1 {
  const trustedNowMs = Date.parse(trustedNowIso);
  if (!Number.isFinite(trustedNowMs)) invalid();
  const normalizedNow = new Date(trustedNowMs).toISOString();
  const canonicalZone = canonicalTimeZone(timeZone);
  const localNow = zonedParts(trustedNowMs, canonicalZone);
  const followingDate = new Date(
    Date.UTC(localNow.year, localNow.month - 1, localNow.day + 1),
  );
  const endsAtMs = localDateTimeToInstant(
    {
      year: followingDate.getUTCFullYear(),
      month: followingDate.getUTCMonth() + 1,
      day: followingDate.getUTCDate(),
      hour: 0,
      minute: 0,
      second: 0,
    },
    canonicalZone,
  );
  if (endsAtMs <= trustedNowMs) invalid();

  return {
    schema_version: "m2-p4-action-context-v1",
    trusted_now_iso: normalizedNow,
    time_zone: canonicalZone,
    action_horizon: {
      code: "current_local_day_remaining",
      user_facing_label_ja: "今夜",
      starts_at: normalizedNow,
      ends_at: new Date(endsAtMs).toISOString(),
    },
    authority: "application",
  };
}

function readUserContactConstraint(
  baseStructuredIntake: JsonObject,
): UserContactConstraintV1 {
  const decisionFacts = baseStructuredIntake.decision_facts;
  if (!isObject(decisionFacts)) invalid();
  const value = decisionFacts.user_contact_constraint;
  if (
    !isObject(value) ||
    !Array.isArray(value.supporting_fact_ids) ||
    value.supporting_fact_ids.some((factId) => typeof factId !== "string") ||
    new Set(value.supporting_fact_ids).size !==
      value.supporting_fact_ids.length
  ) {
    invalid();
  }
  const supportingFactIds = value.supporting_fact_ids as string[];
  const legal =
    (value.kind === "none" &&
      value.status === "none" &&
      supportingFactIds.length === 0) ||
    (value.kind === "unknown" &&
      value.status === "unknown" &&
      supportingFactIds.length === 0) ||
    ((value.kind === "no_followup_message" ||
      value.kind === "business_only") &&
      value.status === "explicit" &&
      supportingFactIds.length > 0);
  if (!legal) invalid();
  return {
    kind: value.kind as UserContactConstraintV1["kind"],
    status: value.status as UserContactConstraintV1["status"],
    supporting_fact_ids: [...supportingFactIds],
  };
}

export function createContactConstraintPolicyV1({
  baseStructuredIntake,
  followUpException,
}: {
  baseStructuredIntake: JsonObject;
  followUpException: DecisionPolicyResultV2["follow_up_exception"];
}): ContactConstraintPolicyV1 {
  const constraint = readUserContactConstraint(baseStructuredIntake);
  const exceptionPresent = followUpException !== "none";
  const noFollowup =
    constraint.kind === "no_followup_message" &&
    constraint.status === "explicit";
  const unknown =
    constraint.kind === "unknown" && constraint.status === "unknown";

  return {
    schema_version: "m2-p4-contact-constraint-policy-v1",
    constraint_kind: constraint.kind,
    constraint_status: constraint.status,
    supporting_fact_ids: [...constraint.supporting_fact_ids],
    follow_up_exception: followUpException,
    outbound_contact_now_allowed: noFollowup
      ? exceptionPresent
      : !unknown,
    outbound_contact_after_time_passage_allowed: !noFollowup && !unknown,
    exception_required_for_future_contact: noFollowup || unknown,
  };
}
