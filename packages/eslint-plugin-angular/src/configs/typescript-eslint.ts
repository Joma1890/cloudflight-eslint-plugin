import {TSESLint} from '@typescript-eslint/utils';

export const typescriptEslintRules: TSESLint.Linter.RulesRecord = {
    // angular modules are usually empty, so this rule is turned off just for them
    '@typescript-eslint/no-extraneous-class': 'off',
};
