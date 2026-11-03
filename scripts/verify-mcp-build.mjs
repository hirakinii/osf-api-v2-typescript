/**
 * Smoke test for the MCP server build output.
 *
 * Asserts:
 *   1. dist/mcp/server.cjs exists and is smaller than MAX_BUNDLE_SIZE_KB.
 *   2. dist/mcp/server.cjs.map does NOT exist (source maps must be disabled).
 *   3. When the optional peer packages cannot be resolved, the bundle prints
 *      the launch guidance and exits with code 1 instead of crashing with
 *      MODULE_NOT_FOUND (i.e. the peers are loaded only after the peer check).
 *   4. package.json does not list the MCP-only packages as runtime
 *      dependencies, and declares them as optional peer dependencies.
 *
 * Exit code: 0 on success, 1 on failure.
 */

import { statSync, existsSync, mkdtempSync, mkdirSync, copyFileSync, readFileSync, rmSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
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

// --- Check 3: missing peers must produce launch guidance, not MODULE_NOT_FOUND ---
/** Packages used only by the MCP server; they must be optional peers. */
const MCP_ONLY_PACKAGES = ['@modelcontextprotocol/sdk', 'ts-morph'];
// Keep in sync with NPX_LAUNCH_COMMAND in src/mcp/peerCheck.ts. This script checks
// the built bundle, so it cannot import the TypeScript source; check 3 fails on drift.
const NPX_LAUNCH_COMMAND = 'npx -y -p osf-api-v2-typescript -p @modelcontextprotocol/sdk@1 -p ts-morph@28 osf-mcp';

if (existsSync(bundlePath)) {
  // Copy the bundle outside the project so the peers cannot be resolved.
  const isolatedRoot = mkdtempSync(join(tmpdir(), 'osf-mcp-verify-'));
  try {
    const isolatedBundle = join(isolatedRoot, 'dist', 'mcp', 'server.cjs');
    mkdirSync(dirname(isolatedBundle), { recursive: true });
    copyFileSync(bundlePath, isolatedBundle);

    const result = spawnSync(process.execPath, [isolatedBundle], {
      encoding: 'utf8',
      env: { ...process.env, NODE_PATH: '' },
      input: '',
      timeout: 30000,
    });
    const stderr = result.stderr ?? '';
    const listsAllPeers = MCP_ONLY_PACKAGES.every((name) => stderr.includes(`  - ${name}`));

    if (result.status === 1 && stderr.includes(NPX_LAUNCH_COMMAND) && listsAllPeers && !stderr.includes('MODULE_NOT_FOUND')) {
      console.log('PASS: bundle without peers prints launch guidance and exits with code 1.');
    } else {
      console.error(`FAIL: bundle without peers did not print launch guidance (exit code: ${result.status}).`);
      console.error(stderr);
      failed = true;
    }
  } finally {
    rmSync(isolatedRoot, { recursive: true, force: true });
  }
}

// --- Check 4: MCP-only packages must be optional peers, not runtime dependencies ---
const manifest = JSON.parse(readFileSync(resolve(projectRoot, 'package.json'), 'utf8'));
for (const name of MCP_ONLY_PACKAGES) {
  if (manifest.dependencies?.[name]) {
    console.error(`FAIL: ${name} must not be listed in "dependencies".`);
    failed = true;
  } else if (!manifest.peerDependencies?.[name] || manifest.peerDependenciesMeta?.[name]?.optional !== true) {
    console.error(`FAIL: ${name} must be an optional peer dependency.`);
    failed = true;
  } else {
    console.log(`PASS: ${name} is an optional peer dependency.`);
  }
}

process.exit(failed ? 1 : 0);
