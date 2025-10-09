/* Phase 3 Validation Layer
 * Provides a function to validate a NetworkContext-like object against the JSON schema.
 */
import fs from 'fs';
import path from 'path';
// Using classic CJS import style compatibility for existing TS config
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Ajv = require('ajv');
import type { ErrorObject } from 'ajv';

export interface ValidationResult {
  valid: boolean;
  errors?: ErrorObject[];
}

let _ajvInstance: any | undefined; // narrowed later
let _validateFn: undefined | ((data: unknown) => boolean | PromiseLike<unknown>);

export function validateNetworkConfig(config: unknown): ValidationResult {
  if (!_ajvInstance) {
  _ajvInstance = new Ajv({ allErrors: true });
    const schemaPath = path.resolve(__dirname, '..', 'schemas', 'network.schema.json');
    const schemaRaw = fs.readFileSync(schemaPath, 'utf-8');
  const schemaObj = JSON.parse(schemaRaw) as Record<string, unknown>;
  _validateFn = _ajvInstance.compile(schemaObj) as (data: unknown) => boolean | PromiseLike<unknown>;
  }
  const validateFn = _validateFn;
  if (!validateFn) {
    return { valid: false, errors: [] };
  }
  const result = validateFn(config);
  const valid = typeof result === 'boolean' ? result : false; // async schemas not expected yet
  const errors: ErrorObject[] | undefined = (validateFn as any).errors ? [...(validateFn as any).errors] : undefined;
  return { valid, errors };
}
