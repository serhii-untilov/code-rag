import { describe, it } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { maybeAddNpmScripts, detectIndent } from "../commands/init.js";

describe("maybeAddNpmScripts", () => {
  it("adds both scripts when package.json has no scripts", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "code-rag-init-"));
    fs.writeFileSync(
      path.join(tmpDir, "package.json"),
      JSON.stringify({ name: "test-pkg" }, null, 2) + "\n",
    );
    maybeAddNpmScripts(tmpDir);
    const updated = JSON.parse(fs.readFileSync(path.join(tmpDir, "package.json"), "utf-8"));
    assert.equal(updated.scripts["rag:ingest"], "npx code-rag ingest");
    assert.equal(updated.scripts["rag:start"], "npx code-rag start");
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("preserves existing scripts and only adds missing ones", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "code-rag-preserve-"));
    fs.writeFileSync(
      path.join(tmpDir, "package.json"),
      JSON.stringify({
        name: "test-pkg",
        scripts: { "rag:ingest": "custom-ingest", build: "tsc" },
      }, null, 2) + "\n",
    );
    maybeAddNpmScripts(tmpDir);
    const updated = JSON.parse(fs.readFileSync(path.join(tmpDir, "package.json"), "utf-8"));
    assert.equal(updated.scripts["rag:ingest"], "custom-ingest");
    assert.equal(updated.scripts["rag:start"], "npx code-rag start");
    assert.equal(updated.scripts.build, "tsc");
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("handles missing package.json gracefully", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "code-rag-missing-"));
    maybeAddNpmScripts(tmpDir);
    assert.equal(fs.existsSync(path.join(tmpDir, "package.json")), false);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("handles invalid JSON in package.json gracefully", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "code-rag-invalid-"));
    fs.writeFileSync(path.join(tmpDir, "package.json"), "{ invalid json");
    maybeAddNpmScripts(tmpDir);
    assert.equal(fs.readFileSync(path.join(tmpDir, "package.json"), "utf-8"), "{ invalid json");
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});

describe("detectIndent", () => {
  it("detects 2-space indentation", () => {
    assert.equal(detectIndent('{\n  "name": "x"\n}'), 2);
  });

  it("detects 4-space indentation", () => {
    assert.equal(detectIndent('{\n    "name": "x"\n}'), 4);
  });

  it("defaults to 2 when no match", () => {
    assert.equal(detectIndent('{}'), 2);
  });
});

describe("maybeAddNpmScripts indentation preservation", () => {
  it("preserves 4-space indentation on write-back", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "code-rag-indent-"));
    const raw = JSON.stringify({ name: "test-pkg", scripts: {} }, null, 4) + "\n";
    fs.writeFileSync(path.join(tmpDir, "package.json"), raw);
    maybeAddNpmScripts(tmpDir);
    const written = fs.readFileSync(path.join(tmpDir, "package.json"), "utf-8");
    assert.match(written, /^    "scripts":/m, "top-level keys should use 4-space indent");
    assert.doesNotMatch(written, /^  "[a-z]/m, "no top-level keys should use 2-space indent");
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});