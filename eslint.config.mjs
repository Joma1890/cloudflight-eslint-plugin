import {cloudflightTypescriptConfig} from '@cloudflight/eslint-plugin-typescript';
import {defineConfig, includeIgnoreFile} from 'eslint/config';
import {dirname, normalize, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const directory = dirname(fileURLToPath(import.meta.url));
const gitignorePath = normalize(resolve(directory, '.gitignore'));

export default defineConfig(
    includeIgnoreFile(gitignorePath),
    ...cloudflightTypescriptConfig({
        rootDirectory: import.meta.dirname,
        tsConfigFiles: ['./packages/*/tsconfig.json', './packages/*/tsconfig.spec.json', './tsconfig.eslint.json'],
    }),
    {
        ignores: [
            // exclude private type definition packages (no tsconfig.json)
            'packages/types-eslint-plugin-*/**',
            // lint fixtures deliberately contain rule violations
            'packages/*/fixtures/**',
            'scripts/consumer-fixtures/**',
        ],
    },
    {
        rules: {
            'import-x/no-named-as-default-member': 'off',
        },
    },
);
