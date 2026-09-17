import {cloudflightTypescriptVersion} from '@cloudflight/eslint-plugin-typescript';
import {existsSync, readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {isAbsolute, join} from 'node:path';

interface PackageManifest {
    name: string;
    version: string;
}

function isPackageManifest(value: unknown): value is PackageManifest {
    return typeof value === 'object' && value !== null &&
        'name' in value && typeof value.name === 'string' &&
        'version' in value && typeof value.version === 'string';
}

function readManifest(path: string): PackageManifest {
    const manifest: unknown = JSON.parse(readFileSync(path, 'utf8'));

    if (!isPackageManifest(manifest)) {
        throw new Error(`No package manifest found at ${path}`);
    }

    return manifest;
}

// reads this package's own manifest without help from the base package,
// because a base package of another version is exactly what is detected here
const {name, version} = readManifest(join(__dirname, '..', 'package.json'));

const updateHint = 'Update all @cloudflight/eslint-plugin-* packages together.';

function hasDependency(manifest: unknown, dependency: string): boolean {
    if (typeof manifest !== 'object' || manifest === null) {
        return false;
    }

    return ['dependencies', 'devDependencies'].some((field) => {
        const dependencies: unknown = Reflect.get(manifest, field);

        return typeof dependencies === 'object' && dependencies !== null && dependency in dependencies;
    });
}

/**
 * Whether the project declares the base package itself. A project that only depends on a framework
 * package gets the base package through it, and a base package hoisted next to the project for
 * another workspace is not the one its config files import.
 */
function projectDeclaresBase(rootDirectory: string): boolean {
    const manifestPath = join(rootDirectory, 'package.json');

    return existsSync(manifestPath) && hasDependency(JSON.parse(readFileSync(manifestPath, 'utf8')), '@cloudflight/eslint-plugin-typescript');
}

/**
 * The base package as the project resolves it from its root directory, which is the copy its
 * config files import; undefined when the project does not declare or cannot resolve the base package.
 */
function projectBaseManifest(rootDirectory: string): {path: string; manifest: PackageManifest} | undefined {
    // an invalid root directory is reported by the base config with a message that names the setting
    if (typeof rootDirectory !== 'string' || !isAbsolute(rootDirectory) || !projectDeclaresBase(rootDirectory)) {
        return undefined;
    }

    const require = createRequire(join(rootDirectory, 'package.json'));
    let path: string;

    try {
        path = require.resolve('@cloudflight/eslint-plugin-typescript/package.json');
    }
    catch {
        return undefined;
    }

    return {path, manifest: readManifest(path)};
}

/**
 * The framework packages are released together with the base package and are only supported at one
 * version. A partial update leaves two copies installed, and the configs of a project then come from
 * different versions. This compares the base package this framework package resolved and the one the
 * project resolves from its root directory with the framework package's own version.
 */
export function assertMatchingBaseVersion(rootDirectory: string): void {
    // an older base package does not export its version at all
    const baseVersion: string | undefined = cloudflightTypescriptVersion;

    if (baseVersion !== version) {
        throw new Error(`${name} ${version} requires @cloudflight/eslint-plugin-typescript ${version}, but resolved ${baseVersion ?? 'an older version'}. ${updateHint}`);
    }

    const projectBase = projectBaseManifest(rootDirectory);

    if (projectBase !== undefined && projectBase.manifest.version !== version) {
        throw new Error(`${name} ${version} requires @cloudflight/eslint-plugin-typescript ${version}, but the project resolves ${projectBase.manifest.version} from ${projectBase.path}. ${updateHint}`);
    }
}
