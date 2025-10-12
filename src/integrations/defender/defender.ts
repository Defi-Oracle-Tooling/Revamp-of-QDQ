/**
 * OpenZeppelin Defender Integration Scaffolding
 */

export interface DefenderRelayerConfig {
  apiKey?: string;
  apiSecret?: string;
  address?: string;
}

export interface DefenderSentinelConfig {
  name: string;
  network: string;
  conditions: { eventSignature?: string; functionSelector?: string };
  webhookUrl?: string;
}

export interface DefenderAdminAction {
  contract: string;
  action: 'upgrade' | 'pause' | 'unpause' | 'transferOwnership';
  params?: Record<string, any>;
}

export interface DefenderConfig {
  relayer?: DefenderRelayerConfig;
  sentinels?: DefenderSentinelConfig[];
  adminActions?: DefenderAdminAction[];
}

export class DefenderAdapter {
  constructor(private config: DefenderConfig) {}

  listSentinels(): DefenderSentinelConfig[] {
    return this.config.sentinels || [];
  }

  listAdminActions(): DefenderAdminAction[] {
    return this.config.adminActions || [];
  }
}
