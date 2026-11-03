# Implementation Plan: Move MCP Runtime Packages to Optional `peerDependencies` (Issue #75)

## Background

`@modelcontextprotocol/sdk` (^1.26.0) and `ts-morph` (^27.0.2) are listed in `dependencies`, but only the MCP server CLI uses them. The CLI is exposed through `bin` as `osf-api-v2-typescript` and `osf-mcp`, both pointing to `dist/mcp/server.cjs`.

`scripts/build-mcp.mjs` keeps both packages as esbuild externals, so the bundle `require`s them at runtime. The library entry points (dist/cjs, dist/esm, UMD) never import them. As a result, library-only consumers install the whole MCP stack and inherit its `npm audit` advisories.

Current state:

- `src/mcp/index.ts` statically imports `StdioServerTransport` from `@modelcontextprotocol/sdk/server/stdio.js` and imports `./server`.
- `src/mcp/server.ts` imports `McpServer` from the SDK and `z` from `zod`. zod is bundled rather than external, and it is only available because the SDK depends on it.
- `src/mcp/extractor.ts` imports from `ts-morph`.
- If the packages are not installed, the CLI crashes with a raw `MODULE_NOT_FOUND`.
- The bundle is about 309 KB. `scripts/verify-mcp-build.mjs` requires it to be under 500 KB with no source map.

### Decision

We adopt **Option 2** from the issue:

- Move both packages to **optional `peerDependencies`** (with `peerDependenciesMeta`). Also list them in `devDependencies`, because the build and tests need them.
- The new launch command is `npx -y -p osf-api-v2-typescript -p @modelcontextprotocol/sdk -p ts-morph osf-mcp`.

We plan to migrate to **Option 1** later, which moves the server into a separate package such as `osf-api-v2-mcp`. To keep that migration simple:

- All MCP code stays under `src/mcp/` and does not import library internals.
- The launch command string lives in a single constant.
- The build script, verify script and tests stay MCP-specific.
- The launch instructions stay in a single README subsection.

## Goals

1. Installing the package as a library no longer installs the SDK or `ts-morph`.
2. The MCP server can still be launched, and its launch instructions are documented.
3. The change is released as minor version **0.5.0**, and the CHANGELOG states the change to the launch command.
4. If the peers are missing, the CLI prints a clear English error and exits with code 1 instead of crashing with `MODULE_NOT_FOUND`. The error lists the missing packages and the exact npx command.
5. Automated checks fail if either package is moved back into `dependencies`.

## Files to Modify / Create

| File | Change |
|------|--------|
| `tests/mcp/peerCheck.test.ts` | NEW. Unit tests for the peer check, written first (RED). |
| `tests/packageManifest.test.ts` | NEW. Checks the dependency layout in `package.json`. |
| `src/mcp/peerCheck.ts` | NEW. Peer check module; the resolver can be injected for testing. |
| `src/mcp/index.ts` | Run the peer check first, then load `./server` and the SDK lazily. |
| `package.json` | Remove both packages from `dependencies`; add them to `peerDependencies`, `peerDependenciesMeta` and `devDependencies`; bump the version to `0.5.0`. |
| `package-lock.json` | Regenerate with `npm install`. |
| `scripts/verify-mcp-build.mjs` | Add check 3 (load order) and check 4 (manifest layout). |
| `scripts/build-mcp.mjs` | Update the comment on `external`. No functional change. |
| `README.md` | Rewrite the "Using the MCP Server" subsection. |
| `CHANGELOG.md` | Add a `[0.5.0]` entry. |

## Design

### 1. `package.json` layout

```jsonc
{
  "version": "0.5.0",
  // "dependencies" removed entirely (would be empty)
  "peerDependencies": {
    "@modelcontextprotocol/sdk": "^1.26.0",
    "ts-morph": "^27.0.2"
  },
  "peerDependenciesMeta": {
    "@modelcontextprotocol/sdk": { "optional": true },
    "ts-morph": { "optional": true }
  },
  "devDependencies": {
    "@modelcontextprotocol/sdk": "^1.26.0",
    "ts-morph": "^27.0.2"
    // ...existing devDependencies
  }
}
```

- The peer ranges equal the devDependency ranges, so the versions we test are the versions we document.
- npm does not install optional peers for library consumers and does not print peer warnings for them.
- **zod:** `src/mcp/server.ts` imports `zod`, which the project does not declare (a phantom dependency).
  - Add `zod` as an explicit `devDependency` with the range the SDK resolves (currently `zod@4.3.6`), so the tree keeps a single copy.
  - zod stays bundled into `server.cjs`. It is never a runtime or peer dependency.

### 2. Peer check module (`src/mcp/peerCheck.ts`)

The module has no side effects when imported and does not import the SDK or `ts-morph`.

```typescript
export interface RequiredPackage {
  /** npm package name shown to the user. */
  name: string;
  /** Specifier passed to the resolver. */
  probe: string;
}

export const REQUIRED_PACKAGES: readonly RequiredPackage[] = [
  { name: '@modelcontextprotocol/sdk', probe: '@modelcontextprotocol/sdk/server/stdio.js' },
  { name: 'ts-morph', probe: 'ts-morph' },
];

export type Resolver = (specifier: string) => string;

export function findMissingPackages(
  resolver: Resolver = require.resolve,
  packages = REQUIRED_PACKAGES,
): string[];

export function formatMissingPackagesMessage(missing: readonly string[]): string;

export const NPX_LAUNCH_COMMAND =
  'npx -y -p osf-api-v2-typescript -p @modelcontextprotocol/sdk -p ts-morph osf-mcp';
```

- The SDK is probed through the subpath that is actually imported, because its `exports` map may not resolve the bare package name.
- Any resolver error counts as "missing".
- The message lists the missing packages, then `NPX_LAUNCH_COMMAND`, then the global-install alternative. It contains no filesystem paths or stack traces.

### 3. Lazy loading in `src/mcp/index.ts`

esbuild turns top-level imports of externals into top-level `require`s. If `./server` or the SDK were imported statically, they would load before the peer check runs.

```typescript
import * as path from 'path';
import { findMissingPackages, formatMissingPackagesMessage } from './peerCheck';

async function main(): Promise<void> {
  const missing = findMissingPackages();
  if (missing.length > 0) {
    console.error(formatMissingPackagesMessage(missing));
    process.exit(1);
  }
  // Load lazily: these modules pull in the optional peer packages.
  const { StdioServerTransport } = await import('@modelcontextprotocol/sdk/server/stdio.js');
  const { createMcpServer, resolveSrcDir } = await import('./server');
  // ...existing logic unchanged...
}
```

- **Fallback:** if the bundle still loads the externals before the check (verified in Step 7), call `require()` inside `main` instead, with an explanatory comment.

### 4. Resolution semantics (document in README)

- `npx -y -p A -p B -p C osf-mcp`: npx installs all three packages into the same `node_modules` in its cache, so `require` calls from `dist/mcp/server.cjs` can find the other two. The bin name `osf-mcp` must be given explicitly, because npx cannot infer it when several `-p` flags are present.
- `npm install -g osf-api-v2-typescript @modelcontextprotocol/sdk ts-morph`: the packages are installed side by side in the global `lib/node_modules`, so Node finds the peers by searching parent directories.
- A plain `npx osf-api-v2-typescript` no longer works. This is a breaking change for CLI users.

## Implementation Steps (TDD)

### Step 1 (RED): `tests/mcp/peerCheck.test.ts`

| # | Test case |
|---|-----------|
| 1 | Returns `[]` when the resolver succeeds for every probe. |
| 2 | Returns only `ts-morph` when the resolver throws for it. |
| 3 | Returns both names when the resolver always throws. |
| 4 | Passes probe specifiers to the resolver and returns display names. |
| 5 | The message includes every missing package name. |
| 6 | The message includes the exact `NPX_LAUNCH_COMMAND`. |
| 7 | The message contains no absolute paths or stack traces. |
| 8 | The default resolver returns `[]` in the dev environment. |

### Step 2 (RED): `tests/packageManifest.test.ts`

Assert the following:

- `dependencies` contains neither package.
- Both packages are in `peerDependencies`, and `peerDependenciesMeta` marks each one as optional.
- Both packages are in `devDependencies` with the same ranges as the peers.
- `version` matches `^0\.5\.`.
- `bin['osf-mcp']` is `./dist/mcp/server.cjs`.

### Step 3 (GREEN): implement `src/mcp/peerCheck.ts`

### Step 4 (GREEN): `package.json` and lockfile

1. Edit `package.json` and run `npm install`.
2. Review the lockfile diff.
3. Confirm the result with `npm ls @modelcontextprotocol/sdk ts-morph zod`.

### Step 5: lazy loading in `src/mcp/index.ts`

### Step 6: quality gates and refactoring

```bash
npm run format && npm run lint && npm run typecheck
npm test            # coverage >= 80%
npm run build
npm run verify:mcp
```

### Step 7: bundle load order and the missing-peer error

1. Extend `scripts/verify-mcp-build.mjs`:
   - Check 3 asserts that the first `require` of either external comes after the peer check code. The `NPX_LAUNCH_COMMAND` literal marks where the check is.
   - Check 4 asserts the manifest layout.
2. Manually copy `server.cjs` to a temp directory outside any `node_modules` tree, and run it.
   - Expected: the clear error and exit code 1.
   - Also run it with only one peer resolvable; only the other one should be listed.
3. Happy path: complete an MCP `initialize` handshake over stdio.

### Step 8: confirm that installing the library does not pull in the peers

1. Run `npm pack`.
2. Install the tarball into an empty project.
3. Run these checks:
   - `npm ls @modelcontextprotocol/sdk ts-morph` lists neither package.
   - `require('osf-api-v2-typescript')` still loads.
   - `npm audit --omit=dev` no longer reports the MCP advisories.
4. Launch the CLI and confirm the handshake both ways:
   - with `npx -y -p <tgz> -p @modelcontextprotocol/sdk -p ts-morph osf-mcp`;
   - with a global install into a throwaway `--prefix`.

### Step 9: documentation

- **README:**
  - Explain that the MCP server needs two optional packages.
  - Document the npx command, the global install and the checkout usage.
  - Update the `mcpServers` JSON:

    ```json
    {
      "mcpServers": {
        "osf-api-v2": {
          "command": "npx",
          "args": ["-y", "-p", "osf-api-v2-typescript", "-p", "@modelcontextprotocol/sdk", "-p", "ts-morph", "osf-mcp"]
        }
      }
    }
    ```

  - Note that the MCP server may move to a separate package in the future.
- **CHANGELOG `[0.5.0]`:**
  - Under Changed, add a BREAKING note that the launch command changed (old and new commands).
  - Under Added, add the startup peer check and the new `verify:mcp` checks.

### Step 10: final verification and release

- Run the full gate.
- Run the `security.md` checklist. In particular, the error message must not leak any paths.
- Merge, then tag `v0.5.0` so CD publishes the release.

## Testing Summary

- **Unit:**
  - `tests/mcp/peerCheck.test.ts` and `tests/packageManifest.test.ts`.
  - The existing tests in `tests/mcp/*` must keep passing.
- **Build-level:** the extended `scripts/verify-mcp-build.mjs` (size, no source map, load order, manifest).
- **Manual integration:**
  - running without the peers;
  - the stdio handshake;
  - `npm pack`, install into a consumer project and `npm ls`;
  - npx launch with several `-p` flags;
  - launch after a global install.
- **Coverage:** at least 80% (`jest.config.js`).

## Risks and Mitigations

- **esbuild loads the externals before the check.**
  - Mitigation: Step 7 inspects the real bundle; fall back to `require()` inside `main`.
- **The SDK's bare package name does not resolve.**
  - Mitigation: probe the subpath, and confirm with test 8.
- **Existing MCP client configs (`npx -y osf-api-v2-typescript`) break.**
  - Mitigation: this is an intended breaking change in a minor release, as the issue requires. The CHANGELOG has a BREAKING note, and the runtime error prints the new command.
- **pnpm and yarn handle optional peers differently.**
  - Mitigation: document npm/npx usage only.
- **The bundled zod and the SDK's zod drift apart.**
  - Mitigation: use the SDK-compatible range, and run the tests and the handshake.
- **Later migration to Option 1.**
  - Mitigation: the MCP code is self-contained and the command lives in a single constant. After the move, the new package declares the SDK and `ts-morph` as normal dependencies, and this package drops the optional peers.

## Success Criteria

- [ ] Installing the library into a clean project does not install `@modelcontextprotocol/sdk` or `ts-morph`.
- [ ] `package.json` lists both packages as optional peers and as devDependencies, but not as dependencies.
- [ ] The npx command starts the server and completes the MCP handshake.
- [ ] Without the peers, the CLI prints the missing packages and the npx command, and exits with code 1.
- [ ] `npm run verify:mcp` passes.
- [ ] `npm test` passes with at least 80% coverage, and lint, typecheck and build pass.
- [ ] The README documents the new launch command.
- [ ] The CHANGELOG has a `[0.5.0]` entry that states the launch command change.
- [ ] The version is 0.5.0 in both `package.json` and `package-lock.json`.
