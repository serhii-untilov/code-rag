## MODIFIED Requirements

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