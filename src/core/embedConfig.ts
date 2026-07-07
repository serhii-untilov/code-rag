import type { Config } from "../config/schema.js";
import { getProviderDefaults } from "../config/defaults.js";

export type EmbedProvider = "ollama" | "lmstudio";

export interface EmbedConfig {
  provider: EmbedProvider;
  modelName: string;
  baseUrl: string;
  dimensions: number;
  collection: string;
}

export function resolveConfig(partial?: Partial<EmbedConfig>, config?: Config): EmbedConfig {
  if (config) {
    const defaults = getProviderDefaults(config.embed.provider);
    return {
      provider: config.embed.provider,
      modelName: config.embed.modelName ?? defaults.modelName,
      baseUrl: config.embed.baseUrl ?? defaults.baseUrl,
      dimensions: config.embed.dimensions ?? defaults.dimensions,
      collection: config.qdrant.collection ?? defaults.collection,
    };
  }

  const provider = partial?.provider ?? "lmstudio";
  const defaults = getProviderDefaults(provider);

  return {
    provider,
    modelName: partial?.modelName ?? defaults.modelName,
    baseUrl: partial?.baseUrl ?? defaults.baseUrl,
    dimensions: partial?.dimensions ?? defaults.dimensions,
    collection: partial?.collection ?? defaults.collection,
  };
}