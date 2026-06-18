import { EmbedConfig } from "./embedConfig.js";

export interface EmbedResult {
  embedding: number[];
}

export async function embed(text: string, config: EmbedConfig): Promise<number[]> {
  if (config.provider === "ollama") {
    return embedOllama(text, config);
  }
  return embedLmStudio(text, config);
}

async function embedOllama(text: string, config: EmbedConfig): Promise<number[]> {
  const url = `${config.baseUrl}/api/embeddings`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: config.modelName, prompt: text }),
    });
  } catch (err) {
    throw new EmbedProviderError(
      `Ollama`,
      url,
      `Failed to connect to Ollama at ${url}. ` +
        `Make sure Ollama is running: "ollama serve" and the model is pulled: "ollama pull ${config.modelName}". ` +
        `Alternatively, configure LM Studio as the embedding provider.`,
      err,
    );
  }

  if (!response.ok) {
    const body = await response.text();
    throw new EmbedProviderError(
      `Ollama`,
      url,
      `Ollama returned ${response.status}: ${body}. ` +
        `Make sure the model "${config.modelName}" is pulled: "ollama pull ${config.modelName}". ` +
        `Alternatively, configure LM Studio as the embedding provider.`,
    );
  }

  const data = (await response.json()) as { embedding: number[] };
  return data.embedding;
}

async function embedLmStudio(text: string, config: EmbedConfig): Promise<number[]> {
  const baseUrl = config.baseUrl.replace(/\/+$/, "");
  const url = `${baseUrl}/embeddings`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: config.modelName,
        input: text,
      }),
    });
  } catch (err) {
    throw new EmbedProviderError(
      `LM Studio`,
      url,
      `Failed to connect to LM Studio at ${url}. ` +
        `Make sure LM Studio is running with an embedding model loaded and the server started. ` +
        `Alternatively, configure Ollama as the embedding provider.`,
      err,
    );
  }

  if (!response.ok) {
    const body = await response.text();
    throw new EmbedProviderError(
      `LM Studio`,
      url,
      `LM Studio returned ${response.status}: ${body}. ` +
        `Make sure an embedding model is loaded in LM Studio. ` +
        `Alternatively, configure Ollama as the embedding provider.`,
    );
  }

  const data = (await response.json()) as {
    data?: Array<{ embedding?: number[] }>;
    embedding?: number[];
  };

  if (data.data && Array.isArray(data.data) && data.data.length > 0 && data.data[0].embedding) {
    return data.data[0].embedding;
  }

  if (data.embedding && Array.isArray(data.embedding)) {
    return data.embedding;
  }

  throw new EmbedProviderError(
    `LM Studio`,
    url,
    `LM Studio returned an unexpected response format: ${JSON.stringify(data).slice(0, 500)}. ` +
      `Make sure an embedding model is loaded in LM Studio.`,
  );
}

export async function embedBatch(texts: string[], config: EmbedConfig): Promise<number[][]> {
  const results: number[][] = [];
  for (const text of texts) {
    const embedding = await embed(text, config);
    results.push(embedding);
  }
  return results;
}

export class EmbedProviderError extends Error {
  public readonly provider: string;
  public readonly endpoint: string;

  constructor(provider: string, endpoint: string, message: string, cause?: unknown) {
    super(message);
    this.name = "EmbedProviderError";
    this.provider = provider;
    this.endpoint = endpoint;
    if (cause instanceof Error) {
      this.cause = cause;
    }
  }
}