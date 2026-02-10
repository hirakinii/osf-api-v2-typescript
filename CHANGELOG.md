# Changelog

All notable changes to this project will be documented in this file.

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

### Changed
- `HttpClient.put()` signature: `Buffer` replaced with `Uint8Array` for browser compatibility (`Buffer` extends `Uint8Array`, so this is backward-compatible).
- `OsfClientConfig.token` is now optional (was required) to support OAuth2 and custom token provider modes.
- Build output directory changed from `dist/` to `dist/cjs/` for CJS; ESM output to `dist/esm/`.

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
