import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const tracked = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
  .split("\0")
  .filter(Boolean);

const forbiddenPaths = [
  /^\.env(?:\.|$)/,
  /^\.vscode\//,
  /\.(?:pem|key|p12|pfx)$/i,
];
const allowedPaths = new Set([".env.example"]);
const textPatterns = [
  { name: "private key", pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { name: "AWS access key", pattern: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/ },
  { name: "GitHub token", pattern: /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/ },
  { name: "Slack token", pattern: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/ },
  { name: "credentialed database URL", pattern: /\b(?:postgres(?:ql)?|mongodb(?:\+srv)?):\/\/[^\s:/]+:[^\s@/]+@/i },
  { name: "personal macOS path", pattern: /\/Users\/[A-Za-z0-9._-]+\// },
  { name: "personal Windows path", pattern: /[A-Z]:\\Users\\[^\\]+\\/i },
  { name: "retired personal email", pattern: /alch\.infoemail@gmail\.com/i },
];

const errors = [];
for (const file of tracked) {
  if (!allowedPaths.has(file) && forbiddenPaths.some((pattern) => pattern.test(file))) {
    errors.push(`forbidden tracked path: ${file}`);
  }

  const data = await readFile(file);
  if (data.includes(0)) continue;
  const text = data.toString("utf8");
  for (const { name, pattern } of textPatterns) {
    if (pattern.test(text)) errors.push(`${name} found in ${file}`);
  }
}

if (errors.length) {
  console.error("Public-repository validation failed:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Validated ${tracked.length} tracked paths for forbidden files, common secrets, personal paths, and retired contact data.`);
