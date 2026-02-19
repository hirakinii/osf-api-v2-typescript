import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import * as path from 'path';
import { createMcpServer, resolveSrcDir } from './server';

/**
 * Entry point for the MCP server via stdio transport.
 */
async function main(): Promise<void> {
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
