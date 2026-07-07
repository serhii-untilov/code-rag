import { z } from "zod";

export const embedProviderSchema = z.enum(["ollama", "lmstudio"]);

export const embedConfigSchema = z.object({
  provider: embedProviderSchema.default("lmstudio"),
  modelName: z.string().optional(),
  baseUrl: z.string().optional(),
  dimensions: z.number().int().positive().optional(),
});

export const qdrantConfigSchema = z.object({
  url: z.string().default("http://localhost:6333"),
  collection: z.string().default("code_rag"),
});

export const ingestConfigSchema = z.object({
  repoPath: z.string().optional(),
  excludedDirs: z.array(z.string()).default(["node_modules", ".git", "dist", "build", "coverage"]),
  supportedExtensions: z.array(z.string()).default([".ts", ".tsx", ".js", ".jsx", ".py"]),
});

export const serverConfigSchema = z.object({
  transport: z.enum(["stdio"]).default("stdio"),
});

export const configSchema = z.object({
  embed: embedConfigSchema.default({}),
  qdrant: qdrantConfigSchema.default({}),
  ingest: ingestConfigSchema.default({}),
  server: serverConfigSchema.default({}),
});

export type EmbedConfigSchema = z.infer<typeof embedConfigSchema>;
export type QdrantConfigSchema = z.infer<typeof qdrantConfigSchema>;
export type IngestConfigSchema = z.infer<typeof ingestConfigSchema>;
export type ServerConfigSchema = z.infer<typeof serverConfigSchema>;
export type Config = z.infer<typeof configSchema>;