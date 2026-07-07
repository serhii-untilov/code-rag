## ADDED Requirements

### Requirement: Provider-agnostic embedding generation
The system SHALL support two local embedding providers: Ollama and LM Studio. The active provider SHALL be determined by configuration. The embedding client SHALL abstract both providers behind a common interface returning a float vector.

#### Scenario: Ollama provider embedding generation
- **WHEN** the provider is configured as Ollama and a CodeUnit content string is sent for embedding
- **THEN** the system SHALL POST to `http://localhost:11434/api/embeddings` with `model` set to the configured model name (default: `nomic-embed-text`) and return the resulting embedding vector

#### Scenario: LM Studio provider embedding generation
- **WHEN** the provider is configured as LM Studio and a CodeUnit content string is sent for embedding
- **THEN** the system SHALL POST to `http://localhost:1234/v1/embeddings` using the OpenAI-compatible API format with `model` set to the configured model name and return the resulting embedding vector

#### Scenario: Provider endpoint unreachable
- **WHEN** the configured provider endpoint is unreachable or returns an error
- **THEN** the system SHALL throw a descriptive error indicating which provider failed, the endpoint attempted, and include setup instructions for both Ollama and LM Studio

### Requirement: Embedding provider configuration
The system SHALL accept a configuration object specifying: `provider` ("ollama" | "lmstudio"), `modelName` (string), `baseUrl` (optional string override), and `dimensions` (number).

#### Scenario: Default configuration
- **WHEN** no configuration is provided
- **THEN** the system SHALL default to Ollama provider with model `nomic-embed-text`, base URL `http://localhost:11434`, and dimensions `768`

#### Scenario: LM Studio configuration
- **WHEN** the user configures provider as `lmstudio`
- **THEN** the system SHALL use `http://localhost:1234` as the default base URL and the OpenAI-compatible `/v1/embeddings` endpoint

#### Scenario: Custom base URL
- **WHEN** a custom `baseUrl` is provided
- **THEN** the system SHALL use that URL instead of the provider's default, enabling non-standard ports or remote servers

### Requirement: Qdrant collection management
The system SHALL manage a Qdrant collection named `code_rag` with vector configuration matching the configured embedding model dimensions and cosine distance metric.

#### Scenario: Collection creation
- **WHEN** ingestion starts and the `code_rag` collection does not exist
- **THEN** the system SHALL create the collection with vectors matching the configured `dimensions` value and cosine distance

#### Scenario: Existing collection reuse
- **WHEN** the `code_rag` collection already exists
- **THEN** the system SHALL reuse it without re-creating

#### Scenario: Dimension mismatch detection
- **WHEN** the existing collection has different vector dimensions than the configured embedding model
- **THEN** the system SHALL throw a descriptive error indicating the mismatch between the collection and the configured model

### Requirement: CodeUnit storage in Qdrant
The system SHALL store each CodeUnit in Qdrant with its embedding vector as the point vector and the full CodeUnit payload (excluding the embedding) as the point payload.

#### Scenario: Storing a CodeUnit
- **WHEN** a CodeUnit with its embedding is upserted into Qdrant
- **THEN** the point SHALL have the CodeUnit's `id` as the point ID, the embedding vector as the vector, and all CodeUnit fields as searchable payload fields

#### Scenario: Duplicate ID handling
- **WHEN** a CodeUnit with an existing ID is upserted
- **THEN** the existing point SHALL be overwritten with the new data