import { ingestRepository } from "../src/ingestion/ingest.js";
import { resolveConfig } from "../src/core/embedConfig.js";

async function main() {
  const repoPath = process.argv[2];
  if (!repoPath) {
    console.error("Usage: tsx scripts/ingest-repo.ts <repo-path> [--provider ollama|lmstudio] [--model <name>] [--base-url <url>]");
    process.exit(1);
  }

  const args = process.argv.slice(3);
  const provider = getArg(args, "--provider") as "ollama" | "lmstudio" | undefined;
  const modelName = getArg(args, "--model");
  const baseUrl = getArg(args, "--base-url");

  const result = await ingestRepository({
    repoPath,
    embedConfig: {
      ...(provider ? { provider } : {}),
      ...(modelName ? { modelName } : {}),
      ...(baseUrl ? { baseUrl } : {}),
    },
  });

  console.log(JSON.stringify(result, null, 2));
}

function getArg(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag);
  if (idx === -1 || idx + 1 >= args.length) return undefined;
  return args[idx + 1];
}

main().catch((err) => {
  console.error("Ingestion failed:", err);
  process.exit(1);
});