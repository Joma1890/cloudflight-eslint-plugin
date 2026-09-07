import type {FlatConfig} from '@typescript-eslint/utils/ts-eslint';

import {CloudflightEslintPluginSettings, cloudflightTypescriptConfig} from '@cloudflight/eslint-plugin-typescript';
import angularEslint from 'angular-eslint';
import tseslint from 'typescript-eslint';

import {angularRules} from './configs/angular';
import {angularTemplateRules} from './configs/angular-template';
import {eslintRules} from './configs/eslint';
import {typescriptRules} from './configs/typescript';

export function cloudflightAngularTypescriptConfig(settings: CloudflightEslintPluginSettings): FlatConfig.ConfigArray {
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- tseslint.config is deprecated but defineConfig has type incompatibilities with typescript-eslint
    return tseslint.config(
        ...cloudflightTypescriptConfig(settings),
        {
            files: ['**/*.{ts,mts,cts}'],
            extends: [
                ...angularEslint.configs.tsRecommended,
            ],
            processor: angularEslint.processInlineTemplates,
            name: 'cloudflight/angular/typescript/rules',
            rules: {
                ...eslintRules,
                ...typescriptRules,
                ...angularRules,
            },
        },
    );
}

// eslint-disable-next-line @typescript-eslint/no-deprecated -- tseslint.config is deprecated but defineConfig has type incompatibilities with typescript-eslint
export const cloudflightAngularTemplateConfig = tseslint.config(
    {
        files: ['**/*.html'],
        extends: [
            ...angularEslint.configs.templateRecommended,
            ...angularEslint.configs.templateAccessibility,
        ],
        name: 'cloudflight/angular/template/rules',
        rules: {
            ...angularTemplateRules,
            // todo: this should be its own config
            // ...formatAngularTemplateEslintRules,
        },
    },
);

export function cloudflightAngularConfig(settings: CloudflightEslintPluginSettings): FlatConfig.ConfigArray {
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- tseslint.config is deprecated but defineConfig has type incompatibilities with typescript-eslint
    return tseslint.config(
        ...cloudflightAngularTypescriptConfig(settings),
        ...cloudflightAngularTemplateConfig,
    );
}
