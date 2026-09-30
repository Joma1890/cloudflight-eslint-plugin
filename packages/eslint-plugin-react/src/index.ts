import type {FlatConfig} from '@typescript-eslint/utils/ts-eslint';
import type {Linter} from 'eslint';

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

import {assertMatchingBaseVersion} from './base-version';
import {reactRules} from './configs/react';

const relevantFiles = ['**/*.{js,jsx,mjs,cjs,ts,mts,cts,tsx}'];

// eslint-plugin-react 7.x still calls rule-context APIs that were removed in ESLint 10
// (e.g. context.getFilename()), which crashes at lint time on ESLint 10.
// Until upstream ships a compatible release the rules are wrapped with the official
// @eslint/compat fixup layer. See https://github.com/jsx-eslint/eslint-plugin-react/issues/3977
const pluginReactFixed = fixupPluginRules(pluginReact);

/**
 * The React lint config: the TypeScript config plus the react, react-hooks and jsx-a11y rules.
 * @throws Error when the installed @cloudflight/eslint-plugin-typescript has a different version than this package.
 */
export function cloudflightReactConfig(settings: CloudflightEslintPluginSettings): Linter.Config[] {
    assertMatchingBaseVersion(settings.rootDirectory);

    // eslint-disable-next-line @typescript-eslint/no-deprecated -- tseslint.config is deprecated but defineConfig has type incompatibilities with typescript-eslint
    return eslintConfigs(tseslint.config(
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
        {
            files: ['**/*.{js,jsx,mjs,cjs}'],
            name: 'cloudflight/react/javascript-rules',
            rules: {
                // the core no-undef rule is active for javascript files and reports the same identifier
                'react/jsx-no-undef': 'off',
            },
        },
    ));
}

/**
 * The React format config: the TypeScript format config with JSX parsing.
 * @throws Error when the installed @cloudflight/eslint-plugin-typescript has a different version than this package.
 */
export function cloudflightReactFormatConfig(settings: CloudflightEslintPluginSettings): Linter.Config[] {
    assertMatchingBaseVersion(settings.rootDirectory);

    return eslintConfigs([
        ...cloudflightTypescriptFormatConfig(settings),
        {
            files: relevantFiles,
            // registered without rules, so eslint recognizes react, react-hooks and jsx-a11y disable comments
            // in the format run; the same plugin objects as in the lint config, so both configs can be combined
            plugins: {
                // typed as {react: any} upstream, the preset registers 'react-hooks'
                ...pluginReactHooks.configs.flat['recommended-latest'].plugins,
                ...pluginJsxA11y.flatConfigs.recommended.plugins,
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
            settings: {
                react: {
                    version: 'detect',
                },
            },
        },
    ]);
}

/**
 * The config objects are valid eslint configs; typescript-eslint's config type is stricter than
 * eslint's own and is not accepted by eslint's `defineConfig` or in a typed `eslint.config.ts`.
 */
function eslintConfigs(configs: FlatConfig.ConfigArray): Linter.Config[] {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return configs as Linter.Config[];
}
