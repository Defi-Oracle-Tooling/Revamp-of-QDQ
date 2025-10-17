/**
 * Cross-chain bridge abstraction layer
 */

export type BridgeProvider = 'layerzero' | 'wormhole';

export interface BridgeRouteDefinition {
  provider: BridgeProvider;
  sourceChainId: number;
  destinationChainId: number;
  messagingContract: string;
}

export interface BridgeMessageReceipt {
  provider: BridgeProvider;
  route: BridgeRouteDefinition;
  messageId: string;
  delivered: boolean;
}

export class BridgeAdapter {
  constructor(private routes: BridgeRouteDefinition[]) {}

  findRoute(source: number, dest: number, provider?: BridgeProvider): BridgeRouteDefinition | undefined {
    return this.routes.find(r => r.sourceChainId === source && r.destinationChainId === dest && (!provider || r.provider === provider));
  }

  async sendMessage(route: BridgeRouteDefinition, _payload: string): Promise<BridgeMessageReceipt> {
    // Placeholder: would call provider specific SDK
    return {
      provider: route.provider,
      route,
      messageId: `msg-${Date.now()}`,
      delivered: true
    };
  }
}
