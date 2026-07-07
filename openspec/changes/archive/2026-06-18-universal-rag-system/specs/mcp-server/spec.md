## ADDED Requirements

### Requirement: MCP server stdio transport
The system SHALL expose an MCP server using stdio transport with the `@modelcontextprotocol/sdk` package, providing tools for OpenCode integration.

#### Scenario: Server startup
- **WHEN** the MCP server is started
- **THEN** it SHALL listen on stdio and register the `search_codebase` and `ingest_repository` tools

### Requirement: search_codebase tool
The system SHALL expose an MCP tool named `search_codebase` that accepts a `query` string, an optional `tags` string array, an optional `type` string, an optional `topK` number (default 5), and an optional `minScore` number.

#### Scenario: Search via MCP
- **WHEN** OpenCode calls `search_codebase` with `query="find all suppliers"`
- **THEN** the tool SHALL return a formatted JSON string containing matching CodeUnits with file, symbol, content, score, type, language, and tags

#### Scenario: Search with filters via MCP
- **WHEN** OpenCode calls `search_codebase` with `query="auth"` and `tags=["api"]`
- **THEN** the tool SHALL pass the tag filter to the retrieval layer and return filtered results

### Requirement: ingest_repository tool
The system SHALL expose an MCP tool named `ingest_repository` that accepts a `path` string pointing to a local repository directory.

#### Scenario: Ingest via MCP
- **WHEN** OpenCode calls `ingest_repository` with `path="/home/user/my-project"`
- **THEN** the tool SHALL trigger the full ingestion pipeline on that repository and return a summary with the count of CodeUnits ingested

#### Scenario: Invalid path
- **WHEN** OpenCode calls `ingest_repository` with a non-existent path
- **THEN** the tool SHALL return an error message indicating the path does not exist

### Requirement: Tool response format
All MCP tool responses SHALL return results as JSON-formatted strings with a consistent structure: `{ "results": [...] }` for searches and `{ "ingested": <count>, "path": "<path>" }` for ingestion.

#### Scenario: Search response format
- **WHEN** search results are returned via MCP
- **THEN** the response SHALL be a JSON string with a `results` array containing objects with `file`, `symbol`, `content`, `score`, `type`, `language`, `tags` fields