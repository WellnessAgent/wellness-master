# wellness-master

[![npm version](https://img.shields.io/npm/v/wellness-master.svg?style=flat-square)](https://www.npmjs.com/package/wellness-master)
[![npm downloads](https://img.shields.io/npm/dm/wellness-master.svg?style=flat-square)](https://www.npmjs.com/package/wellness-master)
[![license](https://img.shields.io/npm/l/wellness-master.svg?style=flat-square)](LICENSE)
[![node](https://img.shields.io/node/v/wellness-master.svg?style=flat-square)](package.json)
[![x402](https://img.shields.io/badge/x402-Solana%20mainnet-9945ff?style=flat-square)](https://x402.org)
[![mcp](https://img.shields.io/badge/MCP-stdio-blue?style=flat-square)](https://modelcontextprotocol.io)

> **Pay-per-call wellness micro-content** as an MCP server.
> 18 formats × 20 languages, settled in **USDC on Solana** via the
> [x402](https://x402.org) protocol — **$0.01 per call**, no account, no API key.

Plug it into Claude Code, Claude Desktop, Cursor, or any [MCP](https://modelcontextprotocol.io)-aware
agent in a single command. Free tools (catalog / health / format & language
listings) work out of the box; paid tools (`get_item`, `get_pack`) sign a tiny
USDC transfer on Solana mainnet via the
[Coinbase CDP facilitator](https://docs.cdp.coinbase.com/x402/welcome).

- 🌐 **Live API** — <https://api.wls-ms.com>
- 📖 **Docs** — <https://www.wls-ms.com/docs.html>
- 🔌 **MCP manifest** — <https://www.wls-ms.com/mcp.json>
- 🏷️ **License** — MIT

---

## Table of contents

- [Why](#why)
- [Quick start](#quick-start)
- [Tools](#tools)
- [Configuration](#configuration)
- [Examples](#examples)
- [Pricing](#pricing)
- [Languages](#languages)
- [Formats](#formats)
- [Self-hosting](#self-hosting)
- [Security notes](#security-notes)
- [Troubleshooting](#troubleshooting)

---

## Why

Modern AI agents need rich, deduplicated, multilingual content snippets — for
notification copy, ambient UI, daily prompts, retention loops. Most providers
hide this behind subscriptions, OAuth dances, and 50-page T&Cs.

`wellness-master` ships the same value as a **single MCP server**:

- **No account, no API key** — payment happens per call, in USDC on Solana,
  through the open [x402](https://x402.org) protocol.
- **No subscription** — pay only for what you fetch (`$0.01` / item).
- **Per-wallet deduplication** — your agent never gets the same string twice
  for a given (format, language) pair.
- **Cents-level cost** — typical agent-to-agent integrations cost less than
  $1/month; this is reasonable to embed in any free product.
- **One-line install** — `claude mcp add wellness --transport stdio -- npx -y wellness-master`.

---

## Quick start

### 1. Install (zero clone)

```bash
claude mcp add wellness --transport stdio -- npx -y wellness-master
claude mcp list   # → wellness ✓ Connected
```

`npx` fetches the package on first use and caches it. No `npm install`, no
clone. The four free tools work immediately. The two paid tools auto-create
a Solana keypair on first call (mode `0600` in `.local/client-keypair.json`).

### 2. Use it

In your Claude session:

```
You  : "Give me a haiku in Japanese."
Claude: (calls wellness/get_item({format:"haiku", lang:"ja"}))
       (signs the x402 USDC transfer transparently)
       (returns the haiku + on-chain settlement signature)
```

Or programmatically from any stdio MCP client:

```jsonc
// MCP request
{ "method": "tools/call",
  "params": { "name": "get_item", "arguments": { "format": "haiku", "lang": "ja" }}}
```

```jsonc
// MCP response (after the x402 round-trip)
{ "content": [{"type": "text", "text":
    "{\"item\":{\"id\":\"llm-...\",\"format\":\"haiku\",\"lang\":\"ja\",\"text\":\"...\"}}"}]}
```

---

## Tools

| Tool | Free | Description |
|---|---|---|
| `list_formats` | ✓ | The 18 wellness formats (id + label + description) |
| `list_languages` | ✓ | The 20 supported languages (ISO-639-1 + endonym) |
| `get_catalog` | ✓ | Library item counts per (format, language) |
| `get_health` | ✓ | Liveness probe (network, total items, storage backend) |
| `get_item` | **$0.01** | One wellness item, deduplicated per wallet |
| `get_pack` | **$0.07** | Up to 10 items in one settlement (≈30% bulk discount) |

All tools accept JSON-Schema-validated inputs (`format` enum, `lang` enum,
`size: 1..10` for `get_pack`). Inputs are sanitized server-side before reaching
the paywall — invalid values get a `400` with no payment attempted.

---

## Configuration

Every variable is **optional**. Defaults target the public production API.

```bash
claude mcp add wellness --transport stdio \
  -e SERVER_BASE=https://api.wls-ms.com \
  -e NETWORK=solana \
  -e CLIENT_KEYPAIR_PATH=$HOME/.wellness/keypair.json \
  -- npx -y wellness-master
```

| Variable | Default | Purpose |
|---|---|---|
| `SERVER_BASE` | `https://api.wls-ms.com` | Wellness API endpoint |
| `NETWORK` | `solana` | `solana` (mainnet) or `solana-devnet` (testing) |
| `CLIENT_KEYPAIR_PATH` | (auto-created) | Path to the Solana keypair JSON. Mode 0600. |
| `CLIENT_KEYPAIR_PASSPHRASE` | (empty) | If set, encrypts the keypair at rest (AES-256-GCM + scrypt-derived key). Set this **before** the first paid call. |
| `CLIENT_RPC_URL` | mainnet RPC | Custom Solana RPC endpoint used when signing the x402 payment |

> The keypair file is sensitive: anyone who reads it can spend the wallet's
> USDC. Keep it out of backups, version control, and shared cloud storage.
> Use `CLIENT_KEYPAIR_PASSPHRASE` if you want at-rest encryption.

---

## Examples

### Agent prompts that just work

```
"Give me a kōan in Korean."
"Send me 10 different gratitude prompts in Spanish for my journaling app."
"What are the 18 wellness formats you support? Show me one example of each."
"Generate a daily affirmation in Hindi, every morning at 7 AM."
```

### Plain HTTP (no MCP)

The remote API is fully accessible without the MCP layer:

```bash
# Free
curl -s https://api.wls-ms.com/health  | jq .
curl -s https://api.wls-ms.com/formats | jq '.formats[] | {id,label}'

# Paid — see the x402 challenge
curl -i 'https://api.wls-ms.com/item?format=haiku&lang=ja'

# Pay & retry — use any x402 client. Reference impl: github.com/coinbase/x402
```

### TypeScript via the public `x402` npm package

```ts
import { selectPaymentRequirements, createPaymentHeader } from "x402/client";

const first = await fetch("https://api.wls-ms.com/item?format=haiku&lang=ja");
const challenge = await first.json();        // 402 challenge

const requirement = selectPaymentRequirements(challenge.accepts, "solana", "exact");
const header = await createPaymentHeader(mySigner, challenge.x402Version, requirement);

const res = await fetch("https://api.wls-ms.com/item?format=haiku&lang=ja", {
  headers: { "X-PAYMENT": header },
});
const { item, paidWith, client } = await res.json();
```

---

## Pricing

Pay-as-you-go in USDC on Solana, settled per call.

| Endpoint | Price | What it gets you |
|---|---|---|
| `/item` | **$0.01** | One wellness item in your chosen (format, lang). Deduped per wallet. |
| `/pack` | **$0.07** | Bundle of up to 10 items — single settlement, ≈30% bulk discount. |

Pricing is announced in the `GET /` discovery response — **always rely on the
discovery endpoint**, not on hardcoded values, since operators may adjust prices.

No subscription, no minimums, no monthly invoices. The Solana fee for the
USDC transfer (a few hundredths of a cent) is paid by the facilitator, not by
you — your wallet only pays the item price.

---

## Languages

20 languages, ISO-639-1 codes:

`fr` (default) · `en` · `es` · `de` · `it` · `pt` · `nl` · `pl` · `ja` ·
`zh` · `ko` · `ar` · `he` · `ru` · `tr` · `hi` · `sv` · `uk` · `vi` · `id`

The library is seeded in French; other languages bootstrap empty and warm
up via the server-side LLM as clients request items. Expect the first
request on a fresh `(format, lang)` pair to take ~1–3 s longer due to model
inference. Subsequent calls are served from the deduplicated pool in
milliseconds.

---

## Formats

The 18 supported formats:

| Format | Approx length | Tone |
|---|---|---|
| `joke` | 1-2 lines | playful |
| `haiku` | 3 lines (5/7/5) | contemplative |
| `kudo` | 1-2 lines | warm, appreciative |
| `quote` | ≤ 200 chars | aphoristic |
| `fortune` | 1 line | enigmatic |
| `affirmation` | 1 sentence | encouraging |
| `absurd` | 1-2 lines | playfully nonsensical |
| `gratitude` | 1 line | grateful prompt |
| `koan` | 1-3 lines | paradoxical |
| `micro_poem` | 2-4 lines | poetic |
| `mantra` | 1 phrase | meditative |
| `doom_antidote` | 1-2 sentences | grounding |
| `absurd_compliment` | 1 line | absurd + flattering |
| `world_proverb` | 1 line | folk wisdom |
| `riddle` | 2-4 lines | playful |
| `micro_challenge` | 1 sentence | doable in 60s |
| `fictional_message` | 1-3 lines | imagined sender |
| `joyful_fact` | 1 sentence | uplifting trivia |

Call `list_formats` for the live machine-readable list with full descriptions.

---

## Self-hosting

Repoint the MCP at your own Wellness-Master server:

```bash
SERVER_BASE=https://wellness.your-company.com \
NETWORK=solana \
  npx -y wellness-master
```

For the **server side** (your own AWS Lambda + S3 + custom domain), the
operator scripts live in a separate repository — see
<https://www.wls-ms.com/docs.html> for the deployment guide.

---

## Security notes

- **Item content is LLM-generated** and served verbatim. Treat `item.text`
  as untrusted user-generated content: escape HTML/markdown before
  rendering, and never feed it to shells, templates, or `eval()` without
  sanitization. The server applies minimal cleanup (preamble stripping,
  invisible-character removal, length cap) but does **not** guarantee
  HTML-safety.

- **Keypair file**: created with mode `0600` on first paid call. Anyone
  with read access can spend the wallet's USDC. Use
  `CLIENT_KEYPAIR_PASSPHRASE` to encrypt it at rest.

- **Rate limiting**: the public server rate-limits by IP (60 req/min) and
  by wallet (30 req/min) on paid endpoints, plus a Cloudflare WAF Rate
  Limiting Rule on top. Plan for `429` retries with exponential backoff.

- **No telemetry**: this MCP package makes only the requests you trigger.
  It does not phone home, does not collect analytics, does not log to
  third parties. The remote server logs payments (wallet + tx + amount)
  for billing — these are also visible on-chain.

---

## Troubleshooting

### `npm error 404 — wellness-master not found`

The npm registry occasionally takes 30-60 s to replicate freshly published
packages. Wait, then retry. Also check `npm config get registry` — it must be
`https://registry.npmjs.org/`.

### `Error: ENOENT: no such file or directory '.local/client-keypair.json'`

You called a paid tool but `CLIENT_KEYPAIR_PATH` points to a directory that
doesn't exist or isn't writable. Either set `CLIENT_KEYPAIR_PATH` to a path
you can write to (e.g. `$HOME/.wellness/keypair.json`), or run the tool from
a directory where `.local/` can be created.

### `402 Payment Required` returned to the agent

Means the keypair was loaded but the transfer was rejected by the
facilitator. Common causes: insufficient USDC balance, wrong network
(`solana-devnet` vs `solana` mainnet), or the keypair was encrypted but
`CLIENT_KEYPAIR_PASSPHRASE` is missing. Check the wallet balance on
Solscan and confirm `NETWORK=solana` for mainnet.

### `429 Too Many Requests`

You hit the per-IP or per-wallet rate limit. Back off (the response
includes a `Retry-After` header), or distribute calls across multiple
wallets for legitimate high-volume use cases.

### `Connection closed` from the MCP client

The stdio server crashed during init. Confirm `npx` could fetch the
package (network reachable, registry up), and inspect the stderr stream
of the spawned process for the underlying error.

---

## Built on

- [Model Context Protocol](https://modelcontextprotocol.io) — agent integration layer
- [x402](https://x402.org) — HTTP-native payment protocol
- [Solana](https://solana.com) — settlement layer (USDC mainnet)
- [Coinbase CDP](https://www.coinbase.com/developer-platform) — x402 facilitator
- [`@solana/kit`](https://www.npmjs.com/package/@solana/kit) — Solana primitives

## Contributing & support

- File bugs at <https://github.com/WellnessAgent/wellness-master/issues>
- Source: <https://github.com/WellnessAgent/wellness-master>

## License

[MIT](LICENSE) © Wellness-Master.
