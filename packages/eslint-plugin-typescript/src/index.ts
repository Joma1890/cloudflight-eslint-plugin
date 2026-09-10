import type {FlatConfig, SharedConfigurationSettings} from '@typescript-eslint/utils/ts-eslint';

import pluginJs from '@eslint/js';
import pluginStylistic from '@stylistic/eslint-plugin';
import {createTypeScriptImportResolver} from 'eslint-import-resolver-typescript';
import pluginImportX from 'eslint-plugin-import-x';
import pluginNoUnsanitized from 'eslint-plugin-no-unsanitized';
import pluginPerfectionist from 'eslint-plugin-perfectionist';
import pluginSecurity from 'eslint-plugin-security';
import tseslint from 'typescript-eslint';

import {customRules} from './configs/custom';
import {eslintRules} from './configs/eslint';
import {formatRules} from './configs/format';
import {importRules} from './configs/import';
import {securityRules} from './configs/security';
import {typescriptEslintDisableTypeCheckedRules, typescriptEslintRules} from './configs/typescript-eslint';
import {cloudflightTypescriptPlugin} from './rules';

/**
 * Base rule set (core ESLint + typescript-eslint rules) without the import,
 * security and type-service wiring.
 * Exposed for composition by the Cloudflight framework plugins
 * (e.g. to apply the same rules inside Vue SFCs); use `cloudflightTypescriptConfig` in projects.
 */
// eslint-disable-next-line @typescript-eslint/no-deprecated -- tseslint.config is deprecated but defineConfig has type incompatibilities with typescript-eslint
export const cloudflightTypescriptBaseConfig = tseslint.config(
    {
        files: ['**/*.{js,jsx,mjs,cjs,ts,mts,cts,tsx}'],
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
);

/**
 * Security rule set (eslint-plugin-security + eslint-plugin-no-unsanitized).
 * Exposed for composition by the Cloudflight framework plugins
 * (e.g. to apply the same rules inside Vue SFCs); use `cloudflightTypescriptConfig` in projects.
 */
// eslint-disable-next-line @typescript-eslint/no-deprecated -- tseslint.config is deprecated but defineConfig has type incompatibilities with typescript-eslint
export const cloudflightTypescriptSecurityConfig = tseslint.config(
    {
        files: ['**/*.{js,jsx,mjs,cjs,ts,mts,cts,tsx}'],
        extends: [
            pluginSecurity.configs.recommended,
            pluginNoUnsanitized.configs.recommended,
        ],
        name: 'cloudflight/typescript/security-rules',
        rules: {
            ...securityRules,
        },
    },
);

function cloudflightTypescriptImportConfig(settings: CloudflightEslintPluginSettings): FlatConfig.ConfigArray {
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- tseslint.config is deprecated but defineConfig has type incompatibilities with typescript-eslint
    return tseslint.config({
        files: ['**/*.{js,jsx,mjs,cjs,ts,mts,cts,tsx}'],
        extends: [
            pluginImportX.flatConfigs.recommended,
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
    });
}

// eslint-disable-next-line @typescript-eslint/no-deprecated -- tseslint.config is deprecated but defineConfig has type incompatibilities with typescript-eslint
const cloudflightTypescriptDisableTypeCheckedConfig = tseslint.config({
    files: ['**/*.{js,jsx,mjs,cjs}'],
    extends: [tseslint.configs.disableTypeChecked],
    name: 'cloudflight/typescript/disable-type-checked-rules',
    rules: {
        ...typescriptEslintDisableTypeCheckedRules,
    },
});

export interface CloudflightEslintPluginSettings {
    rootDirectory: string;
    /**
     * Override the tsconfig files to use for the project.
     * When omitted, typed linting uses the typescript-eslint project service,
     * which discovers the closest tsconfig.json for each linted file (recommended).
     * Set this only when automatic discovery does not fit the project layout,
     * e.g. when linting relies on tsconfig files not named tsconfig.json.
     * Keep this list as short as possible, a large list will negatively impact performance.
     * Relative to the rootDirectory.
     */
    tsConfigFiles?: string[];
}

export function cloudflightTypedParserOptions(settings: CloudflightEslintPluginSettings): FlatConfig.ParserOptions {
    // the two modes are mutually exclusive, both are set explicitly so a later config block
    // (e.g. the vue helper, which enables the project service on its own) cannot leave both on
    if (settings.tsConfigFiles == null) {
        return {
            project: false,
            projectService: true,
            tsconfigRootDir: settings.rootDirectory,
        };
    }

    return {
        project: settings.tsConfigFiles,
        projectService: false,
        tsconfigRootDir: settings.rootDirectory,
    };
}

export function cloudflightTypescriptFormatConfig(settings: CloudflightEslintPluginSettings): FlatConfig.ConfigArray {
    return [
        {
            ignores: ['.yarn/**'],
        },
        {
            files: ['**/*.{js,jsx,mjs,cjs,ts,mts,cts,tsx}'],
            plugins: {
                '@typescript-eslint': tseslint.plugin,
                'import-x': pluginImportX,
                '@cloudflight/typescript': cloudflightTypescriptPlugin,
                '@stylistic': pluginStylistic,
                'perfectionist': pluginPerfectionist,
                // Security plugins are registered here (even though no security rules are active in format config)
                // to allow ESLint to recognize security/* disable comments in files
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
    ];
}

export function cloudflightTypescriptConfig(settings: CloudflightEslintPluginSettings): FlatConfig.ConfigArray {
    return [
        ...cloudflightTypescriptBaseConfig,
        ...cloudflightTypescriptSecurityConfig,
        ...cloudflightTypescriptImportConfig(settings),
        ...cloudflightTypescriptDisableTypeCheckedConfig,
        {
            files: ['**/*.{ts,mts,cts,tsx}'],
            name: 'cloudflight/typescript/typed-parser',
            languageOptions: {
                parserOptions: cloudflightTypedParserOptions(settings),
            },
        },
    ];
}

function importXSettings(settings: CloudflightEslintPluginSettings): SharedConfigurationSettings {
    return {
        // the resolver is passed as an object: named in the settings, eslint-plugin-import-x loads it
        // from its own location, which fails when the package manager nests the resolver below this package
        'import-x/resolver-next': [
            createTypeScriptImportResolver({
                alwaysTryTypes: true,
                project: settings.tsConfigFiles ?? ['tsconfig*(.*).json'],
                // the default glob matches every tsconfig*.json on purpose
                noWarnOnMultipleProjects: true,
            }),
        ],
    };
}
