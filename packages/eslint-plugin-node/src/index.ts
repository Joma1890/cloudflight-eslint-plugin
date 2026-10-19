import type {FlatConfig} from '@typescript-eslint/utils/ts-eslint';
import type {Linter} from 'eslint';

import {CloudflightEslintPluginSettings, cloudflightTypescriptConfig} from '@cloudflight/eslint-plugin-typescript';
import pluginNode from 'eslint-plugin-n';
import nounsanitized from 'eslint-plugin-no-unsanitized';
import pluginSecurity from 'eslint-plugin-security';
import tseslint from 'typescript-eslint';

import {importEslintRules} from './configs/import';
import {nodeRules} from './configs/node';
import {securityRules} from './configs/security';

export function cloudflightNodeConfig(settings: CloudflightEslintPluginSettings): Linter.Config[] {
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- tseslint.config is deprecated but defineConfig has type incompatibilities with typescript-eslint
    return eslintConfigs(tseslint.config(
        ...cloudflightTypescriptConfig(settings),
        {
            files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
            extends: [
                pluginNode.configs['flat/recommended'],
                nounsanitized.configs.recommended,
                pluginSecurity.configs.recommended,
            ],
            name: 'cloudflight/node/rules',
            rules: {
                ...nodeRules,
                ...securityRules,
                ...importEslintRules,
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
