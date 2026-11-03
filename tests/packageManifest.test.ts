import * as fs from 'fs';
import * as path from 'path';

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
const MCP_ONLY_PACKAGES = ['@modelcontextprotocol/sdk', 'ts-morph'];

describe('package.json dependency layout', () => {
  it.each(MCP_ONLY_PACKAGES)('does not list %s as a runtime dependency', (name) => {
    expect(manifest.dependencies?.[name]).toBeUndefined();
  });

  it.each(MCP_ONLY_PACKAGES)('lists %s as an optional peer dependency', (name) => {
    expect(manifest.peerDependencies?.[name]).toBeDefined();
    expect(manifest.peerDependenciesMeta?.[name]?.optional).toBe(true);
  });

  it.each(MCP_ONLY_PACKAGES)('lists %s as a dev dependency with the same range as the peer', (name) => {
    expect(manifest.devDependencies?.[name]).toBeDefined();
    expect(manifest.devDependencies?.[name]).toBe(manifest.peerDependencies?.[name]);
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
