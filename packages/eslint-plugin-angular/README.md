# `@cloudflight/eslint-plugin-angular`

The Cloudflight ESLint Plugin for Angular provides multiple configurations of ESLint rules recommended by Cloudflight.

You can find the directory of all rules including their reasoning [here](src/configs).

## Dependencies

The following dependencies are required:

```
"eslint": "^10.0.0",
"typescript": ">=5.0.0 <6.1.0"
```

Node.js must satisfy `^22.22.3 || ^24.15.0 || >=26.0.0`.

The usage example below imports `includeIgnoreFile` from `@eslint/compat` (2.0.2 or newer, the first release with an ESLint 10 peer dependency); install it if you keep that line.

Upgrading from 1.x? See [Upgrading from 1.x](https://github.com/cloudflightio/cloudflight-eslint-plugin#upgrading-from-1x).

Angular 22 applications must use TypeScript 6.0.x; the wider TypeScript peer covers the configuration library, not the Angular compiler.

## Usage

In your `package.json` add the following:

```json
"devDependencies": {
    ...
    "@cloudflight/eslint-plugin-angular": "<version>",
    ...
}
```

The plugin provides 2 different main configurations (linting and formatting):

- `cloudflightAngularConfig(settings)`: Both of the below 2 configurations
    - `cloudflightAngularTypescriptConfig(settings)`: The TypeScript config plus the Angular rules for TS files, inline templates are linted with the template rules
    - `cloudflightAngularTemplateConfig`: Only contains rules for HTML files (a config array, spread it without calling it)
- `cloudflightAngularFormatConfig(settings)`: Both of the below 2 configurations
    - `cloudflightTypescriptFormatConfig(settings)` from `@cloudflight/eslint-plugin-typescript`: Only contains formatting rules for JavaScript and TypeScript files
    - `cloudflightAngularTemplateFormatConfig`: Only contains formatting rules for HTML files (a config array), inline templates are not format-checked

For linting: Open your `eslint.config.mjs` and add one of the configurations:

```js
import {cloudflightAngularConfig} from '@cloudflight/eslint-plugin-angular';
import {includeIgnoreFile} from '@eslint/compat';
import {resolve} from 'node:path';

export default [
    includeIgnoreFile(resolve(import.meta.dirname, '.gitignore')),
    ...cloudflightAngularConfig({
        rootDirectory: import.meta.dirname,
    }),
];
```

For formatting: Open your `eslint.format.mjs` and add one of the configurations:

```js
import {cloudflightAngularFormatConfig} from '@cloudflight/eslint-plugin-angular';
import {includeIgnoreFile} from '@eslint/compat';
import {resolve} from 'node:path';

export default [
    includeIgnoreFile(resolve(import.meta.dirname, '.gitignore')),
    ...cloudflightAngularFormatConfig({
        rootDirectory: import.meta.dirname,
    }),
];
```

See [Custom Configuration](../../CUSTOM_CONFIGURATION.md) for more complicated project setups.
