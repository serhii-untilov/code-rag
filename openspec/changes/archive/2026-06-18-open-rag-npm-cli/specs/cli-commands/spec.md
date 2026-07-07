## ADDED Requirements

### Requirement: CLI provides init command
The system SHALL provide `npx code-rag init` that creates a `.code-rag.jsonc` file in the current working directory with default configuration values.

#### Scenario: Init creates config with defaults
- **WHEN** user runs `npx code-rag init`
- **THEN** a `.code-rag.jsonc` file is created in `process.cwd()` containing all default configuration values with explanatory comments

#### Scenario: Init warns if config already exists
- **WHEN** user runs `npx code-rag init` and `.code-rag.jsonc` already exists in CWD
- **THEN** the system SHALL print a warning message and NOT overwrite the existing file unless `--force` flag is provided

#### Scenario: Init with force flag overwrites existing config
- **WHEN** user runs `npx code-rag init --force`
- **THEN** the system SHALL overwrite the existing `.code-rag.jsonc` with fresh defaults

### Requirement: CLI provides ingest command
The system SHALL provide `npx code-rag ingest` that reads `.code-rag.jsonc`, resolves configuration, and runs the Qdrant ingestion pipeline on the configured repository path.

#### Scenario: Ingest reads config and runs pipeline
- **WHEN** user runs `npx code-rag ingest`
- **THEN** the system loads `.code-rag.jsonc` from CWD (or homedir fallback), resolves embedding and Qdrant config, scans the repository, chunks CodeUnits, embeds them, and stores them in Qdrant

#### Scenario: Ingest with explicit path override
- **WHEN** user runs `npx code-rag ingest --path /some/repo`
- **THEN** the system uses the provided path instead of the `repoPath` from config

#### Scenario: Ingest fails gracefully when config not found
- **WHEN** user runs `npx open-rag ingest` and no `.code-rag.jsonc` exists in CWD or homedir
- **THEN** the system SHALL exit with error code 1 and print a message suggesting `npx code-rag init`

#### Scenario: Ingest with provider override
- **WHEN** user runs `npx code-rag ingest --provider ollama`
- **THEN** the system overrides the embedding provider from config with the CLI-provided value

### Requirement: CLI provides start command
The system SHALL provide `npx code-rag start` that reads `.code-rag.jsonc` and starts the MCP RAG server for the current project.

#### Scenario: Start reads config and launches MCP server
- **WHEN** user runs `npx code-rag start`
- **THEN** the system loads `.code-rag.jsonc`, resolves Qdrant and embedding config, and starts the MCP server on stdio transport

#### Scenario: Start fails gracefully when config not found
- **WHEN** user runs `npx code-rag start` and no `.code-rag.jsonc` exists
- **THEN** the system SHALL exit with error code 1 and print a message suggesting `npx open-rag init`

### Requirement: CLI shows help text
The system SHALL display help text when `npx code-rag --help` or `npx code-rag` is invoked without a subcommand.

#### Scenario: Help displays available commands
- **WHEN** user runs `npx code-rag --help`
- **THEN** the system SHALL list all available commands (`init`, `ingest`, `start`) with brief descriptions