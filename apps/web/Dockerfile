FROM node:24-bookworm-slim AS build
WORKDIR /workspace

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci

COPY . .
RUN npm run build --workspace @lumina/web

FROM node:24-bookworm-slim AS production
WORKDIR /workspace
ENV NODE_ENV=production

COPY --from=build /workspace/apps/web/.next/standalone ./
COPY --from=build /workspace/apps/web/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
