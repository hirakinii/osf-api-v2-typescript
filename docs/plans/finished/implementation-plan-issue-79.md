# Implementation Plan: Support ts-morph 28 and Pin Peer Majors in the MCP Launch Command (Issue #79)

## Background

0.5.0 moved `@modelcontextprotocol/sdk` (^1.26.0) and `ts-morph` (^27.0.2) to optional `peerDependencies` (#75). The documented launch command was:

```
npx -y -p osf-api-v2-typescript -p @modelcontextprotocol/sdk -p ts-morph osf-mcp
```

It fails with `ERESOLVE`: an unpinned `-p ts-morph` resolves to the latest release (28.0.0), which is outside `^27.0.2`. The SDK's latest release (1.32.2) is inside its range, so it is not affected.

Verified before planning:

- With ts-morph 28.0.0, `tsc -b --noEmit`, the tests in `tests/mcp`, a stdio `initialize` handshake and a `list_symbols` tool call all pass.
- On published 0.5.0, `-p @modelcontextprotocol/sdk@1 -p ts-morph@27` works as a workaround. It is documented in the v0.5.0 release notes.

#76 missed this because its manual verification pinned `ts-morph@^27.0.2` instead of running the documented command verbatim.

### Decision

- Widen the ts-morph peer range to `^27.0.2 || ^28.0.0`. The SDK range does not change.
- Pin the peer majors in the documented commands, so that a future major release cannot break the launch again.
- Keep the pinned specs in one place, `src/mcp/peerCheck.ts`.
- Add no new dependencies (no `semver`).

## Goals

1. The documented npx command and the global install command no longer fail with `ERESOLVE`.
2. ts-morph 27 and 28 are both supported peers. The development and test environment uses 28.
3. A test fails if a pinned major in the launch commands falls outside the declared peer range.
4. The fix is released as patch version **0.5.1** with a CHANGELOG entry.

## Files to Modify

| File | Change |
|------|--------|
| `tests/mcp/peerCheck.test.ts` | Update the expected command strings and add `launchSpec` tests (RED first). |
| `tests/packageManifest.test.ts` | Replace the "same range" test with a caret-major membership test and add the launch-spec guard. |
| `src/mcp/peerCheck.ts` | Add `launchSpec` to `RequiredPackage`, and build both commands from `REQUIRED_PACKAGES`. |
| `package.json` | Version `0.5.1`; ts-morph peer `^27.0.2 \|\| ^28.0.0`; ts-morph devDependency `^28.0.0`. |
| `package-lock.json` | Regenerate with `npm install`. |
| `scripts/verify-mcp-build.mjs` | Update the hard-coded launch command and add a comment to keep it in sync. |
| `README.md` | Update the npx command, the global install command and the `mcpServers` JSON. |
| `CHANGELOG.md` | Add a `[0.5.1]` entry. |

## Design

### 1. `package.json`

```jsonc
{
  "version": "0.5.1",
  "peerDependencies": {
    "@modelcontextprotocol/sdk": "^1.26.0",
    "ts-morph": "^27.0.2 || ^28.0.0"
  },
  "devDependencies": {
    "@modelcontextprotocol/sdk": "^1.26.0",
    "ts-morph": "^28.0.0"
  }
}
```

### 2. `src/mcp/peerCheck.ts`: single source of truth

```typescript
export interface RequiredPackage {
  name: string;
  probe: string;
  /** Package spec used in launch commands; pins a major version within the peer range. */
  launchSpec: string;
}

export const REQUIRED_PACKAGES: readonly RequiredPackage[] = [
  { name: '@modelcontextprotocol/sdk', probe: '@modelcontextprotocol/sdk/server/stdio.js', launchSpec: '@modelcontextprotocol/sdk@1' },
  { name: 'ts-morph', probe: 'ts-morph', launchSpec: 'ts-morph@28' },
];

// npx -y -p osf-api-v2-typescript -p @modelcontextprotocol/sdk@1 -p ts-morph@28 osf-mcp
export const NPX_LAUNCH_COMMAND = ...;
// npm install -g osf-api-v2-typescript @modelcontextprotocol/sdk@1 ts-morph@28
export const GLOBAL_INSTALL_COMMAND = ...;
```

### 3. Regression guard in `tests/packageManifest.test.ts`

A helper parses the peer ranges without `semver`, for example `"^27.0.2 || ^28.0.0"` becomes `[27, 28]`. It throws on any alternative that is not a caret range, so a range format it does not understand fails the test loudly.

For each entry in `REQUIRED_PACKAGES`, the tests assert:

- The package has an entry in `peerDependencies`.
- The major pinned in `launchSpec` is one of the peer range's majors.
- The devDependency's caret major is one of the peer range's majors. This replaces the old "devDependency range === peer range" test.

### 4. `scripts/verify-mcp-build.mjs`

The script runs against the built bundle, so it keeps its own copy of the command string. Add a sync comment. Check 3 fails if the bundle's message does not contain this string, so any drift is caught.

## Implementation Steps (TDD)

1. **RED:** update `tests/mcp/peerCheck.test.ts` and `tests/packageManifest.test.ts`, then confirm that they fail.
2. **GREEN:** implement Design 2 in `src/mcp/peerCheck.ts`.
3. **GREEN:**
   1. Edit `package.json` and run `npm install`.
   2. Review the lockfile diff: only ts-morph, `@ts-morph/common` and the version should change.
   3. Confirm with `npm ls @modelcontextprotocol/sdk ts-morph zod`.
4. Update `scripts/verify-mcp-build.mjs`.
5. Run the quality gates: `npm run format && npm run lint && npm run typecheck && npm test && npm run build && npm run verify:mcp`.
6. Update the documentation:
   - README: the commands, the `mcpServers` JSON, and one sentence explaining why the majors are pinned.
   - CHANGELOG `[0.5.1]`.
7. **Manual verification.** Run the documented commands **verbatim**; only the package name may be replaced with the path of the tarball from `npm pack`.
   1. Run `npx -y -p <tgz> -p @modelcontextprotocol/sdk@1 -p ts-morph@28 osf-mcp`. Expect no `ERESOLVE`, a completed `initialize` handshake and a working `list_symbols` call.
   2. Run the same command with `-p ts-morph@27`, to confirm that both peer majors work.
   3. Run the documented global install with a throwaway `--prefix`, then start `osf-mcp` and complete the handshake.
   4. Install the tarball into an empty project as a library. Expect neither peer to be installed.
   5. Run the bundle without the peers. Expect the new pinned commands in the message and exit code 1.
8. **Release:**
   1. Merge and tag `v0.5.1`.
   2. Edit the known-issue section of the v0.5.0 release notes to point to 0.5.1.

## Testing Summary

- **Unit:**
  - `tests/mcp/peerCheck.test.ts`: the exact command strings and `launchSpec` consistency.
  - `tests/packageManifest.test.ts`: each required package has a peer entry, and the pinned major and the devDependency major are within the peer range.
- **Build-level:** `npm run verify:mcp`.
- **Manual integration:** Step 7, which runs the documented commands verbatim with ts-morph 27 and 28.
- **Coverage:** at least 80%.

## Risks and Mitigations

- **A future ts-morph or SDK major release.**
  - Mitigation: the pinned majors keep the launch command working, and the guard test forces `launchSpec` and the peer range to be updated together.
- **ts-morph 27 regresses unnoticed, because the dev environment uses 28.**
  - Mitigation: the manual check in Step 7. If ongoing assurance is needed, a CI matrix can be considered in a separate issue.
- **The literal in `verify-mcp-build.mjs` drifts from `peerCheck.ts`.**
  - Mitigation: the sync comment, and check 3, which fails on any mismatch.
- **Users keep the old unpinned command.**
  - Mitigation: the CHANGELOG and the v0.5.0 release notes point to the pinned command.

## Success Criteria

- [ ] The documented npx command, run verbatim against the packed tarball, completes the MCP handshake with ts-morph@28 and with ts-morph@27.
- [ ] The global install command installs cleanly, and `osf-mcp` completes the handshake.
- [ ] The peer range is `^27.0.2 || ^28.0.0` and the devDependency is `^28.0.0`.
- [ ] The version is 0.5.1 in both `package.json` and `package-lock.json`.
- [ ] Both commands are built from `REQUIRED_PACKAGES[].launchSpec`.
- [ ] A test fails if a pinned launch major falls outside the peer range.
- [ ] `npm run verify:mcp` passes.
- [ ] `npm test` passes with at least 80% coverage, and lint, typecheck and build pass.
- [ ] Installing the library still installs neither peer.
- [ ] The README and the CHANGELOG are updated, and the v0.5.0 release notes point to 0.5.1.
