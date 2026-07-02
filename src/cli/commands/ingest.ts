import { resolveConfigOrDie, type Config } from "../../config/index.js";
import { ingestRepository } from "../../ingestion/ingest.js";
import { resolveConfig } from "../../core/embedConfig.js";

export function registerIngestCommand(program: any): void {
  program
    .command("ingest")
    .description("Ingest a repository into the vector database")
    .option("-p, --path <path>", "Repository path (overrides config)")
    .option("--provider <provider>", "Embedding provider (ollama|lmstudio)")
    .action(async (options: { path?: string; provider?: string }) => {
      const config: Config = resolveConfigOrDie();

      const repoPath = options.path ?? config.ingest.repoPath ?? process.cwd();
      const embedConfig = resolveConfig({
        ...(options.provider ? { provider: options.provider as "ollama" | "lmstudio" } : {}),
        provider: config.embed.provider,
        modelName: config.embed.modelName,
        baseUrl: config.embed.baseUrl,
        dimensions: config.embed.dimensions,
        collection: config.qdrant.collection,
      });

      try {
        const result = await ingestRepository({
          repoPath,
          embedConfig: {
            provider: embedConfig.provider,
            modelName: embedConfig.modelName,
            baseUrl: embedConfig.baseUrl,
            dimensions: embedConfig.dimensions,
          },
          qdrantUrl: config.qdrant.url,
        });
        console.log(JSON.stringify(result, null, 2));
      } catch (err) {
        console.error("Ingestion failed:", err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
    });
}