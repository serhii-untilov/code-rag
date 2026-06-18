import * as fs from 'node:fs';
import * as path from 'node:path';
import { QdrantClient } from '@qdrant/js-client-rest';
import { chunkFile, EXCLUDED_DIRS, SUPPORTED_EXTENSIONS } from '../chunking/tsChunker.js';
import { CodeUnit } from '../model/codeUnit.js';
import { embed, embedBatch } from '../core/embed.js';
import { EmbedConfig, resolveConfig } from '../core/embedConfig.js';
import { createClient, ensureCollection, COLLECTION_NAME } from '../core/qdrant.js';
import { v5 as uuidv5 } from 'uuid';

const NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

export interface IngestOptions {
  repoPath: string;
  embedConfig?: Partial<EmbedConfig>;
  qdrantUrl?: string;
}

export interface IngestResult {
  totalCodeUnits: number;
  totalFiles: number;
  failedFiles: Array<{ file: string; error: string }>;
}

export async function ingestRepository(options: IngestOptions): Promise<IngestResult> {
  const config = resolveConfig(options.embedConfig);
  const qdrantUrl = options.qdrantUrl ?? 'http://localhost:6333';
  const repoPath = path.resolve(options.repoPath);

  const client = await createClient(qdrantUrl);
  await ensureCollection(client, config.dimensions);

  const files = scanRepository(repoPath);
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
        config
      );

      const points = units.map((unit, idx) => ({
        // id: unit.id,
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

      // Debug !!!
      // console.log('!!! Begin');
      // points.forEach((o) => console.log(o.vector.length));
      // console.log('!!! End');

      await client.upsert(COLLECTION_NAME, { points });
      totalCodeUnits += units.length;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      // console.error(`Error processing ${filePath}: ${errorMsg}`);
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

function scanRepository(repoPath: string): string[] {
  const files: string[] = [];

  function walk(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (EXCLUDED_DIRS.has(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (ext in SUPPORTED_EXTENSIONS) {
          files.push(fullPath);
        }
      }
    }
  }

  walk(repoPath);
  return files;
}
