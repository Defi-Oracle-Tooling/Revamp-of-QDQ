import * as fs from 'fs';
import * as os from 'os';
import {
  renderTemplateDir,
  copyFilesDir,
  renderFileToDir,
  validateDirectoryExists
} from '../src/fileRendering';
import { NetworkContext } from '../src/networkBuilder';

// Mock dependencies
jest.mock('fs');
jest.mock('os');
jest.mock('nunjucks');
jest.mock('isbinaryfile');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockOs = os as jest.Mocked<typeof os>;

describe('File Rendering', () => {
  const mockContext: NetworkContext = {
    clientType: 'besu',
    nodeCount: 4,
    outputPath: './test-output',
    privacy: false,
    monitoring: 'loki',
    blockscout: false,
    chainlens: false,
    validators: 4
  };

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(mockOs, 'EOL', { value: '\n', writable: true });
  });

  describe('validateDirectoryExists', () => {
    it('should return true for existing directory', () => {
      const mockStats = { isDirectory: () => true } as fs.Stats;
      mockFs.statSync.mockReturnValue(mockStats);

      const result = validateDirectoryExists('./existing-dir');
      expect(result).toBe(true);
      expect(mockFs.statSync).toHaveBeenCalledWith('./existing-dir');
    });

    it('should return false for non-existent path', () => {
      const error = new Error('ENOENT') as any;
      error.code = 'ENOENT';
      mockFs.statSync.mockImplementation(() => { throw error; });

      const result = validateDirectoryExists('./non-existent');
      expect(result).toBe(false);
    });

    it('should throw error for existing non-directory', () => {
      const mockStats = { isDirectory: () => false } as fs.Stats;
      mockFs.statSync.mockReturnValue(mockStats);

      expect(() => validateDirectoryExists('./file-not-dir')).toThrow(
        'Path ./file-not-dir exists, but is not a directory.'
      );
    });

    it('should rethrow non-ENOENT errors', () => {
      const error = new Error('Permission denied');
      mockFs.statSync.mockImplementation(() => { throw error; });

      expect(() => validateDirectoryExists('./permission-denied')).toThrow('Permission denied');
    });
  });

  describe('renderFileToDir', () => {
    beforeEach(() => {
      // Mock nunjucks renderString
      const nunjucks = require('nunjucks');
      nunjucks.renderString = jest.fn((template: string) =>
        template.replace('{{ clientType }}', mockContext.clientType)
      );
    });

    it('should render template file and write to output directory', () => {
      mockFs.readFileSync.mockReturnValue('Client: {{ clientType }}');
      mockFs.existsSync.mockReturnValue(false);
      const mockStats = { mode: 0o644 } as fs.Stats;
      mockFs.statSync.mockReturnValue(mockStats);

      renderFileToDir('./templates', 'config.yml', mockContext);

      expect(mockFs.readFileSync).toHaveBeenCalledWith('./templates/config.yml', 'utf-8');
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        './test-output/config.yml',
        'Client: besu\n',
        { mode: 0o644 }
      );
    });

    it('should throw error if output file already exists', () => {
      mockFs.existsSync.mockReturnValue(true);

      expect(() => renderFileToDir('./templates', 'config.yml', mockContext)).toThrow(
        'Output file ./test-output/config.yml already exists'
      );
    });

    it('should create directory structure if it does not exist', () => {
      mockFs.readFileSync.mockReturnValue('template content');
      mockFs.existsSync.mockReturnValue(false);
      const mockStats = { mode: 0o644 } as fs.Stats;
      mockFs.statSync.mockReturnValue(mockStats);

      renderFileToDir('./templates', 'nested/config.yml', mockContext);

      expect(mockFs.mkdirSync).toHaveBeenCalledWith('./test-output/nested', { recursive: true });
    });
  });

  describe('renderTemplateDir', () => {
    beforeEach(() => {
      // Mock fs.readdirSync to return mock directory contents
      mockFs.readdirSync.mockReturnValue(['file1.yml', 'subdir'] as any);

      // Mock fs.statSync for different file types
      mockFs.statSync
        .mockReturnValueOnce({ isDirectory: () => false, mode: 0o644 } as fs.Stats) // file1.yml
        .mockReturnValueOnce({ isDirectory: () => true } as fs.Stats); // subdir

      mockFs.readFileSync.mockReturnValue('template: {{ clientType }}');
      mockFs.existsSync.mockReturnValue(false);

      const nunjucks = require('nunjucks');
      nunjucks.renderString = jest.fn((template: string) =>
        template.replace('{{ clientType }}', mockContext.clientType)
      );
    });

    it('should render all template files in directory', () => {
      // Setup recursive directory mocking
      mockFs.readdirSync
        .mockReturnValueOnce(['file1.yml', 'subdir'] as any) // root level
        .mockReturnValueOnce(['file2.yml'] as any); // subdir level

      mockFs.statSync
        .mockReturnValueOnce({ isDirectory: () => false, mode: 0o644 } as fs.Stats)
        .mockReturnValueOnce({ isDirectory: () => true } as fs.Stats)
        .mockReturnValueOnce({ isDirectory: () => false, mode: 0o644 } as fs.Stats);

      renderTemplateDir('./templates', mockContext);

      expect(mockFs.writeFileSync).toHaveBeenCalledTimes(2);
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        './test-output/file1.yml',
        'template: besu\n',
        { mode: 0o644 }
      );
    });
  });

  describe('copyFilesDir', () => {
    beforeEach(() => {
      // Mock binary file detection
      const isbinaryfile = require('isbinaryfile');
      isbinaryfile.isBinaryFileSync = jest.fn(() => false);
    });

    it('should copy text files with newline normalization', () => {
      mockFs.readdirSync.mockReturnValue(['script.sh'] as any);
      mockFs.statSync.mockReturnValue({
        isDirectory: () => false,
        mode: 0o755,
        size: 100
      } as fs.Stats);
      mockFs.readFileSync.mockReturnValue('#!/bin/bash\r\necho "test"\r\n');

      copyFilesDir('./files', mockContext);

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        './test-output/script.sh',
        '#!/bin/bash\necho "test"\n',
        { mode: 0o755 }
      );
    });

    it('should skip directories based on client type', () => {
      mockFs.readdirSync.mockReturnValue(['goquorum', 'common', 'besu'] as any);
      mockFs.statSync
        .mockReturnValueOnce({ isDirectory: () => true } as fs.Stats) // goquorum - should skip
        .mockReturnValueOnce({ isDirectory: () => true } as fs.Stats) // common
        .mockReturnValueOnce({ isDirectory: () => true } as fs.Stats); // besu

      // Mock subdirectory contents
      mockFs.readdirSync
        .mockReturnValueOnce(['common-file.txt'] as any) // common contents
        .mockReturnValueOnce(['besu-file.txt'] as any); // besu contents

      mockFs.statSync
        .mockReturnValueOnce({ isDirectory: () => false, mode: 0o644, size: 50 } as fs.Stats)
        .mockReturnValueOnce({ isDirectory: () => false, mode: 0o644, size: 60 } as fs.Stats);

      mockFs.readFileSync.mockReturnValue('file content');

      copyFilesDir('./files', mockContext);

      // Should process common and besu directories, but skip goquorum
      expect(mockFs.writeFileSync).toHaveBeenCalledTimes(2);
    });

    it('should handle binary files with streaming', () => {
      const isbinaryfile = require('isbinaryfile');
      isbinaryfile.isBinaryFileSync.mockReturnValue(true);

      mockFs.readdirSync.mockReturnValue(['binary.bin'] as any);
      mockFs.statSync.mockReturnValue({
        isDirectory: () => false,
        mode: 0o644,
        size: 1024
      } as fs.Stats);

      const mockReadStream = { pipe: jest.fn() };
      const mockWriteStream = {};
      mockFs.createReadStream.mockReturnValue(mockReadStream as any);
      mockFs.createWriteStream.mockReturnValue(mockWriteStream as any);

      copyFilesDir('./files', mockContext);

      expect(mockFs.createReadStream).toHaveBeenCalledWith('./files/binary.bin');
      expect(mockFs.createWriteStream).toHaveBeenCalledWith('./test-output/binary.bin', { mode: 0o644 });
      expect(mockReadStream.pipe).toHaveBeenCalledWith(mockWriteStream);
    });
  });
});