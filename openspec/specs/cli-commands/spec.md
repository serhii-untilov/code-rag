## ADDED Requirements

### Requirement: CLI provides init command
The system SHALL provide `npx code-rag init` that creates a `.code-rag.jsonc` file in the current working directory with default configuration values, and additionally injects `rag:ingest` and `rag:start` npm scripts into the project's `package.json` when they are not already present.

#### Scenario: Init creates config with defaults
- **WHEN** user runs `npx code-rag init`
- **THEN** a `.code-rag.jsonc` file is created in `process.cwd()` containing all default configuration values with explanatory comments

#### Scenario: Init warns if config already exists
- **WHEN** user runs `npx code-rag init` and `.code-rag.jsonc` already exists in CWD
- **THEN** the system SHALL print a warning message and NOT overwrite the existing file unless `--force` flag is provided

#### Scenario: Init with force flag overwrites existing config
- **WHEN** user runs `npx code-rag init --force`
- **THEN** the system SHALL overwrite the existing `.code-rag.jsonc` with fresh defaults

#### Scenario: Init adds npm scripts to package.json
- **WHEN** user runs `npx code-rag init` and a `package.json` exists in `process.cwd()` without `rag:ingest` or `rag:start` in its `scripts`
- **THEN** the system SHALL add `"rag:ingest": "npx code-rag ingest"` and `"rag:start": "npx code-rag start"` to the `scripts` section and print a summary of the added scripts

#### Scenario: Init preserves existing npm scripts
- **WHEN** user runs `npx code-rag init` and `package.json` already contains `rag:ingest` or `rag:start`
- **THEN** the system SHALL NOT overwrite those existing script entries and SHALL only add the ones that are missing

#### Scenario: Init handles missing package.json gracefully
- **WHEN** user runs `npx code-rag init` and no `package.json` exists in `process.cwd()`
- **THEN** the system SHALL still create `.code-rag.jsonc`, print a warning that npm scripts were skipped, and exit successfully

### Requirement: CLI provides ingest command
The system SHALL provide `npx code-rag ingest` that reads `.code-rag.jsonc`, resolves configuration, ensures the Qdrant server is running (starting it via Docker Compose if needed), and runs the Qdrant ingestion pipeline on the configured repository path.

#### Scenario: Ingest reads config and runs pipeline
- **WHEN** user runs `npx code-rag ingest`
- **THEN** the system loads `.code-rag.jsonc` from CWD (or homedir fallback), resolves embedding and Qdrant config, ensures Qdrant is running, scans the repository, chunks CodeUnits, embeds them, and stores them in Qdrant

#### Scenario: Ingest auto-starts Qdrant via Docker Compose
- **WHEN** user runs `npx code-rag ingest`, Qdrant is not reachable at the configured URL, and a `docker-compose.yml` (or `compose.yml`) exists in the `@untilov/code-rag` package directory
- **THEN** the system SHALL run `docker compose up -d` to start Qdrant, wait for it to become healthy (polling `/healthz`), and then proceed with ingestion

#### Scenario: Ingest skips auto-start when Qdrant already running
- **WHEN** user runs `npx code-rag ingest` and Qdrant is already reachable at the configured URL
- **THEN** the system SHALL NOT invoke Docker Compose and SHALL proceed with ingestion immediately

#### Scenario: Ingest with explicit path override
- **WHEN** user runs `npx code-rag ingest --path /some/repo`
- **THEN** the system uses the provided path instead of the `repoPath` from config

#### Scenario: Ingest fails gracefully when config not found
- **WHEN** user runs `npx code-rag ingest` and no `.code-rag.jsonc` exists in CWD or homedir
- **THEN** the system SHALL exit with error code 1 and print a message suggesting `npx code-rag init`

#### Scenario: Ingest with provider override
- **WHEN** user runs `npx code-rag ingest --provider ollama`
- **THEN** the system overrides the embedding provider from config with the CLI-provided value

#### Scenario: Ingest warns when Qdrant cannot be auto-started
- **WHEN** user runs `npx code-rag ingest`, Qdrant is not reachable, no `docker-compose.yml` exists in the `@untilov/code-rag` package directory, and Docker is unavailable
- **THEN** the system SHALL print a warning that Qdrant auto-start was skipped, proceed with the ingestion attempt, and surface the original connection error if ingestion fails

### Requirement: CLI provides start command
The system SHALL provide `npx code-rag start` that reads `.code-rag.jsonc`, ensures the Qdrant server is running (starting it via Docker Compose if needed), and starts the MCP RAG server for the current project.

#### Scenario: Start reads config and launches MCP server
- **WHEN** user runs `npx code-rag start`
- **THEN** the system loads `.code-rag.jsonc`, resolves Qdrant and embedding config, ensures Qdrant is running, and starts the MCP server on stdio transport

#### Scenario: Start auto-starts Qdrant via Docker Compose
- **WHEN** user runs `npx code-rag start`, Qdrant is not reachable at the configured URL, and a `docker-compose.yml` (or `compose.yml`) exists in the `@untilov/code-rag` package directory
- **THEN** the system SHALL run `docker compose up -d` to start Qdrant, wait for it to become healthy (polling `/healthz`), and then start the MCP server

#### Scenario: Start skips auto-start when Qdrant already running
- **WHEN** user runs `npx code-rag start` and Qdrant is already reachable at the configured URL
- **THEN** the system SHALL NOT invoke Docker Compose and SHALL start the MCP server immediately

#### Scenario: Start fails gracefully when config not found
- **WHEN** user runs `npx code-rag start` and no `.code-rag.jsonc` exists
- **THEN** the system SHALL exit with error code 1 and print a message suggesting `npx code-rag init`

#### Scenario: Start warns when Qdrant cannot be auto-started
- **WHEN** user runs `npx code-rag start`, Qdrant is not reachable, no `docker-compose.yml` exists in the `@untilov/code-rag` package directory, and Docker is unavailable
- **THEN** the system SHALL print a warning that Qdrant auto-start was skipped and proceed with starting the MCP server

### Requirement: CLI shows help text
The system SHALL display help text when `npx code-rag --help` or `npx code-rag` is invoked without a subcommand.

#### Scenario: Help displays available commands
- **WHEN** user runs `npx code-rag --help`
- **THEN** the system SHALL list all available commands (`init`, `ingest`, `start`) with brief descriptions