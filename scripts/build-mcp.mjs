import { build } from 'esbuild';

await build({
    entryPoints: ['src/mcp/index.ts'],
    bundle: true,
    platform: 'node',
    target: 'node18',
    format: 'cjs',
    outfile: 'dist/mcp/server.cjs',
    sourcemap: true,
    external: [],
});

console.log('MCP server build completed.');
