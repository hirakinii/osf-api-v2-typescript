import * as path from 'path';
import { findMissingPackages, formatMissingPackagesMessage } from './peerCheck';

/**
 * Entry point for the MCP server via stdio transport.
 */
async function main(): Promise<void> {
  // The SDK and ts-morph are optional peer dependencies. Check for them before
  // loading any module that imports them, so users get actionable guidance
  // instead of a raw MODULE_NOT_FOUND error.
  const missing = findMissingPackages();
  if (missing.length > 0) {
    console.error(formatMissingPackagesMessage(missing));
    process.exit(1);
  }

  // Load lazily: these modules pull in the optional peer packages.
  const { StdioServerTransport } = await import('@modelcontextprotocol/sdk/server/stdio.js');
  const { createMcpServer, resolveSrcDir } = await import('./server');

  const projectRoot = path.resolve(__dirname, '../../');
  const rawSrcDir = process.argv[2] || 'src';
  const srcDir = resolveSrcDir(rawSrcDir, projectRoot);

  const server = createMcpServer(srcDir);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : 'Unknown error';
  console.error(`MCP server error: ${message}`);
  process.exit(1);
});
