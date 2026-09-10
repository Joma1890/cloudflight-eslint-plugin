import type {Config} from 'jest';

export const baseJestConfig: Config = {
    preset: 'ts-jest/presets/default',
    testEnvironment: 'node',
    roots: ['./src/'],
    // config tests boot a full type-aware ESLint instance, which needs more than the default 5s
    testTimeout: 60_000,
    // the project service leaves a 2.5 s tsserver timer behind, a jest worker is force-exited after
    // 500 ms with a warning; in band there is no worker to wait for
    maxWorkers: 1,
};
