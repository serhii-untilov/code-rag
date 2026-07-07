## 1. Qdrant auto-start helper

- [x] 1.1 Create `src/cli/qdrantAutostart.ts` exporting `ensureQdrantRunning(qdrantUrl: string, projectRoot: string): Promise<void>` — HTTP GET `${qdrantUrl}/healthz` with ~2s timeout; if healthy return immediately.
- [x] 1.2 In `ensureQdrantRunning`, when Qdrant is not reachable: check for `docker-compose.yml` or `compose.yml` in `projectRoot`; if found, run `docker compose up -d` via `child_process.exec` (detached); if not found, warn and return (non-fatal).
- [x] 1.3 After `docker compose up -d`, poll `${qdrantUrl}/healthz` up to ~30s (e.g. 15 × 2s); if healthy within timeout, return; if not, warn and return (non-fatal — let the command surface the real error).
- [x] 1.4 If `docker compose up -d` itself fails (non-zero exit), warn with the stderr output and return (non-fatal).

## 2. Init command — package.json script injection

- [x] 2.1 In `src/cli/commands/init.ts`, add a `maybeAddNpmScripts(): void` function that reads `process.cwd()/package.json`; if missing or invalid JSON, warn and return (non-fatal).
- [x] 2.2 Detect the existing indentation unit by inspecting the raw file content (fallback 2 spaces) to preserve formatting on write-back.
- [x] 2.3 Ensure a `scripts` object exists on the parsed package.json (create `{}` if absent); for each of `rag:ingest` (→ `npx code-rag ingest`) and `rag:start` (→ `npx code-rag start`): if the key is missing, add it; if present, skip silently.
- [x] 2.4 Write back `package.json` with detected indentation **only if** changes were made; print a summary listing added vs. already-present scripts.
- [x] 2.5 Call `maybeAddNpmScripts()` at the end of the `init` action (after writing `.code-rag.jsonc`), regardless of `--force` vs. fresh creation.

## 3. Wire auto-start into ingest and start commands

- [x] 3.1 In `src/cli/commands/ingest.ts`, call `ensureQdrantRunning(config.qdrant.url, process.cwd())` after `resolveConfigOrDie()` and before `ingestRepository`.
- [x] 3.2 In `src/cli/commands/start.ts`, call `ensureQdrantRunning(config.qdrant.url, process.cwd())` after `resolveConfigOrDie()` and before `startServer`.

## 4. Tests

- [x] 4.1 Create `src/cli/__tests__/qdrantAutostart.test.ts` — stub `child_process.exec` and a `fetch`/health probe helper; assert (a) no-op when Qdrant already healthy, (b) invokes `docker compose up -d` when not healthy and compose file exists, (c) warns and returns when no compose file, (d) warns and returns when `docker compose` exits non-zero.  *(Used injectable `AutostartDeps` for stubbable healthCheck/runCompose.)*
- [x] 4.2 Create `src/cli/__tests__/initScripts.test.ts` — write a temp `package.json` (no scripts) and assert both `rag:ingest` and `rag:start` are added; write one with `rag:ingest` already present and assert it is preserved while `rag:start` is added; assert missing `package.json` is non-fatal.  *(Also covers invalid JSON and preserves-existing cases.)*
- [x] 4.3 Add a test verifying `init` writes `package.json` back with the same indentation it read (e.g. 4-space input → 4-space output).
- [x] 4.4 Run the full test suite (`npx tsx --test src/**/*.test.ts`) and ensure all existing + new tests pass.  *(34/34 pass — 20 existing + 14 new.)*
- [x] 4.5 Run `npm run build` (tsc typecheck) and ensure clean.

## 5. Verification

- [x] 5.1 Manually run `npx tsx src/cli/index.ts init --force` in the code-rag repo and confirm `package.json` gains `rag:ingest` and `rag:start` without clobbering existing scripts.  *(Added both scripts; `build`, `mcp`, etc. all preserved.)*
- [x] 5.2 Grep to confirm `ensureQdrantRunning` is called in both `ingest.ts` and `start.ts` before the respective main action.