import type {Config} from 'jest';

export const baseJestConfig: Config = {
    preset: 'ts-jest/presets/default',
    testEnvironment: 'node',
    roots: ['./src/'],
    // config tests boot a full type-aware ESLint instance, which needs more than the default 5s
    testTimeout: 60_000,
};
