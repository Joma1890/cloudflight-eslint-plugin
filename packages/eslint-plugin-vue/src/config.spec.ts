import {type ESLint} from 'eslint';
import {join} from 'node:path';

import {appliedRules, createEslint, javascriptFiles, lintMessages, ruleIds, typescriptFiles} from '../../../test/eslint-helpers';
import {cloudflightVueConfig} from './index';

const fixtureDir = join(__dirname, '..', 'fixtures');

function lintConfig(): ESLint {
    return createEslint(fixtureDir, cloudflightVueConfig({rootDirectory: fixtureDir}));
}

describe('cloudflightVueConfig', () => {
    it('applies the expected rules to each file type', async () => {
        expect(await appliedRules(lintConfig(), fixtureDir, [...typescriptFiles, ...javascriptFiles])).toMatchSnapshot();
    });

    // the config reads the script of each single-file component, so the typed and the untyped one need real files
    it.each([
        'valid/ContactForm.vue',
    ])('applies the expected rules to %s', async (file) => {
        expect(await appliedRules(lintConfig(), fixtureDir, [file])).toMatchSnapshot();
    });

    it.each([
        'valid/ContactForm.vue',
    ])('reports nothing for %s', async (file) => {
        expect(await lintMessages(lintConfig(), file)).toEqual([]);
    });

    it.each([
        ['vue template rules', 'invalid/ContactForm.vue', 'vue/html-button-has-type'],
        ['typescript-eslint rules with type information in scripts', 'invalid/ContactForm.vue', '@typescript-eslint/no-floating-promises'],
    ])('applies the %s', async (_layer, file, rule) => {
        expect(await ruleIds(lintConfig(), file)).toContain(rule);
    });
});
