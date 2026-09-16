import type {FlatConfig} from '@typescript-eslint/utils/ts-eslint';

import {
    CloudflightEslintPluginSettings,
    cloudflightTypedParserOptions,
    cloudflightTypescriptBaseConfig,
    cloudflightTypescriptConfig,
    cloudflightTypescriptSecurityConfig,
} from '@cloudflight/eslint-plugin-typescript';
import {TSESLint} from '@typescript-eslint/utils';
import {configureVueProject, defineConfigWithVueTs, vueTsConfigs} from '@vue/eslint-config-typescript';
import pluginVue from 'eslint-plugin-vue';

import {assertMatchingBaseVersion} from './base-version';
import {typescriptRules} from './configs/typescript';
import {vueRules} from './configs/vue';

/**
 * The Vue lint config: the TypeScript config plus the Vue rules and typed linting for single-file components.
 * @throws Error when the installed @cloudflight/eslint-plugin-typescript has a different version than this package.
 */
export function cloudflightVueConfig(settings: CloudflightEslintPluginSettings): FlatConfig.ConfigArray {
    assertMatchingBaseVersion(settings.rootDirectory);

    // This synchronous upstream helper uses a separate discovery root from ESLint.
    // Set it on every call so factories for different projects do not reuse a root.
    // With a type-checked preset the helper turns the no-unsafe-* rules off for every .ts and .vue
    // file by default; keep them, the base config only relaxes no-unsafe-assignment for .vue files.
    configureVueProject({rootDir: settings.rootDirectory, allowComponentTypeUnsafety: false});
    const configs = defineConfigWithVueTs(
        ...cloudflightTypescriptConfig(settings),
        {
            files: ['**/*.vue'],
            extends: [
                // the base and security rules target js/ts file extensions,
                // so they have to be applied to the .vue files here explicitly.
                // The import rules are left out because eslint-plugin-import-x
                // does not work with vue-eslint-parser properly.
                ...cloudflightTypescriptBaseConfig,
                ...cloudflightTypescriptSecurityConfig,
                // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                ...pluginVue.configs['flat/recommended'] as TSESLint.FlatConfig.ConfigArray,
                vueTsConfigs.recommendedTypeChecked,
            ],
            name: 'cloudflight/vue/rules',
            rules: {
                ...typescriptRules,
                ...vueRules,
            },
            languageOptions: {
                parserOptions: cloudflightTypedParserOptions(settings),
            },
        },
    );

    // Nested installs give the Vue helper a separate copy of typescript-eslint.
    // Keep the shared base's plugin identity while preserving the helper's rules
    // and parser composition. ESLint rejects two objects under one plugin name.
    const typescriptPlugin = cloudflightTypescriptBaseConfig.find((config) => config.plugins?.['@typescript-eslint'])?.plugins?.['@typescript-eslint'];
    const sharedPluginConfigs = configs.map((config) => config.plugins?.['@typescript-eslint'] && typescriptPlugin
        ? {...config, plugins: {...config.plugins, '@typescript-eslint': typescriptPlugin}}
        : config);

    return [
        ...sharedPluginConfigs,
        {
            files: ['**/*.{ts,mts,cts,tsx,vue}'],
            name: 'cloudflight/vue/typed-parser',
            languageOptions: {
                // the type-checked preset enables the project service for typescript files, the
                // base's typed parser options are applied after the helper's entries
                parserOptions: cloudflightTypedParserOptions(settings),
            },
        },
    ];
}
