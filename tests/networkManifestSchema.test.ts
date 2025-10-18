import fs from 'fs';
import path from 'path';

// Simple schema validation (subset) without external libs to avoid new deps.
const schemaPath = path.resolve('schemas/network-manifest.schema.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));

function validate(manifest: any): string[] {
  const errors: string[] = [];
  const props = schema.properties;
  // required fields
  for (const req of schema.required) {
    if (!(req in manifest)) errors.push(`Missing required field: ${req}`);
  }
  // type & enum checks (basic)
  for (const key of Object.keys(manifest)) {
    if (!props[key] && schema.additionalProperties === false) {
      errors.push(`Unexpected field: ${key}`);
      continue;
    }
    const def = props[key];
    if (!def) continue;
    if (def.type === 'string' && typeof manifest[key] !== 'string') {
      errors.push(`Field ${key} should be string`);
    }
    if (def.type === 'integer' && !Number.isInteger(manifest[key])) {
      errors.push(`Field ${key} should be integer`);
    }
    if (def.type === 'boolean' && typeof manifest[key] !== 'boolean') {
      errors.push(`Field ${key} should be boolean`);
    }
    if (def.enum && !def.enum.includes(manifest[key])) {
      errors.push(`Field ${key} value '${manifest[key]}' not in enum ${def.enum.join(',')}`);
    }
  }
  return errors;
}

function loadManifests(dir: string): Array<{file: string; manifest: any}> {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.network.json'))
    .map(f => ({ file: path.join(dir, f), manifest: JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8')) }));
}

describe('network-manifest.schema.json validation', () => {
  const dirs = [
    'USER_CONFIGS/LOCAL_NETWORKS',
    'USER_CONFIGS/DEVNETS',
    'USER_CONFIGS/PRIVATE_NETWORKS',
    'USER_CONFIGS/TEST_NETWORKS',
    'USER_CONFIGS/EXPERIMENTAL'
  ];
  for (const d of dirs) {
    const manifests = loadManifests(d);
    for (const { file, manifest } of manifests) {
      it(`validates manifest ${file}`, () => {
        const issues = validate(manifest);
        expect(issues).toEqual([]);
      });
    }
  }
});
