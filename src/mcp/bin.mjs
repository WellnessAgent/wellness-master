#!/usr/bin/env node
// wellness-mcp bin shim — runs the TypeScript entry via tsx so consumers
// don't need a compiled dist/. tsx ships in devDependencies; a plain
// `npm install` inside this package is enough to make this work.
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const entry = resolve(here, "server.ts");
const require = createRequire(import.meta.url);
const tsxBin = require.resolve("tsx/cli");

const child = spawn(process.execPath, [tsxBin, entry], {
  stdio: "inherit",
  env: process.env,
});
child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 0);
});
