## Context

We need a local-first, framework-agnostic Code RAG system that indexes code from multiple repositories (NestJS, Vue 3, FastAPI) and provides semantic retrieval for LLM-assisted development via OpenCode MCP integration. Currently no code intelligence system exists — developers rely on manual file navigation and grep-based search.

The system must run entirely locally: Ollama or LM Studio for embeddings, Qdrant for vector storage, and Node.js MCP server for OpenCode integration.

## Goals / Non-Goals

**Goals:**
- Provide a unified CodeUnit schema that normalizes code across languages (TS, JS, Python)
- Enable AST-based chunking that preserves semantic boundaries (functions, classes, methods, DTOs)
- Deliver sub-second semantic search over indexed repositories
- Expose retrieval and ingestion capabilities via MCP protocol for OpenCode
- Run entirely locally with no cloud dependencies

**Non-Goals:**
- Multi-user authentication or authorization
- Cloud-hosted deployment or SaaS offering
- Real-time collaborative editing
- Code generation or modification (retrieval only)
- Support for languages beyond TS/JS/Python in Phase 1

## Decisions

### 1. ts-morph for AST parsing over regex-based chunking
**Choice**: ts-morph (wrappers around TypeScript Compiler API)
**Rationale**: Regex-based chunking loses structural context. ts-morph provides full AST access, enabling extraction of decorators, imports, exports, and symbol metadata. It specifically supports NestJS decorators (@Controller, @Injectable, @Post) and Vue SFC structure.
**Alternatives**: Babel parser (no type info), tree-sitter (needs grammar setup), simple regex splitting (loses structure).

### 2. Qdrant as vector database over alternatives
**Choice**: Qdrant with `@qdrant/js-client-rest`
**Rationale**: Qdrant offers a clean REST API, supports payload filtering (for tag-based retrieval), runs locally via Docker, and has excellent TypeScript client support. Payload filtering enables efficient `tag=api` or `type=controller` filters alongside vector search.
**Alternatives**: ChromaDB (less mature client), Pinecone (cloud-only), Weaviate (heavier), Milvus (overkill for local use).

### 3. Local embedding with Ollama or LM Studio
**Choice**: Provider-agnostic embedding client supporting Ollama and LM Studio as backends
**Rationale**: Users may already run either Ollama or LM Studio locally. Ollama provides a native embeddings API at `localhost:11434/api/embeddings` while LM Studio exposes an OpenAI-compatible API at `localhost:1234/v1/embeddings`. Supporting both removes a setup barrier and lets users choose their preferred tool. The system auto-detects which provider is available based on configuration.
- **Ollama**: Runs `nomic-embed-text` (768-dim) via `localhost:11434/api/embeddings`. Simpler model management (`ollama pull nomic-embed-text`).
- **LM Studio**: Runs any loaded embedding model via `localhost:1234/v1/embeddings` using the OpenAI-compatible API. Better for users who already use LM Studio for local inference and want a single local server.
**Alternatives**: OpenAI embeddings (cloud, cost), sentence-transformers (requires Python runtime), CodeBERT (heavier model).

### 4. MCP Server architecture
**Choice**: `@modelcontextprotocol/sdk` stdio transport
**Rationale**: OpenCode uses MCP protocol for tool integration. Stdio transport is the simplest and most reliable for local agent communication. Two tools: `search_codebase(query)` for retrieval and `ingest_repository(path)` for indexing.
**Alternatives**: HTTP-based REST API (adds networking complexity), direct CLI (no streaming protocol).

### 5. CodeUnit as the core abstraction
**Choice**: Unified `CodeUnit` interface with id, symbol, type, language, filePath, content, imports, exports, tags
**Rationale**: A language-agnostic schema allows the same retrieval pipeline to serve NestJS controllers, Vue components, and Python endpoints. Tags enable filtered retrieval (e.g., find all `@Controller` endpoints).
**Alternatives**: Per-language schemas (duplicates retrieval logic), flat text chunks (loses structural metadata).

### 6. Ingestion as CLI script, not always-on service
**Choice**: `scripts/ingest-repo.ts` triggered manually or via MCP tool
**Rationale**: Code doesn't change constantly; on-demand ingestion via MCP's `ingest_repository` tool is simpler and avoids the complexity of file watchers. Future phases can add watchers.
**Alternatives**: Always-on watcher service (over-engineering for Phase 1), git hook triggers (coupling to git workflow).

## Risks / Trade-offs

- **[Ollama/LM Studio model availability]** → Document setup instructions for both providers; auto-detect configured provider; fail gracefully with clear error if the selected provider is unreachable or model is not loaded
- **[Large repo ingestion time]** → Process files in batches; show progress via MCP tool output; store partial results
- **[AST parsing failures on non-TS files]** → Graceful fallback to line-based chunking for unknown syntax; mark language as `"unknown"`
- **[Qdrant uptime dependency]** → Document Docker Compose setup; add health check before operations
- **[Embedding dimension mismatch across providers]** → Pin model dimensions via config; validate vector dimensions match on Qdrant collection creation; reject mismatched models at startup