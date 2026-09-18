import {TSESLint} from '@typescript-eslint/utils';

export const angularRules: TSESLint.Linter.RulesRecord = {
    // the angular team no longer recommends class suffixes since v20, the cli generates classes
    // without them; kept as house style for now
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
    // correctness rules the recommended preset does not enable, available since angular-eslint
    // 17.2 (no-async-lifecycle-method), 17.4 (no-duplicates-in-metadata-arrays) and 19.7 (no-uncalled-signals)
    '@angular-eslint/no-async-lifecycle-method': 'error',
    '@angular-eslint/no-duplicates-in-metadata-arrays': 'error',
    '@angular-eslint/no-uncalled-signals': 'error',
    '@angular-eslint/computed-must-return': 'error',
    '@angular-eslint/no-implicit-take-until-destroyed': 'error',
    '@angular-eslint/require-lifecycle-on-prototype': 'error',
    // prefer-signals covers inputs and queries, this covers @Output
    '@angular-eslint/prefer-output-emitter-ref': 'error',
};
