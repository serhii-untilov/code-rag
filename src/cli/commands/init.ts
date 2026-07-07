import * as fs from "node:fs";
import * as path from "node:path";
import { DEFAULT_CONFIG, getProviderDefaults } from "../../config/index.js";

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
  const embedDefaults = getProviderDefaults(DEFAULT_CONFIG.embed.provider);
  return `{
  // Code-RAG configuration
  // Run "npx code-rag init" to regenerate defaults
  "embed": {
    // Embedding provider: "ollama" or "lmstudio"
    "provider": "${DEFAULT_CONFIG.embed.provider}",
    // Model name for the embedding provider
    "modelName": "${embedDefaults.modelName}",
    // Base URL for the embedding provider API
    "baseUrl": "${embedDefaults.baseUrl}",
    // Vector dimensions for the embedding model
    "dimensions": ${embedDefaults.dimensions}
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

const NPM_SCRIPTS_TO_ADD: Record<string, string> = {
  "rag:ingest": "npx code-rag ingest",
  "rag:start": "npx code-rag start",
};

export function detectIndent(raw: string): number {
  const match = raw.match(/^(\s+)"/m);
  if (match) {
    return match[1].length;
  }
  return 2;
}

export function maybeAddNpmScripts(projectRoot: string = process.cwd()): void {
  const pkgPath = path.join(projectRoot, "package.json");

  let raw: string;
  try {
    raw = fs.readFileSync(pkgPath, "utf-8");
  } catch {
    console.warn(`[code-rag] No package.json found in ${projectRoot}. Skipping npm scripts injection.`);
    return;
  }

  let pkg: any;
  try {
    pkg = JSON.parse(raw);
  } catch {
    console.warn(`[code-rag] Failed to parse ${pkgPath}. Skipping npm scripts injection.`);
    return;
  }

  const indent = detectIndent(raw);
  const existingScripts: Record<string, string> = pkg.scripts ?? {};
  pkg.scripts = { ...existingScripts };

  const added: string[] = [];
  const skipped: string[] = [];

  for (const [key, value] of Object.entries(NPM_SCRIPTS_TO_ADD)) {
    if (key in existingScripts) {
      skipped.push(key);
    } else {
      pkg.scripts[key] = value;
      added.push(key);
    }
  }

  if (added.length > 0) {
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, indent) + "\n", "utf-8");
    console.log(`[code-rag] Added npm scripts to ${pkgPath}: ${added.join(", ")}`);
    if (skipped.length > 0) {
      console.log(`[code-rag] Skipped (already present): ${skipped.join(", ")}`);
    }
  } else {
    console.log(`[code-rag] All npm scripts already present in ${pkgPath}.`);
  }
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

      maybeAddNpmScripts();
    });
}