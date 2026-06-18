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
    mcp/
      server.ts          # MCP API for OpenCode
      routes.ts          # search + ingest endpoints

    ingestion/
      ingest.ts          # repository ingestion pipeline
      watcher.ts         # git/file watcher (optional)

    chunking/
      tsChunker.ts       # AST-based TS chunking (NestJS/Vue)

    core/
      embed.ts           # Ollama embeddings
      qdrant.ts         # vector DB client
      retriever.ts      # semantic search logic

    model/
      codeUnit.ts       # unified schema

  config/
    opencode.json
    qdrant.json

  scripts/
    ingest-repo.ts

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
