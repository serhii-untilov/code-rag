#!/usr/bin/env node
import { Command } from "commander";
import { registerInitCommand } from "./commands/init.js";
import { registerIngestCommand } from "./commands/ingest.js";
import { registerStartCommand } from "./commands/start.js";

const program = new Command();

program
  .name("code-rag")
  .description("Universal CodeUnit-based RAG system with MCP integration")
  .version("0.1.0");

registerInitCommand(program);
registerIngestCommand(program);
registerStartCommand(program);

program.parse();