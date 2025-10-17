import { UpstreamApiError, SimulationFallbackError, ConfigurationError } from '../../src/connectors/errors';

describe('Connector Error Classes', () => {
  it('UpstreamApiError formats message', () => {
    const err = new UpstreamApiError('tatum','fetchBalance','HTTP 500');
    expect(err.message).toContain('[tatum:fetchBalance]');
    expect(err.name).toBe('UpstreamApiError');
  });
  it('SimulationFallbackError formats message', () => {
    const err = new SimulationFallbackError('wells-fargo','init','disabled');
    expect(err.message).toContain('Simulation fallback');
    expect(err.name).toBe('SimulationFallbackError');
  });
  it('ConfigurationError formats message', () => {
    const err = new ConfigurationError('bni','apiKey','Missing');
    expect(err.message).toContain('apiKey');
    expect(err.name).toBe('ConfigurationError');
  });
});