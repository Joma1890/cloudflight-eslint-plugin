import type {FlatConfig} from '@typescript-eslint/utils/ts-eslint';
import type {Linter} from 'eslint';

import {CloudflightEslintPluginSettings, cloudflightTypescriptConfig, cloudflightTypescriptFormatConfig} from '@cloudflight/eslint-plugin-typescript';
import angularEslint from 'angular-eslint';
import tseslint from 'typescript-eslint';

import {assertMatchingBaseVersion} from './base-version';
import {angularRules} from './configs/angular';
import {angularTemplateRules} from './configs/angular-template';
import {angularTemplateFormatRules} from './configs/angular-template-format';
import {eslintRules} from './configs/eslint';
import {typescriptRules} from './configs/typescript';

/**
 * The TypeScript config plus the Angular rules for TypeScript files, inline templates are linted with the template rules.
 * @throws Error when the installed @cloudflight/eslint-plugin-typescript has a different version than this package.
 */
export function cloudflightAngularTypescriptConfig(settings: CloudflightEslintPluginSettings): Linter.Config[] {
    assertMatchingBaseVersion(settings.rootDirectory);

    // eslint-disable-next-line @typescript-eslint/no-deprecated -- tseslint.config is deprecated but defineConfig has type incompatibilities with typescript-eslint
    return eslintConfigs(tseslint.config(
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
    ));
}

// eslint-disable-next-line @typescript-eslint/no-deprecated -- tseslint.config is deprecated but defineConfig has type incompatibilities with typescript-eslint
export const cloudflightAngularTemplateConfig: Linter.Config[] = eslintConfigs(tseslint.config(
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
));

// eslint-disable-next-line @typescript-eslint/no-deprecated -- tseslint.config is deprecated but defineConfig has type incompatibilities with typescript-eslint
export const cloudflightAngularTemplateFormatConfig: Linter.Config[] = eslintConfigs(tseslint.config(
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
));

/**
 * The Angular lint config: TypeScript files with the Angular rules and HTML templates.
 * @throws Error when the installed @cloudflight/eslint-plugin-typescript has a different version than this package.
 */
export function cloudflightAngularConfig(settings: CloudflightEslintPluginSettings): Linter.Config[] {
    assertMatchingBaseVersion(settings.rootDirectory);

    // eslint-disable-next-line @typescript-eslint/no-deprecated -- tseslint.config is deprecated but defineConfig has type incompatibilities with typescript-eslint
    return eslintConfigs(tseslint.config(
        ...cloudflightAngularTypescriptConfig(settings),
        ...cloudflightAngularTemplateConfig,
    ));
}

/**
 * The Angular format config: the TypeScript format config and the fixable template rules.
 * @throws Error when the installed @cloudflight/eslint-plugin-typescript has a different version than this package.
 */
export function cloudflightAngularFormatConfig(settings: CloudflightEslintPluginSettings): Linter.Config[] {
    assertMatchingBaseVersion(settings.rootDirectory);

    // eslint-disable-next-line @typescript-eslint/no-deprecated -- tseslint.config is deprecated but defineConfig has type incompatibilities with typescript-eslint
    return eslintConfigs(tseslint.config(
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
