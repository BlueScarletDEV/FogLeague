# ==============================================================
# FOGLEAGUE — PRODUCTION MULTI-STAGE DOCKERFILE
# Ultra-léger, sécurisé (non-root user), production-ready
# ==============================================================

# Étape 1 : Construction du Frontend Vite / React
FROM node:22-alpine AS builder

WORKDIR /app

# Installation des dépendances avec cache Docker
COPY package*.json ./
RUN npm ci

# Copie des sources et compilation de production
COPY . .
RUN npm run build

# ==============================================================
# Étape 2 : Image finale de production minimale
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Installation uniquement des dépendances de production
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copie du backend et du build frontend statique
COPY server ./server
COPY --from=builder /app/dist ./dist

# Sécurité : Exécution sous l'utilisateur non-privilégié 'node'
USER node

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3001/api/health || exit 1

CMD ["node", "server/index.js"]
