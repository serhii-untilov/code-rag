export type CodeUnitType = "function" | "method" | "class" | "module" | "dto";

export type CodeUnitLanguage = "ts" | "js" | "py" | "unknown";

export interface CodeUnit {
  id: string;
  symbol: string;
  type: CodeUnitType;
  language: CodeUnitLanguage;
  filePath: string;
  content: string;
  imports?: string[];
  exports?: string[];
  tags?: string[];
}