## 1. Fix CLI ingest command — pass collectionName

- [x] 1.1 In `src/cli/commands/ingest.ts`, add `collectionName: config.qdrant.collection` to the options object passed to `ingestRepository`.
- [x] 1.2 Verify `config.qdrant.collection` is always present (Zod schema defaults it to `code_rag`) — no extra fallback needed at the call site.

## 2. Fix the "Found N files" log in ingestRepository

- [x] 2.1 In `src/ingestion/ingest.ts`, change the log on line 50 from `options.collectionName` to the resolved local `collectionName` variable.
- [x] 2.2 Confirm no other call sites in the file use `options.collectionName` for logging or upserts (only the resolved `collectionName` local should be referenced).  *(Only the local init on line 38 reads `options.collectionName`; all other uses reference the `collectionName` local.)*

## 3. Regression tests

- [x] 3.1 Add a test asserting the "Found N files to process into …" log prints the passed `collectionName` (e.g. `"payroll-smb"`) when `ingestRepository` is called with `collectionName: "payroll-smb"`. Stub `createClient`/`ensureCollection`/`embedBatch` so the pipeline completes without real Qdrant/Ollama.  *(Added `src/ingestion/__tests__/ingest.test.ts`; used injectable `IngestDeps` — same pattern as `AutostartDeps` — because `tsx`-emitted module exports are non-configurable.)*
- [x] 3.2 Add a test asserting the same log prints `"code_rag"` (the fallback) when `ingestRepository` is called without `collectionName`, never `undefined`.
- [x] 3.3 Add a test asserting the CLI `ingest` action passes `config.qdrant.collection` into `ingestRepository` (mock/inspect the options object received by `ingestRepository`).  *(Extracted `runIngestAction` with `IngestActionDeps` for stubbable `ingest`/`ensureQdrant`; added `src/cli/__tests__/ingestCli.test.ts`.)*

## 4. Verification

- [x] 4.1 Run the full test suite (`npx tsx --test src/**/*.test.ts`) and ensure all existing + new tests pass.  *(37/37 pass — 34 existing + 3 new.)*
- [x] 4.2 Run `npm run build` (tsc typecheck) and ensure clean.
- [x] 4.3 Grep `src/ingestion/ingest.ts` to confirm `options.collectionName` is no longer referenced (only the resolved `collectionName` local).  *(Only the local-init line `const collectionName = options.collectionName ?? 'code_rag';` reads it; the log now uses the resolved local.)*