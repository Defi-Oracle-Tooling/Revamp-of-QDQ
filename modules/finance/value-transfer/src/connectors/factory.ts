// Connector factory for all Wells Fargo and Tatum.io connectors
import { BankingConnector } from '../connector';
import { WellsFargoACHConnector } from './wellsFargoACH';
import { WellsFargoWireConnector } from './wellsFargoWire';
import { WellsFargoRTPConnector } from './wellsFargoRTP';
import { WellsFargoFXConnector } from './wellsFargoFX';
import { WellsFargoBetaExperimentalConnector } from './wellsFargoBetaExperimental';
import { TatumVirtualAccountConnector } from './tatumVirtualAccount';
import { TatumFiatWalletConnector } from './tatumFiatWallet';
import { TatumCryptoConnector } from './tatumCrypto';

export type ConnectorType =
  | 'wells-fargo-ach'
  | 'wells-fargo-wire'
  | 'wells-fargo-rtp'
  | 'wells-fargo-fx'
  | 'wells-fargo-beta-experimental'
  | 'tatum-virtual-account'
  | 'tatum-fiat-wallet'
  | 'tatum-crypto';

export function createConnector(type: ConnectorType, simulation = false): BankingConnector {
  switch (type) {
    case 'wells-fargo-ach':
      return new WellsFargoACHConnector(simulation);
    case 'wells-fargo-wire':
      return new WellsFargoWireConnector(simulation);
    case 'wells-fargo-rtp':
      return new WellsFargoRTPConnector(simulation);
    case 'wells-fargo-fx':
      return new WellsFargoFXConnector(simulation);
    case 'wells-fargo-beta-experimental':
      return new WellsFargoBetaExperimentalConnector(simulation);
    case 'tatum-virtual-account':
      return new TatumVirtualAccountConnector(simulation);
    case 'tatum-fiat-wallet':
      return new TatumFiatWalletConnector(simulation);
    case 'tatum-crypto':
      return new TatumCryptoConnector(simulation);
    default:
      throw new Error(`Unknown connector type: ${type}`);
  }
}
