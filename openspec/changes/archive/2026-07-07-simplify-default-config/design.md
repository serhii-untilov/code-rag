## Context

The config layer (`src/config/defaults.ts`) and the embedding layer (`src/core/embedConfig.ts`) both maintain their own copies of `OLLAMA_DEFAULTS` and `LMSTUDIO_DEFAULTS`. Over time they drifted: embedConfig still references the original developer's LAN IP (`192.168.1.136`) while defaults.ts was corrected to `localhost`. The current config requires users on other machines to override the baseUrl manually, making first-run fail by default.

## Goals / Non-Goals

**Goals:**
- Make first-run work out of the box on any machine by using `localhost` for all default service URLs.
- Eliminate the duplicate provider-defaults constants so there is exactly one place to update defaults.
- Keep the public config schema, env-var overrides, and CLI surface unchanged.

**Non-Goals:**
- Auto-discovery of LM Studio / Ollama / Qdrant hosts on the network.
- Changing the default provider (stays `lmstudio`) or the default model names.
- Introducing a new config file format or field.
- Refactoring the broader config-loading pipeline (find/read/validate flow stays as-is).

## Decisions

### Decision 1: Single source of provider defaults

Define `OLLAMA_DEFAULTS` and `LMSTUDIO_DEFAULTS` once in `src/config/defaults.ts` and import them into `src/core/embedConfig.ts` (and anywhere else that needs provider defaults). `embedConfig.ts` no longer declares its own constants.

- **Rationale**: `defaults.ts` already exports these constants and a `getProviderDefaults()` helper. embedConfig already imports `getProviderDefaults` for the config-driven path but keeps a separate set for the partial-driven path. Consolidating removes the drift that caused this bug.
- **Alternative considered**: Move defaults into a new `src/core/embedConfig.ts` and have `defaults.ts` import from there. Rejected because config is the higher-level layer and embeddings should depend on config, not the reverse.

### Decision 2: Simplify `DEFAULT_CONFIG` to drop manual provider spreads

`DEFAULT_CONFIG` currently spreads `LMSTUDIO_DEFAULTS` into `embed` for `modelName`, `baseUrl`, `dimensions`. Since `applyProviderDefaults` already fills these at load time from `getProviderDefaults`, `DEFAULT_CONFIG.embed` only needs to carry the `provider` (optionally with empty optional fields) and Zod schema defaults handle the rest.

- **Rationale**: Removes dead duplication; the field-filling logic lives in one place (`applyProviderDefaults`).
- **Alternative considered**: Keep `DEFAULT_CONFIG` fully populated as a snapshot. Rejected — it duplicates what `getProviderDefaults` returns and is what caused the drift in the first place.

### Decision 3: LM Studio default baseUrl → `http://localhost:1234/v1`

Replace `192.168.1.136` with `localhost` in all three layers (defaults, embedConfig, and ingest.ts inline literal) plus docs/Makefile/spec.

- **Rationale**: `localhost` is the only sane universal default; a LAN IP is machine-specific. Users who need the LAN host can set `CODE_RAG_EMBED_BASE_URL` or `embed.baseUrl` in `.code-rag.jsonc`.
- **Alternative considered**: Make baseUrl mandatory (no default). Rejected — breaks the "works out of the box" goal and contradicts existing schema optionality.

### Decision 4: Remove inline LM Studio literal from `ingest.ts`

`src/ingestion/ingest.ts` hardcodes the `192.168.1.136` baseUrl when no config is supplied. Route this path through `resolveConfig`/`getProviderDefaults` instead.

- **Rationale**: No inline defaults should exist outside the defaults module.
- **Alternative considered**: Leave the inline literal but just change the IP. Rejected — perpetuates the drift problem.

## Risks / Trade-offs

- [Risk] Users who previously relied on the implicit `192.168.1.136` default see a connection failure on the LM Studio host. → Mitigation: documented as **BREAKING** in proposal; users set `embed.baseUrl`/env var explicitly. Also visible in `npx code-rag init` template which should emit `localhost`.
- [Risk] Removing the inline default in `ingest.ts` changes behavior when called without config (it previously silently used the LAN IP). → Mitigation: ensure `ingest.ts` calls `resolveConfig`/`getProviderDefaults` so the no-config path produces the same shape as the config path; covered by tests.
- [Risk] Tests asserting `192.168.1.136` anywhere break. → Mitigation: update affected tests in `src/config/__tests__/` and `src/core/__tests__/`; the tasks phase enumerates them.