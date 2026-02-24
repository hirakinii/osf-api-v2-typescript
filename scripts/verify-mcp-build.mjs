/**
 * Smoke test for the MCP server build output.
 *
 * Asserts:
 *   1. dist/mcp/server.cjs exists and is smaller than MAX_BUNDLE_SIZE_KB.
 *   2. dist/mcp/server.cjs.map does NOT exist (source maps must be disabled).
 *
 * Exit code: 0 on success, 1 on failure.
 */

import { statSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

/** Maximum allowed size for server.cjs in kilobytes. */
const MAX_BUNDLE_SIZE_KB = 500;

const bundlePath = resolve(projectRoot, 'dist/mcp/server.cjs');
const sourceMapPath = resolve(projectRoot, 'dist/mcp/server.cjs.map');

let failed = false;

// --- Check 1: bundle must exist and be under the size threshold ---
if (!existsSync(bundlePath)) {
  console.error(`FAIL: ${bundlePath} does not exist. Run "npm run build:mcp" first.`);
  failed = true;
} else {
  const stats = statSync(bundlePath);
  const sizeKb = Math.round(stats.size / 1024);
  if (sizeKb > MAX_BUNDLE_SIZE_KB) {
    console.error(
      `FAIL: dist/mcp/server.cjs is ${sizeKb} KB, which exceeds the ${MAX_BUNDLE_SIZE_KB} KB threshold.`,
    );
    failed = true;
  } else {
    console.log(`PASS: dist/mcp/server.cjs is ${sizeKb} KB (threshold: ${MAX_BUNDLE_SIZE_KB} KB).`);
  }
}

// --- Check 2: source map must NOT exist ---
if (existsSync(sourceMapPath)) {
  console.error('FAIL: dist/mcp/server.cjs.map exists. Source maps must be disabled for production builds.');
  failed = true;
} else {
  console.log('PASS: dist/mcp/server.cjs.map does not exist.');
}

process.exit(failed ? 1 : 0);
