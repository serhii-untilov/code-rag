import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import stripJsonComments from "strip-json-comments";
import { configSchema, type Config } from "./schema.js";
import { DEFAULT_CONFIG, getProviderDefaults } from "./defaults.js";

const CONFIG_FILENAME = ".code-rag.jsonc";

export class ConfigNotFoundError extends Error {
  constructor(searched: string[]) {
    super(
      `Configuration file not found. Searched: ${searched.join(", ")}\n` +
        `Run "npx code-rag init" to create a configuration file.`
    );
    this.name = "ConfigNotFoundError";
  }
}

export class ConfigValidationError extends Error {
  constructor(message: string) {
    super(`Invalid configuration: ${message}`);
    this.name = "ConfigValidationError";
  }
}

export function findConfigFile(): string | null {
  const cwdPath = path.join(process.cwd(), CONFIG_FILENAME);
  if (fs.existsSync(cwdPath)) return cwdPath;

  const homePath = path.join(os.homedir(), CONFIG_FILENAME);
  if (fs.existsSync(homePath)) return homePath;

  return null;
}

export function readConfigFile(filePath: string): unknown {
  const raw = fs.readFileSync(filePath, "utf-8");
  const stripped = stripJsonComments(raw);
  return JSON.parse(stripped);
}

export function applyEnvOverrides(config: Config): Config {
  const envVars: Record<string, string | undefined> = {
    provider: process.env.CODE_RAG_EMBED_PROVIDER,
    modelName: process.env.CODE_RAG_EMBED_MODEL,
    baseUrl: process.env.CODE_RAG_EMBED_BASE_URL,
    dimensions: process.env.CODE_RAG_EMBED_DIMENSIONS,
    qdrantUrl: process.env.CODE_RAG_QDRANT_URL,
    collection: process.env.CODE_RAG_COLLECTION,
  };

  const embed = { ...config.embed };
  if (envVars.provider !== undefined) {
    embed.provider = envVars.provider as "ollama" | "lmstudio";
  }
  if (envVars.modelName !== undefined) {
    embed.modelName = envVars.modelName;
  }
  if (envVars.baseUrl !== undefined) {
    embed.baseUrl = envVars.baseUrl;
  }
  if (envVars.dimensions !== undefined) {
    embed.dimensions = parseInt(envVars.dimensions, 10);
  }

  const qdrant = { ...config.qdrant };
  if (envVars.qdrantUrl !== undefined) {
    qdrant.url = envVars.qdrantUrl;
  }
  if (envVars.collection !== undefined) {
    qdrant.collection = envVars.collection;
  }

  return { ...config, embed, qdrant };
}

export function applyProviderDefaults(config: Config): Config {
  const defaults = getProviderDefaults(config.embed.provider);
  return {
    ...config,
    embed: {
      ...config.embed,
      modelName: config.embed.modelName ?? defaults.modelName,
      baseUrl: config.embed.baseUrl ?? defaults.baseUrl,
      dimensions: config.embed.dimensions ?? defaults.dimensions,
    },
  };
}

export function loadConfig(configPath?: string): Config {
  const filePath = configPath ?? findConfigFile();

  if (filePath === null) {
    const searched = [
      path.join(process.cwd(), CONFIG_FILENAME),
      path.join(os.homedir(), CONFIG_FILENAME),
    ];
    throw new ConfigNotFoundError(searched);
  }

  let rawConfig: unknown;
  try {
    rawConfig = readConfigFile(filePath);
  } catch (err) {
    throw new Error(
      `Failed to parse config file at ${filePath}: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  const parsed = configSchema.safeParse(rawConfig);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new ConfigValidationError(issues);
  }

  const config = applyProviderDefaults(parsed.data);
  return applyEnvOverrides(config);
}

export function resolveConfigOrDie(configPath?: string): Config {
  try {
    return loadConfig(configPath);
  } catch (err) {
    if (err instanceof ConfigNotFoundError) {
      console.error(err.message);
      process.exit(1);
    }
    if (err instanceof ConfigValidationError) {
      console.error(err.message);
      process.exit(1);
    }
    throw err;
  }
}