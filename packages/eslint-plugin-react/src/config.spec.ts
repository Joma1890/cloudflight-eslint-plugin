import {ESLint, type Linter} from 'eslint';
import {mkdirSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

import {cloudflightReactConfig, cloudflightReactFormatConfig} from './index';

const fixtureDir = join(__dirname, '..', 'fixtures');

function createEslint(): ESLint {
    return new ESLint({
        cwd: fixtureDir,
        overrideConfigFile: true,
        // the typescript-eslint config types are structurally compatible with the eslint core types
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        overrideConfig: cloudflightReactConfig({rootDirectory: fixtureDir}) as Linter.Config[],
    });
}

describe('cloudflightReactConfig', () => {
    it('lints JSX outside tsconfig with shared and accessibility rules, without TS modifiers', async () => {
        const results = await createEslint().lintText('export class Box { render() { console.log("debug"); return <img src="logo.png" />; } }', {filePath: 'outside.jsx'});
        const messages = results.flatMap((result) => result.messages);
        const rules = messages.map((message) => message.ruleId);

        expect(messages.filter((message) => message.fatal)).toEqual([]);
        expect(rules).toContain('no-console');
        expect(rules).toContain('jsx-a11y/alt-text');
        expect(rules).not.toContain('@typescript-eslint/explicit-member-accessibility');
    });

    it('reports an undefined component in javascript files once', async () => {
        const results = await createEslint().lintText('export const view = <Missing />;', {filePath: 'outside.jsx'});
        const rules = results.flatMap((result) => result.messages).map((message) => message.ruleId);

        expect(rules.filter((rule) => rule === 'no-undef')).toHaveLength(1);
        expect(rules).not.toContain('react/jsx-no-undef');
    });

    it('reports no errors for valid code', async () => {
        const results = await createEslint().lintFiles(['valid.tsx']);

        expect(results.flatMap((result) => result.messages)).toEqual([]);
    });

    // this also proves the @eslint/compat fixup for eslint-plugin-react works on ESLint 10:
    // without it, linting crashes with "contextOrFilename.getFilename is not a function"
    // (https://github.com/jsx-eslint/eslint-plugin-react/issues/3977)
    it('reports react, hooks, a11y and type-aware violations', async () => {
        const results = await createEslint().lintFiles(['invalid.tsx']);
        const ruleIds = results.flatMap((result) => result.messages).map((message) => message.ruleId);

        expect(ruleIds).toContain('react/jsx-key');
        expect(ruleIds).toContain('react-hooks/rules-of-hooks');
        expect(ruleIds).toContain('jsx-a11y/alt-text');
        expect(ruleIds).toContain('@typescript-eslint/no-floating-promises');
    });

    it('fixes formatting in tsx files with the format config', async () => {
        const eslint = new ESLint({
            cwd: fixtureDir,
            overrideConfigFile: true,
            fix: true,
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            overrideConfig: cloudflightReactFormatConfig({rootDirectory: fixtureDir}) as Linter.Config[],
        });
        // a disable comment for a react rule must be recognized although the format config runs no react rules
        const [result] = await eslint.lintText('// eslint-disable-next-line react-hooks/exhaustive-deps\nexport const value=1', {filePath: 'format.tsx'});
        // the fixed output must be clean and stable: nothing left to report, and a second pass changes nothing
        const [second] = await eslint.lintText(result?.output ?? '', {filePath: 'format.tsx'});

        expect(result?.output).toContain('value = 1;');
        expect(result?.messages).toEqual([]);
        expect(second?.output).toBeUndefined();
        expect(second?.messages).toEqual([]);
    });

    it('rejects a project whose own base package has another version', () => {
        const project = mkdtempSync(join(tmpdir(), 'cloudflight-mixed-'));
        const olderBase = join(project, 'node_modules', '@cloudflight', 'eslint-plugin-typescript');

        mkdirSync(olderBase, {recursive: true});
        writeFileSync(join(project, 'package.json'), JSON.stringify({devDependencies: {'@cloudflight/eslint-plugin-typescript': '0.0.0-older'}}));
        writeFileSync(join(olderBase, 'package.json'), JSON.stringify({name: '@cloudflight/eslint-plugin-typescript', version: '0.0.0-older'}));
        try {
            expect(() => cloudflightReactConfig({rootDirectory: project})).toThrow('Update all @cloudflight/eslint-plugin-* packages together');
        }
        finally {
            rmSync(project, {recursive: true, force: true});
        }
    });
});
