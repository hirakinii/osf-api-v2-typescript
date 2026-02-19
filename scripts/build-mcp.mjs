import { build } from 'esbuild';

await build({
    entryPoints: ['src/mcp/index.ts'],
    bundle: true,
    platform: 'node',
    target: 'node18',
    format: 'cjs',
    outfile: 'dist/mcp/server.cjs',
    sourcemap: true,
    banner: {
      js: '#!/usr/bin/env node',
    },
    external: [],
});

console.log('MCP server build completed.');
