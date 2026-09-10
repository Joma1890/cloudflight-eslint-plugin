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

import {typescriptRules} from './configs/typescript';
import {vueRules} from './configs/vue';

export function cloudflightVueConfig(settings: CloudflightEslintPluginSettings): FlatConfig.ConfigArray {
    // with a type-checked preset the helper turns the no-unsafe-* rules off for every .ts and .vue file
    // by default; keep them, the base config only relaxes no-unsafe-assignment for .vue files
    configureVueProject({allowComponentTypeUnsafety: false});

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

    return [
        ...configs,
        {
            files: ['**/*.{ts,mts,cts,tsx}'],
            name: 'cloudflight/vue/typed-parser',
            languageOptions: {
                // the type-checked preset enables the project service for typescript files, the
                // base's typed parser options are applied after the helper's entries
                parserOptions: cloudflightTypedParserOptions(settings),
            },
        },
    ];
}
