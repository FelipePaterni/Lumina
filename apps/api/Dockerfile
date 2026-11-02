FROM node:24-bookworm-slim AS build
WORKDIR /workspace
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci

COPY . .
RUN npm run db:generate
RUN npm run build --workspace @lumina/api

FROM node:24-bookworm-slim AS production
WORKDIR /workspace
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci --omit=dev

COPY --from=build /workspace/node_modules/.prisma node_modules/.prisma
COPY --from=build /workspace/apps/api/dist apps/api/dist
EXPOSE 3001
CMD ["node", "apps/api/dist/main.js"]
