// Wellness MCP server — exposes the x402-paid wellness API as MCP tools.
//
// Transport: stdio. Upstream: the running wellness HTTP server (default
// http://127.0.0.1:${PORT}, override via SERVER_BASE). The server handles the
// x402 402-challenge → sign → retry flow on behalf of the MCP caller using
// the client keypair at CLIENT_KEYPAIR_PATH (loaded lazily on first paid call).
//
// Run:      npm run mcp:server
// Register: make mcp-register   (or: claude mcp add wellness -- npx -y tsx <abs>/src/mcp/server.ts)

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { selectPaymentRequirements, createPaymentHeader } from "x402/client";
import type { PaymentRequirements } from "x402/types";
import { loadClientOnlyConfig } from "../config.js";
import { loadOrCreateKeypair } from "../client/keypair.js";
import { FORMATS, FORMAT_IDS, type FormatId } from "../content/formats.js";
import { LANGUAGES, LANG_CODES, DEFAULT_LANG, type LangCode } from "../content/languages.js";
import { AUDIENCES, AUDIENCE_IDS, DEFAULT_AUDIENCE, type AudienceId } from "../content/audiences.js";

const cfg = loadClientOnlyConfig();
// Default to the production API so a fresh `npx wellness-mcp` install Just Works
// for free read-only tools. Local dev / self-hosting overrides via SERVER_BASE.
const SERVER_BASE = process.env.SERVER_BASE ?? "https://api.wls-ms.com";

type Signer = Awaited<ReturnType<typeof loadOrCreateKeypair>>;
let signerPromise: Promise<Signer> | null = null;
function getSigner(): Promise<Signer> {
  if (!signerPromise) signerPromise = loadOrCreateKeypair(cfg.clientKeypairPath);
  return signerPromise;
}

type FetchResult = { status: number; body: string; settle?: unknown };

async function freeGet(path: string): Promise<FetchResult> {
  const res = await fetch(`${SERVER_BASE}${path}`);
  return { status: res.status, body: await res.text() };
}

async function paidGet(path: string): Promise<FetchResult> {
  const url = `${SERVER_BASE}${path}`;
  const first = await fetch(url);
  if (first.status !== 402) {
    return { status: first.status, body: await first.text() };
  }
  const challenge = (await first.json()) as {
    accepts: PaymentRequirements[];
    x402Version: number;
  };
  const { signer } = await getSigner();
  const requirement = selectPaymentRequirements(challenge.accepts, cfg.network, "exact");
  const header = await createPaymentHeader(
    signer,
    challenge.x402Version,
    requirement,
    cfg.clientRpcUrl ? { svmConfig: { rpcUrl: cfg.clientRpcUrl } } : undefined,
  );
  const second = await fetch(url, { headers: { "X-PAYMENT": header } });
  const settleHeader = second.headers.get("X-PAYMENT-RESPONSE");
  let settle: unknown;
  if (settleHeader) {
    try {
      settle = JSON.parse(Buffer.from(settleHeader, "base64").toString("utf8"));
    } catch {
      /* ignore — malformed header is not fatal for the caller */
    }
  }
  return { status: second.status, body: await second.text(), settle };
}

function toTextResult(r: FetchResult) {
  const text = r.settle
    ? `${r.body}\n\n---\nx402 settlement: ${JSON.stringify(r.settle)}`
    : r.body;
  return { content: [{ type: "text" as const, text }], isError: r.status !== 200 };
}

const formatEnum   = z.enum(FORMAT_IDS as readonly FormatId[] as [FormatId, ...FormatId[]]);
const langEnum     = z.enum(LANG_CODES as readonly LangCode[] as [LangCode, ...LangCode[]]);
const audienceEnum = z.enum(AUDIENCE_IDS as readonly AudienceId[] as [AudienceId, ...AudienceId[]]);

const server = new McpServer(
  { name: "wellness-master", version: "0.3.0" },
  {
    instructions:
      "Wellness micro-content for HUMANS and AI AGENTS (the first pay-per-call " +
      "wellness platform that treats both as first-class). 18 formats × 20 languages × 2 audiences. " +
      "Call list_formats / list_languages / list_audiences first to discover ids. " +
      "get_item / get_pack are paid via x402 on Solana mainnet (USDC) and dedup'd per " +
      "(wallet, audience, format, lang). Default audience: \"human\". " +
      "Pass audience=\"agent\" for content tuned to AI-agent workflows " +
      "(LangGraph, Claude Code, Cursor agents, multi-step pipelines).",
  },
);

server.registerTool(
  "list_formats",
  {
    description: "List the 18 wellness content formats (id + label + description).",
    inputSchema: {},
    annotations: {
      title: "List wellness formats",
      readOnlyHint: true,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async () => ({
    content: [
      {
        type: "text",
        text: JSON.stringify(
          FORMATS.map((f) => ({ id: f.id, label: f.label, description: f.description })),
          null,
          2,
        ),
      },
    ],
  }),
);

server.registerTool(
  "list_languages",
  {
    description: `List the ${LANG_CODES.length} supported languages (ISO-639-1 code + English name + native label). Default: "${DEFAULT_LANG}".`,
    inputSchema: {},
    annotations: {
      title: "List supported languages",
      readOnlyHint: true,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async () => ({
    content: [
      {
        type: "text",
        text: JSON.stringify({ default: DEFAULT_LANG, languages: LANGUAGES }, null, 2),
      },
    ],
  }),
);

server.registerTool(
  "get_catalog",
  {
    description: "Library item counts per format + storage backend (free, no x402).",
    inputSchema: {},
    annotations: {
      title: "Get catalog",
      readOnlyHint: true,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async () => toTextResult(await freeGet("/catalog")),
);

server.registerTool(
  "get_health",
  {
    description: "Server liveness + storage backend + total item count (free).",
    inputSchema: {},
    annotations: {
      title: "Health check",
      readOnlyHint: true,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async () => toTextResult(await freeGet("/health")),
);

server.registerTool(
  "list_audiences",
  {
    description:
      `List the ${AUDIENCE_IDS.length} supported audiences (human, agent). ` +
      `Wellness-Master is the first wellness API to treat both humans and AI agents ` +
      `as first-class corpora. Default: "${DEFAULT_AUDIENCE}". Free, no x402.`,
    inputSchema: {},
    annotations: {
      title: "List supported audiences",
      readOnlyHint: true,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async () => ({
    content: [
      {
        type: "text",
        text: JSON.stringify(
          { default: DEFAULT_AUDIENCE, audiences: AUDIENCES },
          null,
          2,
        ),
      },
    ],
  }),
);

server.registerTool(
  "get_item",
  {
    description:
      "Fetch ONE wellness item in the requested language and for the requested audience. " +
      "PAID — signs and settles an x402 micropayment in USDC on Solana mainnet from the " +
      "configured client wallet. Dedup'd per (wallet, audience, format, lang). " +
      "Pass audience=\"agent\" when the consumer is an AI agent (LangGraph, Claude Code, " +
      "Cursor agents, multi-step pipelines) — the corpus is tuned for inference, " +
      "context coherence, and recovery from failure.",
    inputSchema: {
      format: formatEnum.describe("One of the 18 format ids (see list_formats)"),
      lang: langEnum
        .default(DEFAULT_LANG)
        .describe(`One of the ${LANG_CODES.length} language codes (see list_languages). Default: "${DEFAULT_LANG}".`),
      audience: audienceEnum
        .default(DEFAULT_AUDIENCE)
        .describe(`Audience: "human" (warm, embodied) or "agent" (pragmatic, inference-aware). Default: "${DEFAULT_AUDIENCE}".`),
    },
    annotations: {
      title: "Get one wellness item (paid)",
      readOnlyHint: false,  // spends funds
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  async ({ format, lang, audience }) =>
    toTextResult(
      await paidGet(
        `/item?format=${encodeURIComponent(format)}` +
        `&lang=${encodeURIComponent(lang)}` +
        `&audience=${encodeURIComponent(audience)}`,
      ),
    ),
);

server.registerTool(
  "get_pack",
  {
    description:
      "Fetch a bundle of up to 10 wellness items in the requested language and audience. " +
      "PAID — settles a single x402 micropayment for the whole pack. Same dedup semantics " +
      "as get_item. Same price for human and agent audiences.",
    inputSchema: {
      format: formatEnum.describe("One of the 18 format ids"),
      size: z.number().int().min(1).max(10).default(10).describe("1–10 items"),
      lang: langEnum
        .default(DEFAULT_LANG)
        .describe(`One of the ${LANG_CODES.length} language codes. Default: "${DEFAULT_LANG}".`),
      audience: audienceEnum
        .default(DEFAULT_AUDIENCE)
        .describe(`Audience: "human" or "agent". Default: "${DEFAULT_AUDIENCE}".`),
    },
    annotations: {
      title: "Get a pack of wellness items (paid)",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  async ({ format, size, lang, audience }) =>
    toTextResult(
      await paidGet(
        `/pack?format=${encodeURIComponent(format)}` +
        `&size=${size}` +
        `&lang=${encodeURIComponent(lang)}` +
        `&audience=${encodeURIComponent(audience)}`,
      ),
    ),
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error(`[wellness-mcp] stdio connected, upstream=${SERVER_BASE}`);
