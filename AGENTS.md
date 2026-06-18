# Universal Code RAG system (MCP + Qdrant + Ollama)

## 1. Overview

This document describes a simple, production-ready, Code RAG system designed for:

- NestJS backend (TypeScript)
- FastAPI gateway (external, not indexed internally)
- Vue 3 frontend
- OpenCode MCP integration
- Local LLM via Ollama
- Vector DB: Qdrant

The goal is to build a **framework-agnostic code intelligence system** that works across all projects.

---

## 2. Core Idea

We do NOT build framework-specific RAG.

Instead we build:

> A universal CodeUnit-based indexing system.

Everything (TS, JS, Python, etc.) becomes a normalized "CodeUnit".

---

## 3. High-Level Architecture

```
Codebases (NestJS / Vue / FastAPI)
        ↓
AST Chunker (TypeScript: ts-morph)
        ↓
CodeUnit Normalizer
        ↓
Embedding (Ollama: nomic-embed-text)
        ↓
Qdrant Vector DB
        ↓
RAG Retrieval API (Node.js MCP Server)
        ↓
OpenCode Agent
        ↓
LLM (local inference)
```

---

## 4. Project Structure

```
code-rag/
  src/
    cli/
      index.ts           # CLI entry point (commander)
      commands/
        init.ts          # npx code-rag init
        ingest.ts        # npx code-rag ingest
        start.ts         # npx code-rag start

    config/
      schema.ts          # Zod schema for .code-rag.jsonc
      loader.ts          # config resolution, JSONC parsing, env var overrides
      defaults.ts        # default config values

    mcp/
      server.ts          # MCP API for OpenCode
      routes.ts          # search + ingest endpoints

    ingestion/
      ingest.ts          # repository ingestion pipeline

    chunking/
      tsChunker.ts       # AST-based TS chunking (NestJS/Vue)

    core/
      embed.ts           # embedding client (Ollama / LM Studio)
      embedConfig.ts     # embedding config resolution
      qdrant.ts          # vector DB client
      retriever.ts       # semantic search logic

    model/
      codeUnit.ts        # unified schema

  .code-rag.jsonc        # project config file (created by code-rag init)

  scripts/
    ingest-repo.ts       # legacy ingest script (prefer npx code-rag ingest)

  package.json
  tsconfig.json
```

---

## 5. CodeUnit Model (Core Abstraction)

All languages are normalized into this:

```ts
export interface CodeUnit {
  id: string;
  symbol: string;
  type: "function" | "method" | "class" | "module" | "dto";
  language: "ts" | "js" | "py" | "go" | "unknown";

  filePath: string;
  content: string;

  imports?: string[];
  exports?: string[];

  tags?: string[]; // auth, db, api, ui
}
```

---

## 6. Chunking Strategy (TypeScript / NestJS / Vue)

### Rules

- Function = atomic unit
- Method = atomic unit
- DTO / Interface = atomic unit
- Class = context wrapper only
- Module = metadata only

### NestJS-aware extraction

- @Controller → route grouping
- @Injectable → service grouping
- @Post/@Get → endpoint marking

---

## 7. Ingestion Flow

```
1. Scan repo
2. Parse TS AST (ts-morph)
3. Extract CodeUnits
4. Embed each CodeUnit
5. Store in Qdrant
```

---

## 8. Retrieval Flow

```
User query
   ↓
Embed query (Ollama)
   ↓
Qdrant similarity search (top 5–10)
   ↓
Return CodeUnits
   ↓
Inject into OpenCode prompt
   ↓
LLM response
```

---

## 9. MCP Server (OpenCode Integration)

Exposes:

### Tools

- search_codebase(query)
- ingest_repository(path)

### Output format

```json
{
  "results": [
    {
      "file": "supplier.service.ts",
      "symbol": "SupplierService.create",
      "content": "..."
    }
  ]
}
```

---

## 9b. CLI Usage

Install as a dev dependency:

```bash
npm install --save-dev code-rag
```

### Configuration

Create a config file in your project:

```bash
npx code-rag init          # creates .code-rag.jsonc with defaults
npx code-rag init --force  # overwrite existing config
```

Config file `.code-rag.jsonc` is searched in CWD first, then `~/.code-rag.jsonc`.

Environment variable overrides:
- `CODE_RAG_EMBED_PROVIDER` — ollama or lmstudio
- `CODE_RAG_EMBED_MODEL` — embedding model name
- `CODE_RAG_EMBED_BASE_URL` — embedding API URL
- `CODE_RAG_EMBED_DIMENSIONS` — vector dimensions
- `CODE_RAG_QDRANT_URL` — Qdrant server URL
- `CODE_RAG_COLLECTION` — Qdrant collection name

### Ingest

```bash
npx code-rag ingest                     # uses repoPath from config
npx code-rag ingest --path /some/repo   # override repo path
npx code-rag ingest --provider ollama    # override embedding provider
```

### Start MCP Server

```bash
npx code-rag start
```

---

## 10. Embedding Model (Local)

Use Ollama:

```
nomic-embed-text
```

Endpoint:

```
http://localhost:11434/api/embeddings
```

---

## 11. Vector DB (Qdrant)

- Collection: `code_rag`
- Stores:
  - embedding vector
  - CodeUnit payload

---

## 12. Minimal Build Plan

### Phase 1 — Core
- Setup Qdrant
- Setup Ollama embeddings
- Build CodeUnit schema
- Build TS chunker

### Phase 2 — RAG
- Implement ingestion pipeline
- Implement retrieval API

### Phase 3 — MCP
- Build MCP server
- Connect OpenCode

### Phase 4 — Optimization
- Add tagging system
- Add file watcher
- Add reranking (optional later)

---

## 13. Design Principles

- No framework lock-in
- AST-based chunking only
- Language-agnostic core
- Minimal dependencies
- Local-first (no cloud required)

---

## 14. Result

A reusable Poject RAG that works for:

- NestJS backend
- Vue frontend
- FastAPI gateway
- future projects in any language
- future docs and specs
