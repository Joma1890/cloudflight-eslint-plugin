import {TSESLint} from '@typescript-eslint/utils';

// only auto-fixable rules belong here: this config runs with --fix in pre-commit hooks
export const angularTemplateFormatRules: TSESLint.Linter.RulesRecord = {
    '@angular-eslint/template/attributes-order': 'error',
    '@angular-eslint/template/prefer-self-closing-tags': 'error',
    // title="text" instead of [title]="'text'"
    '@angular-eslint/template/prefer-static-string-properties': 'error',
};
