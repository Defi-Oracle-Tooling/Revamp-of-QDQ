export class UpstreamApiError extends Error {
  constructor(public readonly connector: string, public readonly operation: string, message: string, public readonly cause?: unknown) {
    super(`[${connector}:${operation}] ${message}`);
    this.name = 'UpstreamApiError';
  }
}
