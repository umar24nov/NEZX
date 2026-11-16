export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export function assertFound<T>(value: T | null | undefined, message = "Not found."): T {
  if (value === null || value === undefined) {
    throw new ApiError(404, "NOT_FOUND", message);
  }
  return value;
}
