import { Spinner } from '../src/spinner';

describe('Spinner', () => {
  let spinner: Spinner;

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    if (spinner && spinner.isRunning) {
      spinner.forceStop();
    }
    jest.useRealTimers();
  });

  describe('constructor', () => {
    it('should create a spinner with default dots3 spinner', () => {
      spinner = new Spinner('Test message');
      expect(spinner.text).toBe('Test message');
      expect(spinner.isRunning).toBe(false);
      expect(spinner.isSettled).toBe(false);
    });

    it('should throw error for invalid spinner name', () => {
      expect(() => {
        new Spinner('Test', 'invalidSpinner' as any);
      }).toThrow('Invalid spinner name');
    });
  });

  describe('lifecycle management', () => {
    beforeEach(() => {
      spinner = new Spinner('Test spinner');
    });

    it('should start and stop correctly', async () => {
      expect(spinner.isRunning).toBe(false);

      spinner.start();
      expect(spinner.isRunning).toBe(true);
      expect(spinner.isSettled).toBe(false);

      await spinner.stop('Done');
      expect(spinner.isRunning).toBe(false);
      expect(spinner.isSettled).toBe(true);
    });

    it('should handle multiple start calls gracefully', () => {
      const result1 = spinner.start();
      const result2 = spinner.start();

      expect(result1).toBe(spinner);
      expect(result2).toBe(spinner);
      expect(spinner.isRunning).toBe(true);
    });

    it('should handle stop without start', async () => {
      expect(spinner.isRunning).toBe(false);
      await spinner.stop('Done');
      expect(spinner.isSettled).toBe(false); // Should not change state if never started
    });
  });

  describe('success and failure states', () => {
    beforeEach(() => {
      spinner = new Spinner('Processing...');
      spinner.start();
    });

    it('should succeed with correct message', async () => {
      await spinner.succeed('Process completed successfully');
      expect(spinner.isRunning).toBe(false);
      expect(spinner.isSettled).toBe(true);
    });

    it('should fail with correct message', async () => {
      await spinner.fail('Process failed');
      expect(spinner.isRunning).toBe(false);
      expect(spinner.isSettled).toBe(true);
    });
  });

  describe('text updates', () => {
    beforeEach(() => {
      spinner = new Spinner('Initial message');
    });

    it('should allow text updates while running', () => {
      spinner.start();
      spinner.text = 'Updated message';
      expect(spinner.text).toBe('Updated message');
    });

    it('should allow text updates when stopped', () => {
      spinner.text = 'Updated message';
      expect(spinner.text).toBe('Updated message');
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      spinner = new Spinner('Test spinner');
    });

    it('should handle forced stop gracefully', () => {
      spinner.start();
      expect(spinner.isRunning).toBe(true);

      spinner.forceStop();
      expect(spinner.isRunning).toBe(false);
      expect(spinner.isSettled).toBe(true);
    });

    it('should prevent operations after settlement', async () => {
      spinner.start();
      await spinner.succeed('Done');

      // Should not restart after settlement
      spinner.start();
      expect(spinner.isRunning).toBe(false);
    });
  });

  describe('state consistency', () => {
    it('should maintain consistent state through lifecycle', async () => {
      spinner = new Spinner('Lifecycle test');

      // Initial state
      expect(spinner.isRunning).toBe(false);
      expect(spinner.isSettled).toBe(false);

      // After start
      spinner.start();
      expect(spinner.isRunning).toBe(true);
      expect(spinner.isSettled).toBe(false);

      // After success
      await spinner.succeed('Complete');
      expect(spinner.isRunning).toBe(false);
      expect(spinner.isSettled).toBe(true);
    });
  });
});