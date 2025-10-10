// Global test setup

// Mock console methods for cleaner test output
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock process.exit to prevent tests from killing the test runner
const mockExit = jest.fn();
process.exit = mockExit as any;

beforeEach(() => {
  jest.clearAllMocks();
});