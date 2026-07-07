import { describe, it } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { ensureQdrantRunning, findComposeFile } from "../qdrantAutostart.js";

const QDRANT_URL = "http://localhost:6333";

describe("ensureQdrantRunning", () => {
  it("no-op when Qdrant already healthy", async () => {
    let composeInvoked = false;
    await ensureQdrantRunning(QDRANT_URL, "/irrelevant", {
      healthCheck: async () => true,
      runCompose: async () => { composeInvoked = true; },
    });
    assert.equal(composeInvoked, false);
  });

  it("warns and returns when no compose file", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "code-rag-no-compose-"));
    let composeInvoked = false;
    await ensureQdrantRunning(QDRANT_URL, "", {
      healthCheck: async () => false,
      runCompose: async () => { composeInvoked = true; },
      packageDir: tmpDir,
    });
    assert.equal(composeInvoked, false);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("invokes docker compose up -d when compose file exists", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "code-rag-compose-"));
    fs.writeFileSync(path.join(tmpDir, "docker-compose.yml"), "services:\n  qdrant:\n    image: qdrant/qdrant\n");
    let composeInvoked = false;
    let healthCallCount = 0;
    await ensureQdrantRunning(QDRANT_URL, "", {
      healthCheck: async () => { healthCallCount++; return healthCallCount > 1; },
      runCompose: async () => { composeInvoked = true; },
      packageDir: tmpDir,
    });
    assert.equal(composeInvoked, true);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("warns and returns when docker compose fails", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "code-rag-fail-"));
    fs.writeFileSync(path.join(tmpDir, "docker-compose.yml"), "services:\n  qdrant:\n    image: qdrant/qdrant\n");
    let pollAfterCompose = 0;
    await ensureQdrantRunning(QDRANT_URL, "", {
      healthCheck: async () => { pollAfterCompose++; return false; },
      runCompose: async () => { throw new Error("docker not found"); },
      pollIntervalMs: 1,
      pollMaxAttempts: 2,
      packageDir: tmpDir,
    });
    assert.equal(pollAfterCompose, 1);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});

describe("findComposeFile", () => {
  it("finds docker-compose.yml", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "code-rag-find-"));
    fs.writeFileSync(path.join(tmpDir, "docker-compose.yml"), "");
    const result = findComposeFile(tmpDir);
    assert.ok(result);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns null when no compose file", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "code-rag-none-"));
    assert.equal(findComposeFile(tmpDir), null);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});