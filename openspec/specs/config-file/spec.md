## ADDED Requirements

### Requirement: Config file schema
The system SHALL define a Zod-validated schema for `.code-rag.jsonc` covering: `embed` (provider, modelName, baseUrl, dimensions), `qdrant` (url, collection), `ingest` (repoPath, excludedDirs, supportedExtensions), and `server` (transport).

#### Scenario: Valid config parses successfully
- **WHEN** a `.code-rag.jsonc` file contains all valid fields
- **THEN** the system SHALL parse, strip comments, validate against the Zod schema, and return a typed config object

#### Scenario: Invalid config shows validation errors
- **WHEN** a `.code-rag.jsonc` file contains invalid values (e.g., wrong provider name, negative dimensions)
- **THEN** the system SHALL exit with error code 1 and print a human-readable Zod validation error

### Requirement: Config file resolution
The system SHALL resolve the config file by searching `process.cwd()/.code-rag.jsonc` first, then `~/.code-rag.jsonc` as fallback.

#### Scenario: CWD config takes precedence
- **WHEN** both `.code-rag.jsonc` files exist in CWD and homedir
- **THEN** the system SHALL use the CWD config file

#### Scenario: Homedir fallback used when no CWD config
- **WHEN** no `.code-rag.jsonc` exists in CWD but one exists in homedir
- **THEN** the system SHALL use the homedir config file

#### Scenario: No config found throws error
- **WHEN** no `.code-rag.jsonc` exists in either CWD or homedir
- **THEN** the system SHALL throw a descriptive error indicating the config was not found and suggesting `npx code-rag init`

### Requirement: Config file supports JSONC with comments
The system SHALL parse `.code-rag.jsonc` files containing JSON with comments (single-line `//` and multi-line `/* */`).

#### Scenario: Config with comments parses correctly
- **WHEN** a `.code-rag.jsonc` file contains `//` or `/* */` comments
- **THEN** the system SHALL strip comments and parse the resulting JSON successfully

### Requirement: Config default values
The system SHALL provide default values for all config fields using `localhost` for all service URLs: provider `lmstudio`, model `text-embedding-nomic-embed-text-v1.5`, baseUrl `http://localhost:1234/v1`, dimensions `768`, Qdrant URL `http://localhost:6333`, collection `code_rag`. The system SHALL derive provider-specific defaults (model, baseUrl, dimensions, collection) from a single source of truth in the config layer, with no duplicate constant definitions for the same provider across the config and embedding modules.

#### Scenario: Partial config fills provider-specific defaults
- **WHEN** a `.code-rag.jsonc` file provides only `embed.provider: "lmstudio"`
- **THEN** the system SHALL fill remaining fields with LM Studio-specific defaults (model `text-embedding-nomic-embed-text-v1.5`, baseUrl `http://localhost:1234/v1`, dimensions `768`)

#### Scenario: Ollama provider fills Ollama defaults
- **WHEN** a `.code-rag.jsonc` file provides only `embed.provider: "ollama"`
- **THEN** the system SHALL fill remaining fields with Ollama-specific defaults (model `nomic-embed-text`, baseUrl `http://localhost:11434`, dimensions `768`)

#### Scenario: Embedding layer and config layer share identical defaults
- **WHEN** the embedding module resolves defaults for a provider without a config file
- **THEN** the resulting model, baseUrl, dimensions, and collection SHALL be byte-for-byte identical to the values `applyProviderDefaults` produces for the same provider

#### Scenario: No machine-specific IPs in default URLs
- **WHEN** no config file exists and no environment variables are set
- **THEN** every default service URL SHALL resolve to `localhost` (no LAN IP such as `192.168.1.136` SHALL appear in any default baseUrl or Qdrant URL)

### Requirement: Environment variable overrides
The system SHALL support environment variable overrides for config values: `OPEN_RAG_QDRANT_URL`, `OPEN_RAG_EMBED_PROVIDER`, `OPEN_RAG_EMBED_MODEL`, `OPEN_RAG_EMBED_BASE_URL`, `OPEN_RAG_EMBED_DIMENSIONS`, `OPEN_RAG_COLLECTION`.

#### Scenario: Env var overrides config file value
- **WHEN** `OPEN_RAG_QDRANT_URL=http://custom:6333` is set and `.code-rag.jsonc` has `qdrant.url: "http://localhost:6333"`
- **THEN** the system SHALL use `http://custom:6333` as the Qdrant URL

#### Scenario: Env var overrides when no config file exists
- **WHEN** no config file exists and env vars are set
- **THEN** the system SHALL construct the config from env vars plus defaults for unspecified fields