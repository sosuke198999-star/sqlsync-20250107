# syntax=docker/dockerfile:1

FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
# `npm ci` requires a package-lock.json. This project currently excludes package-lock.json
# so use `npm install` including dev dependencies (esbuild etc.) required during the build stage.
RUN npm install --include=dev --ignore-scripts --no-audit --no-fund

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Copy only runtime artifacts
COPY --from=build /app/dist ./dist
COPY --from=build /app/attached_assets ./attached_assets
COPY package*.json ./

EXPOSE 5000
CMD ["node", "dist/index.js"]
