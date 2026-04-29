# wellness-master

[![npm](https://img.shields.io/npm/v/wellness-master.svg)](https://www.npmjs.com/package/wellness-master)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![x402](https://img.shields.io/badge/x402-Solana%20mainnet-9945ff)](https://x402.org)

**Pay-per-call wellness micro-content** — 18 formats × 20 languages, settled in
USDC on Solana via the [x402 protocol](https://x402.org). One-line install as
an MCP server (Claude Code, Claude Desktop, Cursor, …).

- 🌐 **Live API** : <https://api.wls-ms.com>
- 📖 **Docs** : <https://www.wls-ms.com/docs.html>
- 🔌 **MCP manifest** : <https://www.wls-ms.com/mcp.json>

---

## Install

### As an MCP server (zero clone, recommended)

```bash
claude mcp add wellness --transport stdio -- npx -y wellness-master
claude mcp list   # → wellness ✓ Connected
```

`npx` fetches the package on first run and caches it. The four free tools
(`list_formats`, `list_languages`, `get_catalog`, `get_health`) work out of
the box. The two paid tools (`get_item`, `get_pack`) need a Solana keypair
with USDC — see [Configuration](#configuration).

### From git (for contributors / self-hosting)

```bash
git clone https://github.com/WellnessAgent/wellness-master.git
cd wellness-master
npm install
npm run mcp:server   # local stdio MCP, points at https://api.wls-ms.com
```

---

## What you get

| Tool | Free | Description |
|---|---|---|
| `list_formats` | ✓ | 18 wellness formats (joke, haiku, kōan, affirmation, …) |
| `list_languages` | ✓ | 20 languages (ISO-639-1 + native names) |
| `get_catalog` | ✓ | Library item counts per (format, language) |
| `get_health` | ✓ | Liveness + storage backend |
| `get_item` | $0.01 | One wellness item, dedup'd per wallet |
| `get_pack` | $0.07 | Up to 10 items in one settlement |

Items are deduplicated per (wallet, format, language) — the same wallet never
receives the same string twice. Every paid call settles a single Solana USDC
transfer via the [Coinbase CDP facilitator](https://docs.cdp.coinbase.com/x402/welcome).

---

## Configuration

All env vars are optional — sensible defaults target the public production API.

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
| `NETWORK` | `solana` | `solana` (mainnet) or `solana-devnet` |
| `CLIENT_KEYPAIR_PATH` | (auto-created on first paid call) | Solana keypair JSON file. **Required only for paid tools.** |
| `CLIENT_KEYPAIR_PASSPHRASE` | (empty) | If set, encrypts the keypair at rest (AES-256-GCM + scrypt). |

---

## Self-hosting

The repo ships everything needed to run your own Wellness-Master stack on AWS
(Lambda + S3 + SNS/SQS + custom domain via API Gateway), with idempotent setup
and teardown scripts.

```bash
git clone https://github.com/WellnessAgent/wellness-master.git
cd wellness-master
make install          # node deps + .env scaffold
make aws-bootstrap    # create the IAM user (one-time, requires root creds)
make cf-token         # create a Cloudflare token (one-time)
make deploy-all       # AWS + custom domain + DNS + static site (idempotent)
```

See [`docs/deployment-checklist.fr.md`](docs/deployment-checklist.fr.md) for
the full operator guide. Tear down with `make purge-all YES=1`.

---

## Pricing

Pay-as-you-go in USDC on Solana, settled per call. No subscription, no minimum.

- **$0.01** per `/item` call
- **$0.07** per `/pack` (up to 10 items, ≈30% bulk discount)

Pricing is announced in the `GET /` discovery response — always rely on it as
the source of truth (operators may adjust prices over time).

---

## Built on

- [x402](https://x402.org) — HTTP-native payment protocol
- [Solana](https://solana.com) — settlement layer (USDC mainnet)
- [Model Context Protocol](https://modelcontextprotocol.io) — agent integration
- [Coinbase CDP](https://www.coinbase.com/developer-platform) — facilitator

## License

[MIT](LICENSE).
