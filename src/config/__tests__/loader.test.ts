import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { readConfigFile, applyEnvOverrides, applyProviderDefaults } from "../loader.js";
import { DEFAULT_CONFIG } from "../defaults.js";
import { configSchema, type Config } from "../schema.js";

describe("config schema", () => {
  it("parses empty config with defaults", () => {
    const result = configSchema.parse({});
    assert.equal(result.embed.provider, "lmstudio");
    assert.equal(result.qdrant.url, "http://localhost:6333");
    assert.equal(result.qdrant.collection, "code_rag");
  });

  it("parses partial embed config with ollama provider", () => {
    const result = configSchema.parse({ embed: { provider: "ollama" } });
    assert.equal(result.embed.provider, "ollama");
  });

  it("rejects invalid provider", () => {
    assert.throws(() => configSchema.parse({ embed: { provider: "invalid" } }));
  });

  it("parses full config", () => {
    const full = {
      embed: { provider: "ollama", modelName: "nomic-embed-text", baseUrl: "http://localhost:11434", dimensions: 768 },
      qdrant: { url: "http://localhost:6333", collection: "code_rag" },
      ingest: { repoPath: "/some/path", excludedDirs: ["node_modules"], supportedExtensions: [".ts"] },
      server: { transport: "stdio" as const },
    };
    const result = configSchema.parse(full);
    assert.equal(result.embed.provider, "ollama");
    assert.equal(result.ingest.repoPath, "/some/path");
  });
});

describe("readConfigFile", () => {
  const tmpDir = path.join(os.tmpdir(), "code-rag-test-" + Date.now());

  beforeEach(() => { fs.mkdirSync(tmpDir, { recursive: true }); });
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true, force: true }); });

  it("parses JSONC with comments", () => {
    const configPath = path.join(tmpDir, ".code-rag.jsonc");
    fs.writeFileSync(configPath, `{
  // This is a comment
  "embed": {
    /* block comment */
    "provider": "ollama"
  }
}`);
    const result = readConfigFile(configPath) as any;
    assert.equal(result.embed.provider, "ollama");
  });
});

describe("applyProviderDefaults", () => {
  it("fills ollama defaults", () => {
    const config: Config = {
      embed: { provider: "ollama" },
      qdrant: { url: "http://localhost:6333", collection: "code_rag" },
      ingest: { excludedDirs: ["node_modules"], supportedExtensions: [".ts"] },
      server: { transport: "stdio" },
    };
    const result = applyProviderDefaults(config);
    assert.equal(result.embed.modelName, "nomic-embed-text");
    assert.equal(result.embed.baseUrl, "http://localhost:11434");
    assert.equal(result.embed.dimensions, 768);
  });

  it("fills lmstudio defaults", () => {
    const config: Config = {
      embed: { provider: "lmstudio" },
      qdrant: { url: "http://localhost:6333", collection: "code_rag" },
      ingest: { excludedDirs: ["node_modules"], supportedExtensions: [".ts"] },
      server: { transport: "stdio" },
    };
    const result = applyProviderDefaults(config);
    assert.equal(result.embed.modelName, "text-embedding-nomic-embed-text-v1.5");
  });

  it("preserves explicit values", () => {
    const config: Config = {
      embed: { provider: "ollama", modelName: "custom-model", baseUrl: "http://custom:1234", dimensions: 512 },
      qdrant: { url: "http://localhost:6333", collection: "code_rag" },
      ingest: { excludedDirs: [], supportedExtensions: [".ts"] },
      server: { transport: "stdio" },
    };
    const result = applyProviderDefaults(config);
    assert.equal(result.embed.modelName, "custom-model");
    assert.equal(result.embed.dimensions, 512);
  });
});

describe("applyEnvOverrides", () => {
  const originalEnv: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of ["CODE_RAG_EMBED_PROVIDER", "CODE_RAG_EMBED_MODEL", "CODE_RAG_EMBED_BASE_URL", "CODE_RAG_EMBED_DIMENSIONS", "CODE_RAG_QDRANT_URL", "CODE_RAG_COLLECTION"]) {
      originalEnv[key] = process.env[key];
    }
  });

  afterEach(() => {
    for (const [key, val] of Object.entries(originalEnv)) {
      if (val === undefined) { delete process.env[key]; } else { process.env[key] = val; }
    }
  });

  it("overrides config values from env vars", () => {
    process.env.CODE_RAG_QDRANT_URL = "http://custom:6333";
    process.env.CODE_RAG_COLLECTION = "custom_collection";
    const result = applyEnvOverrides(DEFAULT_CONFIG);
    assert.equal(result.qdrant.url, "http://custom:6333");
    assert.equal(result.qdrant.collection, "custom_collection");
  });

  it("overrides embed settings from env vars", () => {
    process.env.CODE_RAG_EMBED_PROVIDER = "ollama";
    process.env.CODE_RAG_EMBED_MODEL = "custom-model";
    const result = applyEnvOverrides(DEFAULT_CONFIG);
    assert.equal(result.embed.provider, "ollama");
    assert.equal(result.embed.modelName, "custom-model");
  });

  it("leaves config unchanged when no env vars set", () => {
    const result = applyEnvOverrides(DEFAULT_CONFIG);
    assert.deepEqual(result.embed, DEFAULT_CONFIG.embed);
  });
});