import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',

  testEnvironment: 'node',

  // Define the root directory for tests and modules
  roots: ['test'],

  // Use ts-jest to transform TypeScript files
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
  // Regular expression to find test files
  testRegex: '((\\.|/)(test|spec))\\.ts?$',

  // File extensions to recognize in module resolution
  moduleFileExtensions: ['ts', 'js'],
}

export default config

// import type { Config } from 'jest'

// const config: Config = {
//   preset: 'ts-jest',
//   testEnvironment: 'node',
//   roots: ['<rootDir>/src', '<rootDir>/test'],
//   testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
//   transform: {
//     '^.+\\.ts$': 'ts-jest',
//   },
//   collectCoverageFrom: [
//     'src/**/*.ts',
//     '!src/**/*.d.ts',
//     '!src/start.ts',
//     '!src/**/*.test.ts',
//   ],
//   coverageDirectory: 'coverage',
//   coverageReporters: ['text', 'lcov', 'html', 'json'],
//   coverageThreshold: {
//     global: {
//       branches: 80,
//       functions: 80,
//       lines: 80,
//       statements: 80,
//     },
//   },
//   setupFilesAfterEnv: ['<rootDir>/test/setupFile.ts'],
//   globalSetup: '<rootDir>/test/globalSetup.ts',
//   globalTeardown: '<rootDir>/test/globalTeardown.ts',
//   reporters: [
//     'default',
//     [
//       'jest-junit',
//       { outputDirectory: 'test-results', outputName: 'junit.xml' },
//     ],
//   ],
//   verbose: true,
//   detectOpenHandles: true,
//   forceExit: true,
// }

// export default config
