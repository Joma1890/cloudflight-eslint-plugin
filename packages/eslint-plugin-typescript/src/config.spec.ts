import {ESLint, type Linter} from 'eslint';
import {join} from 'node:path';

import {cloudflightTypescriptConfig, cloudflightTypescriptFormatConfig} from './index';

const fixtureDir = join(__dirname, '..', 'fixtures');

function createEslint(tsConfigFiles?: string[]): ESLint {
    return new ESLint({
        cwd: fixtureDir,
        overrideConfigFile: true,
        // the typescript-eslint config types are structurally compatible with the eslint core types
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        overrideConfig: cloudflightTypescriptConfig({rootDirectory: fixtureDir, tsConfigFiles}) as Linter.Config[],
    });
}

async function ruleIdsFor(file: string): Promise<(string | null)[]> {
    const results = await createEslint().lintFiles([file]);

    return results.flatMap((result) => result.messages).map((message) => message.ruleId);
}

describe('cloudflightTypescriptConfig', () => {
    it('reports no errors for valid code', async () => {
        const results = await createEslint().lintFiles(['valid.ts']);

        expect(results.flatMap((result) => result.messages)).toEqual([]);
    });

    it('reports violations including type-aware, security and custom rules', async () => {
        const ruleIds = await ruleIdsFor('invalid.ts');

        // proves typed linting works: rule needs type information
        expect(ruleIds).toContain('@typescript-eslint/no-floating-promises');
        expect(ruleIds).toContain('no-unsanitized/property');
        expect(ruleIds).toContain('@cloudflight/typescript/no-on-event-assign');
        expect(ruleIds).toContain('no-var');
    });

    it('reports a typescript file that no tsconfig.json includes instead of linting it without types', async () => {
        const results = await createEslint().lintFiles(['orphan/orphan.ts']);
        const messages = results.flatMap((result) => result.messages);

        expect(messages).toHaveLength(1);
        expect(messages[0]?.fatal).toBe(true);
        expect(messages[0]?.message).toContain('was not found by the project service');
    });

    it('provides type information with an explicit tsConfigFiles configuration', async () => {
        const results = await createEslint(['tsconfig.json']).lintFiles(['invalid.ts']);
        const ruleIds = results.flatMap((result) => result.messages).map((message) => message.ruleId);

        expect(ruleIds).toContain('@typescript-eslint/no-floating-promises');
    });

    it.each(['js', 'jsx'])('lints untyped .%s files outside tsconfig without TS-only syntax requirements', async (extension) => {
        const results = await createEslint().lintText('class Box { method() { return "ok"; } } new Box().method();', {
            filePath: `outside.${extension}`,
        });

        expect(results.flatMap((result) => result.messages).filter((message) => message.severity === 2)).toEqual([]);
    });

    it('reports a caught error that is thrown away', async () => {
        const results = await createEslint().lintText('try { JSON.parse("x"); } catch (error) { throw new Error("failed"); }\n', {filePath: 'invalid.ts'});
        const rules = results.flatMap((result) => result.messages).map((message) => message.ruleId);

        expect(rules).toContain('preserve-caught-error');
    });

    it('fixes formatting with the format config', async () => {
        const eslint = new ESLint({
            cwd: fixtureDir,
            overrideConfigFile: true,
            fix: true,
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            overrideConfig: cloudflightTypescriptFormatConfig({rootDirectory: fixtureDir}) as Linter.Config[],
        });
        const [result] = await eslint.lintText('export const value=1', {filePath: 'format.ts'});
        // the fixed output must be clean and stable: nothing left to report, and a second pass changes nothing
        const [second] = await eslint.lintText(result?.output ?? '', {filePath: 'format.ts'});

        expect(result?.output).toContain('value = 1;');
        expect(result?.messages).toEqual([]);
        expect(second?.output).toBeUndefined();
        expect(second?.messages).toEqual([]);
    });
});
