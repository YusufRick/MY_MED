import type { Config } from '@jest/types'

const config: Config.InitialOptions = {
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/tests/unit/**/*.test.ts'],
      preset: 'ts-jest',
      testEnvironment: 'node',
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      setupFiles: [],
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/tests/integration/**/*.test.ts'],
      preset: 'ts-jest',
      testEnvironment: 'node',
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      setupFiles: ['<rootDir>/tests/setup/env.ts'],
    },
    {
      displayName: 'e2e',
      testMatch: ['<rootDir>/tests/e2e/**/*.test.ts'],
      preset: 'ts-jest',
      testEnvironment: 'node',
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      setupFiles: ['<rootDir>/tests/setup/env.ts'],
    },
  ],

  collectCoverageFrom: [
    'src/lib/**/*.ts',
    'src/repositories/**/*.ts',
    'src/app/api/**/*.ts',
    '!src/**/*.d.ts',
  ],

  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 75,
      statements: 75,
    },
  },
}

export default config