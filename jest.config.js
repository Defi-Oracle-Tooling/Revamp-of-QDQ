module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Include az-billing submodule tests explicitly for unified runs
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      diagnostics: false,
      tsconfig: '<rootDir>/tsconfig.json'
    }]
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    'az-billing/src/**/*.ts',
    '!src/**/*.d.ts',
    '!az-billing/src/**/*.d.ts',
    '!src/**/index.ts',
    '!az-billing/src/**/index.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 10000,
  verbose: true
};