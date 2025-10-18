#!/usr/bin/env node
/**
 * Sync .gitmodules -> repos.yaml submodules section.
 * Idempotent: rewrites submodules section preserving existing meta/modules blocks.
 */
const fs = require('fs');
const path = require('path');
const yamlPath = path.resolve(process.cwd(), 'repos.yaml');
const gitmodulesPath = path.resolve(process.cwd(), '.gitmodules');

function parseGitmodules(content) {
  const blocks = content.split(/\n\s*\[submodule "/).slice(1);
  return blocks.map(b => {
    const nameMatch = b.match(/^(.*?)"\]/);
    const name = nameMatch ? nameMatch[1] : undefined;
    const pathMatch = b.match(/\n\s*path\s*=\s*(.*)/);
    const urlMatch = b.match(/\n\s*url\s*=\s*(.*)/);
    return name && pathMatch && urlMatch ? { name, path: pathMatch[1].trim(), url: urlMatch[1].trim() } : undefined;
  }).filter(Boolean);
}

function injectSubmodules(yamlText, submodules) {
  // Remove existing submodules: section if present
  const cleaned = yamlText.replace(/\nsubmodules:\n[\s\S]*$/m, '');
  const subYaml = ['submodules:'].concat(submodules.map(s => `  - name: ${s.name}\n    path: ${s.path}\n    url: ${s.url}`)).join('\n');
  return cleaned.trimEnd() + '\n\n' + subYaml + '\n';
}

(function main() {
  if (!fs.existsSync(gitmodulesPath)) {
    console.error('No .gitmodules found');
    process.exit(1);
  }
  if (!fs.existsSync(yamlPath)) {
    console.error('No repos.yaml found');
    process.exit(1);
  }
  const gitmodules = fs.readFileSync(gitmodulesPath, 'utf8');
  const parsed = parseGitmodules(gitmodules);
  if (!parsed.length) {
    console.error('No submodules parsed from .gitmodules');
    process.exit(2);
  }
  const yamlText = fs.readFileSync(yamlPath, 'utf8');
  const updated = injectSubmodules(yamlText, parsed);
  fs.writeFileSync(yamlPath, updated);
  console.log(`Synced ${parsed.length} submodules into repos.yaml`);
})();
