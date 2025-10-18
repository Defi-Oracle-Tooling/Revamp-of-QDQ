export class ConfigurationError extends Error {
  constructor(public readonly connector: string, public readonly field: string, message: string) {
    super(`[${connector}:config:${field}] ${message}`);
    this.name = 'ConfigurationError';
  }
}
