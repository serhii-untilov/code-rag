import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { OLLAMA_DEFAULTS, LMSTUDIO_DEFAULTS } from "../defaults.js";

describe("provider defaults", () => {
  it("LM Studio default baseUrl is localhost (not LAN IP)", () => {
    assert.equal(LMSTUDIO_DEFAULTS.baseUrl, "http://localhost:1234/v1");
  });

  it("Ollama default baseUrl is localhost", () => {
    assert.equal(OLLAMA_DEFAULTS.baseUrl, "http://localhost:11434");
  });

  it("no default URL contains the legacy LAN IP 192.168.1.136", () => {
    const legacyIp = "192.168.1.136";
    const allUrls = [OLLAMA_DEFAULTS.baseUrl, LMSTUDIO_DEFAULTS.baseUrl];
    for (const url of allUrls) {
      assert.ok(!url.includes(legacyIp), `default URL still references legacy IP: ${url}`);
    }
  });

  it("all default URLs resolve to localhost", () => {
    for (const url of [OLLAMA_DEFAULTS.baseUrl, LMSTUDIO_DEFAULTS.baseUrl]) {
      assert.ok(url.startsWith("http://localhost:"), `expected localhost URL, got ${url}`);
    }
  });
});