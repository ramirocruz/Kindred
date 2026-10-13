module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  reporters: process.env.GITHUB_ACTIONS ? ['default', ['github-actions', { silent: false }]] : ['default'],
  testMatch: ['<rootDir>/src/**/*.test.ts'],
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};
