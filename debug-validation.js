import { validateContext } from '../src/networkValidator';

// Simple test to debug validation
const context = {
  clientType: 'besu',
  nodeCount: 4,
  outputPath: './test-output',
  privacy: false,
  monitoring: 'loki',
  blockscout: false,
  chainlens: false,
  validators: 4
};

const result = validateContext(context);
console.log('Validation result:', result);
console.log('Issues:', JSON.stringify(result.issues, null, 2));