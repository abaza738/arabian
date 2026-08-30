FROM node:24 AS base
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
# Corepack caches the pnpm it downloads under $HOME, and the install below runs
# as root while the container runs as `node` — two different homes, so the shim
# would try to re-download pnpm at start-up. Park the cache inside /app instead,
# which the runner hands to `node` wholesale.
ENV COREPACK_HOME=/app/.corepack
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY cms/package.json cms/
COPY ui/package.json ui/
RUN pnpm install --frozen-lockfile --filter cms

FROM deps AS builder
COPY cms/ cms/
ENV DATABASE_CLIENT=postgres
RUN pnpm --filter cms build

FROM base AS runner
ENV NODE_ENV=production
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY cms/package.json cms/
COPY ui/package.json ui/
RUN pnpm install --frozen-lockfile --prod --filter cms

COPY cms/tsconfig.json cms/
COPY --from=builder /app/cms/dist ./cms/dist
COPY --from=builder /app/cms/public ./cms/public
COPY --from=builder /app/cms/src ./cms/src
COPY --from=builder /app/cms/config ./cms/config
COPY --from=builder /app/cms/data ./cms/data
COPY --from=builder /app/cms/scripts ./cms/scripts

# Docker seeds a new named volume from the image directory it covers, ownership
# included, so `cms/public/uploads` reaching this line owned by `node` is what
# lets Strapi write uploads without any runtime chown.
RUN chown -R node:node /app
USER node

WORKDIR /app/cms
EXPOSE 1337
CMD ["pnpm", "start"]
