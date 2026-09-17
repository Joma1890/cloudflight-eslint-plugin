import type {FlatConfig} from '@typescript-eslint/utils/ts-eslint';
import type {Linter} from 'eslint';

import {CloudflightEslintPluginSettings, cloudflightTypescriptConfig} from '@cloudflight/eslint-plugin-typescript';
import pluginNode from 'eslint-plugin-n';
import {existsSync, readFileSync} from 'node:fs';
import {join} from 'node:path';
import tseslint from 'typescript-eslint';

import {assertMatchingBaseVersion} from './base-version';
import {importRules} from './configs/import';
import {nodeRules} from './configs/node';
import {securityRules} from './configs/security';

/**
 * The Node config: the TypeScript config plus the eslint-plugin-n rules and all security rules as errors.
 * @throws Error when the installed @cloudflight/eslint-plugin-typescript has a different version than this package.
 */
export function cloudflightNodeConfig(settings: CloudflightEslintPluginSettings): Linter.Config[] {
    assertMatchingBaseVersion(settings.rootDirectory);

    // eslint-disable-next-line @typescript-eslint/no-deprecated -- tseslint.config is deprecated but defineConfig has type incompatibilities with typescript-eslint
    return eslintConfigs(tseslint.config(
        ...cloudflightTypescriptConfig(settings),
        {
            files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
            extends: [
                nodeRecommendedConfig(settings.rootDirectory),
            ],
            name: 'cloudflight/node/rules',
            rules: {
                ...nodeRules,
                ...securityRules,
                ...importRules,
            },
        },
        {
            files: ['**/*.{js,mjs,cjs}'],
            name: 'cloudflight/node/javascript-rules',
            rules: {
                // eslint-plugin-n 18 asks the parser for type information on every match of this rule
                // and throws for javascript files, which are linted without a program
                'n/no-sync': 'off',
            },
        },
        // explicit extensions have a fixed module type, whatever the package type says
        {
            files: ['**/*.{cjs,cts}'],
            name: 'cloudflight/node/commonjs',
            languageOptions: {...pluginNode.configs['flat/recommended-script'].languageOptions},
        },
        {
            files: ['**/*.{mjs,mts}'],
            name: 'cloudflight/node/module',
            languageOptions: {...pluginNode.configs['flat/recommended-module'].languageOptions},
        },
    ));
}

/**
 * The config objects are valid eslint configs; typescript-eslint's config type is stricter than
 * eslint's own and is not accepted by eslint's `defineConfig` or in a typed `eslint.config.ts`.
 */
function eslintConfigs(configs: FlatConfig.ConfigArray): Linter.Config[] {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return configs as Linter.Config[];
}

/**
 * eslint-plugin-n's recommended preset chooses between its module and script variant by the
 * package.json of the working directory at load time; the project's own package.json decides
 * here for .js and .ts files, so the result does not depend on where eslint runs from.
 */
function nodeRecommendedConfig(rootDirectory: string): typeof pluginNode.configs['flat/recommended-script'] {
    const manifestPath = join(rootDirectory, 'package.json');
    const manifest: unknown = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : undefined;
    const isModule = typeof manifest === 'object' && manifest !== null && Reflect.get(manifest, 'type') === 'module';

    return isModule ? pluginNode.configs['flat/recommended-module'] : pluginNode.configs['flat/recommended-script'];
}
