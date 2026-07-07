import type { EmbedProvider } from "../core/embedConfig.js";
import type { Config } from "./schema.js";

const OLLAMA_DEFAULTS = {
  provider: "ollama" as EmbedProvider,
  modelName: "nomic-embed-text",
  baseUrl: "http://localhost:11434",
  dimensions: 768,
  collection: "code-rag",
};

const LMSTUDIO_DEFAULTS = {
  provider: "lmstudio" as EmbedProvider,
  modelName: "text-embedding-nomic-embed-text-v1.5",
  baseUrl: "http://localhost:1234/v1",
  dimensions: 768,
  collection: "code-rag",
};

export function getProviderDefaults(provider: EmbedProvider) {
  return provider === "ollama" ? OLLAMA_DEFAULTS : LMSTUDIO_DEFAULTS;
}

export const DEFAULT_CONFIG: Config = {
  embed: {
    provider: "lmstudio",
  },
  qdrant: {
    url: "http://localhost:6333",
    collection: "code_rag",
  },
  ingest: {
    excludedDirs: ["node_modules", ".git", "dist", "build", "coverage"],
    supportedExtensions: [".ts", ".tsx", ".js", ".jsx", ".py"],
  },
  server: {
    transport: "stdio",
  },
};

export { OLLAMA_DEFAULTS, LMSTUDIO_DEFAULTS };