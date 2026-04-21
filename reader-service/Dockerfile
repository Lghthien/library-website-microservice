# Stage 1: Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Production Dependencies stage
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm audit fix --only=production || true

# Stage 3: Runtime stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Remove npm to eliminate its bundled vulnerable deps from security scans
RUN npm uninstall -g npm && rm -rf /usr/local/lib/node_modules/npm

EXPOSE 4005
CMD ["node", "dist/main"]
