###############################################################################
# STRESSNES — multi-stage Dockerfile
# Produces a single Railway service: Express serves the API (/api) and the
# Vite-compiled frontend (everything else) from one container.
###############################################################################

###############################################################################
# Stage 1 – base: Node 20 + pnpm
###############################################################################
FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.26.1 --activate

###############################################################################
# Stage 2 – deps: install all workspace dependencies
# Only the package manifests are copied here so that this expensive layer is
# cached until a dependency actually changes.
###############################################################################
FROM base AS deps
WORKDIR /app

# Workspace root manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./

# lib packages
COPY lib/api-client-react/package.json   lib/api-client-react/
COPY lib/api-spec/package.json           lib/api-spec/
COPY lib/api-zod/package.json            lib/api-zod/
COPY lib/db/package.json                 lib/db/
COPY lib/object-storage-web/package.json lib/object-storage-web/

# artifact packages
COPY artifacts/api-server/package.json    artifacts/api-server/
COPY artifacts/stressnes/package.json     artifacts/stressnes/
COPY artifacts/mockup-sandbox/package.json artifacts/mockup-sandbox/

# scripts package
COPY scripts/package.json scripts/

RUN pnpm install --frozen-lockfile

###############################################################################
# Stage 3 – frontend-builder: compile the Vite / React storefront
###############################################################################
FROM deps AS frontend-builder
WORKDIR /app

# Copy full source on top of the already-installed node_modules
COPY . .

# PORT is validated at vite.config.ts load time (dev-server config only, not
# used in production builds). BASE_PATH=/ means assets load from the domain root.
RUN NODE_ENV=production PORT=3000 BASE_PATH=/ \
    pnpm --filter @workspace/stressnes run build

###############################################################################
# Stage 4 – api-builder: compile the Express API with esbuild
###############################################################################
FROM deps AS api-builder
WORKDIR /app

COPY . .

RUN pnpm --filter @workspace/api-server run build

###############################################################################
# Stage 5 – runtime: minimal image (~200 MB) containing only built artefacts
###############################################################################
FROM node:20-slim AS runtime
WORKDIR /app
# build.mjs marks "@google-cloud/*" as external (not bundled), so the real
# package needs to actually exist in node_modules at runtime.
RUN npm install --no-save @google-cloud/storage@^7.21.0
# Self-contained esbuild bundle (all workspace deps are inlined)
COPY --from=api-builder     /app/artifacts/api-server/dist  ./dist

# Compiled Vite output (HTML + JS + CSS, served as static files by Express)
COPY --from=frontend-builder /app/artifacts/stressnes/dist/public ./public

ENV NODE_ENV=production
# Railway injects PORT at runtime. 3000 is the fallback shown in docs.
EXPOSE 3000

CMD ["node", "--enable-source-maps", "./dist/index.mjs"]
