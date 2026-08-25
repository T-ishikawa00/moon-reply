import "server-only";

import { M2RuntimeError } from "../assessment/runtime/errors";
import type { CustomerAccountHistoryItem } from "./types";

export const CUSTOMER_ACCOUNT_TIME_ZONE = "Asia/Tokyo";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const timestampPattern =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,6}))?(?:Z|([+-])(\d{2}):(\d{2}))$/u;

function accountHistoryFailure(): never {
  throw new M2RuntimeError("CUSTOMER_AUTH_DATABASE_OPERATION_FAILED", 503);
}

function record(value: unknown) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    accountHistoryFailure();
  }
  return value as Record<string, unknown>;
}

function uuid(value: unknown) {
  if (typeof value !== "string" || !uuidPattern.test(value)) {
    accountHistoryFailure();
  }
  return value;
}

function nullableUuid(value: unknown) {
  return value === null ? null : uuid(value);
}

function timestamp(value: unknown) {
  if (typeof value !== "string") accountHistoryFailure();
  const match = timestampPattern.exec(value);
  if (!match) accountHistoryFailure();
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);
  const offsetHour = Number(match[9] ?? "0");
  const offsetMinute = Number(match[10] ?? "0");
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > daysInMonth ||
    hour > 23 ||
    minute > 59 ||
    second > 59 ||
    offsetHour > 23 ||
    offsetMinute > 59 ||
    !Number.isFinite(Date.parse(value))
  ) {
    accountHistoryFailure();
  }
  return value;
}

export function decodeCustomerAccountHistoryRow(
  value: unknown,
): CustomerAccountHistoryItem {
  const row = record(value);
  const purchaseIntentId = uuid(row.purchase_intent_id);
  const deliveryId = nullableUuid(row.delivery_id);
  const date = timestamp(row.created_at);
  const state = row.state;
  if (state !== "processing" && state !== "completed") {
    accountHistoryFailure();
  }
  if (
    (state === "processing" && deliveryId !== null) ||
    (state === "completed" && deliveryId === null)
  ) {
    accountHistoryFailure();
  }
  return { purchaseIntentId, deliveryId, date, state };
}

function part(
  parts: Intl.DateTimeFormatPart[],
  type: "month" | "day" | "hour" | "minute",
) {
  const value = parts.find((candidate) => candidate.type === type)?.value;
  if (!value) accountHistoryFailure();
  return value;
}

export function formatCustomerAccountTimestampJst(value: string) {
  timestamp(value);
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: CUSTOMER_ACCOUNT_TIME_ZONE,
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  return `${part(parts, "month")}月${part(parts, "day")}日 ${part(parts, "hour")}:${part(parts, "minute")}`;
}

export type CustomerAccountHistoryPresentation = Readonly<{
  purchaseIntentId: string;
  deliveryId: string | null;
  date: string;
  title: string;
  dateTimeLabel: string;
  statusLabel: "処理中" | "完了" | "確認中";
  summary: string;
  canOpenResult: boolean;
}>;

export function presentCustomerAccountHistoryItem(
  item: CustomerAccountHistoryItem,
): CustomerAccountHistoryPresentation {
  const shortDateTime = formatCustomerAccountTimestampJst(item.date);
  if (item.state === "completed" && item.deliveryId !== null) {
    return {
      ...item,
      title: `${shortDateTime}の鑑定ノート`,
      dateTimeLabel: `${shortDateTime}（日本時間）`,
      statusLabel: "完了",
      summary: "鑑定ノートを確認できます。",
      canOpenResult: true,
    };
  }
  if (item.state === "completed") {
    return {
      ...item,
      title: `${shortDateTime}の鑑定ノート`,
      dateTimeLabel: `${shortDateTime}（日本時間）`,
      statusLabel: "確認中",
      summary: "現在、鑑定ノートの状態を確認しています。",
      canOpenResult: false,
    };
  }
  return {
    ...item,
    title: `${shortDateTime}の鑑定ノート`,
    dateTimeLabel: `${shortDateTime}（日本時間）`,
    statusLabel: "処理中",
    summary: "鑑定ノートを準備しています。",
    canOpenResult: false,
  };
}

export function presentCustomerAccountHistory(
  items: readonly CustomerAccountHistoryItem[],
) {
  return [...items]
    .sort((left, right) => {
      const timeDifference = Date.parse(right.date) - Date.parse(left.date);
      if (timeDifference !== 0) return timeDifference;
      return left.purchaseIntentId < right.purchaseIntentId
        ? -1
        : left.purchaseIntentId > right.purchaseIntentId
          ? 1
          : 0;
    })
    .map(presentCustomerAccountHistoryItem);
}
