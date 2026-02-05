# Changelog

All notable changes to this project will be documented in this file.

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
