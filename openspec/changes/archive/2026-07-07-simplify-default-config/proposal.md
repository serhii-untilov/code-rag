## Why

The default config contains a hardcoded LAN IP (`192.168.1.136`) for the LM Studio baseUrl instead of `localhost`, which fails on any machine other than the original developer's. Additionally, `OLLAMA_DEFAULTS` and `LMSTUDIO_DEFAULTS` are duplicated across `src/config/defaults.ts` and `src/core/embedConfig.ts`, leading to drift (embedConfig still has the stale IP while defaults.ts was already corrected). These maintenance and portability issues block first-run usability.

## What Changes

- Replace the hardcoded `http://192.168.1.136:1234/v1` LM Studio baseUrl with `http://localhost:1234/v1` everywhere (source, README, Makefile, spec).
- Eliminate the duplicated `OLLAMA_DEFAULTS` / `LMSTUDIO_DEFAULTS` by defining provider defaults in a single source of truth (`src/config/defaults.ts`) and importing them into `src/core/embedConfig.ts`.
- Simplify the `DEFAULT_CONFIG` in `defaults.ts` so it no longer manually spreads provider defaults; provider-specific fields are resolved at load time via `applyProviderDefaults`.
- Update the existing `config-file` spec to reference `localhost` instead of `192.168.1.136`.
- **BREAKING**: The LM Studio default baseUrl changes from `http://192.168.1.136:1234/v1` to `http://localhost:1234/v1`. Users who relied on the hardcoded IP must set `baseUrl` explicitly in their `.code-rag.jsonc` or `CODE_RAG_EMBED_BASE_URL` env var.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `config-file`: The default `baseUrl` for `lmstudio` SHALL be `http://localhost:1234/v1` instead of `http://192.168.1.136:1234/v1`. Provider defaults SHALL be defined in a single module with no duplicate constant definitions across the config and embedding layers.

## Impact

- `src/config/defaults.ts` — single source of provider defaults; `DEFAULT_CONFIG` simplified.
- `src/core/embedConfig.ts` — remove local `OLLAMA_DEFAULTS` / `LMSTUDIO_DEFAULTS`, import from `defaults.ts`.
- `src/ingestion/ingest.ts` — replace inline `192.168.1.136` literal with imported defaults.
- `README.md` — update example config and docs to use `localhost`.
- `Makefile` — update `BASE_URL` to `localhost`.
- `openspec/specs/config-file/spec.md` — update the default-values requirement to reference `localhost`.
- Tests under `src/config/__tests__/` and `src/core/__tests__/` may need assertion updates for the new default baseUrl.