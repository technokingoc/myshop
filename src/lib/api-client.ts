import { withRetry } from "@/lib/retry";

export async function fetchJsonWithRetry<T>(input: RequestInfo | URL, init?: RequestInit, attempts = 3): Promise<T> {
  return withRetry(async () => {
    const res = await fetch(input, init);
    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      throw new Error(payload?.error || `Request failed: ${res.status}`);
    }
    return (await res.json()) as T;
  }, attempts);
}
