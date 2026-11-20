# syntax=docker/dockerfile:1
#
# One image for the public deployment: the Express API plus the compiled React
# bundle that the API serves from `client/dist`. There is no separate web
# container — a second origin would only re-introduce CORS and cookie
# configuration that the single-service layout avoids.
#
# Stages:
#   build    installs every dependency, compiles client and server
#   migrate  Prisma CLI only, for `prisma migrate deploy` (one-shot compose job)
#   runtime  production dependencies + build output, runs as the `node` user

FROM node:20-bookworm-slim AS base
ENV NODE_ENV=production \
    NPM_CONFIG_UPDATE_NOTIFIER=false \
    NPM_CONFIG_FUND=false
WORKDIR /app
# openssl: the Prisma query engine links against it.
# ca-certificates: outbound HTTPS to Gnani, the assistant LLM endpoint and Resend.
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

FROM base AS build
ENV NODE_ENV=development
# Puppeteer is a client dev dependency used for local browser checks. Its
# Chromium download is ~200 MB and is never used inside this image.
ENV PUPPETEER_SKIP_DOWNLOAD=true
# Baked into the bundle at build time; the browser reads them from the export.
ARG VITE_AI_SERVICE_URL=""
ARG VITE_SUPABASE_URL=""
ARG VITE_SUPABASE_ANON_KEY=""
ENV VITE_AI_SERVICE_URL=$VITE_AI_SERVICE_URL \
    VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
COPY client/package.json client/package-lock.json ./client/
COPY server/package.json server/package-lock.json ./server/
COPY server/prisma ./server/prisma
RUN npm ci --prefix client && npm ci --prefix server
COPY client ./client
COPY server ./server
# The server's own build runs `prisma generate` again in its postbuild hook, so
# the generated client always matches the schema that was just compiled.
RUN npm --prefix client run build \
    && npm --prefix server run build \
    && npm --prefix server prune --omit=dev

FROM base AS migrate
ENV NODE_ENV=development
COPY server/package.json server/package-lock.json ./server/
COPY server/prisma ./server/prisma
RUN npm ci --prefix server
WORKDIR /app/server
# The local binary, not `npx`: if the CLI were ever missing this must fail loudly
# rather than silently downloading one at deploy time.
CMD ["./node_modules/.bin/prisma", "migrate", "deploy"]

FROM base AS runtime
COPY --from=build --chown=node:node /app/server/dist ./server/dist
COPY --from=build --chown=node:node /app/server/node_modules ./server/node_modules
COPY --from=build --chown=node:node /app/server/prisma ./server/prisma
COPY --from=build --chown=node:node /app/server/package.json ./server/package.json
COPY --from=build --chown=node:node /app/client/dist ./client/dist

# Never root. The app only reads its build output; writer caches land in the
# `node` user's home directory.
USER node

EXPOSE 5000

# Liveness only: /health is a readiness probe that returns 503 when Postgres is
# unreachable, which would restart a container that is doing nothing wrong.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||5000)+'/livez').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server/dist/app.js"]
