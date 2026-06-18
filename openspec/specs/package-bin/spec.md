## ADDED Requirements

### Requirement: Package binary entry point
The `package.json` SHALL include a `bin` field mapping `code-rag` to the compiled CLI entry point `dist/cli/index.js`.

#### Scenario: npx code-rag resolves to CLI binary
- **WHEN** the package is installed via `npm install --save-dev code-rag` or used via `npx code-rag`
- **THEN** the `code-rag` command SHALL resolve to `dist/cli/index.js` and execute the CLI

### Requirement: Package name and package.json configuration
The `package.json` SHALL have `name: "code-rag"`, `type: "module"`, and include `commander` as a dependency and `jsonc-parser` (or `strip-json-comments`) as a dependency.

#### Scenario: Package installable as code-rag
- **WHEN** the package is published or linked via `npm link`
- **THEN** running `npx code-rag --version` SHALL print the current version from `package.json`

### Requirement: CLI entry point file
The system SHALL have a `src/cli/index.ts` file that imports Commander, registers the `init`, `ingest`, and `start` commands, and parses `process.argv`.

#### Scenario: CLI entry point bootstrap
- **WHEN** `dist/cli/index.js` is executed
- **THEN** Commander SHALL be initialized with program name `code-rag`, version from `package.json`, and descriptions for each subcommand

### Requirement: Each command in separate module
Each CLI command (`init`, `ingest`, `start`) SHALL be implemented in its own file under `src/cli/commands/` directory.

#### Scenario: Command module structure
- **WHEN** the CLI starts
- **THEN** `src/cli/commands/init.ts`, `src/cli/commands/ingest.ts`, and `src/cli/commands/start.ts` SHALL each export a function registering their respective command with the Commander program