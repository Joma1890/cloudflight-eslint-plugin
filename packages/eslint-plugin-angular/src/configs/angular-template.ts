import {TSESLint} from '@typescript-eslint/utils';

export const angularTemplateRules: TSESLint.Linter.RulesRecord = {
    '@angular-eslint/template/button-has-type': 'error',
    '@angular-eslint/template/eqeqeq': [
        'off', // disable it for now since it does not work correctly
        {
            allowNullOrUndefined: true,
        },
    ],
    // does not work with custom input components
    '@angular-eslint/template/label-has-associated-control': 'off',
    '@angular-eslint/template/no-any': 'error',
    // disabled as there is no way to allow signals only and is unlikely to ever be supported
    // see: https://github.com/angular-eslint/angular-eslint/issues/1380
    '@angular-eslint/template/no-call-expression': 'off',
    '@angular-eslint/template/no-duplicate-attributes': 'error',
    '@angular-eslint/template/no-inline-styles': 'error',
    '@angular-eslint/template/no-interpolation-in-attributes': 'error',
    '@angular-eslint/template/no-positive-tabindex': 'error',
    // part of the recommended preset since angular-eslint 22: every *ngIf, *ngFor and *ngSwitch is
    // reported, `ng generate @angular/core:control-flow` migrates a project
    '@angular-eslint/template/prefer-control-flow': 'error',
    '@angular-eslint/template/prefer-ngsrc': 'error',
    // does not provide any value for primitive types
    // it is fine to not have this automated for now
    // since it is a performance improvement and not a bug
    '@angular-eslint/template/use-track-by-function': 'off',
};
