## Why

There is no unified way to index, embed, and retrieve code intelligence across multiple codebases (NestJS, Vue 3, FastAPI). Developers need semantic search over their own code to support LLM-assisted development via OpenCode MCP integration. Building a local-first, framework-agnostic RAG system eliminates the need for cloud services and enables instant, context-rich code retrieval.

## What Changes

- Add a CodeUnit-based AST chunker for TypeScript/JavaScript (ts-morph), extracting functions, methods, classes, DTOs, and modules as atomic units
- Add local embedding pipeline supporting Ollama and LM Studio as model providers
- Add Qdrant vector DB integration for storing and searching CodeUnit embeddings
- Add ingestion pipeline to scan, parse, chunk, embed, and store repositories
- Add retrieval API for semantic search over indexed CodeUnits
- Add MCP server exposing `search_codebase` and `ingest_repository` tools for OpenCode integration
- Add tag-based classification (auth, db, api, ui) for filtered retrieval

## Capabilities

### New Capabilities
- `code-unit-chunking`: AST-based extraction and normalization of code into unified CodeUnit schema across languages
- `embedding-pipeline`: Local embedding generation (Ollama or LM Studio) and storage into Qdrant vector DB
- `rag-retrieval`: Semantic search API that embeds queries and returns ranked CodeUnits from Qdrant
- `mcp-server`: MCP protocol server exposing search and ingestion tools for OpenCode agent integration
- `ingestion-flow`: End-to-end repository ingestion pipeline (scan → parse → chunk → embed → store)

### Modified Capabilities

## Impact

- New dependency: `ts-morph` for AST parsing, `@qdrant/js-client-rest` for vector DB, `@modelcontextprotocol/sdk` for MCP
- New local services required: Qdrant (Docker), Ollama with `nomic-embed-text` model or LM Studio server
- No existing APIs or modules are modified — this is a greenfield addition