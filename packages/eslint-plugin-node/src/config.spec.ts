import {ESLint} from 'eslint';
import {mkdirSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

import {cloudflightNodeConfig} from './index';

const fixtureDir = join(__dirname, '..', 'fixtures');

function createEslint(): ESLint {
    return new ESLint({
        cwd: fixtureDir,
        overrideConfigFile: true,
        overrideConfig: cloudflightNodeConfig({rootDirectory: fixtureDir}),
    });
}

describe('cloudflightNodeConfig', () => {
    it('reports no errors for valid code', async () => {
        const results = await createEslint().lintFiles(['valid.ts']);

        expect(results.flatMap((result) => result.messages)).toEqual([]);
    });

    it('escalates the security recommendations to errors', async () => {
        const results = await createEslint().lintText(
            'export function get(object: Record<string, string>, key: string): string | undefined {\n    return object[key];\n}\n',
            {filePath: 'invalid.ts'},
        );
        const messages = results.flatMap((result) => result.messages)
            .filter((message) => message.ruleId === 'security/detect-object-injection');

        // the base config only warns here, the node config turns it into an error
        expect(messages.map((message) => message.severity)).toEqual([2]);
    });

    it('reports node and type-aware violations', async () => {
        const results = await createEslint().lintFiles(['invalid.ts']);
        const ruleIds = results.flatMap((result) => result.messages).map((message) => message.ruleId);

        expect(ruleIds).toContain('n/no-sync');
        expect(ruleIds).toContain('@typescript-eslint/no-floating-promises');
    });

    it('lints javascript tooling files with synchronous calls without a typescript project', async () => {
        const results = await createEslint().lintFiles(['tool.mjs']);
        const messages = results.flatMap((result) => result.messages);

        expect(messages.filter((message) => message.fatal)).toEqual([]);
        expect(messages.map((message) => message.ruleId)).not.toContain('n/no-sync');
    });

    it.each([
        ['module', 'module'],
        ['commonjs', 'commonjs'],
    ])('follows the package type %s of the project for .js files and the extension for .cjs and .mjs', async (type, sourceType) => {
        const project = mkdtempSync(join(tmpdir(), 'cloudflight-node-'));

        writeFileSync(join(project, 'package.json'), JSON.stringify({type}));
        try {
            const eslint = new ESLint({
                cwd: project,
                overrideConfigFile: true,
                overrideConfig: cloudflightNodeConfig({rootDirectory: project}),
            });
            const expectations: [string, string][] = [['tool.js', sourceType], ['tool.cjs', 'commonjs'], ['tool.mjs', 'module']];

            for (const [file, expected] of expectations) {
                const config: unknown = await eslint.calculateConfigForFile(join(project, file));

                expect(config).toMatchObject({languageOptions: {sourceType: expected}});
            }
            // commonjs globals stay available in .cjs files of a module project
            const [result] = await eslint.lintText('module.exports = 1;\n', {filePath: join(project, 'tool.cjs')});

            expect(result?.messages.map((message) => message.ruleId)).not.toContain('no-undef');
        }
        finally {
            rmSync(project, {recursive: true, force: true});
        }
    });

    it('accepts a workspace that gets the base package through this package only', () => {
        const project = mkdtempSync(join(tmpdir(), 'cloudflight-workspace-'));
        const hoistedBase = join(project, 'node_modules', '@cloudflight', 'eslint-plugin-typescript');

        mkdirSync(hoistedBase, {recursive: true});
        // a base package hoisted for another workspace, not declared by this one
        writeFileSync(join(project, 'package.json'), JSON.stringify({devDependencies: {'@cloudflight/eslint-plugin-node': '0.0.0'}}));
        writeFileSync(join(hoistedBase, 'package.json'), JSON.stringify({name: '@cloudflight/eslint-plugin-typescript', version: '0.0.0-older'}));
        try {
            expect(() => cloudflightNodeConfig({rootDirectory: project})).not.toThrow();
        }
        finally {
            rmSync(project, {recursive: true, force: true});
        }
    });

    it('rejects a project whose own base package has another version', () => {
        const project = mkdtempSync(join(tmpdir(), 'cloudflight-mixed-'));
        const olderBase = join(project, 'node_modules', '@cloudflight', 'eslint-plugin-typescript');

        mkdirSync(olderBase, {recursive: true});
        writeFileSync(join(project, 'package.json'), JSON.stringify({devDependencies: {'@cloudflight/eslint-plugin-typescript': '0.0.0-older'}}));
        writeFileSync(join(olderBase, 'package.json'), JSON.stringify({name: '@cloudflight/eslint-plugin-typescript', version: '0.0.0-older'}));
        try {
            expect(() => cloudflightNodeConfig({rootDirectory: project})).toThrow('Update all @cloudflight/eslint-plugin-* packages together');
        }
        finally {
            rmSync(project, {recursive: true, force: true});
        }
    });
});
