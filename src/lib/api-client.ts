import { withRetry } from "@/lib/retry";

type ApiErrorCode = "DB_UNAVAILABLE" | "DB_TABLES_NOT_READY" | "REQUEST_FAILED" | "UNKNOWN";

export class ApiClientError extends Error {
  status: number;
  code: ApiErrorCode;
  context?: string;

  constructor(message: string, status = 500, code: ApiErrorCode = "UNKNOWN", context?: string) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.context = context;
  }
}

function debugLog(context: string | undefined, details: Record<string, unknown>) {
  if (process.env.NODE_ENV === "production") return;
  console.info("[myshop:api]", { context, ...details });
}

function mapError(status: number, payload: { error?: string; errorCode?: string } | null, context?: string) {
  const code = (payload?.errorCode ?? "") as ApiErrorCode;
  const message = payload?.error || `Request failed: ${status}`;

  if (code === "DB_UNAVAILABLE" || code === "DB_TABLES_NOT_READY") {
    return new ApiClientError(message, status, code, context);
  }

  return new ApiClientError(message, status, status >= 500 ? "REQUEST_FAILED" : "UNKNOWN", context);
}

export async function fetchJsonWithRetry<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
  attempts = 3,
  context?: string,
): Promise<T> {
  return withRetry(async () => {
    const res = await fetch(input, init);
    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      const error = mapError(res.status, payload, context);
      debugLog(context, { status: res.status, code: error.code, message: error.message, path: String(input) });
      throw error;
    }
    return (await res.json()) as T;
  }, attempts);
}
