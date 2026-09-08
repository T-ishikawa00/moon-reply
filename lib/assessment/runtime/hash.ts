import { createHash } from "node:crypto";
import type { JsonValue } from "./types.ts";

export function canonicalizeJson(value: JsonValue): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalizeJson).join(",")}]`;
  }
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalizeJson(value[key])}`)
    .join(",")}}`;
}

export function hashJson(value: JsonValue) {
  return createHash("sha256")
    .update(Buffer.from(canonicalizeJson(value), "utf8"))
    .digest("hex");
}
