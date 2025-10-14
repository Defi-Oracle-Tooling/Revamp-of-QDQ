// Shared backend TatumAdapter for Next.js API
import { TatumAdapter, TatumConfig } from '../../../src/integrations/tatum/tatum';

const tatumConfig: TatumConfig = {
  apiKey: process.env.TATUM_API_KEY || 'demo-key',
  testnet: true,
};
export const tatum = new TatumAdapter(tatumConfig, false);