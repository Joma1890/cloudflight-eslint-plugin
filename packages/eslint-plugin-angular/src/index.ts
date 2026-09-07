import type {FlatConfig} from '@typescript-eslint/utils/ts-eslint';

import {CloudflightEslintPluginSettings, cloudflightTypescriptConfig, cloudflightTypescriptFormatConfig} from '@cloudflight/eslint-plugin-typescript';
import angularEslint from 'angular-eslint';
import tseslint from 'typescript-eslint';

import {angularRules} from './configs/angular';
import {angularTemplateRules} from './configs/angular-template';
import {angularTemplateFormatRules} from './configs/angular-template-format';
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
        },
    },
);

// eslint-disable-next-line @typescript-eslint/no-deprecated -- tseslint.config is deprecated but defineConfig has type incompatibilities with typescript-eslint
export const cloudflightAngularTemplateFormatConfig = tseslint.config(
    {
        files: ['**/*.html'],
        plugins: {
            '@angular-eslint/template': angularEslint.templatePlugin,
        },
        languageOptions: {
            parser: angularEslint.templateParser,
        },
        name: 'cloudflight/angular/template/format-rules',
        rules: {
            ...angularTemplateFormatRules,
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

export function cloudflightAngularFormatConfig(settings: CloudflightEslintPluginSettings): FlatConfig.ConfigArray {
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- tseslint.config is deprecated but defineConfig has type incompatibilities with typescript-eslint
    return tseslint.config(
        ...cloudflightTypescriptFormatConfig(settings),
        {
            files: ['**/*.{ts,mts,cts}'],
            // registered without rules, so eslint recognizes @angular-eslint/* disable comments in the format run
            plugins: {
                '@angular-eslint': angularEslint.tsPlugin,
            },
            name: 'cloudflight/angular/typescript/format-plugins',
        },
        ...cloudflightAngularTemplateFormatConfig,
    );
}
