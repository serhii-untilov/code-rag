import { Project, SyntaxKind, type SourceFile, type Node, type FunctionDeclaration, type ClassDeclaration, type InterfaceDeclaration, type TypeAliasDeclaration, type MethodDeclaration } from "ts-morph";
import * as crypto from "node:crypto";
import type { CodeUnit, CodeUnitLanguage, CodeUnitType } from "../model/codeUnit.js";

const EXCLUDED_DIRS = new Set(["node_modules", ".git", "dist", "build", "coverage"]);

const SUPPORTED_EXTENSIONS: Record<string, CodeUnitLanguage> = {
  ".ts": "ts",
  ".tsx": "ts",
  ".js": "js",
  ".jsx": "js",
  ".py": "py",
};

const NESTJS_CONTROLLER_DECORATORS = new Set(["Controller"]);
const NESTJS_INJECTABLE_DECORATORS = new Set(["Injectable"]);
const NESTJS_MODULE_DECORATORS = new Set(["Module"]);
const NESTJS_HTTP_DECORATORS = new Set(["Get", "Post", "Put", "Delete", "Patch", "Options", "Head", "All"]);

function detectLanguage(filePath: string): CodeUnitLanguage {
  const ext = filePath.substring(filePath.lastIndexOf("."));
  return SUPPORTED_EXTENSIONS[ext] ?? "unknown";
}

function generateId(filePath: string, symbol: string): string {
  return crypto.createHash("sha256").update(`${filePath}::${symbol}`).digest("hex").substring(0, 16);
}

function extractImports(sourceFile: SourceFile): string[] {
  return sourceFile.getImportDeclarations().map((imp) => {
    const moduleSpecifier = imp.getModuleSpecifierValue();
    const namedImports = imp.getNamedImports().map((ni) => ni.getName());
    const defaultImport = imp.getDefaultImport()?.getText() ?? undefined;
    const parts: string[] = [];
    if (defaultImport) parts.push(defaultImport);
    if (namedImports.length > 0) parts.push(`{ ${namedImports.join(", ")} }`);
    return parts.length > 0 ? `${moduleSpecifier} (${parts.join(", ")})` : moduleSpecifier;
  });
}

function extractExports(sourceFile: SourceFile): string[] {
  const exports: string[] = [];
  for (const exp of sourceFile.getExportDeclarations()) {
    const namedExports = exp.getNamedExports().map((ne) => ne.getName());
    exports.push(...namedExports);
  }
  for (const dec of [
    ...sourceFile.getFunctions(),
    ...sourceFile.getClasses(),
    ...sourceFile.getInterfaces(),
    ...sourceFile.getTypeAliases(),
  ]) {
    if (dec.isExported()) {
      exports.push(dec.getName() ?? "<anonymous>");
    }
  }
  return exports;
}

function getDecoratorNames(node: Node): string[] {
  if (!("getDecorators" in node) || typeof (node as any).getDecorators !== "function") return [];
  return ((node as any).getDecorators() ?? []).map((d: any) => {
    const expr = d.getExpression();
    if (expr.isIdentifier) return expr.getText();
    if (expr.getProperty) return expr.getExpression().getText();
    return expr.getText();
  });
}

function inferTagsFromDecorators(decoratorNames: string[]): string[] {
  const tags: string[] = [];
  for (const name of decoratorNames) {
    if (NESTJS_CONTROLLER_DECORATORS.has(name)) tags.push("api");
    if (NESTJS_INJECTABLE_DECORATORS.has(name)) tags.push("service");
    if (NESTJS_MODULE_DECORATORS.has(name)) tags.push("module");
  }
  const text = decoratorNames.join(" ").toLowerCase();
  if (text.includes("entity") || text.includes("repository") || text.includes("typeorm")) tags.push("db");
  if (text.includes("auth") || text.includes("guard") || text.includes("jwt")) tags.push("auth");
  if (text.includes("dto") || text.includes("schema") || text.includes("validation")) tags.push("dto");
  return [...new Set(tags)];
}

export function extractFunctionUnits(sourceFile: SourceFile, filePath: string): CodeUnit[] {
  const units: CodeUnit[] = [];
  const fileImports = extractImports(sourceFile);
  const fileExports = extractExports(sourceFile);

  for (const func of sourceFile.getFunctions()) {
    const symbol = func.getName() ?? "<anonymous>";
    units.push({
      id: generateId(filePath, symbol),
      symbol,
      type: "function",
      language: "ts",
      filePath,
      content: func.getText(),
      imports: fileImports,
      exports: fileExports,
      tags: func.isExported() ? ["export"] : undefined,
    });
  }
  return units;
}

export function extractClassUnits(sourceFile: SourceFile, filePath: string): CodeUnit[] {
  const units: CodeUnit[] = [];
  const fileImports = extractImports(sourceFile);
  const fileExports = extractExports(sourceFile);

  for (const cls of sourceFile.getClasses()) {
    const className = cls.getName() ?? "<anonymous>";
    const decoratorNames = getDecoratorNames(cls);
    const tags = inferTagsFromDecorators(decoratorNames);

    units.push({
      id: generateId(filePath, className),
      symbol: className,
      type: "class",
      language: "ts",
      filePath,
      content: cls.getText(),
      imports: fileImports,
      exports: fileExports,
      tags: tags.length > 0 ? tags : undefined,
    });

    for (const method of cls.getMethods()) {
      const methodName = method.getName();
      const methodDecoratorNames = getDecoratorNames(method);
      const methodTags = [...tags, ...inferTagsFromDecorators(methodDecoratorNames)];

      units.push({
        id: generateId(filePath, `${className}.${methodName}`),
        symbol: `${className}.${methodName}`,
        type: "method",
        language: "ts",
        filePath,
        content: method.getText(),
        imports: fileImports,
        exports: fileExports,
        tags: methodTags.length > 0 ? methodTags : undefined,
      });
    }
  }
  return units;
}

export function extractDtoUnits(sourceFile: SourceFile, filePath: string): CodeUnit[] {
  const units: CodeUnit[] = [];
  const fileImports = extractImports(sourceFile);
  const fileExports = extractExports(sourceFile);

  for (const iface of sourceFile.getInterfaces()) {
    const name = iface.getName();
    units.push({
      id: generateId(filePath, name),
      symbol: name,
      type: "dto",
      language: "ts",
      filePath,
      content: iface.getText(),
      imports: fileImports,
      exports: fileExports,
    });
  }

  for (const typeAlias of sourceFile.getTypeAliases()) {
    const name = typeAlias.getName();
    units.push({
      id: generateId(filePath, name),
      symbol: name,
      type: "dto",
      language: "ts",
      filePath,
      content: typeAlias.getText(),
      imports: fileImports,
      exports: fileExports,
    });
  }
  return units;
}

export function chunkTsFile(filePath: string, content: string): CodeUnit[] {
  const language = detectLanguage(filePath);
  if (language === "unknown" || language === "py") {
    return [fallbackChunk(filePath, content, language)];
  }

  const project = new Project({ useInMemoryFileSystem: true });
  const sourceFile = project.createSourceFile(filePath, content);

  const units: CodeUnit[] = [
    ...extractFunctionUnits(sourceFile, filePath),
    ...extractClassUnits(sourceFile, filePath),
    ...extractDtoUnits(sourceFile, filePath),
  ];

  if (units.length === 0) {
    return [fallbackChunk(filePath, content, language)];
  }
  return units;
}

function fallbackChunk(filePath: string, content: string, language: CodeUnitLanguage): CodeUnit {
  const symbol = filePath.split("/").pop()?.replace(/\.[^.]+$/, "") ?? "unknown";
  return {
    id: generateId(filePath, symbol),
    symbol,
    type: "module",
    language,
    filePath,
    content,
  };
}

export function chunkFile(filePath: string, content: string): CodeUnit[] {
  const ext = filePath.substring(filePath.lastIndexOf("."));
  if (ext in SUPPORTED_EXTENSIONS && (ext === ".ts" || ext === ".tsx" || ext === ".js" || ext === ".jsx")) {
    return chunkTsFile(filePath, content);
  }
  if (ext === ".py") {
    return [fallbackChunk(filePath, content, "py")];
  }
  return [fallbackChunk(filePath, content, "unknown")];
}

export { EXCLUDED_DIRS, SUPPORTED_EXTENSIONS };