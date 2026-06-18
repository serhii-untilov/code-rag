import * as fs from "node:fs";
import * as path from "node:path";
import { DEFAULT_CONFIG } from "../../config/index.js";

const CONFIG_FILENAME = ".code-rag.jsonc";

function getProjectName(): string {
  const pkgPath = path.join(process.cwd(), "package.json");
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      if (pkg.name) return pkg.name;
    } catch {}
  }
  return DEFAULT_CONFIG.qdrant.collection;
}

function generateConfigContent(): string {
  return `{
  // Code-RAG configuration
  // Run "npx code-rag init" to regenerate defaults
  "embed": {
    // Embedding provider: "ollama" or "lmstudio"
    "provider": "${DEFAULT_CONFIG.embed.provider}",
    // Model name for the embedding provider
    "modelName": "${DEFAULT_CONFIG.embed.modelName}",
    // Base URL for the embedding provider API
    "baseUrl": "${DEFAULT_CONFIG.embed.baseUrl}",
    // Vector dimensions for the embedding model
    "dimensions": ${DEFAULT_CONFIG.embed.dimensions}
  },
  "qdrant": {
    // Qdrant server URL
    "url": "${DEFAULT_CONFIG.qdrant.url}",
    // Collection name for storing code units
    "collection": "${getProjectName()}"
  },
  "ingest": {
    // Repository path to ingest (defaults to current directory)
    // "repoPath": ".",
    // Directories to exclude from indexing
    "excludedDirs": ${JSON.stringify(DEFAULT_CONFIG.ingest.excludedDirs, null, 4).replace(/\n/g, "\n    ")},
    // File extensions to index
    "supportedExtensions": ${JSON.stringify(DEFAULT_CONFIG.ingest.supportedExtensions, null, 4).replace(/\n/g, "\n    ")}
  },
  "server": {
    // MCP server transport: "stdio"
    "transport": "${DEFAULT_CONFIG.server.transport}"
  }
}`;
}

export function registerInitCommand(program: any): void {
  program
    .command("init")
    .description("Create a .code-rag.jsonc config file with defaults")
    .option("--force", "Overwrite existing config file")
    .action((options: { force?: boolean }) => {
      const configPath = path.join(process.cwd(), CONFIG_FILENAME);

      if (fs.existsSync(configPath) && !options.force) {
        console.error(`Configuration file already exists: ${configPath}`);
        console.error("Use --force to overwrite.");
        process.exit(1);
      }

      const content = generateConfigContent();
      fs.writeFileSync(configPath, content, "utf-8");
      console.log(`Created configuration file: ${configPath}`);
    });
}