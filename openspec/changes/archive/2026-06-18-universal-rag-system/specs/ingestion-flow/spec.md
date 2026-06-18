## ADDED Requirements

### Requirement: Repository scanning
The system SHALL scan a given repository directory and collect all files matching supported extensions: `.ts`, `.tsx`, `.js`, `.jsx`, `.py`, excluding `node_modules`, `.git`, `dist`, `build`, and `coverage` directories.

#### Scenario: Scanning a TypeScript project
- **WHEN** a NestJS project directory is scanned
- **THEN** the system SHALL collect all `.ts` files while excluding `node_modules` and `dist` directories

#### Scenario: Scanning with excluded directories
- **WHEN** a directory is scanned
- **THEN** files under `node_modules`, `.git`, `dist`, `build`, and `coverage` SHALL be skipped

### Requirement: End-to-end ingestion pipeline
The system SHALL provide an ingestion pipeline that: (1) scans the repository, (2) parses each file into CodeUnits via the chunker, (3) generates embeddings for each CodeUnit via Ollama, (4) upserts each CodeUnit with its embedding into Qdrant.

#### Scenario: Full ingestion
- **WHEN** ingestion is triggered on a repository path
- **THEN** the system SHALL scan, chunk, embed, and store all CodeUnits and return a count of total CodeUnits processed

#### Scenario: Incremental re-ingestion
- **WHEN** a repository is re-ingested after changes
- **THEN** CodeUnits with matching IDs SHALL be updated (upserted) and unchanged CodeUnits SHALL remain intact

### Requirement: Ingestion progress reporting
The system SHALL report progress during ingestion, including the current file being processed and the total count of files found.

#### Scenario: Progress output
- **WHEN** ingestion is running
- **THEN** the system SHALL emit progress messages indicating the current file number, total files, and file path being processed

### Requirement: Error resilience
The system SHALL continue ingestion when individual files fail to parse, logging the error and proceeding to the next file.

#### Scenario: File parse failure
- **WHEN** a file fails during AST parsing or embedding
- **THEN** the system SHALL log the error with the file path, skip that file, and continue processing remaining files

#### Scenario: All files fail
- **WHEN** all files in a repository fail to process
- **THEN** the system SHALL return a summary indicating zero CodeUnits ingested with a list of failed files