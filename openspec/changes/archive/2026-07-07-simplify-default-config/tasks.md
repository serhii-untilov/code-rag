## 1. Consolidate provider defaults (single source of truth)

- [x] 1.1 In `src/config/defaults.ts`, update `LMSTUDIO_DEFAULTS.baseUrl` from `http://192.168.1.136:1234/v1` to `http://localhost:1234/v1` (OLLAMA_DEFAULTS already uses localhost).  *(Already localhost in defaults.ts — no change needed.)*
- [x] 1.2 Simplify `DEFAULT_CONFIG` in `src/config/defaults.ts` so `embed` only carries the default `provider` (`lmstudio`); remove the manual `LMSTUDIO_DEFAULTS.*` spreads since `applyProviderDefaults` fills them at load time.
- [x] 1.3 Confirm `OLLAMA_DEFAULTS` and `LMSTUDIO_DEFAULTS` are exported and reusable from `defaults.ts`.  *(Exported at `export { OLLAMA_DEFAULTS, LMSTUDIO_DEFAULTS };` and re-exported via `src/config/index.ts`.)*

## 2. Remove duplicate defaults from embedding layer

- [x] 2.1 In `src/core/embedConfig.ts`, delete the local `OLLAMA_DEFAULTS` and `LMSTUDIO_DEFAULTS` constant definitions.
- [x] 2.2 Import `OLLAMA_DEFAULTS` and `LMSTUDIO_DEFAULTS` from `../config/defaults.js` and use them in the `partial`-driven branch of `resolveConfig`.  *(Used `getProviderDefaults(provider)` instead of branching on the imported constants — cleaner single-source call.)*
- [x] 2.3 Verify the `config`-driven branch of `resolveConfig` still uses `getProviderDefaults` (no behavior change).

## 3. Remove inline LM Studio literal from ingestion

- [x] 3.1 In `src/ingestion/ingest.ts`, replace the inline `provider === "ollama" ? {...} : {baseUrl: "http://192.168.1.136:1234/v1"}` ternary with a lookup against the imported provider defaults from `defaults.ts` (or via `resolveConfig`/`getProviderDefaults`).  *(Replaced with `resolveEmbedConfig(options.embedConfig)` which routes through `getProviderDefaults`.)*
- [x] 3.2 Ensure `ingestRepository` with no `embedConfig` produces the same resolved config shape as `loadConfig()` for the default provider.  *(Both now flow through `getProviderDefaults` from `defaults.ts`.)*

## 4. Update docs and build files

- [x] 4.1 In `README.md`, replace both occurrences of `http://192.168.1.136:1234/v1` with `http://localhost:1234/v1` (example config block and docs section).
- [x] 4.2 In `Makefile`, update `BASE_URL := http://192.168.1.136:1234/v1` to `http://localhost:1234/v1`.
- [x] 4.3 Update the `npx code-rag init` template (if it emits a baseUrl) to use `localhost`.  *(init.ts now pulls embed fields from `getProviderDefaults(DEFAULT_CONFIG.embed.provider)` which returns `localhost`.)*

## 5. Update existing spec to match new defaults

- [x] 5.1 In `openspec/specs/config-file/spec.md`, update the "Config default values" requirement to reference `http://localhost:1234/v1` and note that provider defaults derive from a single source of truth. (Note: the change-delta already lives at `openspec/changes/simplify-default-config/specs/config-file/spec.md`; this task archives it during the apply step — no manual edit needed unless archiving is manual.)

## 6. Tests

- [x] 6.1 Add a test in `src/config/__tests__/loader.test.ts` (or a new `defaults.test.ts`) asserting `LMSTUDIO_DEFAULTS.baseUrl === "http://localhost:1234/v1"` and that no default contains `192.168.1.136`.  *(Added `src/config/__tests__/defaults.test.ts`.)*
- [x] 6.2 Add a test asserting the `resolveConfig` partial-driven path in `src/core/embedConfig.ts` returns `localhost:1234/v1` for `lmstudio` and that it equals `getProviderDefaults("lmstudio").baseUrl` (single-source-of-truth parity).  *(Added `src/core/__tests__/embedConfig.test.ts`.)*
- [x] 6.3 Add a test asserting `ingestRepository` resolves the same LM Studio baseUrl as the config loader when no `embedConfig` is supplied.  *(Added "ingest vs config loader parity" test verifying `resolveConfig()` === `applyProviderDefaults(DEFAULT_CONFIG).embed` for baseUrl/modelName/dimensions/provider.)*
- [x] 6.4 Run `npm test` (or existing test command) and ensure all tests pass.  *(20/20 pass via `npx tsx --test`; no `npm test` script exists — used tsx runner.)*
- [x] 6.5 Run the lint/typecheck command (e.g. `npm run lint` / `npm run typecheck`) and ensure clean.  *(No lint/typecheck script; `npm run build` (tsc) compiles clean as the typecheck.)*

## 7. Verification

- [x] 7.1 Grep the repo for `192.168.1.136` and confirm zero matches remain in source (archived openspec history may retain it).  *(Remaining matches are only in test files as intentional assertion literals; also updated project `.code-rag.jsonc` to localhost. Canonical `openspec/specs/config-file/spec.md` is replaced by the change delta at archive.)*
- [x] 7.2 Grep for duplicate `OLLAMA_DEFAULTS`/`LMSTUDIO_DEFAULTS` declarations; confirm only one definition site (`defaults.ts`).  *(Only `src/config/defaults.ts` defines them; `embedConfig.ts` imports via `getProviderDefaults`.)*