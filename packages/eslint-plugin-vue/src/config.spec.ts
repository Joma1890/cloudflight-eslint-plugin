import {ESLint, type Linter} from 'eslint';
import {mkdirSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

import {cloudflightVueConfig} from './index';

const fixtureDir = join(__dirname, '..', 'fixtures');

function createEslint(tsConfigFiles?: string[]): ESLint {
    return new ESLint({
        cwd: fixtureDir,
        overrideConfigFile: true,
        // the typescript-eslint config types are structurally compatible with the eslint core types
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        overrideConfig: cloudflightVueConfig({rootDirectory: fixtureDir, tsConfigFiles}) as Linter.Config[],
    });
}

describe('cloudflightVueConfig', () => {
    it('reports no errors for a valid SFC', async () => {
        const results = await createEslint().lintFiles(['ValidForm.vue']);

        expect(results.flatMap((result) => result.messages)).toEqual([]);
    });

    it('reports vue template and type-aware script violations', async () => {
        const results = await createEslint().lintFiles(['InvalidForm.vue']);
        const ruleIds = results.flatMap((result) => result.messages).map((message) => message.ruleId);

        expect(ruleIds).toContain('vue/html-button-has-type');
        // proves typed linting works inside .vue SFCs
        expect(ruleIds).toContain('@typescript-eslint/no-floating-promises');
    });

    it('reports duplicate imports in SFC scripts, where import-x is not applied', async () => {
        const results = await createEslint().lintFiles(['DuplicateImports.vue']);
        const ruleIds = results.flatMap((result) => result.messages).map((message) => message.ruleId);

        expect(ruleIds).toContain('no-duplicate-imports');
    });

    it('keeps the no-unsafe rules for typescript files of a vue project', async () => {
        const results = await createEslint().lintFiles(['unsafe.ts']);
        const ruleIds = results.flatMap((result) => result.messages).map((message) => message.ruleId);

        expect(ruleIds).toContain('@typescript-eslint/no-unsafe-member-access');
        expect(ruleIds).toContain('@typescript-eslint/no-unsafe-return');
    });

    it('uses an explicit tsconfig project for conventional SFC scripts and TypeScript files', async () => {
        const results = await createEslint(['explicit-tsconfig/tsconfig.lint.json']).lintFiles(['explicit-tsconfig/Form.vue', 'explicit-tsconfig/outside.ts']);

        expect(results).toHaveLength(2);
        for (const result of results) {
            expect(result.messages.filter((message) => message.fatal)).toEqual([]);
            expect(result.messages.map((message) => message.ruleId)).toContain('@typescript-eslint/no-floating-promises');
        }
    });

    it('lints a template-only SFC without a script block', async () => {
        const results = await createEslint().lintFiles(['OnlyTemplate.vue']);

        expect(results.flatMap((result) => result.messages).filter((message) => message.severity === 2)).toEqual([]);
    });

    it('rejects a project whose own base package has another version', () => {
        const project = mkdtempSync(join(tmpdir(), 'cloudflight-mixed-'));
        const olderBase = join(project, 'node_modules', '@cloudflight', 'eslint-plugin-typescript');

        mkdirSync(olderBase, {recursive: true});
        writeFileSync(join(project, 'package.json'), JSON.stringify({devDependencies: {'@cloudflight/eslint-plugin-typescript': '0.0.0-older'}}));
        writeFileSync(join(olderBase, 'package.json'), JSON.stringify({name: '@cloudflight/eslint-plugin-typescript', version: '0.0.0-older'}));
        try {
            expect(() => cloudflightVueConfig({rootDirectory: project})).toThrow('Update all @cloudflight/eslint-plugin-* packages together');
        }
        finally {
            rmSync(project, {recursive: true, force: true});
        }
    });
});
