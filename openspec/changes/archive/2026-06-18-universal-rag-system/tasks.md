## 1. Project Setup

- [x] 1.1 Initialize package.json with TypeScript, ts-morph, @qdrant/js-client-rest, @modelcontextprotocol/sdk dependencies
- [x] 1.2 Create tsconfig.json with strict mode and path aliases for src/
- [x] 1.3 Create project directory structure (src/mcp, src/ingestion, src/chunking, src/core, src/model)
- [x] 1.4 Set up Docker Compose for Qdrant with health check and persistent volume

## 2. CodeUnit Model & Core Infrastructure

- [x] 2.1 Create src/model/codeUnit.ts with the CodeUnit interface (id, symbol, type, language, filePath, content, imports, exports, tags)
- [x] 2.2 Create src/core/qdrant.ts with Qdrant client initialization and collection management (create/ensure code_rag collection with 768-dim cosine)
- [x] 2.3 Create src/core/embedConfig.ts with embedding provider configuration interface (provider: "ollama" | "lmstudio", modelName, baseUrl, dimensions)
- [x] 2.4 Create src/core/embed.ts with provider-agnostic embedding client supporting Ollama (/api/embeddings) and LM Studio (/v1/embeddings) endpoints
- [x] 2.5 Add default config (Ollama, nomic-embed-text, 768-dim) and LM Studio defaults (localhost:1234, /v1/embeddings)
- [x] 2.6 Add error handling for provider unreachable (descriptive error with setup instructions for both Ollama and LM Studio)
- [x] 2.7 Add Qdrant dimension validation: check collection vector size matches configured embedding dimensions on startup

## 3. TypeScript Chunking

- [x] 3.1 Create src/chunking/tsChunker.ts with ts-morph project initialization
- [x] 3.2 Implement function extraction (top-level functions as atomic CodeUnits)
- [x] 3.3 Implement class and method extraction (class as context wrapper, methods as atomic units)
- [x] 3.4 Implement interface/DTO extraction (type="dto")
- [x] 3.5 Implement NestJS decorator analysis (@Controller → tags=["api"], @Injectable → tags=["service"], @Module → tags=["module"])
- [x] 3.6 Implement import/export extraction for each CodeUnit
- [x] 3.7 Add graceful fallback for unsupported file types (language="unknown", type="module", content=full file)
- [x] 3.8 Add ID generation for CodeUnits (deterministic, based on filePath + symbol)

## 4. Ingestion Pipeline

- [x] 4.1 Create src/ingestion/ingest.ts with repository scanner (collect .ts/.tsx/.js/.jsx/.py files, exclude node_modules/.git/dist/build/coverage)
- [x] 4.2 Implement chunking step: iterate files and produce CodeUnits via tsChunker
- [x] 4.3 Implement embedding step: generate embeddings for each CodeUnit via configured provider (Ollama or LM Studio)
- [x] 4.4 Implement storage step: upsert CodeUnit points into Qdrant (id as point ID, embedding as vector, CodeUnit fields as payload)
- [x] 4.5 Add progress reporting (current file number, total files, file path)
- [x] 4.6 Add error resilience: catch per-file errors, log, skip, and continue
- [x] 4.7 Return ingestion summary (total CodeUnits processed, failed files list)
- [x] 4.8 Create scripts/ingest-repo.ts CLI entry point that takes a repo path argument

## 5. Retrieval API

- [x] 5.1 Create src/core/retriever.ts with semantic search function (embed query → Qdrant search → return ranked CodeUnits)
- [x] 5.2 Implement tag filtering in Qdrant search (filter by tags payload field)
- [x] 5.3 Implement type filtering in Qdrant search (filter by type payload field)
- [x] 5.4 Implement topK parameter (default 5, max 20)
- [x] 5.5 Implement minimum score threshold filtering
- [x] 5.6 Format results as JSON objects with file, symbol, content, score, type, language, tags

## 6. MCP Server

- [x] 6.1 Create src/mcp/server.ts with stdio MCP server using @modelcontextprotocol/sdk
- [x] 6.2 Implement search_codebase tool (query, tags, type, topK, minScore parameters)
- [x] 6.3 Implement ingest_repository tool (path parameter)
- [x] 6.4 Add path validation for ingest_repository (check path exists)
- [x] 6.5 Format MCP tool responses as JSON strings with consistent structure (results array for search, ingested count for ingestion)
- [x] 6.6 Create src/mcp/routes.ts to wire tool handlers to retriever and ingester

## 7. Integration & Verification

- [x] 7.1 Add npm scripts: build, start, ingest, mcp
- [x] 7.2 Test full ingestion pipeline on a sample NestJS project with Ollama provider
- [x] 7.3 Test full ingestion pipeline with LM Studio provider
- [ ] 7.4 Test semantic search via MCP search_codebase tool
- [x] 7.5 Verify Qdrant collection contains expected CodeUnits with correct payloads
- [x] 7.6 Verify tag and type filtering works in search results
- [x] 7.7 Verify dimension mismatch detection rejects wrong embedding models