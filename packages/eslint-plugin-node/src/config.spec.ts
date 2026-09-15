import {ESLint, type Linter} from 'eslint';
import {mkdirSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

import {cloudflightNodeConfig} from './index';

const fixtureDir = join(__dirname, '..', 'fixtures');

function createEslint(): ESLint {
    return new ESLint({
        cwd: fixtureDir,
        overrideConfigFile: true,
        // the typescript-eslint config types are structurally compatible with the eslint core types
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        overrideConfig: cloudflightNodeConfig({rootDirectory: fixtureDir}) as Linter.Config[],
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
