export class UpstreamApiError extends Error {
  constructor(public readonly connector: string, public readonly operation: string, message: string, public readonly cause?: unknown) {
    super(`[${connector}:${operation}] ${message}`);
    this.name = 'UpstreamApiError';
  }
}

export class SimulationFallbackError extends Error {
  constructor(public readonly connector: string, public readonly operation: string, reason: string) {
    super(`[${connector}:${operation}] Simulation fallback: ${reason}`);
    this.name = 'SimulationFallbackError';
  }
}

export class ConfigurationError extends Error {
  constructor(public readonly connector: string, public readonly field: string, message: string) {
    super(`[${connector}:config:${field}] ${message}`);
    this.name = 'ConfigurationError';
  }
}