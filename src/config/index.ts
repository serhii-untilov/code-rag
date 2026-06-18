export { configSchema } from "./schema.js";
export type { Config, EmbedConfigSchema, QdrantConfigSchema, IngestConfigSchema, ServerConfigSchema } from "./schema.js";
export { DEFAULT_CONFIG, getProviderDefaults, OLLAMA_DEFAULTS, LMSTUDIO_DEFAULTS } from "./defaults.js";
export {
  loadConfig,
  findConfigFile,
  readConfigFile,
  applyEnvOverrides,
  applyProviderDefaults,
  resolveConfigOrDie,
  ConfigNotFoundError,
  ConfigValidationError,
} from "./loader.js";