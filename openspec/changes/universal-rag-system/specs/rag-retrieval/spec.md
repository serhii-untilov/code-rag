## ADDED Requirements

### Requirement: Semantic search query
The system SHALL accept a text query, embed it using Ollama, and perform a similarity search against the Qdrant `code_rag` collection returning the top-k most relevant CodeUnits (default k=5, maximum k=20).

#### Scenario: Basic search
- **WHEN** a user searches with query "create supplier"
- **THEN** the system SHALL embed the query, search Qdrant for the top 5 nearest neighbors, and return an array of CodeUnits sorted by relevance score

#### Scenario: Search with tag filter
- **WHEN** a user searches with query "authentication" and a tag filter of `["api"]`
- **THEN** the system SHALL return only CodeUnits whose `tags` field includes `"api"`, ranked by relevance

#### Scenario: Search with type filter
- **WHEN** a user searches with query "controller" and a type filter of `"class"`
- **THEN** the system SHALL return only CodeUnits whose `type` field equals `"class"`

### Requirement: Search result format
The system SHALL return search results as a JSON array of objects with fields: `file`, `symbol`, `content`, `score`, `type`, `language`, `tags`.

#### Scenario: Result structure
- **WHEN** search results are returned
- **THEN** each result SHALL include `filePath` as `file`, `symbol` as `symbol`, `content` as `content`, the Qdrant relevance `score` as `score`, and all other CodeUnit metadata fields

### Requirement: Score threshold filtering
The system SHALL support an optional minimum score threshold parameter to filter out low-relevance results.

#### Scenario: Threshold filtering
- **WHEN** a search is performed with a minimum score of 0.7
- **THEN** results with a similarity score below 0.7 SHALL be excluded from the response