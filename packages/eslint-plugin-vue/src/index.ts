import type {FlatConfig} from '@typescript-eslint/utils/ts-eslint';
import type {Linter} from 'eslint';

import {
    CloudflightEslintPluginSettings,
    cloudflightTypescriptBaseConfig,
    cloudflightTypescriptConfig,
} from '@cloudflight/eslint-plugin-typescript';
import {TSESLint} from '@typescript-eslint/utils';
import vueTsEslintConfig from '@vue/eslint-config-typescript';
import pluginVue from 'eslint-plugin-vue';
import tseslint from 'typescript-eslint';

import {typescriptRules} from './configs/typescript';
import {vueRules} from './configs/vue';

export function cloudflightVueConfig(settings: CloudflightEslintPluginSettings): Linter.Config[] {
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- tseslint.config is deprecated but defineConfig has type incompatibilities with typescript-eslint
    return eslintConfigs(tseslint.config(
        ...cloudflightTypescriptConfig(settings),
        {
            files: ['**/*.vue'],
            extends: [
                // we can only import the base config here because eslint-plugin-import-x
                // does not work with vue-eslint-parser properly
                // eslint-disable-next-line @typescript-eslint/no-deprecated
                ...cloudflightTypescriptBaseConfig,
                // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                ...pluginVue.configs['flat/recommended'] as TSESLint.FlatConfig.ConfigArray,
                // since it is already working we will not change to the new config setup for now
                // eslint-disable-next-line @typescript-eslint/no-deprecated
                ...vueTsEslintConfig(),
            ],
            name: 'cloudflight/vue/rules',
            rules: {
                ...typescriptRules,
                ...vueRules,
            },
            languageOptions: {
                parserOptions: {
                    project: settings.tsConfigFiles ?? ['tsconfig*(.*).json'],
                    tsconfigRootDir: settings.rootDirectory,
                },
            },
        },
    ));
}

// typescript-eslint's config type is not accepted by eslint's defineConfig or a typed eslint.config.ts
function eslintConfigs(configs: FlatConfig.ConfigArray): Linter.Config[] {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return configs as Linter.Config[];
}
