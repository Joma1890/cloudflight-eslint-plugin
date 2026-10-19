import {type ESLint} from 'eslint';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';

import {
    appliedRules,
    createEslint,
    fixFile,
    formatCases,
    javascriptFiles,
    lintMessages,
    readWithUnixLineEndings,
    ruleIds,
    typescriptFiles,
} from '../../../test/eslint-helpers';
import {cloudflightTypescriptConfig, cloudflightTypescriptFormatConfig} from './index';
import {cloudflightTypescriptPlugin} from './rules';
import {NoOnEventAssign} from './rules/typescript/no-on-event-assign';

const fixtureDir = join(__dirname, '..', 'fixtures');
const inputDir = join(fixtureDir, 'format', 'input');
const expectedDir = join(fixtureDir, 'format', 'expected');

function lintConfig(tsConfigFiles?: string[]): ESLint {
    return createEslint(fixtureDir, cloudflightTypescriptConfig({rootDirectory: fixtureDir, tsConfigFiles}));
}

function formatConfig(fix = false): ESLint {
    return createEslint(fixtureDir, cloudflightTypescriptFormatConfig({rootDirectory: fixtureDir}), fix);
}

describe('cloudflightTypescriptPlugin', () => {
    it('carries the package version and links the rule documentation', () => {
        const manifest: unknown = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));

        expect(manifest).toMatchObject({version: cloudflightTypescriptPlugin.meta?.version});
        expect(NoOnEventAssign.meta.docs?.url).toContain('/src/rules/typescript/no-on-event-assign.ts');
    });
});

describe('cloudflightTypescriptConfig', () => {
    it('applies the expected rules to each file type', async () => {
        expect(await appliedRules(lintConfig(), fixtureDir, [...typescriptFiles, ...javascriptFiles])).toMatchSnapshot();
    });

    it.each([
        'valid/typescript.ts',
    ])('reports nothing for %s', async (file) => {
        expect(await lintMessages(lintConfig(), file)).toEqual([]);
    });

    it.each([
        ['core rules', 'invalid/typescript.ts', 'no-var'],
        ['typescript-eslint rules with type information', 'invalid/typescript.ts', '@typescript-eslint/no-floating-promises'],
        ['import rules', 'invalid/typescript.ts', 'import-x/no-mutable-exports'],
        ['custom rules', 'invalid/typescript.ts', '@cloudflight/typescript/no-on-event-assign'],
    ])('applies the %s', async (_layer, file, rule) => {
        expect(await ruleIds(lintConfig(), file)).toContain(rule);
    });

    describe('typed linting', () => {
        it('provides type information with an explicit tsConfigFiles configuration', async () => {
            expect(await ruleIds(lintConfig(['tsconfig.json']), 'invalid/typescript.ts')).toContain('@typescript-eslint/no-floating-promises');
        });
    });
});

describe('cloudflightTypescriptFormatConfig', () => {
    it('applies the expected rules to each file type', async () => {
        expect(await appliedRules(formatConfig(), fixtureDir, [...typescriptFiles, ...javascriptFiles])).toMatchSnapshot();
    });

    it.each(formatCases(inputDir))('formats %s', async (file) => {
        const result = await fixFile(formatConfig(true), join(inputDir, file));

        expect(result.output).toBe(readWithUnixLineEndings(join(expectedDir, file)));
        expect(result.messages).toEqual([]);
    });

    it.each(formatCases(inputDir))('changes nothing in the formatted %s', async (file) => {
        const result = await fixFile(formatConfig(true), join(expectedDir, file));

        expect(result.output).toBe(readWithUnixLineEndings(join(expectedDir, file)));
        expect(result.messages).toEqual([]);
    });

    it.each(formatCases(inputDir))('leaves no lint findings in the formatted %s', async (file) => {
        expect(await lintMessages(lintConfig(), join(expectedDir, file))).toEqual([]);
    });

    describe('disable comments', () => {
        it('knows the lint rules', async () => {
            const result = await fixFile(formatConfig(true), join(fixtureDir, 'disable/lint-rules.ts'));

            expect(result.output).toBe(readWithUnixLineEndings(join(fixtureDir, 'disable/lint-rules.ts')));
            expect(result.messages).toEqual([]);
        });
    });
});
