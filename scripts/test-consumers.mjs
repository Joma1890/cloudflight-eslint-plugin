/* eslint-disable no-console -- Test runner reports progress. */
import spawn from 'cross-spawn';
import assert from 'node:assert/strict';
import {cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

import {copyLicenses} from './copy-license/copy-license.mjs';

const repository = join(import.meta.dirname, '..');
const fixtures = join(import.meta.dirname, 'consumer-fixtures');
const rootPackage = JSON.parse(readFileSync(join(repository, 'package.json'), 'utf8'));

// real framework versions the packed packages are probed against.
// Dependabot does not see these, bump them by hand when updating the framework targets.
const frameworks = new Map([
    ['typescript', {}],
    ['node', {}],
    ['react', {react: '19.2.8', '@types/react': '19.2.18'}],
    ['vue', {vue: '3.5.42'}],
    ['angular', {'@angular/core': '22.1.5', '@angular/compiler': '22.1.5', rxjs: '7.8.2'}],
]);
// the fixtures the probe lints with each package
const fixtureFiles = new Map([
    ['typescript', ['base.ts', 'tool.mjs']],
    ['node', ['node.ts', 'tool.mjs']],
    ['react', ['react.tsx', 'plain.jsx']],
    ['vue', ['Form.vue', 'base.ts']],
    ['angular', ['invalid.component.ts', 'invalid.html']],
]);
// CONSUMER_PACKAGES limits the run to some packages, CONSUMER_TYPESCRIPT, CONSUMER_TYPES_NODE and
// CONSUMER_ESLINT select the compiler, its node types and eslint, e.g. to probe the minimum supported versions.
const selected = (process.env.CONSUMER_PACKAGES ?? [...frameworks.keys()].join(',')).split(',');
const compiler = {
    typescript: process.env.CONSUMER_TYPESCRIPT ?? '6.0.3',
    '@types/node': process.env.CONSUMER_TYPES_NODE ?? rootPackage.devDependencies['@types/node'],
};
const eslint = process.env.CONSUMER_ESLINT ?? rootPackage.devDependencies.eslint;

for (const name of selected) {
    assert.ok(frameworks.has(name), `unknown package ${name}`);
}

function run(command, args, cwd) {
    const result = spawn.sync(command, args, {cwd, stdio: 'inherit'});

    if (result.error) {
        throw result.error;
    }
    assert.equal(result.status, 0, `${command} failed in ${cwd}`);
}

// Outside the checkout: Node cannot fall back to the monorepo's node_modules.
// A failing run keeps the directory (and the consumer lockfiles) for investigation,
// a passing run removes it unless CONSUMER_KEEP is set.
const temporary = mkdtempSync(join(tmpdir(), 'cloudflight-consumers-'));
const archives = join(temporary, 'archives');

mkdirSync(archives);
console.log(`Consumer evidence: ${temporary}`);
copyLicenses();
run('yarn', ['workspaces', 'foreach', '-A', '--no-private', 'pack', '--out', join(archives, '%s.tgz')], repository);

function archive(name) {
    return `file:${join(archives, `@cloudflight-eslint-plugin-${name}.tgz`).replace(/\\/g, '/')}`;
}

function configName(name) {
    return `cloudflight${name[0].toUpperCase()}${name.slice(1)}Config`;
}

function probe(label, names, strategy) {
    const consumer = join(temporary, label);
    // the framework packages depend on the base package, take it from the archives as well
    // instead of letting npm fetch the published version
    const dependencies = {eslint, ...compiler, '@cloudflight/eslint-plugin-typescript': archive('typescript')};

    for (const name of names) {
        Object.assign(dependencies, frameworks.get(name));
        dependencies[`@cloudflight/eslint-plugin-${name}`] = archive(name);
    }

    mkdirSync(consumer);
    for (const file of new Set(['probe.mjs', ...names.flatMap((name) => fixtureFiles.get(name))])) {
        cpSync(join(fixtures, file), join(consumer, file));
    }
    writeFileSync(join(consumer, 'package.json'), JSON.stringify({
        name: `cloudflight-consumer-${label}`,
        private: true,
        type: 'module',
        cloudflightVersion: rootPackage.version,
        cloudflightPackages: names,
        dependencies,
    }, null, 2));
    writeFileSync(join(consumer, 'tsconfig.json'), JSON.stringify({
        compilerOptions: {
            target: 'ES2022',
            module: 'NodeNext',
            moduleResolution: 'NodeNext',
            strict: true,
            jsx: 'react-jsx',
            experimentalDecorators: true,
            types: names.includes('react') ? ['node', 'react'] : ['node'],
            noEmit: true,
        },
        include: ['*.ts', '*.tsx', '*.vue'],
    }, null, 2));
    // the declaration check in probe.mjs imports every probed config and passes it to eslint's defineConfig
    writeFileSync(join(consumer, 'config-types.ts'), [
        ...names.map((name) => `import {${configName(name)}} from '@cloudflight/eslint-plugin-${name}';\n`),
        "import {defineConfig} from 'eslint/config';\n",
        `\nexport const factories = [${names.map(configName).join(', ')}];\n`,
        '\nexport default defineConfig(...factories.map((factory) => factory({rootDirectory: import.meta.dirname})));\n',
    ].join(''));
    // npm's default peer policy warns for the two pinned React plugins.
    // Strict-peer React consumers must wait for compatible upstream metadata.
    run('npm', ['install', '--ignore-scripts', '--engine-strict', '--no-audit', '--no-fund', `--install-strategy=${strategy}`], consumer);
    run(process.execPath, ['probe.mjs'], consumer);
}

// every selected package together, as a hoisted and as a nested tree
for (const strategy of ['hoisted', 'nested']) {
    probe(strategy, selected, strategy);
}
// each package on its own, so a dependency that only a sibling package brings along does not go unnoticed
for (const name of selected) {
    probe(`isolated-${name}`, [name], 'hoisted');
}

// the framework packages are only supported with the base package of their own version
function olderBaseArchive(consumer) {
    const olderBase = join(consumer, 'older-base');

    mkdirSync(olderBase, {recursive: true});
    run('tar', ['-xzf', join(archives, '@cloudflight-eslint-plugin-typescript.tgz'), '--strip-components=1', '-C', olderBase], consumer);
    const manifest = JSON.parse(readFileSync(join(olderBase, 'package.json'), 'utf8'));

    writeFileSync(join(olderBase, 'package.json'), JSON.stringify({...manifest, version: '0.0.0-older'}, null, 2));
    // packed again, because npm does not install the dependencies of a linked directory
    run('npm', ['pack', '--ignore-scripts', '--pack-destination', consumer], olderBase);

    return 'file:./cloudflight-eslint-plugin-typescript-0.0.0-older.tgz';
}

function probeRejectedVersions(label, name, manifest) {
    const consumer = join(temporary, `${label}-${name}`);

    mkdirSync(consumer);
    const olderBase = olderBaseArchive(consumer);

    cpSync(join(fixtures, 'mixed-probe.mjs'), join(consumer, 'mixed-probe.mjs'));
    writeFileSync(join(consumer, 'package.json'), JSON.stringify({name: `cloudflight-consumer-${label}-${name}`, private: true, type: 'module', ...manifest(olderBase)}, null, 2));
    run('npm', ['install', '--ignore-scripts', '--engine-strict', '--no-audit', '--no-fund'], consumer);
    run(process.execPath, ['mixed-probe.mjs', name], consumer);
}

for (const name of selected.filter((selectedName) => selectedName !== 'typescript')) {
    const shared = {eslint, ...compiler, ...frameworks.get(name), [`@cloudflight/eslint-plugin-${name}`]: archive(name)};

    // the framework package's own dependency on the base package is forced to an older copy
    probeRejectedVersions('mixed', name, (olderBase) => ({
        dependencies: shared,
        overrides: {'@cloudflight/eslint-plugin-typescript': olderBase},
    }));
    // a partial update: the project keeps its older base package, only the framework package
    // brings the current one along as a nested copy
    probeRejectedVersions('partial', name, (olderBase) => ({
        dependencies: {...shared, '@cloudflight/eslint-plugin-typescript': olderBase},
        overrides: {[`@cloudflight/eslint-plugin-${name}`]: {'@cloudflight/eslint-plugin-typescript': archive('typescript')}},
    }));
}

console.log(`Packed consumers passed for ${selected.join(', ')}: hoisted, nested, isolated, and mixed versions rejected.`);
if (process.env.CONSUMER_KEEP === undefined) {
    rmSync(temporary, {recursive: true, force: true});
}
