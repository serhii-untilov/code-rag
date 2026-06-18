import { resolveConfigOrDie } from "../../config/index.js";
import { startServer } from "../../mcp/server.js";

export function registerStartCommand(program: any): void {
  program
    .command("start")
    .description("Start the MCP RAG server")
    .action(async () => {
      const config = resolveConfigOrDie();
      await startServer(config);
    });
}