import {ESLint} from 'eslint';
import {mkdirSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

import {cloudflightAngularConfig, cloudflightAngularFormatConfig} from './index';

const fixtureDir = join(__dirname, '..', 'fixtures');

function createEslint(): ESLint {
    return new ESLint({
        cwd: fixtureDir,
        overrideConfigFile: true,
        overrideConfig: cloudflightAngularConfig({rootDirectory: fixtureDir}),
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
        expect(ruleIds).toContain('@angular-eslint/prefer-output-emitter-ref');
        expect(ruleIds).toContain('@angular-eslint/computed-must-return');
        expect(ruleIds).toContain('@angular-eslint/require-lifecycle-on-prototype');
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
        expect(ruleIds).toContain('@angular-eslint/template/eqeqeq');
        expect(ruleIds).toContain('@angular-eslint/template/conditional-complexity');
        expect(ruleIds).toContain('@angular-eslint/template/prefer-class-binding');
        expect(ruleIds).toContain('@angular-eslint/template/prefer-style-binding');
        expect(ruleIds).toContain('@angular-eslint/template/no-nested-tags');
        expect(ruleIds).toContain('@angular-eslint/template/no-outerhtml');
        expect(ruleIds).toContain('@angular-eslint/template/no-empty-control-flow');
        expect(ruleIds).toContain('@angular-eslint/template/no-non-null-assertion');
        expect(ruleIds).toContain('@angular-eslint/template/prefer-template-literal');
    });

    it('fixes formatting in templates and typescript files with the format config', async () => {
        const eslint = new ESLint({
            cwd: fixtureDir,
            overrideConfigFile: true,
            fix: true,
            overrideConfig: cloudflightAngularFormatConfig({rootDirectory: fixtureDir}),
        });
        const [template] = await eslint.lintText('<app-child [title]="\'text\'"></app-child>', {filePath: 'format.html'});
        // a disable comment for an angular rule must be recognized although the format config runs no angular rules
        const [script] = await eslint.lintText('// eslint-disable-next-line @angular-eslint/component-class-suffix\nexport const value=1', {filePath: 'format.ts'});
        // the fixed output must be clean and stable: nothing left to report, and a second pass changes nothing
        const [templateAgain] = await eslint.lintText(template?.output ?? '', {filePath: 'format.html'});
        const [scriptAgain] = await eslint.lintText(script?.output ?? '', {filePath: 'format.ts'});

        expect(template?.output).toContain('<app-child title="text" />');
        expect(script?.output).toContain('value = 1;');
        for (const result of [template, script]) {
            expect(result?.messages).toEqual([]);
        }
        for (const result of [templateAgain, scriptAgain]) {
            expect(result?.output).toBeUndefined();
            expect(result?.messages).toEqual([]);
        }
    });

    it('rejects a project whose own base package has another version', () => {
        const project = mkdtempSync(join(tmpdir(), 'cloudflight-mixed-'));
        const olderBase = join(project, 'node_modules', '@cloudflight', 'eslint-plugin-typescript');

        mkdirSync(olderBase, {recursive: true});
        writeFileSync(join(project, 'package.json'), JSON.stringify({devDependencies: {'@cloudflight/eslint-plugin-typescript': '0.0.0-older'}}));
        writeFileSync(join(olderBase, 'package.json'), JSON.stringify({name: '@cloudflight/eslint-plugin-typescript', version: '0.0.0-older'}));
        try {
            expect(() => cloudflightAngularConfig({rootDirectory: project})).toThrow('Update all @cloudflight/eslint-plugin-* packages together');
        }
        finally {
            rmSync(project, {recursive: true, force: true});
        }
    });
});
