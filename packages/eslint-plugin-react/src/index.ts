import type {FlatConfig} from '@typescript-eslint/utils/ts-eslint';

import {
    CloudflightEslintPluginSettings,
    cloudflightTypescriptBaseConfig,
    cloudflightTypescriptConfig,
    cloudflightTypescriptFormatConfig,
    cloudflightTypescriptImportConfig,
} from '@cloudflight/eslint-plugin-typescript';
import pluginJsxA11y from 'eslint-plugin-jsx-a11y';
import pluginReact from 'eslint-plugin-react';
import * as pluginReactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

import {reactRules} from './configs/react';

const relevantFiles = ['**/*.{js,jsx,mjs,cjs,ts,mts,cts,tsx}'];

export function cloudflightReactConfig(settings: CloudflightEslintPluginSettings): FlatConfig.ConfigArray {
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- tseslint.config is deprecated but defineConfig has type incompatibilities with typescript-eslint
    return tseslint.config(
        ...cloudflightTypescriptConfig(settings),
        {
            files: relevantFiles,
            extends: [
                // eslint-disable-next-line @typescript-eslint/no-deprecated
                ...cloudflightTypescriptBaseConfig,
                // eslint-disable-next-line @typescript-eslint/no-deprecated
                ...cloudflightTypescriptImportConfig(settings),
                // type assertion is workaround for incorrect TypeScript types in eslint-plugin-react
                // see https://github.com/jsx-eslint/eslint-plugin-react/issues/3838
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                pluginReact.configs.flat['recommended']!,
                // type assertion is workaround for incorrect TypeScript types in eslint-plugin-react
                // see https://github.com/jsx-eslint/eslint-plugin-react/issues/3838
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                pluginReact.configs.flat['jsx-runtime']!,
                pluginReactHooks.configs.flat['recommended-latest'],
                pluginJsxA11y.flatConfigs.recommended,
            ],
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
    const mappedConfigs = cloudflightTypescriptFormatConfig(settings).map((config) => {
        if (config.files == null) {
            return config;
        }

        return {
            ...config,
            files: relevantFiles,
        };
    });

    return [
        ...mappedConfigs,
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
