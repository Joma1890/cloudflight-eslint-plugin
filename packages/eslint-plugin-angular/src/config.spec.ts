import {ESLint, type Linter} from 'eslint';
import {join} from 'node:path';

import {cloudflightAngularConfig} from './index';

const fixtureDir = join(__dirname, '..', 'fixtures');

function createEslint(): ESLint {
    return new ESLint({
        cwd: fixtureDir,
        overrideConfigFile: true,
        // the typescript-eslint config types are structurally compatible with the eslint core types
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        overrideConfig: cloudflightAngularConfig({rootDirectory: fixtureDir}) as Linter.Config[],
    });
}

describe('cloudflightAngularConfig', () => {
    it('reports no errors for a valid component', async () => {
        const results = await createEslint().lintFiles(['valid.component.ts']);

        expect(results.flatMap((result) => result.messages)).toEqual([]);
    });

    it('reports angular and type-aware violations including inline templates', async () => {
        const results = await createEslint().lintFiles(['invalid.component.ts']);
        const ruleIds = results.flatMap((result) => result.messages).map((message) => message.ruleId);

        expect(ruleIds).toContain('@angular-eslint/no-empty-lifecycle-method');
        // proves the inline-template processor works
        expect(ruleIds).toContain('@angular-eslint/template/button-has-type');
        // proves typed linting works in angular projects
        expect(ruleIds).toContain('@typescript-eslint/no-floating-promises');
    });

    it('reports template violations in html files', async () => {
        const results = await createEslint().lintFiles(['invalid.template.html']);
        const ruleIds = results.flatMap((result) => result.messages).map((message) => message.ruleId);

        expect(ruleIds).toContain('@angular-eslint/template/button-has-type');
        expect(ruleIds).toContain('@angular-eslint/template/no-inline-styles');
    });
});
