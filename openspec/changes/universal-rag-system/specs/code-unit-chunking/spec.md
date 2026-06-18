## ADDED Requirements

### Requirement: CodeUnit schema normalization
The system SHALL normalize all parsed code into a unified `CodeUnit` interface with the following fields: `id` (string), `symbol` (string), `type` (function | method | class | module | dto), `language` (ts | js | py | unknown), `filePath` (string), `content` (string), `imports` (optional string[]), `exports` (optional string[]), `tags` (optional string[]).

#### Scenario: Valid TypeScript function extraction
- **WHEN** a TypeScript file containing an exported function is parsed
- **THEN** the system SHALL produce a CodeUnit with `type="function"`, `language="ts"`, the function name as `symbol`, and the function body as `content`

#### Scenario: Unknown file type handling
- **WHEN** a file with an unsupported extension is encountered
- **THEN** the system SHALL produce a CodeUnit with `language="unknown"` and `type="module"`, using the entire file content as the unit

### Requirement: TypeScript AST-based chunking
The system SHALL parse TypeScript/JavaScript files using ts-morph and extract the following as atomic CodeUnits: top-level functions, class methods, classes as context wrappers, interfaces/DTOs, and NestJS-decorated items.

#### Scenario: NestJS controller extraction
- **WHEN** a file containing a `@Controller` decorated class is parsed
- **THEN** the system SHALL extract the class as a CodeUnit with `tags=["api"]` and each method decorated with `@Get`, `@Post`, etc. as individual method CodeUnits with the route metadata in their `content`

#### Scenario: NestJS injectable extraction
- **WHEN** a file containing an `@Injectable` decorated class is parsed
- **THEN** the system SHALL extract the class as a CodeUnit with `tags=["service"]`

#### Scenario: Interface and DTO extraction
- **WHEN** a TypeScript interface or type alias is parsed
- **THEN** the system SHALL extract it as a CodeUnit with `type="dto"`

### Requirement: Import and export extraction
The system SHALL extract `imports` and `exports` arrays from each TypeScript CodeUnit to preserve dependency context.

#### Scenario: Function with imports
- **WHEN** a TypeScript function that imports from other modules is parsed
- **THEN** the CodeUnit SHALL include an `imports` array listing all imported module paths

#### Scenario: Exported symbol tracking
- **WHEN** a module exports symbols
- **THEN** the CodeUnit SHALL include an `exports` array listing all exported symbol names

### Requirement: Tag-based classification
The system SHALL automatically assign tags to CodeUnits based on decorator analysis: `@Controller` → `["api"]`, `@Injectable` → `["service"]`, `@Module` → `["module"]`, database-related → `["db"]`, authentication-related → `["auth"]`.

#### Scenario: Auto-tagging a controller
- **WHEN** a class with `@Controller` decorator is parsed
- **THEN** the CodeUnit `tags` array SHALL include `"api"`