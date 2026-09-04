import {cloudflightTypescriptConfig} from '@cloudflight/eslint-plugin-typescript';
import {includeIgnoreFile} from '@eslint/compat';
import {dirname, normalize, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import tseslint from 'typescript-eslint';

const directory = dirname(fileURLToPath(import.meta.url));
const gitignorePath = normalize(resolve(directory, '.gitignore'));

export default tseslint.config(
    includeIgnoreFile(gitignorePath),
    ...cloudflightTypescriptConfig({
        rootDirectory: import.meta.dirname,
        tsConfigFiles: ['./packages/*/tsconfig.json', './packages/*/tsconfig.spec.json', './tsconfig.eslint.json'],
    }),
    {
        ignores: [
            // exclude private type definition packages (no tsconfig.json)
            'packages/types-eslint-plugin-*/**',
        ],
    },
    {
        rules: {
            'import-x/no-named-as-default-member': 'off',
        },
    },
);
