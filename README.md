# OSF API v2 TypeScript Client

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
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
  // baseUrl: 'https://api.test.osf.io/v2/', // Optional: Defaults to production
  // timeout: 30000, // Optional: Defaults to 30 seconds
  // allowedHosts: ['custom-files.example.com'], // Optional: Additional trusted hostnames
});
```

### Initialization with OAuth2 (Authorization Code + PKCE)

```typescript
import { OsfClient, OsfOAuth2Client } from 'osf-api-v2-typescript';

// 1. Create an OAuth2 client
const oauth2 = new OsfOAuth2Client({
  clientId: 'your_client_id',
  redirectUri: 'https://yourapp.example.com/callback',
  scope: 'osf.full_read osf.full_write',
});

// 2. Build the authorization URL and redirect the user
const { url, codeVerifier } = await oauth2.buildAuthorizationUrl({
  accessType: 'offline', // Request a refresh token
});
// Redirect user to `url`, then handle the callback...

// 3. Exchange the authorization code for tokens
const tokenSet = await oauth2.exchangeCode(authorizationCode, codeVerifier);

// 4. Create the client with automatic token refresh
const client = new OsfClient({
  oauth2Client: oauth2,
  tokenSet,
});

// Tokens are refreshed automatically when expired
const node = await client.nodes.getById('abc12');
```

You can also use a custom token provider:

```typescript
const client = new OsfClient({
  tokenProvider: async () => {
    // Your custom logic to provide a fresh access token
    return await fetchTokenFromYourAuthServer();
  },
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

// Upload a new file
const providers = await client.files.listProviders('abc12');
const osfstorage = providers.data.find(p => p.provider === 'osfstorage');
const newContent = new TextEncoder().encode('Hello, world!');
const newFile = await client.files.uploadNew(osfstorage, 'hello.txt', newContent);

// Update an existing file
const updatedContent = new TextEncoder().encode('Updated content');
const updatedFile = await client.files.upload(file, updatedContent);

// List file versions
const versions = await client.files.listVersions(file.id);
```

### Registrations

```typescript
// Get a registration by ID
const registration = await client.registrations.getById('reg12');
console.log(registration.title);

// List registrations
const registrations = await client.registrations.listRegistrations({
  'filter[public]': true,
});

// Update a registration
await client.registrations.update('reg12', { public: true });

// List child registrations
const children = await client.registrations.listChildren('reg12');

// List contributors of a registration
const contributors = await client.registrations.listContributors('reg12');

// List files of a registration
const files = await client.registrations.listFiles('reg12', 'osfstorage');
```

### Contributors

```typescript
// List contributors for a node
const contributors = await client.contributors.listByNode('abc12');

// Get a specific contributor
const contributor = await client.contributors.getByNodeAndUser('abc12', 'user1');
console.log(contributor.permission); // 'read' | 'write' | 'admin'

// Add a contributor to a node
await client.contributors.addToNode('abc12', {
  userId: 'user1',
  permission: 'write',
  bibliographic: true,
});

// Update a contributor's permission
await client.contributors.update('abc12', 'user1', { permission: 'admin' });

// Remove a contributor from a node
await client.contributors.removeFromNode('abc12', 'user1');

// List contributors for a registration
const regContributors = await client.contributors.listByRegistration('reg12');
```

### Institutions

```typescript
// Get an institution by ID
const institution = await client.institutions.getById('inst1');
console.log(institution.name);

// List institutions
const institutions = await client.institutions.listInstitutions({
  'filter[name]': 'University',
});

// List users affiliated with an institution
const users = await client.institutions.listUsers('inst1');

// List nodes affiliated with an institution
const nodes = await client.institutions.listNodes('inst1');

// List registrations affiliated with an institution
const registrations = await client.institutions.listRegistrations('inst1');
```

### Preprints

```typescript
// List preprints
const preprints = await client.preprints.listPreprints({
  'filter[provider]': 'osf',
});

// Get a preprint by ID
const preprint = await client.preprints.getById('preprint1');
console.log(preprint.title);

// List contributors of a preprint
const contributors = await client.preprints.listContributors('preprint1');

// Get citation for a preprint (default: APA style)
const citation = await client.preprints.getCitation('preprint1', 'apa');
```

### Draft Registrations

```typescript
// Create a draft registration (registration_schema_id is required)
const draft = await client.draftRegistrations.create({
  registration_schema_id: '564d31db8c5e4a7c9694b2c0', // Open-Ended Registration schema
  title: 'My Draft Registration',
  branched_from: 'abc12', // Optional: link to an existing project
});

// Update a draft
await client.draftRegistrations.update(draft.id, {
  title: 'Updated Title',
});

// List draft registrations
const drafts = await client.draftRegistrations.listDraftRegistrations();

// List contributors
const contributors = await client.draftRegistrations.listContributors(draft.id);

// Delete a draft
await client.draftRegistrations.delete(draft.id);
```

### Collections

```typescript
// Create a collection
const collection = await client.collections.create({
  title: 'My Collection',
  bookmarks: false,
});

// Link a node to a collection
await client.collections.addLinkedNode(collection.id, 'abc12');

// List linked nodes
const linkedNodes = await client.collections.listLinkedNodes(collection.id);

// List linked registrations
const linkedRegs = await client.collections.listLinkedRegistrations(collection.id);

// Remove a linked node
await client.collections.removeLinkedNode(collection.id, 'abc12');

// Delete a collection
await client.collections.delete(collection.id);
```

### Wikis

```typescript
// Get a wiki page
const wiki = await client.wikis.getById('wiki1');
console.log(wiki.name);

// Get wiki content (markdown)
const content = await client.wikis.getContent('wiki1');

// List wiki versions
const versions = await client.wikis.listVersions('wiki1');

// Create a new version
await client.wikis.createVersion('wiki1', '# Updated Content');
```

### Comments

```typescript
// List comments for a node
const comments = await client.comments.listByNode('abc12');

// Create a comment
const comment = await client.comments.create('abc12', {
  content: 'Great work!',
});

// Update a comment
await client.comments.update(comment.id, { content: 'Updated comment' });

// Delete a comment
await client.comments.delete(comment.id);
```

### Logs

```typescript
// List activity logs for a node
const logs = await client.logs.listByNode('abc12');

// Get a specific log entry
const log = await client.logs.getById('log1');
console.log(log.action);

// Filter logs by action
const filteredLogs = await client.logs.listByNode('abc12', {
  'filter[action]': 'project_created',
});
```

### Subjects

```typescript
// List taxonomy subjects
const subjects = await client.subjects.listSubjects({
  'filter[text]': 'Biology',
});

// Get a subject by ID
const subject = await client.subjects.getById('subj1');

// List child subjects
const children = await client.subjects.listChildren('subj1');
```

### Licenses

```typescript
// List available licenses
const licenses = await client.licenses.listLicenses({
  'filter[name]': 'MIT',
});

// Get a license by ID
const license = await client.licenses.getById('license1');
console.log(license.name);
```

### View Only Links

```typescript
// Get a view only link
const vol = await client.viewOnlyLinks.getById('vol1');
console.log(vol.key);

// List nodes accessible via a view only link
const nodes = await client.viewOnlyLinks.listNodes('vol1');
```

### Identifiers

```typescript
// List identifiers (DOI, ARK) for a node
const identifiers = await client.identifiers.listByNode('abc12');

// List identifiers for a registration
const regIds = await client.identifiers.listByRegistration('reg12');

// Get a specific identifier
const id = await client.identifiers.getById('identifier1');
console.log(id.category); // 'doi' | 'ark'
```

### Citations

```typescript
// List available citation styles
const styles = await client.citations.listStyles({
  'filter[title]': 'APA',
});

// Get a specific citation style
const style = await client.citations.getStyle('apa');
console.log(style.title);
```

### Providers

```typescript
// Preprint providers
const ppProviders = await client.preprintProviders.listProviders();
const osf = await client.preprintProviders.getById('osf');

// Registration providers
const regProviders = await client.registrationProviders.listProviders();

// Collection providers
const colProviders = await client.collectionProviders.listProviders();
```

### Authentication & OAuth

```typescript
// List OAuth scopes
const scopes = await client.scopes.listScopes();
const scope = await client.scopes.getById('osf.full_read');

// Manage OAuth applications
const app = await client.applications.create({
  name: 'My App',
  homeUrl: 'https://myapp.example.com',
  callbackUrl: 'https://myapp.example.com/callback',
});
await client.applications.update(app.id, { name: 'Updated App' });
await client.applications.delete(app.id);

// Manage personal access tokens
const token = await client.tokens.create({
  name: 'My Token',
  scopes: 'osf.full_read',
});
const tokens = await client.tokens.listTokens();
await client.tokens.delete(token.id);
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
import { OsfNotFoundError, OsfPermissionError, OsfRateLimitError } from 'osf-api-v2-typescript';

try {
  const node = await client.nodes.getById('invalid-id');
} catch (error) {
  if (error instanceof OsfNotFoundError) {
    console.error('Node not found');
  } else if (error instanceof OsfPermissionError) {
    console.error('You do not have permission to view this node');
  } else if (error instanceof OsfRateLimitError) {
    console.error(`Rate limited. Retry after ${error.retryAfter} seconds`);
  }
}
```

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
You can run the server directly using Node.js. It uses `stdio` for communication:

```bash
node dist/mcp/server.cjs [src_dir]
```

To use it with an MCP client (like Claude Desktop), add it to your configuration:

```json
{
  "mcpServers": {
    "osf-api-v2": {
      "command": "node",
      "args": ["/path/to/osf-api-v2-typescript/dist/mcp/server.cjs", "src"]
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

| Format | Output | Use Case |
|--------|--------|----------|
| CJS | `dist/cjs/` | Node.js `require()` |
| ESM | `dist/esm/` | Modern bundlers (Vite, webpack, etc.) and `import` |
| UMD | `dist/umd/osf-api-v2.js` | `<script>` tags, CDN (global: `OsfApiV2`) |

## Change log

See [CHANGELOG.md](./CHANGELOG.md) for details.

## License

Apache License 2.0. See [LICENSE](./LICENSE) for details.
