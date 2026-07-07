## Context

`code-rag ingest` runs the ingestion pipeline and logs `Found N files to process into "undefined" collection` even when `.code-rag.jsonc` has a valid `qdrant.collection`. The Qdrant collection actually used (for `ensureCollection` and `client.upsert`) is the locally-resolved variable `collectionName = options.collectionName ?? 'code_rag'`, but the CLI ingest command never passes `collectionName` into `ingestRepository` — so the resolved value silently falls back to `'code_rag'`, ignoring the user's configured collection. The log message additionally reports `options.collectionName` (the raw undefined input) instead of the resolved value, masking the bug.

## Goals / Non-Goals

**Goals:**
- The CLI `ingest` command threads `config.qdrant.collection` into `ingestRepository` so the user's configured collection is actually used for upserts.
- The "Found N files" log shows the resolved collection name, never `undefined`.

**Non-Goals:**
- Changing the `?? 'code_rag'` fallback behavior — it remains a safety net for callers that omit `collectionName`.
- Refactoring the `IngestOptions` shape or the `embedConfig.collection` field (kept for backward compat with `ingestRepositoryFromConfig`).
- Touching `start`/`init`/`qdrantAutostart`.

## Decisions

### Decision 1: Pass `collectionName` from CLI ingest command

Add `collectionName: config.qdrant.collection` to the `ingestRepository` options object in `src/cli/commands/ingest.ts`. `config.qdrant.collection` is always present (Zod schema defaults it to `'code_rag'`), so this guarantees a non-undefined value reaches `ingestRepository`.

- **Rationale**: `ingestRepositoryFromConfig` already passes `collectionName: config.qdrant.collection`; only the CLI `ingest` action was missing it. Eliminates the root cause.
- **Alternative**: make `ingestRepository` fall back to `embedConfig.collection` when `collectionName` is absent. Rejected — `collectionName` and `embedConfig.collection` are independent fields with different defaults (`'code_rag'` vs `'code-rag'`); conflating them would silently pick the wrong collection for some callers.

### Decision 2: Log the resolved `collectionName`, not `options.collectionName`

Change line 50 of `src/ingestion/ingest.ts` from `options.collectionName` to the local `collectionName` variable (already computed on line 38 with the `?? 'code_rag'` fallback). This guarantees the log always shows a concrete name even if a future caller forgets to pass `collectionName`.

- **Rationale**: the local variable is the source of truth used by `ensureCollection` and `client.upsert`; the log should match what actually happened.
- **Alternative**: delete the log entirely. Rejected — users rely on it to confirm which collection they're targeting.

## Risks / Trade-offs

- [Risk] Callers that previously relied on the silent `'code_rag'` fallback while configuring `embed.collection: "code-rag"` now get unexpected behavior. → Mitigation: `config.qdrant.collection` from the Zod schema already defaults to `'code_rag'` and the `.code-rag.jsonc` template emits the configured value, so the CLI path always has a real value; no behavior change for correctly-configured users.
- [Risk] None — the change makes the system behave as users already expect.