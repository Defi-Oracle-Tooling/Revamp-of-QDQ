/**
 * Hyperledger FireFly integration scaffolding
 */

export interface FireflyConfig {
  apiBaseUrl: string;
  authToken?: string;
  namespace: string;
}

export interface FireflyBroadcastPayload {
  topic: string;
  message: string;
  tags?: string[];
}

export class FireflyAdapter {
  constructor(private _cfg: FireflyConfig, private online = false) {}

  async broadcast(payload: FireflyBroadcastPayload): Promise<{ id: string }> {
    if (!this._cfg.namespace) throw new Error('Firefly namespace missing');

    if (this.online && this._cfg.apiBaseUrl.startsWith('http')) {
      try {
        const got = require('got');
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (this._cfg.authToken) {
          headers.Authorization = `Bearer ${this._cfg.authToken}`;
        }

        const response = await got.post(`${this._cfg.apiBaseUrl}/api/v1/namespaces/${this._cfg.namespace}/messages/broadcast`, {
          json: payload,
          headers,
          timeout: { request: 5000 }
        }).json();

        return { id: (response as any).id || `ff-online-${Date.now()}` };
      } catch (error) {
        // Fall through to offline simulation on any error
        console.warn('FireFly online broadcast failed, using offline simulation:', error);
      }
    }

    return { id: `ff-${Date.now()}` };
  }
}
