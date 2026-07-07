import { resolveConfigOrDie, type Config } from "../../config/index.js";
import { ingestRepository, type IngestDeps, type IngestResult } from "../../ingestion/ingest.js";
import { resolveConfig } from "../../core/embedConfig.js";
import { ensureQdrantRunning } from "../qdrantAutostart.js";

export interface IngestActionDeps {
  ingest?: typeof ingestRepository;
  ensureQdrant?: typeof ensureQdrantRunning;
}

export async function runIngestAction(
  options: { path?: string; provider?: string },
  config: Config,
  actionDeps?: IngestActionDeps,
  ingestDeps?: IngestDeps,
): Promise<IngestResult> {
  const ingestFn = actionDeps?.ingest ?? ingestRepository;
  const ensureQdrant = actionDeps?.ensureQdrant ?? ensureQdrantRunning;

  await ensureQdrant(config.qdrant.url);

  const repoPath = options.path ?? config.ingest.repoPath ?? process.cwd();
  const embedConfig = resolveConfig({
    ...(options.provider ? { provider: options.provider as "ollama" | "lmstudio" } : {}),
    provider: config.embed.provider,
    modelName: config.embed.modelName,
    baseUrl: config.embed.baseUrl,
    dimensions: config.embed.dimensions,
    collection: config.qdrant.collection,
  });

  return ingestFn({
    repoPath,
    embedConfig: {
      provider: embedConfig.provider,
      modelName: embedConfig.modelName,
      baseUrl: embedConfig.baseUrl,
      dimensions: embedConfig.dimensions,
    },
    qdrantUrl: config.qdrant.url,
    collectionName: config.qdrant.collection,
  }, ingestDeps);
}

export function registerIngestCommand(program: any): void {
  program
    .command("ingest")
    .description("Ingest a repository into the vector database")
    .option("-p, --path <path>", "Repository path (overrides config)")
    .option("--provider <provider>", "Embedding provider (ollama|lmstudio)")
    .action(async (options: { path?: string; provider?: string }) => {
      const config: Config = resolveConfigOrDie();
      try {
        const result = await runIngestAction(options, config);
        console.log(JSON.stringify(result, null, 2));
      } catch (err) {
        console.error("Ingestion failed:", err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
    });
}