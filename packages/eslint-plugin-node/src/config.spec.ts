import {ESLint, type Linter} from 'eslint';
import {join} from 'node:path';

import {cloudflightNodeConfig} from './index';

const fixtureDir = join(__dirname, '..', 'fixtures');

function createEslint(): ESLint {
    return new ESLint({
        cwd: fixtureDir,
        overrideConfigFile: true,
        // the typescript-eslint config types are structurally compatible with the eslint core types
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        overrideConfig: cloudflightNodeConfig({rootDirectory: fixtureDir}) as Linter.Config[],
    });
}

describe('cloudflightNodeConfig', () => {
    it('reports no errors for valid code', async () => {
        const results = await createEslint().lintFiles(['valid.ts']);

        expect(results.flatMap((result) => result.messages)).toEqual([]);
    });

    it('escalates the security recommendations to errors', async () => {
        const results = await createEslint().lintText(
            'export function get(object: Record<string, string>, key: string): string | undefined {\n    return object[key];\n}\n',
            {filePath: 'invalid.ts'},
        );
        const messages = results.flatMap((result) => result.messages)
            .filter((message) => message.ruleId === 'security/detect-object-injection');

        // the base config only warns here, the node config turns it into an error
        expect(messages.map((message) => message.severity)).toEqual([2]);
    });

    it('reports node and type-aware violations', async () => {
        const results = await createEslint().lintFiles(['invalid.ts']);
        const ruleIds = results.flatMap((result) => result.messages).map((message) => message.ruleId);

        expect(ruleIds).toContain('n/no-sync');
        expect(ruleIds).toContain('@typescript-eslint/no-floating-promises');
    });

    it('lints javascript tooling files with synchronous calls without a typescript project', async () => {
        const results = await createEslint().lintFiles(['tool.mjs']);
        const messages = results.flatMap((result) => result.messages);

        expect(messages.filter((message) => message.fatal)).toEqual([]);
        expect(messages.map((message) => message.ruleId)).not.toContain('n/no-sync');
    });
});
