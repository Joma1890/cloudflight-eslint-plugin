import type {FlatConfig} from '@typescript-eslint/utils/ts-eslint';

import {CloudflightEslintPluginSettings, cloudflightTypescriptConfig} from '@cloudflight/eslint-plugin-typescript';
import pluginNode from 'eslint-plugin-n';
import tseslint from 'typescript-eslint';

import {importRules} from './configs/import';
import {nodeRules} from './configs/node';
import {securityRules} from './configs/security';

export function cloudflightNodeConfig(settings: CloudflightEslintPluginSettings): FlatConfig.ConfigArray {
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- tseslint.config is deprecated but defineConfig has type incompatibilities with typescript-eslint
    return tseslint.config(
        ...cloudflightTypescriptConfig(settings),
        {
            files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
            extends: [
                pluginNode.configs['flat/recommended'],
            ],
            name: 'cloudflight/node/rules',
            rules: {
                ...nodeRules,
                ...securityRules,
                ...importRules,
            },
        },
    );
}
