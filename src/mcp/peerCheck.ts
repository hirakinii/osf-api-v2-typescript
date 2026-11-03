/**
 * Startup check for the optional peer packages required by the MCP server.
 *
 * The MCP server depends on packages that are declared as optional
 * `peerDependencies`, so library consumers do not install them. This module
 * detects whether they can be resolved before the server code loads them,
 * and builds a user-facing message when they cannot.
 *
 * This module must not import the peer packages itself.
 */

/** A package the MCP server needs at runtime. */
export interface RequiredPackage {
  /** npm package name shown to the user. */
  name: string;
  /** Module specifier passed to the resolver to test availability. */
  probe: string;
}

/** Resolves a module specifier to a file path, throwing if it cannot be found. */
export type Resolver = (specifier: string) => string;

/**
 * Packages required by the MCP server.
 * The SDK is probed via the subpath the server imports, because its `exports`
 * map does not guarantee that the bare package name resolves.
 */
export const REQUIRED_PACKAGES: readonly RequiredPackage[] = [
  { name: '@modelcontextprotocol/sdk', probe: '@modelcontextprotocol/sdk/server/stdio.js' },
  { name: 'ts-morph', probe: 'ts-morph' },
];

/** Recommended command to launch the MCP server with its peer packages. */
export const NPX_LAUNCH_COMMAND = 'npx -y -p osf-api-v2-typescript -p @modelcontextprotocol/sdk -p ts-morph osf-mcp';

/** Alternative: install the server and its peer packages globally. */
export const GLOBAL_INSTALL_COMMAND = 'npm install -g osf-api-v2-typescript @modelcontextprotocol/sdk ts-morph';

/**
 * Find the required packages that cannot be resolved.
 *
 * @param resolver - Function used to resolve each probe specifier
 * @param packages - Packages to check
 * @returns Names of the packages that could not be resolved, in input order
 */
export function findMissingPackages(
  resolver: Resolver = require.resolve,
  packages: readonly RequiredPackage[] = REQUIRED_PACKAGES,
): string[] {
  return packages
    .filter((pkg) => {
      try {
        resolver(pkg.probe);
        return false;
      } catch {
        return true;
      }
    })
    .map((pkg) => pkg.name);
}

/**
 * Build the error message shown when required packages are missing.
 * The message intentionally contains no filesystem paths or stack traces.
 *
 * @param missing - Names of the missing packages
 * @returns Multi-line message explaining how to launch the server
 */
export function formatMissingPackagesMessage(missing: readonly string[]): string {
  return [
    'The OSF API v2 MCP server requires the following packages, which are not installed:',
    ...missing.map((name) => `  - ${name}`),
    '',
    'They are optional peer dependencies and are not installed with the library.',
    'Launch the server with:',
    `  ${NPX_LAUNCH_COMMAND}`,
    '',
    'Or install them globally and run "osf-mcp":',
    `  ${GLOBAL_INSTALL_COMMAND}`,
  ].join('\n');
}
