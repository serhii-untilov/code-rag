## Context

The CLI currently has three commands — `init`, `ingest`, `start` — but `init` only creates `.code-rag.jsonc`, leaving users to manually wire npm scripts. The `ingest` and `start` commands assume Qdrant is already running; if not, they fail with a connection error. A `docker-compose.yml` exists in the project root with a Qdrant service, but it is never invoked automatically.

## Goals / Non-Goals

**Goals:**
- After `code-rag init`, the user's `package.json` contains `rag:ingest` and `rag:start` scripts (so `npm run rag:ingest` works immediately).
- `code-rag ingest` and `code-rag start` start Qdrant automatically (via `docker compose up -d`) when it is not yet reachable and a `docker-compose.yml` is available.
- Keep the commands working for users who run an external/self-managed Qdrant (no Docker, no compose file) — auto-start is best-effort.

**Non-Goals:**
- Starting the embedding server (Ollama / LM Studio) automatically — that's user-managed.
- Managing the Docker Compose lifecycle beyond `up -d` (no stop/restart/cleanup).
- Installing Docker or pulling the Qdrant image — assume the environment has Docker if a compose file exists.
- Adding npm scripts for `init` (the init command is one-off; it stays `npx code-rag init`).

## Decisions

### Decision 1: Shared `ensureQdrantRunning` helper module

Create `src/cli/qdrantAutostart.ts` exporting `ensureQdrantRunning(qdrantUrl: string, projectRoot: string): Promise<void>`. It:
1. HTTP GET `${qdrantUrl}/healthz` with a short timeout (~2s).
2. If healthy → return immediately (Qdrant already running).
3. If not reachable and `docker-compose.yml` (or `compose.yml`) exists in `projectRoot` → run `docker compose up -d` (detached), wait up to ~30s polling `/healthz`.
4. If not reachable and no compose file → warn and return (non-fatal).
5. If `docker compose up -d` fails → warn and return (non-fatal — let the command itself surface the connection error later).

- **Rationale**: both `ingest` and `start` need the same preflight; a shared helper avoids duplication. Non-fatal warnings keep external-Qdrant users unaffected.
- **Alternative**: inline the logic in each command. Rejected — duplication and drift risk (same pattern that caused the previous `192.168.1.136` drift bug).
- **Alternative**: use the Qdrant JS client's built-in health check. Rejected — the client connection logic is deeper inside `createClient`; a direct lightweight HTTP probe is easier to short-circuit.

### Decision 2: `package.json` script injection in `init.ts`

Add a `maybeAddNpmScripts()` function called by the `init` action after writing the config file:
1. Read `process.cwd()/package.json` (parse JSON; if not present or invalid → warn and skip, since some projects may not use npm).
2. Ensure `scripts` object exists (create if absent).
3. For each of `rag:ingest` and `rag:start`: if the key is missing (or `scripts` is undefined), add it with `npx code-rag ingest` / `npx code-rag start` respectively. If the key already exists → skip silently (user intent wins).
4. Write back the `package.json` with 2-space indentation (matching typical npm formatting), only if changes were made.
5. Print a summary of what was added vs. already-present.

- **Rationale**: non-destructive — never overwrite user scripts. Target the project's own `package.json`, not the code-rag package's.
- **Alternative**: use a separate `post-init` command. Rejected — adds CLI surface; the user asked for it to happen on `init`.
- **Alternative**: prepend `npm run` instead of `npx`. Rejected — `npx code-rag` works whether or not the package is a dep; `npm run code-rag` would require code-rag's scripts to exist in the user's package, which they don't. The script names (e.g. `rag:ingest`) are user-facing npm script keys, not code-rag commands.

### Decision 3: Script naming convention — `rag:ingest` / `rag:start`

Use the `code-rag:<verb>` namespace to avoid collisions with common user scripts like `start` or `ingest`.

- **Rationale**: namespaced keys are unlikely to clash; matches the user's request.
- **Alternative**: bare `ingest`/`start`. Rejected — high risk of clashing with existing user scripts (`start` is very common).

## Risks / Trade-offs

- [Risk] `docker compose up -d` blocks the command for up to ~30s on first run while Qdrant boots. → Mitigation: 30s cap with polling; printed status so the user knows what's happening. If it exceeds 30s, warn and let the command proceed (it will either succeed on retry or show a useful error).
- [Risk] Users without Docker but with a compose file see `docker compose` fail. → Mitigation: treat `docker compose` failures as non-fatal warnings; the command proceeds and surfaces the real Qdrant connection error if any.
- [Risk] `package.json` formatting differs from user's style. → Mitigation: detect existing indentation by parsing and re-stringifying with the detected indent (default 2); only write if changes made, preserving the rest of the file via JSON parse/stringify round-trip.
- [Risk] Concurrent `init` writes race with other tools editing `package.json`. → Mitigation: read-modify-write is atomic from code-rag's perspective; user-facing warning if the write fails. Out of scope to add file locking.