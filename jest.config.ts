import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/start.ts',
    '!src/**/*.test.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/test/setupFile.ts'],
  globalSetup: '<rootDir>/test/globalSetup.ts',
  globalTeardown: '<rootDir>/test/globalTeardown.ts',
  reporters: [
    'default',
    [
      'jest-junit',
      { outputDirectory: 'test-results', outputName: 'junit.xml' },
    ],
  ],
  verbose: true,
  detectOpenHandles: true,
  forceExit: true,
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
