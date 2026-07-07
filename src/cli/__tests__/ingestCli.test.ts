import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runIngestAction } from "../commands/ingest.js";
import type { Config } from "../../config/index.js";

const FAKE_CONFIG: Config = {
  embed: { provider: "lmstudio", modelName: "m", baseUrl: "http://localhost:1234/v1", dimensions: 768 },
  qdrant: { url: "http://localhost:6333", collection: "payroll-smb" },
  ingest: { excludedDirs: ["node_modules"], supportedExtensions: [".ts"] },
  server: { transport: "stdio" },
};

describe("CLI ingest action passes collectionName", () => {
  it("passes config.qdrant.collection as collectionName to ingestRepository", async () => {
    let receivedOptions: any = null;
    await runIngestAction({}, FAKE_CONFIG, {
      ingest: async (opts) => { receivedOptions = opts; return { totalCodeUnits: 0, totalFiles: 0, failedFiles: [] }; },
      ensureQdrant: async () => {},
    });
    assert.equal(receivedOptions.collectionName, "payroll-smb");
    assert.equal(receivedOptions.qdrantUrl, "http://localhost:6333");
  });
});