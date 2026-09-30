# Cleancode ESLint Plugin

[![License](https://img.shields.io/badge/License-Apache_2.0-green.svg)](https://opensource.org/licenses/Apache-2.0)
![main](https://github.com/cloudflightio/cloudflight-eslint-plugin/actions/workflows/build.yml/badge.svg?branch=main)
[![@cloudflight/eslint-plugin-typescript](https://img.shields.io/npm/v/@cloudflight/eslint-plugin-typescript?label=@cloudflight/eslint-plugin-typescript)](https://www.npmjs.com/package/@cloudflight/eslint-plugin-typescript)
[![@cloudflight/eslint-plugin-angular](https://img.shields.io/npm/v/@cloudflight/eslint-plugin-angular?label=@cloudflight/eslint-plugin-angular)](https://www.npmjs.com/package/@cloudflight/eslint-plugin-angular)
[![@cloudflight/eslint-plugin-vue](https://img.shields.io/npm/v/@cloudflight/eslint-plugin-vue?label=@cloudflight/eslint-plugin-vue)](https://www.npmjs.com/package/@cloudflight/eslint-plugin-vue)
[![@cloudflight/eslint-plugin-react](https://img.shields.io/npm/v/@cloudflight/eslint-plugin-react?label=@cloudflight/eslint-plugin-react)](https://www.npmjs.com/package/@cloudflight/eslint-plugin-react)
[![@cloudflight/eslint-plugin-node](https://img.shields.io/npm/v/@cloudflight/eslint-plugin-node?label=@cloudflight/eslint-plugin-node)](https://www.npmjs.com/package/@cloudflight/eslint-plugin-node)

This repository contains multiple ESLint plugins & configs to enforce rules for clean code across Cloudflight projects.

## Installation

Please refer to the README's of each plugin to get started:

-   [@cloudflight/eslint-plugin-angular](packages/eslint-plugin-angular/README.md)
-   [@cloudflight/eslint-plugin-typescript](packages/eslint-plugin-typescript/README.md)
-   [@cloudflight/eslint-plugin-vue](packages/eslint-plugin-vue/README.md)
-   [@cloudflight/eslint-plugin-react](packages/eslint-plugin-react/README.md)
-   [@cloudflight/eslint-plugin-node](packages/eslint-plugin-node/README.md)

## Upgrading from 1.x

Version 2 requires ESLint 10.4 or newer (flat config only); stay on 1.3.3 for ESLint 9.

1. **Update all `@cloudflight/eslint-plugin-*` packages together, to the same version**, including a direct
   `@cloudflight/eslint-plugin-typescript` dependency you keep for the format config. The framework configs refuse
   to load a mixed installation with
   `… requires @cloudflight/eslint-plugin-typescript <version>, but the project resolves <other version> from <path>. Update all @cloudflight/eslint-plugin-* packages together.`
2. **Deduplicate typescript-eslint.** Every `@typescript-eslint/utils` copy must be 8.56 or newer, the first release
   with ESLint 10 support. Older copies kept nested by other plugins (for example eslint-plugin-storybook) in an
   existing lockfile fail at config load with `TypeError: Class extends value undefined is not a constructor or null`.
   Yarn: `yarn dedupe '@typescript-eslint/*' typescript-eslint`; npm: check `npm ls @typescript-eslint/utils`.
3. **Remove your own `parserOptions.project` blocks.** Typed linting now uses the typescript-eslint project service.
   An own `parserOptions.project` after the Cloudflight config fails every TypeScript file with
   `Parsing error: Enabling "project" does nothing when "projectService" is enabled`. Files that no `tsconfig.json`
   includes are reported as `… was not found by the project service`: add them to a `tsconfig.json`, or pass your
   list as `tsConfigFiles` (see [Custom Configuration](CUSTOM_CONFIGURATION.md)).
4. Import `includeIgnoreFile` from `eslint/config` instead of `@eslint/compat`. The packages do not need
   `@eslint/compat`; remove it if nothing else in your config uses it.
5. Reformat once with `eslint -c eslint.format.mjs --fix .`: multiline enums get a trailing comma and the `?` and `:`
   of multiline conditionals start the line. Move comments that sit between an operator and its operand above the
   line first, the fixer cannot handle them.

What changes in the reported findings:

-   the security rules of eslint-plugin-security and eslint-plugin-no-unsanitized are part of every config
-   the base, security, import and format rules also apply to `.jsx` and `.tsx` files
-   JavaScript files are linted without type information and keep the core rules the compiler covers in
    TypeScript files, such as `no-undef`
-   ESLint 10 adds `no-unassigned-vars`, `no-useless-assignment` and `preserve-caught-error` to its recommended rules
-   Angular: `@angular-eslint/no-conflicting-lifecycle` no longer exists (remove disable comments naming it);
    `prefer-inject` and the template rule `prefer-control-flow` come with the recommended presets of angular-eslint 22;
    `prefer-on-push-component-change-detection` no longer reports components without a `changeDetection` setting;
    newly enabled are `no-uncalled-signals`, `no-async-lifecycle-method`, `no-duplicates-in-metadata-arrays`,
    `computed-must-return`, `require-lifecycle-on-prototype`, `no-implicit-take-until-destroyed`,
    `prefer-output-emitter-ref` and the template rules `eqeqeq`, `conditional-complexity`, `cyclomatic-complexity`,
    `prefer-class-binding`, `prefer-style-binding`, `prefer-template-literal`, `no-non-null-assertion`,
    `no-empty-control-flow`, `no-nested-tags` and `no-outerhtml`; `prefer-static-string-properties` joins the format config
-   the internal exports `cloudflightTypescriptImportConfig` and `cloudflightTypescriptDisableTypeCheckedConfig`
    are gone, use `cloudflightTypescriptConfig`

## Contributing

-   [Contributing to the project](CONTRIBUTING.md)
