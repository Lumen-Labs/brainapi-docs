import { spawnSync } from "node:child_process";
import path from "node:path";

const python = process.env.BRAINAPI_PYTHON ?? "python3";
const source = process.env.BRAINAPI_SOURCE ?? path.resolve("../../brainapi2");
const args = ["scripts/sync-v2-openapi.py", "--source", source, ...process.argv.slice(2)];
const result = spawnSync(python, args, { stdio: "inherit" });

if (result.error) {
  console.error(`Unable to run ${python}: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
