import { build } from 'esbuild';
import { rmSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

// Remove stale source map from previous builds.
const staleMap = resolve(projectRoot, 'dist/mcp/server.cjs.map');
if (existsSync(staleMap)) {
  rmSync(staleMap);
}

await build({
    entryPoints: ['src/mcp/index.ts'],
    bundle: true,
    platform: 'node',
    target: 'node18',
    format: 'cjs',
    outfile: 'dist/mcp/server.cjs',
    // Exclude Node.js built-ins and runtime dependencies.
    external: [
        'node:*',
        'path', 'fs', 'os', 'stream', 'events', 'util', 'crypto', 'url', 'http', 'https', 'net',
        '@modelcontextprotocol/sdk',
        '@modelcontextprotocol/sdk/server/stdio.js',
        'ts-morph',
    ],
    minify: true,
    // Source maps are disabled for production builds to keep the output small.
    banner: {
      js: '#!/usr/bin/env node',
    },
});

console.log('MCP server build completed.');
