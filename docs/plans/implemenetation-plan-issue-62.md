# Implementation Plan: Add `listByPath` and `listByPathPaginated` to Files Resource (Issue #62)

## Background

The existing `listByNode(nodeId, provider)` only lists root-level files.
Subfolder navigation requires listing the contents of a specific folder path, which maps to:

```
GET https://api.osf.io/v2/nodes/{nodeId}/files/osfstorage/{folderPath}/
```

This is needed for lazy-load subfolder expansion in UI clients.

## Goals

- Add `listByPath` method: single-page list of files within a subfolder
- Add `listByPathPaginated` method: async-iterable paginated access (consistent with `listByNodePaginated`)
- Follow TDD — tests written before implementation

## Files to Modify

| File | Change |
|------|--------|
| `tests/resources/Files.test.ts` | Add test suite for both new methods |
| `src/resources/Files.ts` | Add `listByPath` and `listByPathPaginated` methods |

## API Design

### `listByPath`

```typescript
/**
 * List files in a specific folder within a node's storage provider.
 *
 * @param nodeId - The unique identifier of the node
 * @param provider - The storage provider (e.g. 'osfstorage')
 * @param folderPath - The OSF internal folder path (e.g. '/abc123/'), leading slash stripped internally
 * @param params - Optional filter and pagination parameters
 * @returns Paginated list of files and folders within the given folder
 */
async listByPath(
  nodeId: string,
  provider: string,
  folderPath: string,
  params?: FileListParams,
): Promise<TransformedList<OsfFileAttributes>>
```

### `listByPathPaginated`

```typescript
/**
 * List files in a specific folder with automatic pagination support.
 *
 * @param nodeId - The unique identifier of the node
 * @param provider - The storage provider (e.g. 'osfstorage')
 * @param folderPath - The OSF internal folder path (e.g. '/abc123/'), leading slash stripped internally
 * @param params - Optional filter and pagination parameters
 * @returns PaginatedResult with async iteration support
 */
async listByPathPaginated(
  nodeId: string,
  provider: string,
  folderPath: string,
  params?: FileListParams,
): Promise<PaginatedResult<OsfFileAttributes>>
```

### URL Construction

```
nodes/${nodeId}/files/${provider}/${folderPath.replace(/^\//, '')}
```

Leading slash is stripped from `folderPath` to avoid double-slash in the URL.
Trailing slash is preserved (e.g. `/abc123/` → `abc123/`).

## Implementation Steps

### Step 1: Write tests (TDD — RED)

Add `describe('listByPath(nodeId, provider, folderPath)', ...)` to
`tests/resources/Files.test.ts` covering:

| # | Test case |
|---|-----------|
| 1 | Lists files in subfolder — URL uses stripped leading slash |
| 2 | `folderPath` with no leading slash works correctly |
| 3 | Returns files and folders inside the subfolder |
| 4 | Passes `params` as query parameters |
| 5 | Handles empty subfolder (`data: []`) |

Add `describe('listByPathPaginated(nodeId, provider, folderPath)', ...)` covering:

| # | Test case |
|---|-----------|
| 1 | Returns a `PaginatedResult` with correct URL |

### Step 2: Implement (TDD — GREEN)

Add after `listByNodePaginated` in `src/resources/Files.ts`:

```typescript
async listByPath(
  nodeId: string,
  provider: string,
  folderPath: string,
  params?: FileListParams,
): Promise<TransformedList<OsfFileAttributes>> {
  return super.list<OsfFileAttributes>(
    `nodes/${nodeId}/files/${provider}/${folderPath.replace(/^\//, '')}`,
    params,
  );
}

async listByPathPaginated(
  nodeId: string,
  provider: string,
  folderPath: string,
  params?: FileListParams,
): Promise<PaginatedResult<OsfFileAttributes>> {
  return super.listPaginated<OsfFileAttributes>(
    `nodes/${nodeId}/files/${provider}/${folderPath.replace(/^\//, '')}`,
    params,
  );
}
```

### Step 3: Verify (TDD — GREEN check)

Run full test suite and confirm:
- All new tests pass
- No regressions in existing tests
- Coverage remains ≥ 80%

```bash
npm test
```

## Risks and Considerations

- **Trailing slash behaviour**: OSF API folder paths typically end with `/`
  (e.g. `/abc123/`). After stripping the leading slash, the path becomes
  `abc123/`, which is correct. Callers should ensure trailing slash is present
  for folder paths.
- **No new type definitions required**: `listByPath` reuses `OsfFileAttributes`
  and `FileListParams`, which are already defined.
- **Consistency with existing API**: Both methods follow the exact same pattern
  as `listByNode` / `listByNodePaginated`, keeping the public API surface
  predictable.
