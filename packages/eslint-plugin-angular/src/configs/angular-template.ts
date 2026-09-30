import {TSESLint} from '@typescript-eslint/utils';

export const angularTemplateRules: TSESLint.Linter.RulesRecord = {
    '@angular-eslint/template/button-has-type': 'error',
    // complexity rules are not auto-fixable, so they belong in the lint config,
    // not in the format config that runs with --fix in pre-commit hooks
    '@angular-eslint/template/conditional-complexity': ['error', {maxComplexity: 3}],
    '@angular-eslint/template/cyclomatic-complexity': ['error', {maxComplexity: 5}],
    // loose comparisons with null and undefined are allowed
    '@angular-eslint/template/eqeqeq': ['error', {allowNullOrUndefined: true}],
    // does not work with custom input components
    '@angular-eslint/template/label-has-associated-control': 'off',
    '@angular-eslint/template/no-any': 'error',
    // disabled as there is no way to allow signals only and is unlikely to ever be supported
    // see: https://github.com/angular-eslint/angular-eslint/issues/1380
    '@angular-eslint/template/no-call-expression': 'off',
    '@angular-eslint/template/no-duplicate-attributes': 'error',
    // empty blocks are leftovers of unfinished refactorings
    '@angular-eslint/template/no-empty-control-flow': 'error',
    '@angular-eslint/template/no-inline-styles': 'error',
    '@angular-eslint/template/no-interpolation-in-attributes': 'error',
    // invalid html, the browser closes the outer tag
    '@angular-eslint/template/no-nested-tags': 'error',
    // like @typescript-eslint/no-non-null-assertion in the typescript rules
    '@angular-eslint/template/no-non-null-assertion': 'error',
    // detaches the element from the view
    '@angular-eslint/template/no-outerhtml': 'error',
    '@angular-eslint/template/no-positive-tabindex': 'error',
    // the angular style guide prefers class and style bindings over ngClass and ngStyle
    '@angular-eslint/template/prefer-class-binding': 'error',
    '@angular-eslint/template/prefer-style-binding': 'error',
    // like prefer-template in the typescript rules
    '@angular-eslint/template/prefer-template-literal': 'error',
    // part of the recommended preset since angular-eslint 22: every *ngIf, *ngFor and *ngSwitch is
    // reported, `ng generate @angular/core:control-flow` migrates a project
    '@angular-eslint/template/prefer-control-flow': 'error',
    '@angular-eslint/template/prefer-ngsrc': 'error',
    // does not provide any value for primitive types
    // it is fine to not have this automated for now
    // since it is a performance improvement and not a bug
    '@angular-eslint/template/use-track-by-function': 'off',
};
