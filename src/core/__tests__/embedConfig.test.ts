import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveConfig } from "../embedConfig.js";
import { getProviderDefaults, DEFAULT_CONFIG } from "../../config/defaults.js";
import { applyProviderDefaults } from "../../config/loader.js";

describe("resolveConfig (partial-driven path)", () => {
  it("returns localhost baseUrl for lmstudio default provider", () => {
    const result = resolveConfig();
    assert.equal(result.provider, "lmstudio");
    assert.equal(result.baseUrl, "http://localhost:1234/v1");
  });

  it("matches getProviderDefaults('lmstudio') (single-source-of-truth parity)", () => {
    const result = resolveConfig();
    const defaults = getProviderDefaults("lmstudio");
    assert.equal(result.modelName, defaults.modelName);
    assert.equal(result.baseUrl, defaults.baseUrl);
    assert.equal(result.dimensions, defaults.dimensions);
    assert.equal(result.collection, defaults.collection);
  });

  it("matches getProviderDefaults('ollama') when provider is ollama", () => {
    const result = resolveConfig({ provider: "ollama" });
    const defaults = getProviderDefaults("ollama");
    assert.equal(result.baseUrl, defaults.baseUrl);
    assert.equal(result.modelName, defaults.modelName);
    assert.equal(result.dimensions, defaults.dimensions);
  });

  it("no resolved default baseUrl contains the legacy LAN IP", () => {
    const legacyIp = "192.168.1.136";
    assert.ok(!resolveConfig().baseUrl.includes(legacyIp));
    assert.ok(!resolveConfig({ provider: "ollama" }).baseUrl.includes(legacyIp));
  });
});

describe("ingest vs config loader parity", () => {
  it("ingestRepository's no-config resolution matches loadConfig's provider-default resolution", () => {
    const ingestResolved = resolveConfig();
    const configResolved = applyProviderDefaults(DEFAULT_CONFIG);
    assert.equal(ingestResolved.baseUrl, configResolved.embed.baseUrl);
    assert.equal(ingestResolved.modelName, configResolved.embed.modelName);
    assert.equal(ingestResolved.dimensions, configResolved.embed.dimensions);
    assert.equal(ingestResolved.provider, configResolved.embed.provider);
  });
});