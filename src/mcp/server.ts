import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { searchCodebase } from "../core/retriever.js";
import { ingestRepository } from "../ingestion/ingest.js";
import { resolveConfig } from "../core/embedConfig.js";
import { ensureCollection, createClient } from "../core/qdrant.js";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "code-rag",
    version: "0.1.0",
  });

  server.tool(
    "search_codebase",
    "Search the indexed codebase for relevant code units using semantic search",
    {
      query: z.string().describe("Natural language search query"),
      tags: z.array(z.string()).optional().describe("Filter by tags (e.g., api, service, auth)"),
      type: z.string().optional().describe("Filter by code unit type (function, method, class, module, dto)"),
      topK: z.number().optional().default(5).describe("Maximum number of results (1-20)"),
      minScore: z.number().optional().describe("Minimum similarity score threshold (0-1)"),
    },
    async (params) => {
      try {
        const embedConfig = resolveConfig();
        const results = await searchCodebase({
          query: params.query,
          tags: params.tags,
          type: params.type,
          topK: params.topK,
          minScore: params.minScore,
          embedConfig,
        });

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ results }, null, 2),
            },
          ],
        };
      } catch (err) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                error: err instanceof Error ? err.message : String(err),
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.tool(
    "ingest_repository",
    "Ingest a repository into the vector database for semantic search",
    {
      path: z.string().describe("Absolute path to the repository directory"),
    },
    async (params) => {
      try {
        const fs = await import("node:fs");
        if (!fs.existsSync(params.path)) {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  error: `Path does not exist: ${params.path}`,
                }),
              },
            ],
            isError: true,
          };
        }

        const embedConfig = resolveConfig();
        const result = await ingestRepository({
          repoPath: params.path,
          embedConfig,
        });

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                ingested: result.totalCodeUnits,
                path: params.path,
                totalFiles: result.totalFiles,
                failedFiles: result.failedFiles.length,
              }),
            },
          ],
        };
      } catch (err) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                error: err instanceof Error ? err.message : String(err),
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  return server;
}

export async function startServer(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("RAG MCP Server running on stdio");
}