# syntax=docker/dockerfile:1.7
#
# Build multi-stage : les dépendances de production sont installées à part de
# celles nécessaires à la compilation TypeScript, et l'image finale ne contient
# que node + node_modules de prod + dist/.
#
# Node 20 -> 26 : Node 20 est en fin de vie depuis avril 2026 et ne reçoit plus
# de correctifs. Trivy ne le signalait pas parce que `--ignore-unfixed` masque
# précisément les CVE sans correctif disponible — un socle non maintenu passait
# donc les scans en vert.
#
# La version précédente retirait déjà npm et npx du runtime, ce qui était le bon
# réflexe. On conserve ce principe en l'étendant à corepack et yarn, et on ajoute
# ce qui manquait : un utilisateur non-root. L'image tournait en root alors que
# le port 3000 ne l'exigeait pas.

# ── Stage 1 : dépendances de production uniquement ───────────────────────────
FROM node:26-alpine AS deps

ENV NODE_ENV=production \
    PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH

RUN apk update && apk upgrade --no-cache

# pnpm épinglé. Pas de corepack : il a été retiré du bundle Node à partir de
# Node 25/26.
RUN npm install -g pnpm@10.33.4 --no-audit --no-fund

WORKDIR /app

# .npmrc porte ignore-scripts=true : seuls les paquets listés dans
# pnpm.onlyBuiltDependencies ont le droit d'exécuter leurs scripts d'install.
COPY package.json pnpm-lock.yaml .npmrc ./

RUN pnpm install --prod --frozen-lockfile \
    && pnpm store prune 2>/dev/null || true

# ── Stage 2 : compilation TypeScript ─────────────────────────────────────────
FROM node:26-alpine AS build

ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH

RUN apk update && apk upgrade --no-cache
RUN npm install -g pnpm@10.33.4 --no-audit --no-fund

WORKDIR /app

COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

# ── Stage 3 : image runtime minimale ─────────────────────────────────────────
FROM node:26-alpine AS runtime

ENV NODE_ENV=production

RUN apk update && apk upgrade --no-cache

# HARDENING SUPPLY-CHAIN : le runtime n'exécute que `node dist/server.js`.
# En retirant npm, npx, corepack et yarn, toutes les CVE de leurs dépendances
# bundlées (tar, cross-spawn, glob, minimatch, undici, sigstore…) disparaissent
# sans aucun patch à maintenir.
RUN rm -rf \
      /usr/local/lib/node_modules/npm \
      /usr/local/lib/node_modules/corepack \
      /usr/local/bin/npm \
      /usr/local/bin/npx \
      /usr/local/bin/corepack \
      /opt/yarn-* \
      /usr/local/bin/yarn \
      /usr/local/bin/yarnpkg \
    && rm -rf /root/.npm /root/.cache 2>/dev/null || true

WORKDIR /app

# L'utilisateur `node` (uid 1000) est fourni par l'image officielle.
COPY --from=deps  --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./

USER node

EXPOSE 3000

CMD ["node", "dist/server.js"]
