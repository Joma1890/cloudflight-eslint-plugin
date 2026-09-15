import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {dirname, join} from 'node:path';
import {readFileSync} from 'node:fs';
import {ESLint} from 'eslint';

const settings = {rootDirectory: import.meta.dirname};
const require = createRequire(import.meta.url);
const consumer = JSON.parse(readFileSync('package.json', 'utf8'));
// the harness lists the probed packages in the consumer manifest
const packages = consumer.cloudflightPackages;
const tsc = require.resolve('typescript/bin/tsc');
// TypeScript 6 only ignores a tsconfig next to explicit files when told to
const explicitFiles = Number(require('typescript').version.split('.')[0]) >= 6 ? ['--ignoreConfig'] : [];

// Verify the real TS6/Angular22/React types, not ambient replacement modules.
execFileSync(process.execPath, [tsc, '--project', 'tsconfig.json'], {stdio: 'inherit'});

// all packed packages must carry the monorepo version that packed them
for (const kind of packages) {
    const entry = require.resolve(`@cloudflight/eslint-plugin-${kind}`);
    const manifest = JSON.parse(readFileSync(join(dirname(entry), '..', 'package.json'), 'utf8'));
    assert.equal(manifest.version, consumer.cloudflightVersion);
    assert.ok(!JSON.stringify(manifest.dependencies).includes('workspace:'));
    assert.ok(readFileSync(join(dirname(entry), '..', 'LICENSE'), 'utf8').includes('Apache'));
}

const configs = Object.fromEntries(await Promise.all(packages.map(async (name) => [name, await import(`@cloudflight/eslint-plugin-${name}`)])));

async function check(factory, file, expected = []) {
    const eslint = new ESLint({cwd: settings.rootDirectory, overrideConfigFile: true, overrideConfig: factory(settings)});
    const results = await eslint.lintFiles([file]);
    const messages = results.flatMap((result) => result.messages);
    // a resolver that fails to load reports every import as unresolved instead of crashing
    const broken = messages.filter((message) => message.fatal || message.ruleId === 'import-x/no-unresolved' || message.message.startsWith('Resolve error'));
    assert.deepEqual(broken, [], `${file}: ${JSON.stringify(broken)}`);
    for (const rule of expected) assert.ok(messages.some((message) => message.ruleId === rule), `${file}: missing ${rule}`);
    if (!expected.length) assert.deepEqual(messages.filter((message) => message.severity === 2), []);
}

async function checkFormat(factory, file, source, expected) {
    const eslint = new ESLint({overrideConfigFile: true, overrideConfig: factory(settings), fix: true});
    const [result] = await eslint.lintText(source, {filePath: file});
    assert.ok(result.output?.includes(expected), `${file}: not formatted`);
}

if (packages.includes('typescript')) {
    const {cloudflightTypescriptConfig, cloudflightTypescriptFormatConfig} = configs.typescript;
    await check(cloudflightTypescriptConfig, 'base.ts', ['@typescript-eslint/no-floating-promises', 'no-unsanitized/property']);
    await check(cloudflightTypescriptConfig, 'tool.mjs');
    await checkFormat(cloudflightTypescriptFormatConfig, 'format.ts', 'export const value=1', 'value = 1;');
}
if (packages.includes('node')) {
    await check(configs.node.cloudflightNodeConfig, 'node.ts', ['n/no-sync', '@typescript-eslint/no-floating-promises']);
    await check(configs.node.cloudflightNodeConfig, 'tool.mjs');
}
if (packages.includes('react')) {
    const {cloudflightReactConfig} = configs.react;
    await check(cloudflightReactConfig, 'react.tsx', ['react/jsx-key', 'react-hooks/rules-of-hooks', 'jsx-a11y/alt-text', '@typescript-eslint/no-floating-promises']);
    await check(cloudflightReactConfig, 'plain.jsx');
}
if (packages.includes('vue')) {
    const {cloudflightVueConfig} = configs.vue;
    await check(cloudflightVueConfig, 'Form.vue', ['vue/html-button-has-type', '@typescript-eslint/no-floating-promises']);
    await check((options) => cloudflightVueConfig({...options, tsConfigFiles: ['tsconfig.json']}), 'Form.vue', ['@typescript-eslint/no-floating-promises']);
    await check((options) => cloudflightVueConfig({...options, tsConfigFiles: ['tsconfig.json']}), 'base.ts', ['@typescript-eslint/no-floating-promises']);
}
if (packages.includes('angular')) {
    const {cloudflightAngularConfig, cloudflightAngularFormatConfig} = configs.angular;
    await check(cloudflightAngularConfig, 'invalid.component.ts', ['@angular-eslint/no-uncalled-signals', '@angular-eslint/no-async-lifecycle-method', '@angular-eslint/template/button-has-type', '@typescript-eslint/no-floating-promises']);
    await check(cloudflightAngularConfig, 'invalid.html', ['@angular-eslint/template/button-has-type']);
    await checkFormat(cloudflightAngularFormatConfig, 'format.html', '<app-child></app-child>', '<app-child />');
}

// Check type declarations even in nested installs, without skipLibCheck hiding them.
execFileSync(process.execPath, [tsc, ...explicitFiles, '--noEmit', '--strict', '--module', 'nodenext', '--moduleResolution', 'nodenext', 'config-types.ts'], {stdio: 'inherit'});
console.log(`Real-framework linting, declarations and formatting passed for ${packages.join(', ')}.`);
