# OSF API v2 TypeScript Client

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

TypeScript client library for the [Open Science Framework (OSF) API v2](https://developer.osf.io/).

## Features

- **Type-safe**: Comprehensive TypeScript definitions for OSF entities.
- **Resource-oriented**: Intuitive API for Nodes, Files, and Users.
- **Automatic Pagination**: Effortlessly iterate through large datasets using `AsyncIterator`.
- **JSON:API Simplified**: Flattens complex JSON:API structures into easy-to-use objects.
- **Modern**: Built with modern TypeScript and native `fetch`.

## Installation

As of 2026/2/5, this library is not published to npm. You can install it from GitHub:

```bash
npm install git+https://github.com/your-username/osf-api-v2-typescript.git
```

## Basic Usage

### Initialization

```typescript
import { OsfClient } from 'osf-api-v2-typescript';

const client = new OsfClient({
  token: 'your_personal_access_token',
  // baseUrl: 'https://api.test.osf.io/v2/', // Optional: Defaults to production
  // timeout: 30000 // Optional: Defaults to 30 seconds
});
```

### Nodes (Projects & Components)

```typescript
// Get a node by ID
const node = await client.nodes.getById('abc12');
console.log(node.title);

// List public nodes
const publicNodes = await client.nodes.listNodes({ 'filter[public]': true });

// Create a new project
const newProject = await client.nodes.create({
  title: 'My New Research',
  category: 'project',
  description: 'Exploring the depths of science.'
});

// Update a node
await client.nodes.update('abc12', { public: true });

// Delete a node
await client.nodes.deleteNode('abc12');
```

### Files

```typescript
// List files for a node
const files = await client.files.listByNode('abc12', 'osfstorage');

// Download a file (returns ArrayBuffer)
const file = files.data[0];
const content = await client.files.download(file);

// List file versions
const versions = await client.files.listVersions(file.id);
```

### Pagination

The library provides `PaginatedResult` for easy traversal of lists.

```typescript
const result = await client.nodes.listNodesPaginated();

// 1. Iterate through all items across all pages
for await (const node of result.items()) {
  console.log(node.title);
}

// 2. Iterate through pages
for await (const pageItems of result) {
  console.log(`Fetched ${pageItems.length} items on this page`);
}

// 3. Get all items as an array (use with caution for large lists)
const allNodes = await result.toArray();
```

### Error Handling

```typescript
import { OsfNotFoundError, OsfPermissionError } from 'osf-api-v2-typescript';

try {
  const node = await client.nodes.getById('invalid-id');
} catch (error) {
  if (error instanceof OsfNotFoundError) {
    console.error('Node not found');
  } else if (error instanceof OsfPermissionError) {
    console.error('You do not have permission to view this node');
  }
}
```

## Samples

We provide several sample scripts in the `examples/` directory to help you get started:

- `basic_usage.ts`: Client initialization and basic profile fetching.
- `nodes_management.ts`: Project (Node) lifecycle: Create, List, Update, and Delete.
- `file_operations.ts`: Listing storage providers, files, and downloading content.
- `pagination_demo.ts`: Using the auto-pagination feature (`AsyncIterator`).

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

# Build
npm run build
```

## License

Apache License 2.0. See [LICENSE](./LICENSE) for details.
