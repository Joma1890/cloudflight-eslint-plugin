import assert from 'node:assert/strict';

const name = process.argv[2];
const configs = await import(`@cloudflight/eslint-plugin-${name}`);
const factory = configs[`cloudflight${name[0].toUpperCase()}${name.slice(1)}Config`];

assert.throws(
    () => factory({rootDirectory: import.meta.dirname}),
    (error) => error instanceof Error && error.message.includes('Update all @cloudflight/eslint-plugin-* packages together'),
    `${name}: a base package of another version must be rejected`,
);
console.log(`${name}: a base package of another version is rejected.`);
