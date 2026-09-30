# `@cloudflight/eslint-plugin-vue`

The Cloudflight ESLint Plugin for Vue provides a configuration of ESLint rules recommended by Cloudflight.

You can find the directory of all rules including their reasoning [here](src/configs).

## Dependencies

The following dependencies are required:

```
"eslint": "^10.4.0",
"typescript": ">=5.0.0 <6.1.0"
```

Node.js must satisfy `^20.19.0 || ^22.13.0 || >=24`.

Upgrading from 1.x? See [Upgrading from 1.x](https://github.com/cloudflightio/cloudflight-eslint-plugin#upgrading-from-1x).

## Usage

In your `package.json` add the following:

```json
"devDependencies": {
    ...
    "@cloudflight/eslint-plugin-vue": "<version>",
    ...
}
```

Now open your `eslint.config.mjs` and add one of the configurations:

```js
import {cloudflightVueConfig} from '@cloudflight/eslint-plugin-vue';
import {includeIgnoreFile} from 'eslint/config';
import {resolve} from 'node:path';

export default [
    includeIgnoreFile(resolve(import.meta.dirname, '.gitignore')),
    ...cloudflightVueConfig({
        rootDirectory: import.meta.dirname,
    }),
];
```

See [@cloudflight/eslint-plugin-typescript](../eslint-plugin-typescript/README.md) for formatting; the format config covers JavaScript and TypeScript files, `.vue` single-file components are not format-checked.

See [Custom Configuration](../../CUSTOM_CONFIGURATION.md) for more complicated project setups.
