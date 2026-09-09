import {ESLint, type Linter} from 'eslint';
import {join} from 'node:path';

import {cloudflightReactConfig, cloudflightReactFormatConfig} from './index';

const fixtureDir = join(__dirname, '..', 'fixtures');

function createEslint(): ESLint {
    return new ESLint({
        cwd: fixtureDir,
        overrideConfigFile: true,
        // the typescript-eslint config types are structurally compatible with the eslint core types
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        overrideConfig: cloudflightReactConfig({rootDirectory: fixtureDir}) as Linter.Config[],
    });
}

describe('cloudflightReactConfig', () => {
    it('reports no errors for valid code', async () => {
        const results = await createEslint().lintFiles(['valid.tsx']);

        expect(results.flatMap((result) => result.messages)).toEqual([]);
    });

    it('reports react, hooks, a11y and type-aware violations', async () => {
        const results = await createEslint().lintFiles(['invalid.tsx']);
        const ruleIds = results.flatMap((result) => result.messages).map((message) => message.ruleId);

        expect(ruleIds).toContain('react/jsx-key');
        expect(ruleIds).toContain('react-hooks/rules-of-hooks');
        expect(ruleIds).toContain('jsx-a11y/alt-text');
        expect(ruleIds).toContain('@typescript-eslint/no-floating-promises');
    });

    it('fixes formatting in tsx files with the format config', async () => {
        const eslint = new ESLint({
            cwd: fixtureDir,
            overrideConfigFile: true,
            fix: true,
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            overrideConfig: cloudflightReactFormatConfig({rootDirectory: fixtureDir}) as Linter.Config[],
        });
        // a disable comment for a react rule must be recognized although the format config runs no react rules
        const [result] = await eslint.lintText('// eslint-disable-next-line react-hooks/exhaustive-deps\nexport const value=1', {filePath: 'format.tsx'});
        // the fixed output must be clean and stable: nothing left to report, and a second pass changes nothing
        const [second] = await eslint.lintText(result?.output ?? '', {filePath: 'format.tsx'});

        expect(result?.output).toContain('value = 1;');
        expect(result?.messages).toEqual([]);
        expect(second?.output).toBeUndefined();
        expect(second?.messages).toEqual([]);
    });
});
