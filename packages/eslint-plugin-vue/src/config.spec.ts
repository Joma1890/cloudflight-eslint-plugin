import {ESLint, type Linter} from 'eslint';
import {join} from 'node:path';

import {cloudflightVueConfig} from './index';

const fixtureDir = join(__dirname, '..', 'fixtures');

function createEslint(): ESLint {
    return new ESLint({
        cwd: fixtureDir,
        overrideConfigFile: true,
        // the typescript-eslint config types are structurally compatible with the eslint core types
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        overrideConfig: cloudflightVueConfig({rootDirectory: fixtureDir}) as Linter.Config[],
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
});
