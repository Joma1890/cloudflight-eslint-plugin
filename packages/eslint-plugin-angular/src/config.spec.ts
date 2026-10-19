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
import {cloudflightAngularConfig} from './index';

const fixtureDir = join(__dirname, '..', 'fixtures');
const files = [...typescriptFiles, ...javascriptFiles, 'file.html'];

function lintConfig(): ESLint {
    return createEslint(fixtureDir, cloudflightAngularConfig({rootDirectory: fixtureDir}));
}

describe('cloudflightAngularConfig', () => {
    it('applies the expected rules to each file type', async () => {
        expect(await appliedRules(lintConfig(), fixtureDir, files)).toMatchSnapshot();
    });

    it.each([
        'valid/component.ts',
        'valid/template.html',
    ])('reports nothing for %s', async (file) => {
        expect(await lintMessages(lintConfig(), file)).toEqual([]);
    });

    it.each([
        ['angular rules', 'invalid/component.ts', '@angular-eslint/no-empty-lifecycle-method'],
        ['template rules in inline templates', 'invalid/component.ts', '@angular-eslint/template/button-has-type'],
        ['typescript-eslint rules with type information', 'invalid/component.ts', '@typescript-eslint/no-floating-promises'],
        ['template rules in html files', 'invalid/template.html', '@angular-eslint/template/button-has-type'],
    ])('applies the %s', async (_layer, file, rule) => {
        expect(await ruleIds(lintConfig(), file)).toContain(rule);
    });
});
