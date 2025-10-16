import path from 'path';
import fs from 'fs';
import { copyFilesDir } from '../src/fileRendering';
import { NetworkContext } from '../src/networkBuilder';

describe('File Rendering Integration', () => {
  it('should copy a real binary file without corruption', () => {
    const fixture = path.resolve(__dirname, 'fixtures/small.png');
    const outDir = path.resolve(__dirname, 'output-bin');
    const outFile = path.join(outDir, 'small.png');
    if (fs.existsSync(outDir)) fs.rmSync(outDir, { recursive: true, force: true });
    fs.mkdirSync(outDir, { recursive: true });
    // Place the binary file in a temp input dir
    const inputDir = path.resolve(__dirname, 'input-bin');
    if (fs.existsSync(inputDir)) fs.rmSync(inputDir, { recursive: true, force: true });
    fs.mkdirSync(inputDir, { recursive: true });
    fs.copyFileSync(fixture, path.join(inputDir, 'small.png'));
    const ctx: NetworkContext = {
      clientType: 'besu',
      nodeCount: 1,
      outputPath: outDir,
      privacy: false,
      monitoring: 'loki',
      blockscout: false,
      chainlens: false,
      validators: 1
    };
    copyFilesDir(inputDir, ctx);
    // Compare input and output
    const orig = fs.readFileSync(path.join(inputDir, 'small.png'));
    const copied = fs.readFileSync(outFile);
    expect(copied.equals(orig)).toBe(true);
  });
});
