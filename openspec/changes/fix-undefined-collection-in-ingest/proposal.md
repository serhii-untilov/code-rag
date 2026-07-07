## Why

`code-rag ingest` logs `Found 861 files to process into "undefined" collection` even when `.code-rag.jsonc` has a valid `qdrant.collection`. Two bugs cause this: (1) the CLI `ingest` command never passes `collectionName` into `ingestRepository` (it only threads it through `embedConfig.collection`), and (2) the log line in `ingestRepository` reads the raw `options.collectionName` (frequently undefined) instead of the locally-resolved `collectionName` variable that has the `'code_rag'` fallback.

## What Changes

- `src/cli/commands/ingest.ts` — pass `collectionName: config.qdrant.collection` into the `ingestRepository` call so the configured collection is actually used.
- `src/ingestion/ingest.ts` — change the "Found N files to process into …" log to use the resolved `collectionName` local variable (with its `?? 'code_rag'` fallback) rather than `options.collectionName`.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `ingestion-flow`: The ingestion progress-reporting requirement SHALL log the actual resolved collection name, and the ingestion pipeline SHALL receive the configured `collectionName` from the CLI ingest command.

## Impact

- `src/cli/commands/ingest.ts` — add `collectionName` to the `ingestRepository` options object.
- `src/ingestion/ingest.ts` — fix the log message on the "Found N files" line.
- Tests: add a regression test asserting the ingest log (and the upsert target) uses the configured collection name, not `undefined`.