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
# Ensure client lib is explicitly copied (some build contexts may omit nested folders)
COPY client/src/lib ./client/src/lib
# Debug: list client src lib to ensure the file is present in the Docker build context
RUN echo "--- DEBUG: listing client/src ---" && ls -la client/src || true
RUN echo "--- DEBUG: listing client/src/lib ---" && ls -la client/src/lib || true

# Build the app
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
