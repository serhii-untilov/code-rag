import { ingestRepository } from "../src/ingestion/ingest.js";
import { resolveConfigOrDie } from "../src/config/loader.js";

async function main() {
  const repoPath = process.argv[2];
  if (!repoPath) {
    console.error("Usage: tsx scripts/ingest-repo.ts <repo-path>");
    console.error("Note: Prefer 'npx code-rag ingest --path <repo-path>' instead.");
    process.exit(1);
  }

  const config = resolveConfigOrDie();

  const result = await ingestRepository({
    repoPath,
    embedConfig: {
      provider: config.embed.provider,
      modelName: config.embed.modelName,
      baseUrl: config.embed.baseUrl,
      dimensions: config.embed.dimensions,
    },
    qdrantUrl: config.qdrant.url,
    collectionName: config.qdrant.collection,
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error("Ingestion failed:", err);
  process.exit(1);
});