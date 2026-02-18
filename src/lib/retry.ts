export async function withRetry<T>(fn: () => Promise<T>, attempts = 3, baseDelayMs = 250): Promise<T> {
  let lastError: unknown;

  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < attempts - 1) {
        const waitMs = baseDelayMs * Math.pow(2, i);
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }
    }
  }

  throw lastError;
}
