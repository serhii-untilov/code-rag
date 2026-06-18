import { QdrantClient } from "@qdrant/js-client-rest";
import { embed } from "./embed.js";
import { EmbedConfig } from "./embedConfig.js";
import { createClient, COLLECTION_NAME } from "./qdrant.js";

export interface SearchOptions {
  query: string;
  tags?: string[];
  type?: string;
  topK?: number;
  minScore?: number;
  embedConfig: EmbedConfig;
  qdrantUrl?: string;
}

export interface SearchResult {
  file: string;
  symbol: string;
  content: string;
  score: number;
  type: string;
  language: string;
  tags: string[] | null;
}

export async function searchCodebase(options: SearchOptions): Promise<SearchResult[]> {
  const { query, tags, type, topK = 5, minScore, embedConfig } = options;
  const client: QdrantClient = await createClient(options.qdrantUrl ?? "http://localhost:6333");

  const queryVector = await embed(query, embedConfig);
  const clampedTopK = Math.min(Math.max(topK, 1), 20);
  const filter = buildQdrantFilter(tags, type);

  const results = await client.search(COLLECTION_NAME, {
    vector: queryVector,
    filter,
    limit: clampedTopK,
    with_payload: true,
  });

  let searchResults: SearchResult[] = results.map((point) => ({
    file: (point.payload as any).filePath ?? "",
    symbol: (point.payload as any).symbol ?? "",
    content: (point.payload as any).content ?? "",
    score: point.score ?? 0,
    type: (point.payload as any).type ?? "",
    language: (point.payload as any).language ?? "",
    tags: (point.payload as any).tags ?? null,
  }));

  if (minScore !== undefined) {
    searchResults = searchResults.filter((r) => r.score >= minScore);
  }

  return searchResults;
}

export function buildQdrantFilter(tags?: string[], type?: string): any {
  const must: any[] = [];

  if (type) {
    must.push({
      key: "type",
      match: { value: type },
    });
  }

  if (tags && tags.length > 0) {
    must.push({
      should: tags.map((tag) => ({
        key: "tags",
        match: { value: tag },
      })),
    });
  }

  if (must.length === 0) return undefined;

  return { must };
}