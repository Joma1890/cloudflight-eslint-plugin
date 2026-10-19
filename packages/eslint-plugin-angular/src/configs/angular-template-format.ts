import {TSESLint} from '@typescript-eslint/utils';

// runs with --fix in the pre-commit hook, only fixable rules belong here
export const angularTemplateFormatRules: TSESLint.Linter.RulesRecord = {
    '@angular-eslint/template/attributes-order': 'error',
    '@angular-eslint/template/prefer-self-closing-tags': 'error',
};
