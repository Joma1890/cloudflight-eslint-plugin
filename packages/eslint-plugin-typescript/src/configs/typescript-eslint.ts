import type {TSESLint} from '@typescript-eslint/utils';

export const typescriptEslintRules: TSESLint.Linter.RulesRecord = {
    // we do not need to care about js codebases, they are outside our scope
    '@typescript-eslint/consistent-generic-constructors': 'off',
    '@typescript-eslint/consistent-type-assertions': ['error', {assertionStyle: 'never'}],
    'default-param-last': 'off',
    '@typescript-eslint/default-param-last': 'error',
    '@typescript-eslint/explicit-function-return-type': ['error', {allowExpressions: true}],
    '@typescript-eslint/explicit-member-accessibility': ['error', {accessibility: 'explicit'}],
    '@typescript-eslint/member-ordering': [
        'error',
        {default: ['static-field', 'field', 'signature', 'constructor', 'static-method', 'method']},
    ],
    // this rule prevents oneliner functions, which are very useful in component templates
    '@typescript-eslint/no-confusing-void-expression': 'off',
    '@typescript-eslint/no-floating-promises': ['error', {ignoreVoid: true}],
    '@typescript-eslint/no-inferrable-types': ['error', {ignoreParameters: true}],
    'no-invalid-this': 'off',
    '@typescript-eslint/no-invalid-this': 'error',
    '@typescript-eslint/no-invalid-void-type': ['error', {allowInGenericTypeArguments: true, allowAsThisParameter: true}],
    'no-restricted-imports': 'off',
    'no-shadow': 'off',
    '@typescript-eslint/no-shadow': 'error',
    // typescript by default does not add undefined to the type of index-accessed properties
    // because of that this rule incorrectly points correct checks out as error.
    // typescript offers the compiler setting 'noPropertyAccessFromIndexSignature' which would solve this issue,
    // but it is not perfect. It also adds 'undefined' to the type even if there was a bounds-check already.
    '@typescript-eslint/no-unnecessary-condition': ['off', {allowConstantLoopConditions: true}],
    // this rule makes it hard to work with the default functionalities of js itself, thus disabled
    '@typescript-eslint/no-unsafe-argument': 'off',
    // enums can be used as a holder of constants, working
    // with external APIs can be painful if this is not allowed
    '@typescript-eslint/no-unsafe-enum-comparison': 'off',
    '@typescript-eslint/no-unsafe-unary-minus': 'error',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error', {args: 'none', ignoreRestSiblings: true}],
    '@typescript-eslint/promise-function-async': 'error',
    '@typescript-eslint/require-array-sort-compare': 'error',
    '@typescript-eslint/require-await': 'error',
    '@typescript-eslint/strict-boolean-expressions': 'error',
    '@typescript-eslint/switch-exhaustiveness-check': 'error',
};

export const typescriptEslintDisableTypeCheckedRules: TSESLint.Linter.RulesRecord = {
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-member-accessibility': 'off',
};
