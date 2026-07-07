## Why

Running `code-rag ingest` or `code-rag start` requires a running Qdrant instance, but users must manually start it with `docker compose up -d` before invoking those commands. Additionally, after `code-rag init`, users still have to add their own `package.json` scripts to wire `npx code-rag ingest` and `npx code-rag start` into their `npm run` workflow. These manual steps increase friction and cause "connection refused" errors on first run.

## What Changes

- `code-rag init` now also updates the project's `package.json` `scripts` section: adds `rag:ingest` (→ `npx code-rag ingest`) and `rag:start` (→ `npx code-rag start`) if they don't already exist. Existing scripts with the same names are preserved.
- `code-rag ingest` and `code-rag start` now automatically start the Qdrant Docker container (via `docker compose up -d`) before running, if a `docker-compose.yml` is present in the project root and Qdrant is not already reachable.
- A Qdrant health check is performed (HTTP GET to the configured Qdrant URL `/healthz`) before proceeding; if Qdrant is already running, no Docker action is taken.
- If no `docker-compose.yml` is found or Docker is unavailable, the commands proceed with a warning rather than failing, so users with external Qdrant instances are unaffected.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `cli-commands`: The `init` command now also modifies `package.json` scripts. The `ingest` and `start` commands now auto-start Qdrant via Docker Compose before execution.

## Impact

- `src/cli/commands/init.ts` — add `package.json` script injection logic (read, check for existing keys, merge, write).
- `src/cli/commands/ingest.ts` — add Qdrant auto-start before `ingestRepository`.
- `src/cli/commands/start.ts` — add Qdrant auto-start before `startServer`.
- New shared module (e.g. `src/cli/qdrantAutostart.ts`) — encapsulate health check + `docker compose up -d` logic, reused by `ingest` and `start`.
- Tests: `src/cli/__tests__/` — new tests for package.json script injection and Qdrant autostart logic.
- No new dependencies; Docker Compose is invoked via `child_process` exec.