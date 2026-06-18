## Context

The current `code-rag` project is a library with an MCP server entry point (`src/mcp/server.ts`), an ingestion script (`scripts/ingest-repo.ts`), and hardcoded configuration in `src/core/embedConfig.ts`. There is no CLI binary, no config file, and no way to install it as an npm package with `npx` support. All parameters (Qdrant URL, embedding provider/model, collection name) are embedded in code or passed as CLI flags.

## Goals / Non-Goals

**Goals:**
- Make the tool installable as `code-rag` via `npm install --save-dev code-rag`
- Provide `npx code-rag init` to scaffold a `.code-rag.jsonc` config file
- Provide `npx code-rag ingest` to run ingestion reading from config
- Provide `npx code-rag start` to start the MCP server reading from config
- Centralize all configuration into `.code-rag.jsonc` with JSONC (comments supported)
- Keep all existing functionality working (MCP server, ingestion, chunking, retrieval)

**Non-Goals:**
- Python or Go language support for chunking (out of scope)
- File watcher / auto-reingest (Phase 4 from AGENTS.md)
- Reranking or advanced retrieval improvements
- Publishing to npm registry (local `npm link` / tarball usage only for now)

## Decisions

### 1. CLI framework: Commander.js
**Choice**: Use `commander` for CLI parsing.
**Alternatives**: `yargs` (heavier), custom `process.argv` parsing (fragile, doesn't scale for subcommands or help text).
**Rationale**: Commander is lightweight (~40KB), widely adopted, and supports subcommands, options, and help generation out of the box. Matches the three-command structure (`init`, `ingest`, `start`) cleanly.

### 2. Config file format: JSONC (`.code-rag.jsonc`)
**Choice**: Use JSONC format with `.code-rag.jsonc` filename.
**Alternatives**: Pure JSON (no comments), YAML (extra dependency), TOML (extra dependency).
**Rationale**: JSONC allows comments (useful for annotating defaults) while being trivially parseable by stripping comments before `JSON.parse`. No new parser dependency needed — we use `jsonc-parser` or a simple regex strip. The filename makes it easy to `.gitignore` and recognizable.

### 3. Config file resolution: CWD → homedir fallback
**Choice**: Look for `.code-rag.jsonc` in `process.cwd()` first, then `~/.code-rag.jsonc`.
**Rationale**: Project-specific config takes precedence. A global fallback allows defaults without per-project files. The `init` command writes to CWD only.

### 4. Package name: `code-rag`
**Choice**: Keep package name `code-rag` (unchanged from current).
**Rationale**: Matches the CLI command (`npx code-rag`), aligns with the existing package name and config file (`.code-rag.jsonc`). The `bin` field in package.json maps `code-rag` to the compiled CLI entry point.

### 5. Entry point: `src/cli/index.ts`
**Choice**: New `src/cli/index.ts` as the main binary entry point, importing from existing modules.
**Rationale**: Clean separation between library code (`src/core`, `src/ingestion`, `src/mcp`) and CLI wiring. The `bin` field points to `dist/cli/index.js`. Each command (`init`, `ingest`, `start`) lives in its own file under `src/cli/commands/`.

### 6. Config schema and validation: Zod
**Choice**: Define a Zod schema for `.code-rag.jsonc` and validate on load.
**Rationale**: Zod is already a dependency. Provides runtime validation, type inference, and clear error messages for misconfigured files. The schema defines all configurable parameters with defaults.

### 7. Migration of environment variables
**Choice**: Support env var overrides (`OPEN_RAG_QDRANT_URL`, `OPEN_RAG_EMBED_PROVIDER`, etc.) that take precedence over config file values.
**Rationale**: CI/CD and container deployments often rely on env vars. This is non-breaking — config file is the primary, env vars override.

## Risks / Trade-offs

- **[Package name stays the same]** → No breaking change to import paths. The `name` field remains `code-rag`, only the `bin` field and CLI commands are new.
- **[JSONC parsing complexity]** → Use `jsonc-parser` (from VS Code team, well-maintained) or the simpler `strip-json-comments` package. Both are tiny and battle-tested.
- **[Config file not found]** → `ingest` and `start` commands MUST error with a clear message suggesting `npx code-rag init`. No silent fallback to hardcoded defaults — explicit is better.
- **[Duplicated config between embedConfig.ts and config file]** → Deprecate `resolveConfig()` in favor of the new config loader. Keep `EmbedConfig` type but populate it from the config file.