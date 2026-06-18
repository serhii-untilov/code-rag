## Why

The current code-rag project is a library-only codebase with no CLI interface. Users must manually run TypeScript scripts (`tsx scripts/ingest-repo.ts`) and configure embedding/qdrant settings via CLI flags or hardcoded defaults. Configuration is scattered across `embedConfig.ts`, `qdrant.ts`, and `ingest.ts` with no project-level config file. This makes onboarding clunky and prevents easy adoption as a dev dependency in other projects.

## What Changes

- Repackage the project as the `code-rag` npm package, installable via `npm install --save-dev code-rag`
- Add a `.code-rag.jsonc` config file format that centralizes all parameters (embedding provider, model, Qdrant URL, collection name, excluded dirs, etc.)
- Add `npx code-rag init` command that scaffolds a `.code-rag.jsonc` with sensible defaults in the current project directory
- Add `npx code-rag ingest` command that reads `.code-rag.jsonc` and runs the Qdrant ingestion pipeline
- Add `npx code-rag start` command that reads `.code-rag.jsonc` and starts the MCP RAG server for the current project
- Refactor existing hardcoded config resolution (`resolveConfig`, hardcoded Qdrant URL, collection name) to read from `.code-rag.jsonc` with config file credentials
- Add `bin` entry in `package.json` pointing to the CLI entry point

## Capabilities

### New Capabilities
- `cli-commands`: CLI entry point with `init`, `ingest`, and `start` commands using commander.js or similar
- `config-file`: `.code-rag.jsonc` file format, schema, resolution (cwd → homedir fallback), and defaults
- `package-bin`: npm package binary configuration (`bin` field in package.json, CLI bootstrap script)

### Modified Capabilities
- *(none — no existing specs to modify)*

## Impact

- **package.json**: Sets `name` to `code-rag`, adds `bin` field, adds `commander` dependency
- **src/core/embedConfig.ts**: Refactored to accept config from `.code-rag.jsonc` instead of only inline partial overrides
- **src/core/qdrant.ts**: Collection name and URL become configurable via config file
- **src/ingestion/ingest.ts**: Reads excluded dirs and supported extensions from config
- **src/mcp/server.ts**: Reads config from `.code-rag.jsonc` on startup
- **src/cli/**: New directory for CLI commands (`init.ts`, `ingest.ts`, `start.ts`, `index.ts`)
- **New files**: `.code-rag.jsonc` schema/type definition, config loader utility
- **Breaking**: `npm run ingest` script replaced by `npx code-rag ingest`