module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/?(*.)+(spec|test).tsx'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { isolatedModules: true, diagnostics: false }]
  },
  setupFilesAfterEnv: ['<rootDir>/src/test/setupTests.ts']
};
