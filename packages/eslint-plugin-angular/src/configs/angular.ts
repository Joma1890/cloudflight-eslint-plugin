import {TSESLint} from '@typescript-eslint/utils';

export const angularRules: TSESLint.Linter.RulesRecord = {
    '@angular-eslint/component-class-suffix': [
        'error',
        {
            suffixes: ['Component', 'Page'],
        },
    ],
    '@angular-eslint/contextual-decorator': 'error',
    '@angular-eslint/contextual-lifecycle': 'error',
    '@angular-eslint/directive-class-suffix': 'error',
    '@angular-eslint/no-attribute-decorator': 'error',
    // no-conflicting-lifecycle was removed in angular-eslint v22
    '@angular-eslint/no-empty-lifecycle-method': 'error',
    '@angular-eslint/no-input-rename': 'error',
    '@angular-eslint/no-inputs-metadata-property': 'error',
    '@angular-eslint/no-output-native': 'error',
    '@angular-eslint/no-output-on-prefix': 'error',
    '@angular-eslint/no-output-rename': 'error',
    '@angular-eslint/no-outputs-metadata-property': 'error',
    '@angular-eslint/no-queries-metadata-property': 'error',
    '@angular-eslint/prefer-on-push-component-change-detection': 'error',
    '@angular-eslint/prefer-output-readonly': 'error',
    '@angular-eslint/relative-url-prefix': 'error',
    '@angular-eslint/use-lifecycle-interface': 'error',
    '@angular-eslint/use-pipe-transform-interface': 'error',
    '@angular-eslint/prefer-standalone': 'error',
    '@angular-eslint/prefer-signals': 'error',
};
