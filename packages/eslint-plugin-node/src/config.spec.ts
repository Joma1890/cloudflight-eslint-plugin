import {type ESLint} from 'eslint';
import {join} from 'node:path';

import {
    appliedRules,
    createEslint,
    javascriptFiles,
    lintMessages,
    ruleIds,
    typescriptFiles,
} from '../../../test/eslint-helpers';
import {cloudflightNodeConfig} from './index';

const fixtureDir = join(__dirname, '..', 'fixtures');

function lintConfig(): ESLint {
    return createEslint(fixtureDir, cloudflightNodeConfig({rootDirectory: fixtureDir}));
}

describe('cloudflightNodeConfig', () => {
    it('applies the expected rules to each file type', async () => {
        expect(await appliedRules(lintConfig(), fixtureDir, [...typescriptFiles, ...javascriptFiles])).toMatchSnapshot();
    });

    it.each([
        'valid/typescript.ts',
    ])('reports nothing for %s', async (file) => {
        expect(await lintMessages(lintConfig(), file)).toEqual([]);
    });

    it.each([
        ['node rules', 'invalid/typescript.ts', 'n/no-sync'],
        ['typescript-eslint rules with type information', 'invalid/typescript.ts', '@typescript-eslint/no-floating-promises'],
    ])('applies the %s', async (_layer, file, rule) => {
        expect(await ruleIds(lintConfig(), file)).toContain(rule);
    });
});
