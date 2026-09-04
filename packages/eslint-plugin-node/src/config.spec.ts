import {ESLint, type Linter} from 'eslint';
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

    it('reports node and type-aware violations', async () => {
        const results = await createEslint().lintFiles(['invalid.ts']);
        const ruleIds = results.flatMap((result) => result.messages).map((message) => message.ruleId);

        expect(ruleIds).toContain('n/no-sync');
        expect(ruleIds).toContain('@typescript-eslint/no-floating-promises');
    });
});
