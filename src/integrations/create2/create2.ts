/**
 * CREATE2 deterministic deployment utilities.
 */
import { keccak256 } from 'js-sha3';

export interface Create2DeploymentPlan {
  deployer: string; // 0x-prefixed
  saltHex: string;  // 32-byte salt (0x...)
  bytecode: string; // contract creation bytecode
}

function strip0x(input: string): string {
  return input.startsWith('0x') ? input.slice(2) : input;
}

export function computeCreate2Address(plan: Create2DeploymentPlan): string {
  const deployer = strip0x(plan.deployer).toLowerCase();
  const salt = strip0x(plan.saltHex);
  const bytecodeHash = keccak256(strip0x(plan.bytecode));
  const packed = `ff${deployer}${salt}${bytecodeHash}`;
  const addressHash = keccak256(packed);
  return `0x${addressHash.slice(-40)}`.toLowerCase();
}
