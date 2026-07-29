export class M2RuntimeError extends Error {
  readonly safeCode: string;
  readonly httpStatus: number;

  constructor(safeCode: string, httpStatus = 500) {
    super(safeCode);
    this.name = "M2RuntimeError";
    this.safeCode = safeCode;
    this.httpStatus = httpStatus;
  }
}

export function asM2RuntimeError(
  error: unknown,
  fallbackCode = "M2_INTERNAL_RUNTIME_FAILED",
) {
  return error instanceof M2RuntimeError
    ? error
    : new M2RuntimeError(fallbackCode);
}
