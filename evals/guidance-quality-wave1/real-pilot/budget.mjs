// Evaluation-only append-only reservation journal. No runtime/DB imports.
import { openSync, closeSync, writeSync, fsyncSync, readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";

export class PilotStop extends Error {
  constructor(code) { super(code); this.name = "PilotStop"; this.safeCode = code; }
}
export const hash = value => createHash("sha256").update(typeof value === "string" ? value : JSON.stringify(value)).digest("hex");
export const USD_NANOS = 1_000_000_000;
export const reserveNanos = cap => cap.input * 250 + cap.outputIncludingReasoning * 1200;
const integer = n => Number.isSafeInteger(n) && n >= 0;

export function accountUsage(usage, cap, inputCeiling = cap.input) {
  const input = usage?.input_tokens, output = usage?.output_tokens;
  const cached = usage?.input_tokens_details?.cached_tokens;
  const writes = usage?.input_tokens_details?.cache_write_tokens;
  const reasoning = usage?.output_tokens_details?.reasoning_tokens;
  if (![input, output, cached, reasoning, usage?.total_tokens].every(integer) ||
      (writes !== undefined && !integer(writes)) || input + output !== usage.total_tokens ||
      cached + (writes ?? 0) > input || reasoning > output || input > cap.input || input > inputCeiling || output > cap.outputIncludingReasoning)
    throw new PilotStop("BUDGET_USAGE_INCONSISTENT");
  const uncached = input - cached - (writes ?? 0);
  // Older responses may omit cache_write_tokens. Keep the uncertainty explicit;
  // never represent the lower estimate as an invoice-confirmed charge.
  const lowerNanos = uncached * 200 + cached * 20 + (writes ?? 0) * 250 + output * 1200;
  const upperNanos = writes === undefined ? (input - cached) * 250 + cached * 20 + output * 1200 : lowerNanos;
  if (upperNanos > reserveNanos(cap)) throw new PilotStop("BUDGET_USAGE_EXCEEDS_RESERVATION");
  return { inputTokens: input, outputTokens: output, cachedTokens: cached, cacheWriteTokens: writes ?? null, reasoningTokens: reasoning, lowerNanos, upperNanos, pricingComplete: writes !== undefined };
}

export class ReservationLedger {
  constructor(file, manifest, { create = false, io = { openSync, closeSync, writeSync, fsyncSync } } = {}) {
    this.file = file; this.manifest = manifest;
    this.io = io; this.poisoned = false;
    if (create) { const fd = openSync(file, "wx"); closeSync(fd); }
    if (!existsSync(file)) throw new PilotStop("BUDGET_LEDGER_MISSING");
    this.events = []; this.sessions = new Map(); this.calls = []; this.reservedNanos = 0; this.stopReason = null;
    const text = readFileSync(file, "utf8");
    if (text && !text.endsWith("\n")) throw new PilotStop("BUDGET_LEDGER_TRUNCATED");
    for (const line of text.split("\n").filter(Boolean)) {
      let event; try { event = JSON.parse(line); } catch { throw new PilotStop("BUDGET_LEDGER_CORRUPT"); }
      this.apply(event);
    }
    if (create) this.append({ kind: "init", manifestHash: hash(manifest) });
    if (this.events[0]?.manifestHash !== hash(manifest)) throw new PilotStop("BUDGET_MANIFEST_MISMATCH");
  }
  apply(event) {
    const { checksum, ...body } = event;
    if (event.sequence !== this.events.length + 1 || event.previousHash !== (this.events.at(-1)?.checksum ?? null) || hash(body) !== checksum)
      throw new PilotStop("BUDGET_LEDGER_CORRUPT");
    if (event.kind === "start") {
      if (this.stopReason || this.sessions.has(event.sessionId) || !this.manifest.sessions.some(s => s.sessionId === event.sessionId) || [...this.sessions.values()].some(s => s.status === "started")) throw new PilotStop("BUDGET_SESSION_CONFLICT");
      this.sessions.set(event.sessionId, { status: "started" });
    } else if (event.kind === "reserve") {
      const cap = this.manifest.caps.find(c => c.stage === event.stageId);
      const count = this.calls.filter(c => c.sessionId === event.sessionId && c.stageId === event.stageId).length;
      if (this.stopReason || this.sessions.get(event.sessionId)?.status !== "started" || !cap || cap.invocationsPerSession === 0 ||
          ![1, 2].includes(event.attempt) || event.attempt !== count + 1 || count >= cap.invocationsPerSession ||
          this.calls.length >= this.manifest.maxHttpAttempts || event.reservedNanos !== reserveNanos(cap) ||
          !integer(event.inputCeiling) || event.inputCeiling > cap.input || this.calls.some(c => c.status === "reserved") ||
          this.reservedNanos + event.reservedNanos > this.manifest.budgetNanos) throw new PilotStop("BUDGET_RESERVATION_REJECTED");
      this.calls.push({ ...event, status: "reserved" }); this.reservedNanos += event.reservedNanos;
    } else if (event.kind === "dispatch") {
      const call = this.calls.find(c => c.sequence === event.reservationSequence);
      if (!call || call.status !== "reserved" || call.dispatched) throw new PilotStop("BUDGET_DISPATCH_CONFLICT");
      call.dispatched = true;
    } else if (event.kind === "settle") {
      const call = this.calls.find(c => c.sequence === event.reservationSequence);
      if (!call || call.status !== "reserved") throw new PilotStop("BUDGET_SETTLEMENT_CONFLICT");
      if (event.accounting && (!integer(event.accounting.lowerNanos) || !integer(event.accounting.upperNanos) || event.accounting.lowerNanos > event.accounting.upperNanos || event.accounting.upperNanos > call.reservedNanos)) throw new PilotStop("BUDGET_USAGE_INCONSISTENT");
      Object.assign(call, { status: event.status, accounting: event.accounting, requestId: event.requestId, stopReason: event.stopReason });
    } else if (event.kind === "finish") {
      if (this.sessions.get(event.sessionId)?.status !== "started" || this.calls.some(c => c.sessionId === event.sessionId && c.status === "reserved")) throw new PilotStop("BUDGET_SESSION_CONFLICT");
      this.sessions.set(event.sessionId, { status: event.status });
    } else if (event.kind === "stop") this.stopReason ??= event.reason;
    else if (event.kind !== "init" || this.events.length !== 0) throw new PilotStop("BUDGET_LEDGER_CORRUPT");
    this.events.push(event);
  }
  append(payload) {
    if (this.poisoned) throw new PilotStop("BUDGET_LEDGER_IO_FAILURE");
    const body = { ...payload, sequence: this.events.length + 1, previousHash: this.events.at(-1)?.checksum ?? null, recordedAt: new Date().toISOString() };
    const event = { ...body, checksum: hash(body) };
    this.apply(event); // All guards run before a reservation is persisted or sent.
    let fd;
    try {
      fd = this.io.openSync(this.file, "a");
      const bytes = Buffer.from(JSON.stringify(event) + "\n", "utf8");
      for (let offset = 0; offset < bytes.length;) {
        const written = this.io.writeSync(fd, bytes, offset, bytes.length - offset);
        if (!Number.isSafeInteger(written) || written <= 0 || written > bytes.length - offset) throw new Error("short write");
        offset += written;
      }
      this.io.fsyncSync(fd);
      this.io.closeSync(fd); fd = undefined;
    } catch {
      this.poisoned = true; this.stopReason = "BUDGET_LEDGER_IO_FAILURE";
      if (fd !== undefined) { try { this.io.closeSync(fd); } catch { /* permanently poisoned */ } }
      throw new PilotStop("BUDGET_LEDGER_IO_FAILURE");
    }
    return event;
  }
  start(sessionId) { return this.append({ kind: "start", sessionId }); }
  reserve(sessionId, stageId, attempt, inputCeiling, requestHash) {
    const cap = this.manifest.caps.find(c => c.stage === stageId);
    if (!cap) throw new PilotStop("BUDGET_STAGE_REJECTED");
    return this.append({ kind: "reserve", sessionId, stageId, attempt, inputCeiling, requestHash, reservedNanos: reserveNanos(cap) });
  }
  settle(reservation, { status, accounting = null, requestId = null, stopReason = null }) {
    return this.append({ kind: "settle", reservationSequence: reservation.sequence, status, accounting, requestId, stopReason });
  }
  dispatch(reservation) { this.append({ kind: "dispatch", reservationSequence: reservation.sequence }); }
  stop(reason) { if (!this.stopReason && !this.poisoned) this.append({ kind: "stop", reason }); }
  finish(sessionId, status) { this.append({ kind: "finish", sessionId, status }); }
  summary() {
    const known = this.calls.filter(c => c.accounting);
    return { sessionsStarted: this.sessions.size, sessionsCompleted: [...this.sessions.values()].filter(s => s.status === "completed").length, httpReservations: this.calls.length, actualHttpCalls: this.calls.filter(c => c.dispatched).length, reservedUsd: this.reservedNanos / USD_NANOS,
      inputTokens: known.reduce((a,c) => a+c.accounting.inputTokens,0), outputTokens: known.reduce((a,c) => a+c.accounting.outputTokens,0), cachedTokens: known.reduce((a,c) => a+c.accounting.cachedTokens,0), reasoningTokens: known.reduce((a,c) => a+c.accounting.reasoningTokens,0),
      usageBasedCostLowerUsd: known.reduce((a,c) => a+c.accounting.lowerNanos,0) / USD_NANOS, usageBasedCostUpperUsd: known.reduce((a,c) => a+c.accounting.upperNanos,0) / USD_NANOS,
      unknownUsageCalls: this.calls.length - known.length, completeCacheWriteUsage: known.length === this.calls.length && known.every(c => c.accounting.pricingComplete), stopReason: this.stopReason };
  }
}
