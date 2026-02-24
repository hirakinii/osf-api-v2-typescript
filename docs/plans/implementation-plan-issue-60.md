# Implementation Plan: Reduce dist/mcp Bundle Size (Issue #60)

## Background

Running `du dist/ -k` revealed that `dist/mcp/` is over 35 MB total:

| File | Size |
|------|------|
| `dist/mcp/server.cjs` | 15 MB |
| `dist/mcp/server.cjs.map` | 20 MB |

## Root Cause Analysis

Two issues were identified in [scripts/build-mcp.mjs](../../scripts/build-mcp.mjs):

### 1. `external: []` — All npm packages are bundled

```js
external: [],  // No packages excluded → everything bundled
```

esbuild inlines every `node_modules` package into `server.cjs`.
The dominant contributor is `@modelcontextprotocol/sdk` (≈ 8.6 MB on disk),
which itself pulls in 17 transitive dependencies including `express`, `hono`,
`zod`, `ajv`, `jose`, etc.

### 2. `sourcemap: true` — Source map bloats the output by 20 MB

The source map (`server.cjs.map`) is a development artifact that is not needed
at runtime. With `sourcemap: true`, esbuild emits a 20 MB mapping file
alongside the bundle.

## Goals

- Reduce `dist/mcp/server.cjs` to well under 1 MB.
- Remove the 20 MB source map from the distribution artifact.
- Keep the MCP server fully functional as a standalone CLI binary.

## Implementation Steps

### Step 1: Mark Node.js built-ins as external

Add `node:*` (and plain names like `path`, `fs`, etc.) to `external` so that
Node.js built-in modules are never bundled.

```js
external: ['node:*', 'path', 'fs', 'os', 'stream', 'events', 'util', 'crypto', 'url', 'http', 'https', 'net'],
```

### Step 2: Mark `@modelcontextprotocol/sdk` as external

Because the MCP server binary is not a standalone executable shipped to
end-users but is instead installed via `npm install -g` (or run via `npx`),
`@modelcontextprotocol/sdk` can be declared as a runtime dependency and
excluded from the bundle. This removes the single largest contributor to
bundle size.

- Move `@modelcontextprotocol/sdk` from `devDependencies` to `dependencies`
  in `package.json`.
- Add it to the `external` list in `build-mcp.mjs`.

```js
external: [
  'node:*', 'path', 'fs', 'os', 'stream', 'events', 'util', 'crypto', 'url', 'http', 'https', 'net',
  '@modelcontextprotocol/sdk',
  '@modelcontextprotocol/sdk/server/stdio.js',
],
```

### Step 3: Disable source map for the production build

Remove `sourcemap: true` (or set it to `false`) so that the 20 MB `.map`
file is not generated.

```js
// sourcemap: true,  ← remove or set to false
```

### Step 4: Enable minification

Enable esbuild's built-in minification to further reduce bundle size.

```js
minify: true,
```

### Step 5: Update `package.json` — move SDK to `dependencies`

```json
"dependencies": {
  "@modelcontextprotocol/sdk": "^1.26.0"
},
"devDependencies": {
  // remove @modelcontextprotocol/sdk from here
}
```

### Step 6: Add tests / verification

- Add a smoke test script (e.g., `scripts/verify-mcp-build.mjs`) that:
  1. Runs `npm run build:mcp`.
  2. Asserts `dist/mcp/server.cjs` is smaller than a defined threshold
     (e.g., 500 KB).
  3. Asserts `dist/mcp/server.cjs.map` does **not** exist.
- Update CI (if present) to run this verification step.

## Expected Outcome

| File | Before | After (estimate) |
|------|--------|-----------------|
| `dist/mcp/server.cjs` | 15 MB | < 100 KB |
| `dist/mcp/server.cjs.map` | 20 MB | (deleted) |
| **Total `dist/mcp/`** | **35 MB** | **< 100 KB** |

> Note: the exact final size depends on which other packages besides
> `@modelcontextprotocol/sdk` are pulled in. If any remain bundled, they
> should be assessed individually and either externalised or minified.

## Files to Modify

| File | Change |
|------|--------|
| `scripts/build-mcp.mjs` | Add `external`, remove `sourcemap`, add `minify` |
| `package.json` | Move `@modelcontextprotocol/sdk` to `dependencies` |
| `scripts/verify-mcp-build.mjs` | New smoke-test script (optional) |

## Risks and Considerations

- **Runtime dependency**: Moving `@modelcontextprotocol/sdk` to `dependencies`
  means it is installed automatically by npm when users install this package.
  This is the correct behaviour for a CLI tool.
- **Node.js built-ins**: Using `node:` prefix externals requires Node ≥ 14.18.
  The current target is `node18`, so this is safe.
- **Minification and debugging**: Disabling source maps makes production
  debugging harder. If source maps are needed for development builds, a
  separate `build:mcp:dev` script with `sourcemap: true` and `minify: false`
  can be added.
