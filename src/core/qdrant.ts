import { QdrantClient } from "@qdrant/js-client-rest";
import { EmbedConfig } from "./embedConfig.js";

const COLLECTION_NAME = "code_rag";

export async function createClient(url: string = "http://localhost:6333"): Promise<QdrantClient> {
  return new QdrantClient({ url });
}

export async function ensureCollection(
  client: QdrantClient,
  dimensions: number,
): Promise<void> {
  const collections = await client.getCollections();
  const exists = collections.collections.some((c) => c.name === COLLECTION_NAME);

  if (exists) {
    const info = await client.getCollection(COLLECTION_NAME);
    const config = info.config?.params;
    const vectorSize = (config as { vectors?: { size?: number } })?.vectors?.size;
    if (vectorSize !== undefined && vectorSize !== dimensions) {
      throw new Error(
        `Dimension mismatch: collection "${COLLECTION_NAME}" has ${vectorSize} dimensions but configured model has ${dimensions}. ` +
          `Delete the collection or update the model configuration.`,
      );
    }
    return;
  }

  await client.createCollection(COLLECTION_NAME, {
    vectors: {
      size: dimensions,
      distance: "Cosine",
    },
  });
}

export async function healthCheck(client: QdrantClient): Promise<boolean> {
  try {
    await client.getCollections();
    return true;
  } catch {
    return false;
  }
}

export { COLLECTION_NAME };