# Dockerfile — wellness-master MCP server (stdio).
#
# Used by automated MCP catalog services (Glama, Smithery introspection runs,
# any future Anthropic Connector Directory) to spin up the server in a sandbox
# and verify it speaks the MCP protocol.
#
# For local dev / production, prefer `npx -y wellness-master` directly — this
# Dockerfile is opt-in for catalog crawlers, not the recommended install path.
#
# Build : docker build -t wellness-master .
# Run   : docker run --rm -i wellness-master    # MCP stdio
#
# The image runs as a non-root user, ships only the runtime deps (no devDeps,
# no source map, no test files), and has zero attack surface beyond what the
# stdio MCP protocol exposes.

FROM node:22-alpine AS base

# Run as non-root from the start
RUN addgroup -S wm && adduser -S wm -G wm
WORKDIR /app
RUN chown wm:wm /app

USER wm

# Install only the published npm package (smaller image, vetted artifact)
# rather than copying source. The image will run on whatever version is
# resolved from the npm registry at build time — pin via build-arg if needed.
ARG WM_VERSION=latest
RUN npm install --no-save --omit=dev "wellness-master@${WM_VERSION}"

# Free read-only tools (sample_one, list_*, get_health) work out of the box.
# Paid tools require a Solana keypair — pass at runtime via:
#   docker run --rm -i \
#     -e CLIENT_KEYPAIR_PATH=/keys/client.json \
#     -v $HOME/.wellness:/keys:ro \
#     wellness-master
ENV SERVER_BASE=https://api.wls-ms.com \
    NETWORK=solana \
    NODE_ENV=production

# Stdio MCP server — no exposed ports.
ENTRYPOINT ["npx", "wellness-master"]
