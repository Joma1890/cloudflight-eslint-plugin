# `@cloudflight/eslint-plugin-vue`

The Cloudflight ESLint Plugin for Vue provides multiple configurations of ESLint rules recommended by Cloudflight.

You can find the directory of all rules including their reasoning [here](src/configs).

## Dependencies

The following dependencies are required:

```
"eslint": "^10.0.0",
"typescript": ">=5.0.0 <6.1.0"
```

Node.js must satisfy `^20.19.0 || ^22.13.0 || >=24`.

The usage example below imports `includeIgnoreFile` from `@eslint/compat` (2.0.2 or newer, the first release with an ESLint 10 peer dependency); install it if you keep that line.

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

```ts
import { cloudflightVueConfig } from '@cloudflight/eslint-plugin-vue';
import { includeIgnoreFile } from '@eslint/compat';
import { dirname, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = dirname(fileURLToPath(import.meta.url));
const gitignorePath = normalize(resolve(directory, '.gitignore'));

export default [
    includeIgnoreFile(gitignorePath),
    ...cloudflightVueConfig({
        rootDirectory: import.meta.dirname,
    }),
];
```

See [Custom Configuration](../../CUSTOM_CONFIGURATION.md) for more complicated project setups.
