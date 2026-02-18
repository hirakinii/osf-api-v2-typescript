#!/usr/bin/env node

import * as path from 'path';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createMcpServer } from './server';

/**
 * Entry point for the MCP server via stdio transport.
 */
async function main(): Promise<void> {
  const srcDir = process.argv[2] || path.join(process.cwd(), 'src');

  const server = createMcpServer(srcDir);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('MCP server error:', error);
  process.exit(1);
});
