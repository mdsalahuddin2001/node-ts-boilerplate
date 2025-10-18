# Multi-stage build for production
FROM node:24-alpine AS base

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# ============================================
# Development stage
# ============================================
FROM base AS development

# Install all dependencies (including dev)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Expose port
EXPOSE 4000

CMD ["pnpm", "run", "dev"]

# ============================================
# Build stage
# ============================================
FROM base AS builder

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build TypeScript to JavaScript
RUN pnpm run build

# Remove dev dependencies
RUN pnpm prune --prod

# ============================================
# Production stage
# ============================================
FROM node:24-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy built application from builder
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json

# Copy config files
COPY --chown=nodejs:nodejs config ./config

# Create logs directory with proper permissions
RUN mkdir -p logs && chown -R nodejs:nodejs logs

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "dist/src/app.js"]