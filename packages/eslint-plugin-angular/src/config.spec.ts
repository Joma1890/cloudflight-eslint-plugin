import {ESLint, type Linter} from 'eslint';
import {join} from 'node:path';

import {cloudflightAngularConfig, cloudflightAngularFormatConfig} from './index';

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
        expect(ruleIds).toContain('@angular-eslint/template/prefer-control-flow');
    });

    it('fixes formatting in templates and typescript files with the format config', async () => {
        const eslint = new ESLint({
            cwd: fixtureDir,
            overrideConfigFile: true,
            fix: true,
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            overrideConfig: cloudflightAngularFormatConfig({rootDirectory: fixtureDir}) as Linter.Config[],
        });
        const [template] = await eslint.lintText('<app-child></app-child>', {filePath: 'format.html'});
        // a disable comment for an angular rule must be recognized although the format config runs no angular rules
        const [script] = await eslint.lintText('// eslint-disable-next-line @angular-eslint/component-class-suffix\nexport const value=1', {filePath: 'format.ts'});
        // the fixed output must be clean and stable: nothing left to report, and a second pass changes nothing
        const [templateAgain] = await eslint.lintText(template?.output ?? '', {filePath: 'format.html'});
        const [scriptAgain] = await eslint.lintText(script?.output ?? '', {filePath: 'format.ts'});

        expect(template?.output).toContain('<app-child />');
        expect(script?.output).toContain('value = 1;');
        for (const result of [template, script]) {
            expect(result?.messages).toEqual([]);
        }
        for (const result of [templateAgain, scriptAgain]) {
            expect(result?.output).toBeUndefined();
            expect(result?.messages).toEqual([]);
        }
    });
});
