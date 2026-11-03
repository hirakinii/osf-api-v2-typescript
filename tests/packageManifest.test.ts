import * as fs from 'fs';
import * as path from 'path';
import { REQUIRED_PACKAGES } from '../src/mcp/peerCheck';

interface PackageManifest {
  version: string;
  bin?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  peerDependenciesMeta?: Record<string, { optional?: boolean }>;
}

const manifest: PackageManifest = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf8'),
) as PackageManifest;

// Packages used only by the MCP server CLI; library consumers must not install them.
const MCP_ONLY_PACKAGES = REQUIRED_PACKAGES.map((pkg) => pkg.name);

/**
 * Extract the major versions allowed by a range made of caret alternatives,
 * e.g. "^27.0.2 || ^28.0.0" -> [27, 28].
 * Throws on any other range syntax so that unsupported formats fail loudly.
 */
function caretMajors(range: string): number[] {
  return range.split('||').map((alternative) => {
    const match = /^\^(\d+)\.\d+\.\d+$/.exec(alternative.trim());
    if (!match) {
      throw new Error(`Unsupported range alternative: "${alternative.trim()}"`);
    }
    return Number(match[1]);
  });
}

describe('caretMajors', () => {
  it('extracts the major of each caret alternative', () => {
    expect(caretMajors('^1.26.0')).toEqual([1]);
    expect(caretMajors('^27.0.2 || ^28.0.0')).toEqual([27, 28]);
  });

  it('throws on unsupported range syntax', () => {
    expect(() => caretMajors('>=27.0.0')).toThrow('Unsupported range alternative: ">=27.0.0"');
    expect(() => caretMajors('^27.0.2 || ~28.0.0')).toThrow('Unsupported range alternative: "~28.0.0"');
  });
});

describe('package.json dependency layout', () => {
  it.each(MCP_ONLY_PACKAGES)('does not list %s as a runtime dependency', (name) => {
    expect(manifest.dependencies?.[name]).toBeUndefined();
  });

  it.each(MCP_ONLY_PACKAGES)('lists %s as an optional peer dependency', (name) => {
    expect(manifest.peerDependencies?.[name]).toBeDefined();
    expect(manifest.peerDependenciesMeta?.[name]?.optional).toBe(true);
  });

  it.each(MCP_ONLY_PACKAGES)('lists %s as a dev dependency within the peer range', (name) => {
    const devRange = manifest.devDependencies?.[name] ?? '';
    const peerRange = manifest.peerDependencies?.[name] ?? '';
    const [devMajor] = caretMajors(devRange);
    expect(caretMajors(peerRange)).toContain(devMajor);
  });

  it.each(REQUIRED_PACKAGES)(
    'pins $launchSpec in the launch commands within the peer range',
    ({ name, launchSpec }) => {
      const pinnedMajor = Number(launchSpec.slice(launchSpec.lastIndexOf('@') + 1));
      expect(caretMajors(manifest.peerDependencies?.[name] ?? '')).toContain(pinnedMajor);
    },
  );

  it('supports ts-morph 28 as a peer', () => {
    expect(caretMajors(manifest.peerDependencies?.['ts-morph'] ?? '')).toContain(28);
  });

  it('declares zod explicitly as a dev dependency because the MCP server imports it', () => {
    expect(manifest.devDependencies?.zod).toBeDefined();
    expect(manifest.dependencies?.zod).toBeUndefined();
  });

  it('is released as 0.5.x', () => {
    expect(manifest.version).toMatch(/^0\.5\./);
  });

  it('keeps the osf-mcp bin pointing to the MCP server bundle', () => {
    expect(manifest.bin?.['osf-mcp']).toBe('./dist/mcp/server.cjs');
  });
});
