import { describe, it, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

const { ingestRepository } = await import("../ingest.js");

function makeDeps() {
  const ensureCollectionCalls: any[] = [];
  const upsertCalls: any[] = [];
  const deps = {
    createClient: async () => ({
      upsert: async (collectionName: string, body: any) => { upsertCalls.push({ collectionName, body }); return { operation_id: 0, status: "completed" }; },
    }),
    ensureCollection: async (_client: any, _dimensions: number, collectionName: string) => { ensureCollectionCalls.push({ collectionName }); },
    embedBatch: async () => [[0.1]],
    chunkFile: () => [{ id: "1", symbol: "foo", type: "function" as const, language: "ts" as const, filePath: "sample.ts", content: "export function foo(): void {}\n" }],
  };
  return { deps, ensureCollectionCalls, upsertCalls };
}

describe("ingestRepository collection name", () => {
  let tmpDir: string;
  let logSpy: ReturnType<typeof mock.method>;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "code-rag-ingest-"));
    fs.writeFileSync(path.join(tmpDir, "sample.ts"), "export function foo(): void {}\n");
    logSpy = mock.method(console, "log");
  });

  afterEach(() => {
    logSpy.mock.restore();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("log shows the passed collectionName, never undefined", async () => {
    const { deps, ensureCollectionCalls, upsertCalls } = makeDeps();
    await ingestRepository({
      repoPath: tmpDir,
      collectionName: "payroll-smb",
      qdrantUrl: "http://localhost:6333",
      embedConfig: { provider: "lmstudio", modelName: "m", baseUrl: "http://localhost:1234/v1", dimensions: 768 },
    }, deps);
    const foundLine = logSpy.mock.calls.map((c) => c.arguments[0]).find((s) => String(s).includes("Found ")) as string;
    assert.match(foundLine, /"payroll-smb"/, 'log should name the "payroll-smb" collection');
    assert.doesNotMatch(foundLine, /undefined/);
    assert.equal(ensureCollectionCalls[0].collectionName, "payroll-smb");
    assert.equal(upsertCalls[0].collectionName, "payroll-smb");
  });

  it("log shows code_rag fallback when collectionName omitted", async () => {
    const { deps, ensureCollectionCalls } = makeDeps();
    await ingestRepository({
      repoPath: tmpDir,
      qdrantUrl: "http://localhost:6333",
      embedConfig: { provider: "lmstudio", modelName: "m", baseUrl: "http://localhost:1234/v1", dimensions: 768 },
    }, deps);
    const foundLine = logSpy.mock.calls.map((c) => c.arguments[0]).find((s) => String(s).includes("Found ")) as string;
    assert.match(foundLine, /"code_rag"/, "log should name the code_rag fallback");
    assert.doesNotMatch(foundLine, /undefined/);
    assert.equal(ensureCollectionCalls[0].collectionName, "code_rag");
  });
});