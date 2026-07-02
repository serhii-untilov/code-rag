# Code RAG

Local-first, framework-agnostic Code RAG system for code intelligence. Indexes codebases into Qdrant via AST chunking and exposes semantic search through an MCP server.

## Prerequisites

- Node.js 18+
- Docker (for Qdrant)
- Ollama or LM Studio (for embeddings)

## Installation

### As a dev dependency in your project (recommended)

```bash
npm install --save-dev @untilov/code-rag
npx code-rag init
npx code-rag qdrant-up
npx code-rag ingest
```

### From source

```bash
git clone git@github.com:serhii-untilov/code-rag.git code-rag
cd code-rag
npm install
npm run build
```

## Quick Start

### 1. Start Qdrant

```bash
docker compose up -d
```

### 2. Create a config file

```bash
npx code-rag init
```

This creates `.code-rag.jsonc` in your project directory with default settings:

```jsonc
{
  "embed": {
    "provider": "lmstudio",             // "ollama" or "lmstudio"
    "modelName": "text-embedding-nomic-embed-text-v1.5",
    "baseUrl": "http://192.168.1.136:1234/v1",
    "dimensions": 768
  },
  "qdrant": {
    "url": "http://localhost:6333",
    "collection": "code_rag"
  },
  "ingest": {
    "excludedDirs": ["node_modules", ".git", "dist", "build", "coverage"],
    "supportedExtensions": [".ts", ".tsx", ".js", ".jsx", ".py"]
  },
  "server": {
    "transport": "stdio"
  }
}
```

Edit `.code-rag.jsonc` to match your environment (provider, model, URL, etc.).

### 3. Ingest your codebase

```bash
npx code-rag ingest                     # uses repoPath from config (defaults to CWD)
npx code-rag ingest --path /some/repo   # override repository path
npx code-rag ingest --provider ollama   # override embedding provider
```

### 4. Start the MCP server

```bash
npx code-rag start
```

This exposes two tools to OpenCode or any MCP client:

- **`search_codebase`** — Semantic search with optional `tags`, `type`, `topK`, `minScore` filters
- **`ingest_repository`** — Index a repo path into Qdrant

## CLI Reference

```
code-rag init [options]          Create .code-rag.jsonc config file
  --force                        Overwrite existing config

code-rag ingest [options]       Ingest a repository into Qdrant
  -p, --path <path>              Repository path (overrides config)
  --provider <provider>          Embedding provider: ollama | lmstudio

code-rag start                  Start the MCP RAG server

code-rag --version               Show version
code-rag --help                  Show help
```

## Configuration

### Config file resolution

1. `.code-rag.jsonc` in current working directory
2. `~/.code-rag.jsonc` in home directory (fallback)

If no config file is found, `ingest` and `start` exit with an error suggesting `npx code-rag init`.

### Environment variable overrides

Environment variables take precedence over the config file:

| Variable | Description |
|---|---|
| `CODE_RAG_EMBED_PROVIDER` | Embedding provider (`ollama` or `lmstudio`) |
| `CODE_RAG_EMBED_MODEL` | Embedding model name |
| `CODE_RAG_EMBED_BASE_URL` | Embedding API base URL |
| `CODE_RAG_EMBED_DIMENSIONS` | Vector dimensions |
| `CODE_RAG_QDRANT_URL` | Qdrant server URL |
| `CODE_RAG_COLLECTION` | Qdrant collection name |

### Embedding providers

**Ollama** (default settings):
- Model: `nomic-embed-text`
- URL: `http://localhost:11434`
- Dimensions: 768

**LM Studio** (default settings):
- Model: `text-embedding-nomic-embed-text-v1.5`
- URL: `http://192.168.1.136:1234/v1`
- Dimensions: 768

## Development

### Build

```bash
npm run build
```

### Make commands

```
make help          List all commands
make install       Install dependencies
make build         Compile TypeScript
make init          Create .code-rag.jsonc config file
make ingest        Ingest configured repo
make mcp           Start MCP server
make qdrant-up     Start Qdrant
make qdrant-down   Stop Qdrant
make clean         Remove build artifacts
```