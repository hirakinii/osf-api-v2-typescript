# Changelog

All notable changes to this project will be documented in this file.

## [0.4.1] - 2026-02-19

### Added

- **MCP Server Execution**: Added support for running the MCP server via `npx osf-api-v2-typescript` or `npx osf-mcp`. The package now exposes a binary executable.

### Fixed

- **MCP Server**: Fixed an issue where the server failed to start when executed from a directory other than the project root. The server now correctly resolves the project root relative to its own location.

## [0.4.0] - 2026-02-18

### Added

- **Model Context Protocol (MCP) Server**:
  - Implemented a specialized MCP server for code symbol extraction and discovery.
  - Tools:
    - `list_symbols`: Search and filter exported symbols (Classes, Interfaces, Functions, etc.) across the project.
    - `get_symbol_details`: Retrieve detailed information, including signatures and JSDoc, for specific symbols.
    - `refresh_symbols`: Re-scan source files to update the symbol cache.
  - Powered by `ts-morph` for accurate TypeScript AST analysis.
  - New build script `npm run build:mcp` generating `dist/mcp/server.cjs`.

## [0.3.2] - 2026-02-17

### Changed

- `OsfClient.httpClient` visibility changed from `private` to `protected`, allowing subclasses to access the underlying `HttpClient` instance.

## [0.3.1] - 2026-02-16

### Added

- **Security Hardening**:
  - URL validation with host allowlist in `HttpClient` to prevent SSRF-like issues. Only the OSF API host, Waterbutler files host, and explicitly configured `allowedHosts` are permitted.
  - `OsfClientConfig.allowedHosts` option for registering additional trusted hostnames (e.g., custom Waterbutler hosts).
- **`OsfRateLimitError` Enhancement**:
  - `retryAfter` property parsed from the `Retry-After` response header, enabling callers to implement backoff strategies.
- **CD Workflow**:
  - GitHub Actions CD workflow for automated npm publication via OIDC.
  - `.npmignore` for cleaner published packages.

### Changed

- **PKCE Code Verifier**: `generateCodeVerifier()` now uses rejection sampling to eliminate modulo bias, producing a uniformly distributed random string.
- **OAuth2 Error Messages**: `OsfOAuth2Client` now extracts structured `error_description`/`error` fields from OAuth2 error responses for clearer diagnostics.
- **ESM Build**: Added `fix-esm-imports.mjs` post-build script and `dist/esm/package.json` with `"type": "module"` for proper ESM resolution.
- Package description translated to English in `package.json`.

### Fixed

- None yet.

## [0.3.0] - 2026-02-10

### Added

- **OAuth2 Authorization Code + PKCE**:
  - `OsfOAuth2Client`: Full OAuth2 flow management with automatic token refresh and concurrent refresh protection.
  - `generateCodeVerifier()`, `computeCodeChallenge()`, `generatePkceChallenge()`: PKCE utilities using Web Crypto API.
  - Type definitions: `OAuth2Config`, `AuthorizationUrlParams`, `PkceChallenge`, `TokenResponse`, `TokenSet`, `TokenProvider`.
  - Token revocation support via `revokeToken()`.
- **Flexible Authentication Modes**:
  - `OsfClient` now supports three authentication modes: PAT (`token`), OAuth2 (`oauth2Client` + `tokenSet`), and custom (`tokenProvider`).
  - `HttpClient` supports dynamic token resolution via `tokenProvider` for per-request token retrieval.
- **ESM + UMD Dual Build**:
  - ESM output via `tsconfig.esm.json` for modern bundlers.
  - UMD/IIFE output via esbuild (`dist/umd/osf-api-v2.js` and `dist/umd/osf-api-v2.min.js`, global: `OsfApiV2`).
  - `package.json` `exports` field for automatic CJS/ESM resolution.
- **File Upload Support**:
  - `Files.upload()`: Update an existing file's content via Waterbutler API.
  - `Files.uploadNew()`: Upload a new file to a folder or storage provider.
  - `HttpClient.putRaw()` and `BaseResource.putRaw()`: Binary upload primitives for Waterbutler endpoints.
  - `BaseResource.getRaw()`: Binary download primitive exposed to resource subclasses.
- **OAuth2 Example**: New `examples/oauth2.ts` demonstrating the full OAuth2 + PKCE flow.
- **Logs**: `Logs.listActions()` now returns a locally-defined complete list of 50+ OSF log action types with descriptions (the API endpoint is not implemented server-side).

### Changed

- `HttpClient.put()` signature: `Buffer` replaced with `Uint8Array` for browser compatibility (`Buffer` extends `Uint8Array`, so this is backward-compatible).
- `OsfClientConfig.token` is now optional (was required) to support OAuth2 and custom token provider modes.
- Build output directory changed from `dist/` to `dist/cjs/` for CJS; ESM output to `dist/esm/`.
- `Files.download()` now uses the Waterbutler `upload` link instead of the OSF `download` link to avoid cross-origin redirect issues that drop Authorization headers.
- `DraftRegistrations.create()` now uses JSON:API relationships for `registration_schema_id` and optional `branched_from`, matching the API's expected payload format.
- `CreateDraftRegistrationInput` now requires `registration_schema_id` and accepts optional `branched_from`.

### Fixed

- File download URL resolution: fixed cross-origin redirect causing authentication headers to be dropped.
- `DraftRegistrations.create()`: fixed schema ID and branched_from being sent as attributes instead of relationships.
- `Comments.update()`: added missing `target_id` parameter.
- `Collections`: fixed link/unlink operations.
- `Logs.listActions()`: replaced broken API call with local action data.

## [0.2.0] - 2026-02-09

### Added

- **Resources** (Phase 2 - Core Scholarly Entities):
  - `Registrations`: List, get, update registrations; access children, contributors, files, and comments.
  - `Contributors`: Full CRUD for node and registration contributors with permission management.
  - `Institutions`: List and get institutions; access affiliated users, nodes, and registrations.
- **Resources** (Phase 3 - Extended Content):
  - `Preprints`: List, get, create, and update preprints; access contributors, files, and citations.
  - `DraftRegistrations`: Full CRUD for draft registrations; access contributors.
  - `Collections`: Create and delete collections; link/unlink nodes and registrations.
  - `Wikis`: Get wiki metadata and content; list and create versions.
  - `Comments`: Full CRUD for comments on nodes, including replies.
- **Resources** (Phase 4 - Metadata & Discovery):
  - `Logs`: List activity logs by node; get individual log entries.
  - `Subjects`: Browse taxonomy subjects; list children for hierarchical exploration.
  - `Licenses`: List and get available licenses.
  - `ViewOnlyLinks`: Get view-only links; list accessible nodes.
  - `Identifiers`: List identifiers (DOI/ARK) for nodes and registrations.
  - `Citations`: List and get citation styles.
- **Resources** (Phase 5 - Administrative Features):
  - `PreprintProviders`: List and get preprint providers.
  - `RegistrationProviders`: List and get registration providers.
  - `CollectionProviders`: List and get collection providers.
  - `Scopes`: List and get OAuth scopes.
  - `Applications`: Full CRUD for OAuth applications.
  - `Tokens`: Create, list, and delete personal access tokens; list associated scopes.
- **Integration**:
  - All 22 resource types integrated into `OsfClient` with lazy initialization.
  - 20 sample scripts in `examples/` covering all resource types.
  - Integration test scenarios for project lifecycle, pagination, and file navigation.
- **Documentation**:
  - TSDoc comments on all public methods across all resource classes.
  - Comprehensive `examples/README.md` with usage instructions and environment variable reference.

## [0.1.0] - 2026-02-05

### Added

- Initial release of the OSF API v2 TypeScript Client.
- **Core Library**:
  - `OsfClient`: Unified entry point for the API.
  - `HttpClient`: Native fetch-based HTTP client with auth and timeout support.
  - `JsonApiAdapter`: Transformation layer to flatten JSON:API responses.
  - `PaginatedResult`: Automatic pagination support with `AsyncIterator`.
- **Resources**:
  - `Nodes`: Create, read, update, and delete OSF nodes (projects/components).
  - `Files`: Navigate file trees, list versions, and download files.
  - `Users`: Retrieve user profiles and information.
- **Error Handling**:
  - Custom error types for OSF API specific errors (`OsfNotFoundError`, `OsfPermissionError`, etc.).
