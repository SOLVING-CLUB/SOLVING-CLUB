type RetryOptions = {
  retries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
};

const defaultOptions: Required<RetryOptions> = {
  retries: 3,
  baseDelayMs: 300,
  maxDelayMs: 2000,
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetry(error: unknown) {
  const anyErr = error as { status?: number; statusCode?: number; message?: string } | null;
  const status = anyErr?.status ?? anyErr?.statusCode;
  if (!status) return false;
  return status >= 500;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { retries, baseDelayMs, maxDelayMs } = { ...defaultOptions, ...options };

  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (error) {
      attempt += 1;
      if (attempt > retries || !shouldRetry(error)) {
        throw error;
      }
      const backoff = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1));
      const jitter = Math.floor(Math.random() * 100);
      await sleep(backoff + jitter);
    }
  }
}
