import fs from "node:fs";
import path from "node:path";
import type { Network } from "x402/types";

// Minimal env loader (no dotenv dep). Reads .env from CWD if present.
function loadEnvFileSync(): void {
  try {
    const p = path.resolve(process.cwd(), ".env");
    if (!fs.existsSync(p)) return;
    const content = fs.readFileSync(p, "utf8");
    for (const rawLine of content.split("\n")) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq < 0) continue;
      const key = line.slice(0, eq).trim();
      let val = line.slice(eq + 1).trim();
      if ((val.startsWith("\"") && val.endsWith("\"")) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    }
  } catch {
    /* ignore */
  }
}

loadEnvFileSync();

function opt(name: string, fallback: string): string {
  const v = process.env[name];
  return v && v.trim() !== "" ? v : fallback;
}

// Client-only config — what the MCP server / CLI client needs.
// Server-side bits (PAY_TO, facilitator, pricing) are handled by the remote
// API at SERVER_BASE; the MCP client never needs them.
export function loadClientOnlyConfig() {
  const network = opt("NETWORK", "solana") as Network;
  return {
    network,
    port: Number(opt("PORT", "3402")),
    clientKeypairPath: opt("CLIENT_KEYPAIR_PATH", ".local/client-keypair.json"),
    clientRpcUrl: process.env.CLIENT_RPC_URL?.trim() || undefined,
  };
}
