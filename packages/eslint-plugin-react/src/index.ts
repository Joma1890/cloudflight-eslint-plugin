import type {FlatConfig} from '@typescript-eslint/utils/ts-eslint';

import {
    CloudflightEslintPluginSettings,
    cloudflightTypescriptConfig,
    cloudflightTypescriptFormatConfig,
} from '@cloudflight/eslint-plugin-typescript';
import {fixupPluginRules} from '@eslint/compat';
import pluginJsxA11y from 'eslint-plugin-jsx-a11y';
import pluginReact from 'eslint-plugin-react';
import * as pluginReactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

import {reactRules} from './configs/react';

const relevantFiles = ['**/*.{js,jsx,mjs,cjs,ts,mts,cts,tsx}'];

// eslint-plugin-react 7.x still calls rule-context APIs that were removed in ESLint 10
// (e.g. context.getFilename()), which crashes at lint time on ESLint 10.
// Until upstream ships a compatible release the rules are wrapped with the official
// @eslint/compat fixup layer. See https://github.com/jsx-eslint/eslint-plugin-react/issues/3977
const pluginReactFixed = fixupPluginRules(pluginReact);

export function cloudflightReactConfig(settings: CloudflightEslintPluginSettings): FlatConfig.ConfigArray {
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- tseslint.config is deprecated but defineConfig has type incompatibilities with typescript-eslint
    return tseslint.config(
        ...cloudflightTypescriptConfig(settings),
        {
            files: relevantFiles,
            extends: [
                pluginReactHooks.configs.flat['recommended-latest'],
                pluginJsxA11y.flatConfigs.recommended,
            ],
            plugins: {
                react: pluginReactFixed,
            },
            languageOptions: {
                parser: tseslint.parser,
                ecmaVersion: 'latest',
                sourceType: 'module',
                parserOptions: {
                    jsxPragma: null,
                    ecmaFeatures: {
                        jsx: true,
                    },
                },
            },
            name: 'cloudflight/react/rules',
            rules: {
                // configs.flat is typed as Record<string, ...>, so its entries are possibly undefined under noUncheckedIndexedAccess
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                ...pluginReact.configs.flat['recommended']!.rules,
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                ...pluginReact.configs.flat['jsx-runtime']!.rules,
                ...reactRules,
            },
            settings: {
                react: {
                    version: 'detect',
                },
            },
        },
    );
}

export function cloudflightReactFormatConfig(settings: CloudflightEslintPluginSettings): FlatConfig.ConfigArray {
    return [
        ...cloudflightTypescriptFormatConfig(settings),
        {
            files: relevantFiles,
            languageOptions: {
                parser: tseslint.parser,
                ecmaVersion: 'latest',
                sourceType: 'module',
                parserOptions: {
                    jsxPragma: null,
                    ecmaFeatures: {
                        jsx: true,
                    },
                },
            },
            settings: {
                react: {
                    version: 'detect',
                },
            },
        },
    ];
}
