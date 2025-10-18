export class SimulationFallbackError extends Error {
  constructor(public readonly connector: string, public readonly operation: string, reason: string) {
    super(`[${connector}:${operation}] Simulation fallback: ${reason}`);
    this.name = 'SimulationFallbackError';
  }
}
