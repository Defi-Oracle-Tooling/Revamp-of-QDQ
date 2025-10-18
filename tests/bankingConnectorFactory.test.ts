import { createConnector } from '../src/connectors/bankingConnector';

describe('createConnector factory', () => {
  it('returns wells fargo connector', () => {
    const c = createConnector('wells-fargo');
    expect(c.name).toBe('wells-fargo');
  });
  it('returns bni connector', () => {
    const c = createConnector('bni');
    expect(c.name).toBe('bni');
  });
  it('returns tatum connector', () => {
    const c = createConnector('tatum');
    expect(c.name).toBe('tatum');
  });
});