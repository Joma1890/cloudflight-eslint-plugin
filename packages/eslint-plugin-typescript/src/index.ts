import type {FlatConfig, SharedConfigurationSettings} from '@typescript-eslint/utils/ts-eslint';
import type {Linter} from 'eslint';

import pluginJs from '@eslint/js';
import pluginStylistic from '@stylistic/eslint-plugin';
import pluginImportX from 'eslint-plugin-import-x';
import pluginNoUnsanitized from 'eslint-plugin-no-unsanitized';
import pluginPerfectionist from 'eslint-plugin-perfectionist';
import pluginSecurity from 'eslint-plugin-security';
import tseslint, {InfiniteDepthConfigWithExtends} from 'typescript-eslint';

import {customRules} from './configs/custom';
import {eslintRules} from './configs/eslint';
import {formatRules} from './configs/format';
import {importRules} from './configs/import';
import {securityRules} from './configs/security';
import {typescriptEslintDisableTypeCheckedRules, typescriptEslintRules} from './configs/typescript-eslint';
import {cloudflightTypescriptPlugin} from './rules';

/**
 * @deprecated Use `cloudflightTypescriptConfig` instead
 * This is only for internal use only
 */
// eslint-disable-next-line @typescript-eslint/no-deprecated -- tseslint.config is deprecated but defineConfig has type incompatibilities with typescript-eslint
export const cloudflightTypescriptBaseConfig: Linter.Config[] = eslintConfigs(tseslint.config(
    {
        files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
        plugins: {
            '@cloudflight/typescript': cloudflightTypescriptPlugin,
        },
        extends: [
            pluginJs.configs.recommended,
            ...tseslint.configs.strictTypeChecked,
            ...tseslint.configs.stylisticTypeChecked,
        ],
        name: 'cloudflight/typescript/base-rules',
        rules: {
            ...eslintRules,
            ...typescriptEslintRules,
            ...customRules,
        },
    },
));

/**
 * The rules of eslint-plugin-security and eslint-plugin-no-unsanitized. For the framework packages,
 * projects use `cloudflightTypescriptConfig`.
 */
// eslint-disable-next-line @typescript-eslint/no-deprecated -- tseslint.config is deprecated but defineConfig has type incompatibilities with typescript-eslint
export const cloudflightTypescriptSecurityConfig: Linter.Config[] = eslintConfigs(tseslint.config(
    {
        files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
        // the rules are listed, a plugin update cannot add one
        plugins: {
            'security': pluginSecurity,
            'no-unsanitized': pluginNoUnsanitized,
        },
        name: 'cloudflight/typescript/security-rules',
        rules: {
            ...securityRules,
        },
    },
));

/**
 * @deprecated Use `cloudflightTypescriptConfig` instead
 * This is only for internal use only
 */
export function cloudflightTypescriptImportConfig(settings: CloudflightEslintPluginSettings): Linter.Config[] {
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- tseslint.config is deprecated but defineConfig has type incompatibilities with typescript-eslint
    return eslintConfigs(tseslint.config({
        files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
        extends: [
            // https://github.com/typescript-eslint/typescript-eslint/issues/10395
            // typescript-eslint broke backwards compatibility when they added TS 5.7 support.
            // It is only a type issue here, as the changed value isn't actually used outside the type
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            pluginImportX.flatConfigs.recommended as InfiniteDepthConfigWithExtends,
            pluginImportX.flatConfigs.typescript,
        ],
        languageOptions: {
            parser: tseslint.parser,
            ecmaVersion: 'latest',
            sourceType: 'module',
        },
        name: 'cloudflight/typescript/import-rules',
        rules: {
            ...importRules,
        },
        settings: importXSettings(settings),
    }));
}

/**
 * @deprecated Use `cloudflightTypescriptConfig` instead
 * This is only for internal use only
 */
// eslint-disable-next-line @typescript-eslint/no-deprecated -- tseslint.config is deprecated but defineConfig has type incompatibilities with typescript-eslint
export const cloudflightTypescriptDisableTypeCheckedConfig: Linter.Config[] = eslintConfigs(tseslint.config({
    files: ['**/*.{js,mjs,cjs}'],
    extends: [tseslint.configs.disableTypeChecked],
    name: 'cloudflight/typescript/disable-type-checked-rules',
    rules: {
        ...typescriptEslintDisableTypeCheckedRules,
    },
}));

export interface CloudflightEslintPluginSettings {
    rootDirectory: string;
    /**
     * Override the default tsconfig files to use for the project.
     * Keep this list as short as possible, a large list will negatively impact performance.
     * Relative to the rootDirectory.
     */
    tsConfigFiles?: string[];
}

export function cloudflightTypescriptFormatConfig(settings: CloudflightEslintPluginSettings): Linter.Config[] {
    return eslintConfigs([
        {
            ignores: ['.yarn/**'],
        },
        {
            files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
            plugins: {
                '@typescript-eslint': tseslint.plugin,
                'import-x': pluginImportX,
                '@cloudflight/typescript': cloudflightTypescriptPlugin,
                '@stylistic': pluginStylistic,
                'perfectionist': pluginPerfectionist,
                // no security rules in the format config, but the plugins have to be known for disable comments
                'security': pluginSecurity,
                'no-unsanitized': pluginNoUnsanitized,
            },
            languageOptions: {
                parser: tseslint.parser,
                ecmaVersion: 'latest',
                sourceType: 'module',
            },
            linterOptions: {
                reportUnusedDisableDirectives: 'off',
            },
            name: 'cloudflight/typescript/format-rules',
            rules: {
                ...formatRules,
            },
            settings: importXSettings(settings),
        },
    ]);
}

export function cloudflightTypescriptConfig(settings: CloudflightEslintPluginSettings): Linter.Config[] {
    return eslintConfigs([
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        ...cloudflightTypescriptBaseConfig,
        ...cloudflightTypescriptSecurityConfig,
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        ...cloudflightTypescriptImportConfig(settings),
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        ...cloudflightTypescriptDisableTypeCheckedConfig,
        {
            languageOptions: {
                parserOptions: {
                    project: settings.tsConfigFiles ?? ['tsconfig*(.*).json'],
                    tsconfigRootDir: settings.rootDirectory,
                },
            },
        },
    ]);
}

// typescript-eslint's config type is not accepted by eslint's defineConfig or a typed eslint.config.ts
function eslintConfigs(configs: FlatConfig.ConfigArray): Linter.Config[] {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return configs as Linter.Config[];
}

function importXSettings(settings: CloudflightEslintPluginSettings): SharedConfigurationSettings {
    return {
        'import-x/resolver': {
            typescript: {
                alwaysTryTypes: true,
                project: settings.tsConfigFiles ?? ['tsconfig*(.*).json'],
                tsconfigRootDir: settings.rootDirectory,
            },
        },
    };
}
