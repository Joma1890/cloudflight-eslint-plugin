import type {FlatConfig, SharedConfigurationSettings} from '@typescript-eslint/utils/ts-eslint';

import pluginJs from '@eslint/js';
import pluginStylistic from '@stylistic/eslint-plugin';
import {createTypeScriptImportResolver} from 'eslint-import-resolver-typescript';
import pluginImportX from 'eslint-plugin-import-x';
import pluginNoUnsanitized from 'eslint-plugin-no-unsanitized';
import pluginPerfectionist from 'eslint-plugin-perfectionist';
import pluginSecurity from 'eslint-plugin-security';
import globals from 'globals';
import {type Dirent, existsSync, readdirSync} from 'node:fs';
import {isAbsolute, join, relative, resolve, sep} from 'node:path';
import tseslint from 'typescript-eslint';

import {customRules} from './configs/custom';
import {eslintRules} from './configs/eslint';
import {formatRules} from './configs/format';
import {importRules} from './configs/import';
import {securityRules} from './configs/security';
import {javascriptRecommendedRules, typescriptEslintDisableTypeCheckedRules, typescriptEslintRules} from './configs/typescript-eslint';
import {packageManifest} from './package-manifest';
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
    return tseslint.config(
        {
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
        },
        // like the project service, files below a nested tsconfig.json resolve their imports through
        // that project, so aliases of nested projects work and unrelated projects never take part
        ...nestedProjectImportConfigs(settings),
    );
}

function nestedProjectImportConfigs(settings: CloudflightEslintPluginSettings): FlatConfig.Config[] {
    // the config types do not know function matchers yet, eslint supports them since v9
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return nestedProjectDirectories(settings).map((directory) => ({
        // matched by path instead of a pattern relative to eslint's base path: the block then works
        // wherever eslint runs from, inside `extends` (where eslint rejects a base path) and for
        // directory names with glob metacharacters; the glob keeps it to source files
        files: [['**/*.{js,jsx,mjs,cjs,ts,mts,cts,tsx}', isBelow(join(settings.rootDirectory, directory))]],
        name: `cloudflight/typescript/import-rules/${directory}`,
        settings: importXSettings({rootDirectory: settings.rootDirectory, tsConfigFiles: [`${directory}/tsconfig.json`]}),
    } as unknown as FlatConfig.Config));
}

/**
 * Whether a file lies below the directory, compared as paths so the result depends neither on
 * eslint's base path nor on glob metacharacters in directory names.
 */
function isBelow(directory: string): (file: string) => boolean {
    return (file) => {
        const relativePath = relative(directory, file);

        return relativePath !== '' && relativePath !== '..' && !relativePath.startsWith(`..${sep}`) && !isAbsolute(relativePath);
    };
}

// eslint-disable-next-line @typescript-eslint/no-deprecated -- tseslint.config is deprecated but defineConfig has type incompatibilities with typescript-eslint
const cloudflightTypescriptDisableTypeCheckedConfig = tseslint.config({
    files: ['**/*.{js,jsx,mjs,cjs}'],
    extends: [tseslint.configs.disableTypeChecked],
    name: 'cloudflight/typescript/disable-type-checked-rules',
    languageOptions: {
        // javascript files are tooling or browser scripts, declare both environments
        // so no-undef reports unknown identifiers instead of every runtime global
        globals: {...globals.node, ...globals.browser},
    },
    rules: {
        ...javascriptRecommendedRules,
        ...typescriptEslintDisableTypeCheckedRules,
    },
});

/**
 * Version of this package. The framework packages only work with the base package of their own version.
 */
export const cloudflightTypescriptVersion: string = packageManifest(__dirname).version;

export interface CloudflightEslintPluginSettings {
    /**
     * Absolute path of the project directory the config lives in (usually `import.meta.dirname`).
     * tsconfig paths and the import resolver's project globs are resolved against it.
     * Glob metacharacters in this path (`(`, `)`, `[`, `]`, `{`, `}`, `*`, `?`) are not escaped
     * by eslint-import-resolver-typescript and make import alias resolution fall back to
     * the `tsconfig.json` in the working directory.
     */
    rootDirectory: string;
    /**
     * Override the tsconfig files to use for the project.
     * When omitted, typed linting uses the typescript-eslint project service,
     * which discovers the closest tsconfig.json for each linted file (recommended);
     * import resolution uses the tsconfig*.json files in rootDirectory and the tsconfig.json
     * of each nested project directory.
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
                project: (settings.tsConfigFiles ?? ['tsconfig*(.*).json'])
                    .map((file) => resolve(settings.rootDirectory, file).replace(/\\/g, '/')),
                // the default glob matches every tsconfig*.json on purpose
                noWarnOnMultipleProjects: true,
            }),
        ],
    };
}

// dependency, version control, build output and cache directories never hold projects of the consumer
const skippedDirectories = new Set([
    'node_modules',
    '.git',
    '.hg',
    '.svn',
    '.yarn',
    'dist',
    'build',
    'coverage',
    'target',
    '.angular',
    '.gradle',
    '.next',
    '.nuxt',
    '.nx',
    '.svelte-kit',
    '.venv',
]);

/**
 * Directories below the root directory with their own tsconfig.json, parents before children,
 * so that the block of the closest project wins.
 */
function nestedProjectDirectories(settings: CloudflightEslintPluginSettings): string[] {
    if (settings.tsConfigFiles !== undefined) {
        return [];
    }

    return collectProjectDirectories(settings.rootDirectory, '');
}

function isUnreadableDirectory(error: unknown): boolean {
    return error instanceof Error && 'code' in error && ['EACCES', 'EPERM', 'ENOENT', 'ENOTDIR'].includes(String(error.code));
}

/**
 * The entries of a directory below the root; one that cannot be read (permissions, removed in the
 * meantime) holds no project of the linted files and is skipped instead of failing every lint run.
 */
function readNestedDirectory(root: string, directory: string): Dirent[] {
    try {
        return readdirSync(join(root, directory), {withFileTypes: true});
    }
    catch (error) {
        if (directory !== '' && isUnreadableDirectory(error)) {
            return [];
        }

        throw error;
    }
}

function collectProjectDirectories(root: string, directory: string): string[] {
    const directories: string[] = [];

    for (const entry of readNestedDirectory(root, directory)) {
        if (!entry.isDirectory() || skippedDirectories.has(entry.name)) {
            continue;
        }

        const child = directory === '' ? entry.name : `${directory}/${entry.name}`;

        if (existsSync(join(root, child, 'tsconfig.json'))) {
            directories.push(child);
        }
        directories.push(...collectProjectDirectories(root, child));
    }

    return directories;
}
