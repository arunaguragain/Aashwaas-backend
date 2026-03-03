module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    testMatch: ['**/__tests__/**/*.test.ts'],
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
        '!src/index.ts',
        '!src/app.ts',
        '!src/__tests__/**',
    ],
    coveragePathIgnorePatterns: [
        '<rootDir>/src/repositories/passwordReset.repository.ts'
    ],
    moduleNameMapper: {
        '^uuid$': '<rootDir>/src/__tests__/__mocks__/uuid.ts',
    },
    setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
};