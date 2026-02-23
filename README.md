# OSF API v2 TypeScript Client

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![npm version](https://badge.fury.io/js/osf-api-v2-typescript.svg)](https://badge.fury.io/js/osf-api-v2-typescript)
[![CI](https://github.com/hirakinii/osf-api-v2-typescript/actions/workflows/ci.yml/badge.svg)](https://github.com/hirakinii/osf-api-v2-typescript/actions/workflows/ci.yml)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

TypeScript client library for the [Open Science Framework (OSF) API v2](https://developer.osf.io/).

## Features

- **Type-safe**: Comprehensive TypeScript definitions for OSF entities.
- **Resource-oriented**: Intuitive API for 22+ resource types including Nodes, Files, Users, Registrations, Preprints, and more.
- **File Upload & Download**: Upload new files and update existing ones via the Waterbutler API.
- **OAuth2 + PKCE**: Built-in OAuth2 Authorization Code flow with PKCE for browser-based and third-party apps.
- **Automatic Pagination**: Effortlessly iterate through large datasets using `AsyncIterator`.
- **JSON:API Simplified**: Flattens complex JSON:API structures into easy-to-use objects.
- **Dual Build**: CJS, ESM, and UMD outputs for Node.js, modern bundlers, and CDN usage.
- **Browser Compatible**: Uses Web Crypto API and standard `fetch` with no Node.js-specific dependencies.
- **Security**: URL host validation to prevent requests to untrusted origins; rate-limit `Retry-After` support.
- **MCP Server**: Built-in Model Context Protocol server for code symbol discovery and analysis.

## Installation

```bash
npm install osf-api-v2-typescript
```

Or install directly from GitHub:

```bash
npm install git+https://github.com/hirakinii/osf-api-v2-typescript.git
```

You can also load the UMD bundle directly via a CDN or `<script>` tag:

```html
<script src="dist/umd/osf-api-v2.min.js"></script>
<script>
  const client = new OsfApiV2.OsfClient({ token: 'your_token' });
</script>
```

## Basic Usage

### Initialization with Personal Access Token (PAT)

```typescript
import { OsfClient } from 'osf-api-v2-typescript';

const client = new OsfClient({
  token: 'your_personal_access_token',
});

// Get a node by ID
const node = await client.nodes.getById('abc12');
console.log(node.title);
```

For more detailed examples including OAuth2, file operations, and resource-specific guides, please see the [Basic Usage Guide](docs/basic_usage.md).

### Model Context Protocol (MCP) Server

This library includes a built-in MCP server that allows AI agents and other MCP-compatible tools to explore and understand the codebase by extracting exported symbols (classes, interfaces, functions, etc.).

#### Features

- **Symbol Discovery**: Search for symbols by name, kind, or file path.
- **Detailed Metadata**: Retrieve function signatures, line numbers, and JSDoc descriptions.
- **TypeScript AST Based**: Uses `ts-morph` for reliable parsing of TypeScript source files.

#### Building the MCP Server

```bash
npm run build:mcp
```

The output will be generated at `dist/mcp/server.cjs`.

#### Using the MCP Server

You can run the server directly using `npx` (recommended):

```bash
npx osf-api-v2-typescript
```

Or using Node.js from the built output:

```bash
node dist/mcp/server.cjs [src_dir]
```

To use it with an MCP client (like Claude Desktop or Serena), add it to your configuration:

```json
{
  "mcpServers": {
    "osf-api-v2": {
      "command": "npx",
      "args": ["-y", "osf-api-v2-typescript"]
    }
  }
}
```

## Samples

We provide 20+ sample scripts in the `examples/` directory covering all resource types. See [examples/README.md](examples/README.md) for the full list and required environment variables.

Key samples:

- `basic_usage.ts`: Client initialization and basic profile fetching.
- `nodes_management.ts`: Project (Node) lifecycle: Create, List, Update, and Delete.
- `file_operations.ts`: Listing storage providers, files, downloading, and uploading content.
- `pagination_demo.ts`: Using the auto-pagination feature (`AsyncIterator`).
- `registrations.ts`: Registration listing and sub-resource exploration.
- `preprints.ts`: Preprint listing, contributors, files, and citations.
- `draft_registrations.ts`: Draft Registration CRUD and contributors.
- `collections.ts`: Collection creation, node linking/unlinking.
- `wikis.ts`: Wiki metadata, content retrieval, and versioning.
- `comments.ts`: Comment CRUD and replies.
- `providers.ts`: Preprint, Registration, and Collection providers.
- `auth.ts`: OAuth applications, personal access tokens, and scopes.
- `oauth2.ts`: Full OAuth2 Authorization Code + PKCE flow demonstration.

To run the samples, set your OSF token as an environment variable and use `npx ts-node`:

```bash
export OSF_TOKEN='your_personal_access_token'
npx ts-node examples/basic_usage.ts
```

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build all formats (CJS + ESM + UMD)
npm run build

# Build individual formats
npm run build:cjs   # CommonJS → dist/cjs/
npm run build:esm   # ES Modules → dist/esm/
npm run build:umd   # UMD/IIFE → dist/umd/
```

### Build Outputs

| Format | Output                   | Use Case                                           |
| ------ | ------------------------ | -------------------------------------------------- |
| CJS    | `dist/cjs/`              | Node.js `require()`                                |
| ESM    | `dist/esm/`              | Modern bundlers (Vite, webpack, etc.) and `import` |
| UMD    | `dist/umd/osf-api-v2.js` | `<script>` tags, CDN (global: `OsfApiV2`)          |

## Change log

See [CHANGELOG.md](./CHANGELOG.md) for details.

## License

Apache License 2.0. See [LICENSE](./LICENSE) for details.
