## 1. Config Infrastructure

- [x] 1.1 Install `strip-json-comments` and `commander` dependencies
- [x] 1.2 Create `src/config/schema.ts` — Zod schema for `.code-rag.jsonc` with fields: `embed` (provider, modelName, baseUrl, dimensions), `qdrant` (url, collection), `ingest` (repoPath, excludedDirs, supportedExtensions), `server` (transport)
- [x] 1.3 Create `src/config/loader.ts` — config resolution (CWD → homedir), JSONC parsing, Zod validation, env var overrides (`OPEN_RAG_QDRANT_URL`, `OPEN_RAG_EMBED_PROVIDER`, etc.), default value merging
- [x] 1.4 Create `src/config/defaults.ts` — extract current hardcoded defaults from `src/core/embedConfig.ts` and `src/core/qdrant.ts` into shared defaults object
- [x] 1.5 Write unit tests for config loader (valid config, invalid config, env var overrides, CWD/homedir resolution, partial config + defaults)

## 2. CLI Commands

- [x] 2.1 Create `src/cli/commands/init.ts` — `npx code-rag init` command that writes `.code-rag.jsonc` with defaults and comments; `--force` flag to overwrite
- [x] 2.2 Create `src/cli/commands/ingest.ts` — `npx code-rag ingest` command that loads config and runs `ingestRepository`; `--path` and `--provider` override flags
- [x] 2.3 Create `src/cli/commands/start.ts` — `npx code-rag start` command that loads config and starts MCP server
- [x] 2.4 Create `src/cli/index.ts` — Commander program setup, register all commands, parse argv, set version from package.json

## 3. Integration Refactor

- [x] 3.1 Refactor `src/core/embedConfig.ts` — `resolveConfig()` to accept `Config` from config loader; keep `EmbedConfig` type but populate from config file + env vars
- [x] 3.2 Refactor `src/core/qdrant.ts` — make `COLLECTION_NAME` and `qdrantUrl` configurable via config instead of hardcoded
- [x] 3.3 Refactor `src/ingestion/ingest.ts` — read `excludedDirs` and `supportedExtensions` from config instead of hardcoded sets
- [x] 3.4 Refactor `src/mcp/server.ts` — `startServer()` and `createServer()` to accept config from loader instead of inline `resolveConfig()`
- [x] 3.5 Update `scripts/ingest-repo.ts` to use new config loader (or mark deprecated in favor of `npx code-rag ingest`)

## 4. Package Configuration

- [x] 4.1 Update `package.json` — add `bin` field mapping `code-rag` to `dist/cli/index.js`, add `strip-json-comments` and `commander` to dependencies
- [x] 4.2 Add shebang `#!/usr/bin/env node` to `src/cli/index.ts` entry point
- [x] 4.3 Verify `tsconfig.json` includes `src/cli/**` in compilation and outputs to `dist/`
- [x] 4.4 Test full flow: `npm link`, `npx code-rag init`, edit config, `npx code-rag ingest`, `npx code-rag start`

## 5. Documentation and Polish

- [x] 5.1 Update `AGENTS.md` to reflect new CLI commands and config file format
- [x] 5.2 Add `.code-rag.jsonc` to `.gitignore` template / example config in repo root
- [x] 5.3 Verify all existing tests pass after refactor