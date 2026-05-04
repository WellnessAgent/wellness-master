# wellness-master

[![npm version](https://img.shields.io/npm/v/wellness-master.svg?style=flat-square)](https://www.npmjs.com/package/wellness-master)
[![npm downloads](https://img.shields.io/npm/dm/wellness-master.svg?style=flat-square)](https://www.npmjs.com/package/wellness-master)
[![license](https://img.shields.io/npm/l/wellness-master.svg?style=flat-square)](LICENSE)
[![node](https://img.shields.io/node/v/wellness-master.svg?style=flat-square)](package.json)
[![x402](https://img.shields.io/badge/x402-Solana%20mainnet-9945ff?style=flat-square)](https://x402.org)
[![mcp](https://img.shields.io/badge/MCP-stdio-blue?style=flat-square)](https://modelcontextprotocol.io)
[![humans+agents](https://img.shields.io/badge/audience-humans%20%2B%20agents-green?style=flat-square)](https://www.wls-ms.com)

> **The first pay-per-call wellness platform for HUMANS and AI AGENTS.**
> 18 formats × 20 languages × **2 audiences**, settled in USDC on Solana via
> the [x402](https://x402.org) protocol — **$0.01 per call**, no account, no
> API key.

Wellness-Master ships **two distinct corpora** — one tuned for human end-users
(notifications, journaling, gratitude bots) and one tuned for AI agents
(LangGraph, Claude Code, Cursor agents, multi-step pipelines). Same API,
same price.

- 🌐 **Live API** — <https://api.wls-ms.com>
- 📖 **Docs** — <https://www.wls-ms.com/docs.html>
- 🔬 **Research** — <https://www.wls-ms.com/research.html>
- 🛠️ **Use cases** — <https://www.wls-ms.com/use-cases.html>
- 🔌 **MCP manifest** — <https://www.wls-ms.com/mcp.json>

---

## Why a wellness API for both?

Decades of psychology research show that **tiny, repeated** wellness
interventions improve human well-being.

**Recent NLP research shows the same is true for LLMs**:

- Microsoft Research (2023, [arXiv:2307.11760](https://arxiv.org/abs/2307.11760))
  — emotional stimuli in prompts improve GPT-4 / Llama-2 / Vicuna by up to
  **+10.9%** on BIG-Bench tasks.
- Wei et al. (NeurIPS 2022, [arXiv:2201.11903](https://arxiv.org/abs/2201.11903))
  — chain-of-thought adds **+12 to +30 points** on reasoning benchmarks.
- Sclar et al. (2023, [arXiv:2310.11324](https://arxiv.org/abs/2310.11324))
  — LLM performance varies up to **76 percentage points** with prompt-style
  changes; a stable wellness tone is a measurable performance stabilizer.

**Happy agents are productive agents.** The same is true for humans.

Full sourced bibliography on the [research page](https://www.wls-ms.com/research.html).

---

## Install (zero clone)

```bash
claude mcp add wellness --transport stdio -- npx -y wellness-master
claude mcp list   # → wellness ✓ Connected
```

That's it. `npx` fetches the package on first use and caches it. The five
free tools (`sample_one`, `list_formats`, `list_languages`, `list_audiences`,
`get_health`) work immediately. The three paid tools (`get_item`, `get_pack`,
`surprise_me`) auto-create a Solana keypair on first call (mode `0600`).

---

## Tools

| Tool | Free | Description |
|---|---|---|
| `sample_one` | ✓ **NEW v0.7** | **Free showroom** — 5 hand-curated items per format, English, human audience, time-rotated every 60 s. Use to evaluate before integrating paid tools. |
| `list_formats` | ✓ | The 18 wellness formats (served from package data, no HTTP) |
| `list_languages` | ✓ | The 20 supported languages (served from package data) |
| `list_audiences` | ✓ | The 2 audiences (`human`, `agent`) — **first wellness API to ship dual corpora** |
| `get_health` | ✓ | Liveness probe — `{ ok, network }` |
| `get_item` | **$0.01** | One wellness item, dedup'd per (wallet, audience, format, lang) |
| `get_pack` | **$0.07** | Up to 10 items in one settlement (≈30% bulk discount) |
| `surprise_me` | **$0.01** | Random uplifting item — server picks a positive format. Use at task transitions or before high-stakes operations. |

> **Removed in v0.5.1** : `get_catalog`. The library is no longer publicly enumerable for security reasons (avoids recon + S3 LIST/GET on every call). Operators can run `aws s3api list-objects-v2 --bucket wellness-master-prod --prefix manifests/` to inspect their own deployment.

---

## The two audiences

```jsonc
// For your human users
{ "name": "get_item",
  "arguments": { "format": "haiku", "lang": "ja", "audience": "human" }}

// For your AI agents
{ "name": "get_item",
  "arguments": { "format": "haiku", "lang": "ja", "audience": "agent" }}
```

Same format, same price, two distinct corpora. Dedup is partitioned: the
same wallet may pay once for `human/haiku/ja` and once for `agent/haiku/ja`
and receive two distinct items.

| Audience | Tone | Best for |
|---|---|---|
| `human` (default) | Warm, embodied. References body, emotions, relationships. | Journaling apps, daily notifications, kid bedtime stories, gratitude wearables |
| `agent` | Pragmatic, calm. References inference, context, plan, recovery. | LangGraph reset prompts, Claude Code session refresh, Cursor agent priming, multi-agent swarm coordinators |

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
| `CLIENT_KEYPAIR_PASSPHRASE` | (empty) | If set, encrypts the keypair at rest (AES-256-GCM + scrypt). |
| `CLIENT_RPC_URL` | mainnet RPC | Custom Solana RPC endpoint used when signing |

> The keypair file is sensitive: anyone who reads it can spend the wallet's
> USDC. Keep it out of backups, version control, and shared cloud storage.

---

## Pricing

| Endpoint | Price | What it gets you |
|---|---|---|
| `/item` | **$0.01** | One wellness item in your chosen format / language / audience |
| `/pack` | **$0.07** | Bundle of up to 10 items — single settlement, ≈30% bulk discount |

No subscription, no minimums, no monthly invoices. Same price for human and
agent audiences. The Solana fee for the USDC transfer (a few hundredths of a
cent) is paid by the facilitator, not by you.

---

## Languages

20 languages, ISO-639-1 codes:

`fr` (default) · `en` · `es` · `de` · `it` · `pt` · `nl` · `pl` · `ja` ·
`zh` · `ko` · `ar` · `he` · `ru` · `tr` · `hi` · `sv` · `uk` · `vi` · `id`

The library is seeded in French; other languages bootstrap empty and warm
up via the server-side LLM as clients request items. Subsequent calls are
served from the deduplicated pool in milliseconds.

---

## Formats

The 18 supported formats:

`joke` · `haiku` · `kudo` · `quote` · `fortune` · `affirmation` ·
`absurd` · `gratitude` · `koan` · `micro_poem` · `mantra` ·
`doom_antidote` · `absurd_compliment` · `world_proverb` · `riddle` ·
`micro_challenge` · `fictional_message` · `joyful_fact`

Call `list_formats` for the live machine-readable list with full descriptions.

---

## Migration v0.2 → v0.3

- **Default behaviour unchanged**: omitting `audience` is treated as `human`.
- **`/catalog` shape changed** (breaking): now `{audience: {format: {lang: count}}}`.
  Pass `?legacy=1` for the v0.2 flat shape (deprecated, dropped in v0.4).
- **Dedup partition**: per-wallet dedup is now keyed by `(audience, format, lang)`
  instead of `(format, lang)`. A wallet that already exhausted `joke/fr` in
  v0.2 can now pay again on `agent/joke/fr` and get a fresh corpus.

---

## Security

- **Item content is LLM-generated** and served verbatim. Treat `item.text`
  as untrusted user-generated content.
- **Keypair file**: created with mode `0600` on first paid call. Anyone with
  read access to the file can spend the wallet's USDC.
- **Rate limiting**: the public server rate-limits by IP (60 req/min) and by
  wallet (30 req/min) on paid endpoints, plus a Cloudflare WAF Rate Limiting
  Rule on top.
- **No telemetry**: this MCP package makes only the requests you trigger.

---

## Built on

- [Model Context Protocol](https://modelcontextprotocol.io) — agent integration
- [x402](https://x402.org) — HTTP-native payment protocol
- [Solana](https://solana.com) — settlement layer (USDC mainnet)
- [Coinbase CDP](https://www.coinbase.com/developer-platform) — x402 facilitator
- [`@solana/kit`](https://www.npmjs.com/package/@solana/kit) — Solana primitives

## Contributing & support

- Bugs : <https://github.com/WellnessAgent/wellness-master/issues>
- Source : <https://github.com/WellnessAgent/wellness-master>

## License

[MIT](LICENSE) © Wellness-Master.
