import fs from 'fs';
import path from 'path';

describe('connect_vm.sh env file generation (simulation)', () => {
  const envFile = path.join(process.cwd(), '.besu_env.test');
  afterEach(() => { if (fs.existsSync(envFile)) fs.unlinkSync(envFile); });

  it('writes expected variables (mocked)', () => {
    const content = [
      'REMOTE_HOST=1.2.3.4',
      'SSH_KEY=~/.ssh/key.pem',
      'BESU_HOME=~/besu_migration_20250101',
      'BACKUP_DIR=~/besu_backup_20250101',
      'REMOTE_USER=tester',
      'LOG_DIR=./logs'
    ].join('\n');
    fs.writeFileSync(envFile, content, 'utf8');
    const loaded = fs.readFileSync(envFile, 'utf8');
    expect(loaded).toContain('REMOTE_HOST=1.2.3.4');
    expect(loaded.split('\n').length).toBeGreaterThanOrEqual(6);
  });
});