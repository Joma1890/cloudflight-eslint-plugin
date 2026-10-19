import type {FlatConfig, SharedConfigurationSettings} from '@typescript-eslint/utils/ts-eslint';
import type {Linter} from 'eslint';

import pluginJs from '@eslint/js';
import pluginStylistic from '@stylistic/eslint-plugin';
import {createTypeScriptImportResolver} from 'eslint-import-resolver-typescript';
import pluginImportX from 'eslint-plugin-import-x';
import pluginNoUnsanitized from 'eslint-plugin-no-unsanitized';
import pluginPerfectionist from 'eslint-plugin-perfectionist';
import pluginSecurity from 'eslint-plugin-security';
import {createRequire} from 'node:module';
import tseslint from 'typescript-eslint';

import {customRules} from './configs/custom';
import {eslintRules} from './configs/eslint';
import {formatRules} from './configs/format';
import {importRules} from './configs/import';
import {securityRules} from './configs/security';
import {typescriptEslintDisableTypeCheckedRules, typescriptEslintRules} from './configs/typescript-eslint';
import {cloudflightTypescriptPlugin} from './rules';

/**
 * Only the ESLint and typescript-eslint rules, without import rules, security rules and parser options.
 * For the framework packages, projects use `cloudflightTypescriptConfig`.
 */
// eslint-disable-next-line @typescript-eslint/no-deprecated -- tseslint.config is deprecated but defineConfig has type incompatibilities with typescript-eslint
export const cloudflightTypescriptBaseConfig: Linter.Config[] = eslintConfigs(tseslint.config(
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
));

/**
 * The rules of eslint-plugin-security and eslint-plugin-no-unsanitized. For the framework packages,
 * projects use `cloudflightTypescriptConfig`.
 */
// eslint-disable-next-line @typescript-eslint/no-deprecated -- tseslint.config is deprecated but defineConfig has type incompatibilities with typescript-eslint
export const cloudflightTypescriptSecurityConfig: Linter.Config[] = eslintConfigs(tseslint.config(
    {
        files: ['**/*.{js,jsx,mjs,cjs,ts,mts,cts,tsx}'],
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

// import-x loads the parser of its typescript preset by name, from eslint's or the linted file's directory; npm and pnpm can
// keep @typescript-eslint/parser below typescript-eslint, so the preset gets the path of our own parser instead
const typescriptParserPath = createRequire(require.resolve('typescript-eslint')).resolve('@typescript-eslint/parser');
const importXTypescriptConfig = {
    ...pluginImportX.flatConfigs.typescript,
    settings: {
        ...pluginImportX.flatConfigs.typescript.settings,
        'import-x/parsers': {[typescriptParserPath]: ['.ts', '.tsx', '.cts', '.mts']},
    },
};

function cloudflightTypescriptImportConfig(settings: CloudflightEslintPluginSettings): FlatConfig.ConfigArray {
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- tseslint.config is deprecated but defineConfig has type incompatibilities with typescript-eslint
    return tseslint.config({
        files: ['**/*.{js,jsx,mjs,cjs,ts,mts,cts,tsx}'],
        extends: [
            pluginImportX.flatConfigs.recommended,
            importXTypescriptConfig,
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
            files: ['**/*.{js,jsx,mjs,cjs,ts,mts,cts,tsx}'],
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
        {
            files: ['**/*.tsx'],
            name: 'cloudflight/typescript/format-tsx',
            languageOptions: {
                // comma-dangle keeps the comma of <T,> only when it knows the file has jsx
                parserOptions: {ecmaFeatures: {jsx: true}},
            },
        },
    ]);
}

export function cloudflightTypescriptConfig(settings: CloudflightEslintPluginSettings): Linter.Config[] {
    return eslintConfigs([
        ...cloudflightTypescriptBaseConfig,
        ...cloudflightTypescriptSecurityConfig,
        ...cloudflightTypescriptImportConfig(settings),
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
        // as an object, import-x cannot load the resolver by name when npm nests it below this package
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
