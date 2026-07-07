import * as fs from "node:fs";
import * as path from "node:path";
import * as url from "node:url";
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

const HEALTH_TIMEOUT_MS = 2000;
const POLL_INTERVAL_MS = 2000;
const POLL_MAX_ATTEMPTS = 15;

const COMPOSE_FILE_NAMES = ["docker-compose.yml", "docker-compose.yaml", "compose.yml", "compose.yaml"];

export function getPackageDir(): string {
  const moduleDir = path.dirname(fileURLToPathSafe(import.meta.url));
  let dir = moduleDir;
  for (let i = 0; i < 10; i++) {
    const pkgPath = path.join(dir, "package.json");
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
        if (pkg.name === "@untilov/code-rag") return dir;
      } catch {}
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return moduleDir;
}

function fileURLToPathSafe(u: string): string {
  return url.fileURLToPath(u);
}

export async function isQdrantHealthy(qdrantUrl: string): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
  try {
    const res = await fetch(`${qdrantUrl}/healthz`, { signal: controller.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export function findComposeFile(packageDir: string): string | null {
  for (const name of COMPOSE_FILE_NAMES) {
    const candidate = path.join(packageDir, name);
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

export interface AutostartDeps {
  healthCheck?: (qdrantUrl: string) => Promise<boolean>;
  runCompose?: (packageDir: string) => Promise<void>;
  pollIntervalMs?: number;
  pollMaxAttempts?: number;
  packageDir?: string;
}

export async function ensureQdrantRunning(
  qdrantUrl: string,
  _projectRoot?: string,
  deps: AutostartDeps = {},
): Promise<void> {
  const healthCheck = deps.healthCheck ?? isQdrantHealthy;
  const pollIntervalMs = deps.pollIntervalMs ?? POLL_INTERVAL_MS;
  const pollMaxAttempts = deps.pollMaxAttempts ?? POLL_MAX_ATTEMPTS;

  if (await healthCheck(qdrantUrl)) return;

  const packageDir = deps.packageDir ?? getPackageDir();
  const composeFile = findComposeFile(packageDir);
  if (!composeFile) {
    console.warn(`[code-rag] Qdrant is not reachable at ${qdrantUrl} and no docker-compose.yml was found in the @untilov/code-rag package directory (${packageDir}). Skipping auto-start.`);
    return;
  }

  console.log(`[code-rag] Qdrant is not reachable at ${qdrantUrl}. Starting via Docker Compose...`);

  const runCompose = deps.runCompose ?? defaultRunCompose;
  try {
    await runCompose(packageDir);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[code-rag] Failed to run "docker compose up -d": ${msg}. Skipping auto-start.`);
    return;
  }

  for (let attempt = 1; attempt <= pollMaxAttempts; attempt++) {
    if (await healthCheck(qdrantUrl)) {
      console.log(`[code-rag] Qdrant is healthy (ready after ${attempt * pollIntervalMs / 1000}s).`);
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  console.warn(`[code-rag] Qdrant did not become healthy within ${(pollMaxAttempts * pollIntervalMs) / 1000}s after "docker compose up -d". Proceeding anyway — the command may fail with a connection error.`);
}

async function defaultRunCompose(projectRoot: string): Promise<void> {
  const { stderr } = await execAsync("docker compose up -d", { cwd: projectRoot });
  if (stderr) console.error(stderr);
}