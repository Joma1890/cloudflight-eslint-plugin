import {ESLint, type Linter} from 'eslint';
import {defineConfig} from 'eslint/config';
import {readFileSync} from 'node:fs';
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

    it('keeps the core rules that typescript covers for javascript files', async () => {
        const results = await createEslint().lintText('const value = 1;\nvalue = 2;\nexport const environment = [process.cwd(), window.location, typo];\n', {filePath: 'outside.js'});
        const rules = results.flatMap((result) => result.messages).map((message) => message.ruleId);

        expect(rules).toContain('no-const-assign');
        // node and browser globals are declared, only the typo is undefined
        expect(rules.filter((rule) => rule === 'no-undef')).toHaveLength(1);
    });

    it('resolves the aliases of nested tsconfig files with the default configuration', async () => {
        const results = await createEslint().lintFiles(['nested-project/src/index.ts']);
        const messages = results.flatMap((result) => result.messages);

        expect(messages.filter((message) => message.fatal)).toEqual([]);
        expect(messages.map((message) => message.ruleId)).toContain('@typescript-eslint/no-floating-promises');
        expect(messages.map((message) => message.ruleId)).not.toContain('import-x/no-unresolved');
    });

    it('resolves nested aliases when eslint runs from another directory', async () => {
        const eslint = new ESLint({
            cwd: join(fixtureDir, '..'),
            overrideConfigFile: true,
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            overrideConfig: cloudflightTypescriptConfig({rootDirectory: fixtureDir}) as Linter.Config[],
        });
        const results = await eslint.lintFiles([join(fixtureDir, 'nested-project/src/index.ts')]);
        const messages = results.flatMap((result) => result.messages);

        expect(messages.map((message) => message.ruleId)).toContain('@typescript-eslint/no-floating-promises');
        expect(messages.map((message) => message.ruleId)).not.toContain('import-x/no-unresolved');
    });

    it('resolves the aliases of nested projects in directories with glob metacharacters', async () => {
        const file = join(fixtureDir, '[bracket]', 'src', 'index.ts');
        const results = await createEslint().lintText(readFileSync(file, 'utf8'), {filePath: file});
        const messages = results.flatMap((result) => result.messages);

        expect(messages.filter((message) => message.fatal)).toEqual([]);
        expect(messages.map((message) => message.ruleId)).not.toContain('import-x/no-unresolved');
    });

    it('can be extended by a scoped config object although nested projects exist', async () => {
        const eslint = new ESLint({
            cwd: fixtureDir,
            overrideConfigFile: true,
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            overrideConfig: defineConfig({files: ['**/*.ts'], extends: [cloudflightTypescriptConfig({rootDirectory: fixtureDir}) as Linter.Config[]]}),
        });
        const results = await eslint.lintFiles(['nested-project/src/index.ts']);
        const messages = results.flatMap((result) => result.messages);

        expect(messages.filter((message) => message.fatal)).toEqual([]);
        expect(messages.map((message) => message.ruleId)).not.toContain('import-x/no-unresolved');
    });

    it('resolves the aliases of hidden projects such as .storybook', async () => {
        const results = await createEslint().lintFiles(['.storybook/preview.ts']);
        const messages = results.flatMap((result) => result.messages);

        expect(messages.filter((message) => message.fatal)).toEqual([]);
        expect(messages.map((message) => message.ruleId)).toContain('@typescript-eslint/no-floating-promises');
        expect(messages.map((message) => message.ruleId)).not.toContain('import-x/no-unresolved');
    });

    it('keeps unrelated projects with broken tsconfig files out of other files', async () => {
        // broken-project/tsconfig.json extends a file that does not exist, like a generated nuxt config
        const results = await createEslint().lintFiles(['tool.mjs']);
        const messages = results.flatMap((result) => result.messages);

        expect(messages.filter((message) => message.fatal)).toEqual([]);
        expect(messages.map((message) => message.ruleId)).not.toContain('import-x/no-unresolved');
    });

    it('uses the custom project and resolves its aliases independently of process.cwd', async () => {
        const results = await createEslint(['explicit-tsconfig/tsconfig.lint.json']).lintFiles(['explicit-tsconfig/outside.ts']);
        const messages = results.flatMap((result) => result.messages);

        expect(messages.filter((message) => message.fatal)).toEqual([]);
        expect(messages.map((message) => message.ruleId)).toContain('@typescript-eslint/no-floating-promises');
        expect(messages.map((message) => message.ruleId)).not.toContain('import-x/no-unresolved');
    });

    it.each([
        ['throw "oops";', 'no-throw-literal', '@typescript-eslint/only-throw-error'],
        ['Promise.reject("oops");', 'prefer-promise-reject-errors', '@typescript-eslint/prefer-promise-reject-errors'],
    ])('reports %s once through the typed replacement of %s', async (code, coreRule, typedRule) => {
        const results = await createEslint().lintText(code, {filePath: 'invalid.ts'});
        const rules = results.flatMap((result) => result.messages).map((message) => message.ruleId);

        expect(rules.filter((rule) => rule === typedRule)).toHaveLength(1);
        expect(rules).not.toContain(coreRule);
    });

    it.each([
        ["export const value = process['env'];", 'dot-notation'],
        ['export async function load() { return 1; }', 'require-await'],
    ])('keeps the core rule for %s in javascript files', async (code, coreRule) => {
        const results = await createEslint().lintText(code, {filePath: 'outside.js'});
        const rules = results.flatMap((result) => result.messages).map((message) => message.ruleId);

        expect(rules).toContain(coreRule);
    });

    it('reports duplicate imports once through import-x', async () => {
        const results = await createEslint().lintText("import {join} from 'node:path';\nimport {resolve} from 'node:path';\n\nexport const paths = [join, resolve];\n", {filePath: 'invalid.ts'});
        const rules = results.flatMap((result) => result.messages).map((message) => message.ruleId);

        expect(rules).toContain('import-x/no-duplicates');
        expect(rules).not.toContain('no-duplicate-imports');
    });

    it('keeps the unused-expression options for JSX', async () => {
        const results = await createEslint().lintText('<div />;', {filePath: 'outside.jsx'});
        const rules = results.flatMap((result) => result.messages).map((message) => message.ruleId);

        expect(rules).toContain('@typescript-eslint/no-unused-expressions');
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

    it('formats enums and conditional operators like prettier', async () => {
        const eslint = new ESLint({
            cwd: fixtureDir,
            overrideConfigFile: true,
            fix: true,
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            overrideConfig: cloudflightTypescriptFormatConfig({rootDirectory: fixtureDir}) as Linter.Config[],
        });
        const source = "export enum Level {\n    Low = 1,\n    High = 2\n}\nexport const label = Level.Low === 1 ?\n    'low' :\n    'high';\nexport type Wide<T> = T extends string ?\n    string :\n    number;\n";
        const [result] = await eslint.lintText(source, {filePath: 'format.ts'});

        expect(result?.output).toBe("export enum Level {\n    Low = 1,\n    High = 2,\n}\nexport const label = Level.Low === 1\n    ? 'low'\n    : 'high';\nexport type Wide<T> = T extends string\n    ? string\n    : number;\n");
        expect(result?.messages).toEqual([]);
    });
});
