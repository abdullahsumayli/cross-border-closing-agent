import type { Config } from 'jest'

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'node',
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  testMatch: ['**/tests/**/*.test.ts'],
  transform: { '^.+\\.tsx?$': 'ts-jest' },
}

export default config
