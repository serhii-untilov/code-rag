import * as fs from 'node:fs';
import * as path from 'node:path';
import { QdrantClient } from '@qdrant/js-client-rest';
import { chunkFile } from '../chunking/tsChunker.js';
import { CodeUnit } from '../model/codeUnit.js';
import { embedBatch } from '../core/embed.js';
import { EmbedConfig } from '../core/embedConfig.js';
import { createClient, ensureCollection } from '../core/qdrant.js';
import { v5 as uuidv5 } from 'uuid';
import type { Config } from '../config/schema.js';

const NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

const DEFAULT_EXCLUDED_DIRS = new Set(["node_modules", ".git", "dist", "build", "coverage"]);
const DEFAULT_SUPPORTED_EXTENSIONS: Record<string, string> = {
  ".ts": "ts", ".tsx": "ts", ".js": "js", ".jsx": "js", ".py": "py",
};

export interface IngestOptions {
  repoPath: string;
  embedConfig?: Partial<EmbedConfig>;
  qdrantUrl?: string;
  collectionName?: string;
  excludedDirs?: Set<string>;
  supportedExtensions?: Record<string, string>;
}

export interface IngestResult {
  totalCodeUnits: number;
  totalFiles: number;
  failedFiles: Array<{ file: string; error: string }>;
}

export async function ingestRepository(options: IngestOptions): Promise<IngestResult> {
  const config = options.embedConfig ?? {};
  const provider = config.provider ?? "lmstudio";
  const defaults = provider === "ollama"
    ? { modelName: "nomic-embed-text", baseUrl: "http://localhost:11434", dimensions: 768 }
    : { modelName: "text-embedding-nomic-embed-text-v1.5", baseUrl: "http://192.168.1.136:1234/v1", dimensions: 768 };

  const embedConfigResolved: EmbedConfig = {
    provider,
    modelName: config.modelName ?? defaults.modelName,
    baseUrl: config.baseUrl ?? defaults.baseUrl,
    dimensions: config.dimensions ?? defaults.dimensions,
  };

  const qdrantUrl = options.qdrantUrl ?? 'http://localhost:6333';
  const collectionName = options.collectionName ?? 'code_rag';
  const excludedDirs = options.excludedDirs ?? DEFAULT_EXCLUDED_DIRS;
  const supportedExtensions = options.supportedExtensions ?? DEFAULT_SUPPORTED_EXTENSIONS;
  const repoPath = path.resolve(options.repoPath);

  const client = await createClient(qdrantUrl);
  await ensureCollection(client, embedConfigResolved.dimensions, collectionName);

  const files = scanRepository(repoPath, excludedDirs, supportedExtensions);
  const failedFiles: Array<{ file: string; error: string }> = [];
  let totalCodeUnits = 0;

  console.log(`Found ${files.length} files to process`);

  for (let i = 0; i < files.length; i++) {
    const filePath = files[i];
    console.log(`[${i + 1}/${files.length}] Processing: ${filePath}`);

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const relativePath = path.relative(repoPath, filePath);
      const units = chunkFile(relativePath, content);

      const embeddings = await embedBatch(
        units.map((u) => u.content),
        embedConfigResolved
      );

      const points = units.map((unit, idx) => ({
        id: uuidv5(`${unit.filePath}:${unit.symbol}:${unit.type}:${unit.content}`, NAMESPACE),
        vector: embeddings[idx],
        payload: {
          symbol: unit.symbol,
          type: unit.type,
          language: unit.language,
          filePath: unit.filePath,
          content: unit.content,
          imports: unit.imports ?? null,
          exports: unit.exports ?? null,
          tags: unit.tags ?? null
        }
      }));

      await client.upsert(collectionName, { points });
      totalCodeUnits += units.length;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(err);
      failedFiles.push({ file: filePath, error: errorMsg });
    }
  }

  const result: IngestResult = {
    totalCodeUnits,
    totalFiles: files.length,
    failedFiles
  };

  console.log(
    `Ingestion complete: ${totalCodeUnits} CodeUnits from ${files.length} files (${failedFiles.length} failures)`
  );
  return result;
}

function scanRepository(repoPath: string, excludedDirs: Set<string>, supportedExtensions: Record<string, string>): string[] {
  const files: string[] = [];

  function walk(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (excludedDirs.has(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (ext in supportedExtensions) {
          files.push(fullPath);
        }
      }
    }
  }

  walk(repoPath);
  return files;
}

export function ingestRepositoryFromConfig(config: Config): Promise<IngestResult> {
  const excludedDirs = new Set(config.ingest.excludedDirs);
  const supportedExtensions: Record<string, string> = {};
  const extMap: Record<string, string> = {
    ".ts": "ts", ".tsx": "ts", ".js": "js", ".jsx": "js", ".py": "py",
  };
  for (const ext of config.ingest.supportedExtensions) {
    supportedExtensions[ext] = extMap[ext] ?? "unknown";
  }

  return ingestRepository({
    repoPath: config.ingest.repoPath ?? process.cwd(),
    qdrantUrl: config.qdrant.url,
    collectionName: config.qdrant.collection,
    excludedDirs,
    supportedExtensions,
  });
}