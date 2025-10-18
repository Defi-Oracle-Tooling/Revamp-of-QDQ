// Error taxonomy and retry/circuit breaker skeleton
export enum WellsFargoErrorCode {
  AUTH_FAIL = 'AUTH_FAIL',
  TRANSIENT_NETWORK = 'TRANSIENT_NETWORK',
  DATA_MISMATCH = 'DATA_MISMATCH',
  DUPLICATE_TX = 'DUPLICATE_TX',
  SANCTION_HIT = 'SANCTION_HIT'
}

export class WellsFargoError extends Error {
  constructor(public code: WellsFargoErrorCode, message: string) {
    super(message);
  }
}

export async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
  // Consider adding exponential backoff for retries
    }
  }
  throw lastErr;
}
