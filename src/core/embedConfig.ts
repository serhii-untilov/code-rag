import type { Config } from "../config/schema.js";
import { DEFAULT_CONFIG, getProviderDefaults } from "../config/defaults.js";

export type EmbedProvider = "ollama" | "lmstudio";

export interface EmbedConfig {
  provider: EmbedProvider;
  modelName: string;
  baseUrl: string;
  dimensions: number;
}

const OLLAMA_DEFAULTS: Omit<EmbedConfig, "provider"> & { provider: "ollama" } = {
  provider: "ollama",
  modelName: "nomic-embed-text",
  baseUrl: "http://localhost:11434",
  dimensions: 768,
};

const LMSTUDIO_DEFAULTS: Omit<EmbedConfig, "provider"> & { provider: "lmstudio" } = {
  provider: "lmstudio",
  modelName: "text-embedding-nomic-embed-text-v1.5",
  baseUrl: "http://192.168.1.136:1234/v1",
  dimensions: 768,
};

export function resolveConfig(partial?: Partial<EmbedConfig>, config?: Config): EmbedConfig {
  if (config) {
    const defaults = getProviderDefaults(config.embed.provider);
    return {
      provider: config.embed.provider,
      modelName: config.embed.modelName ?? defaults.modelName,
      baseUrl: config.embed.baseUrl ?? defaults.baseUrl,
      dimensions: config.embed.dimensions ?? defaults.dimensions,
    };
  }

  const provider = partial?.provider ?? "lmstudio";
  const defaults = provider === "ollama" ? OLLAMA_DEFAULTS : LMSTUDIO_DEFAULTS;

  return {
    provider,
    modelName: partial?.modelName ?? defaults.modelName,
    baseUrl: partial?.baseUrl ?? defaults.baseUrl,
    dimensions: partial?.dimensions ?? defaults.dimensions,
  };
}