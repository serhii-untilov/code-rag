## MODIFIED Requirements

### Requirement: Ingestion progress reporting
The system SHALL report progress during ingestion, including the current file being processed and the total count of files found. The progress log SHALL reference the resolved collection name (the value actually used for `ensureCollection` and `client.upsert`, with its `'code_rag'` fallback) and SHALL NOT log `undefined` for the collection name.

#### Scenario: Progress output
- **WHEN** ingestion is running
- **THEN** the system SHALL emit progress messages indicating the current file number, total files, and file path being processed

#### Scenario: Found-files log names the resolved collection
- **WHEN** `ingestRepository` is invoked with a `collectionName` option of `"payroll-smb"`
- **THEN** the "Found N files to process into …" log SHALL print `"payroll-smb"` as the collection name

#### Scenario: Found-files log uses fallback when collectionName omitted
- **WHEN** `ingestRepository` is invoked without a `collectionName` option
- **THEN** the "Found N files to process into …" log SHALL print `"code_rag"` (the resolved fallback), not `undefined`

### Requirement: End-to-end ingestion pipeline
The system SHALL provide an ingestion pipeline that: (1) scans the repository, (2) parses each file into CodeUnits via the chunker, (3) generates embeddings for each CodeUnit via Ollama, (4) upserts each CodeUnit with its embedding into Qdrant. The CLI `ingest` command SHALL pass the configured `qdrant.collection` from `.code-rag.jsonc` as the `collectionName` into the ingestion pipeline so the user's configured collection is used for upserts.

#### Scenario: Full ingestion
- **WHEN** ingestion is triggered on a repository path
- **THEN** the system SHALL scan, chunk, embed, and store all CodeUnits and return a count of total CodeUnits processed

#### Scenario: Incremental re-ingestion
- **WHEN** a repository is re-ingested after changes
- **THEN** CodeUnits with matching IDs SHALL be updated (upserted) and unchanged CodeUnits SHALL remain intact

#### Scenario: CLI ingest uses configured collection name
- **WHEN** user runs `npx code-rag ingest` and `.code-rag.jsonc` has `qdrant.collection: "payroll-smb"`
- **THEN** the ingestion pipeline SHALL receive `collectionName: "payroll-smb"` and SHALL upsert CodeUnits into the `"payroll-smb"` collection in Qdrant