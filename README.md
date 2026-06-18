# Code RAG

Local-first, framework-agnostic Code RAG system for code intelligence. Indexes codebases into Qdrant via AST chunking and exposes semantic search through an MCP server.

## Prerequisites

- Node.js 18+
- Docker (for Qdrant)
- Ollama or LM Studio (for embeddings)

## Setup

```bash
make install
make qdrant-up
```

## Ingest a Repository

```bash
make ingest
```

Default configuration (override in Makefile or command line):

| Variable | Default |
|---|---|
| `REPO_PATH` | `/home/untilov/Projects/payroll-smb/` |
| `PROVIDER` | `lmstudio` |
| `MODEL` | `qwen/qwen3.5-9b` |
| `BASE_URL` | `http://192.168.1.136:1234/v1` |

Override example:

```bash
make ingest REPO_PATH=/path/to/repo PROVIDER=ollama MODEL=nomic-embed-text
```

## Search via MCP

Start the MCP server:

```bash
make mcp
```

This exposes two tools to OpenCode:

- **`search_codebase`** — Semantic search with optional `tags`, `type`, `topK`, `minScore` filters
- **`ingest_repository`** — Index a repo path into Qdrant

## Commands

```
make help          List all commands
make install       Install dependencies
make build         Compile TypeScript
make ingest        Ingest configured repo
make mcp           Start MCP server
make qdrant-up     Start Qdrant
make qdrant-down   Stop Qdrant
make clean         Remove build artifacts
```