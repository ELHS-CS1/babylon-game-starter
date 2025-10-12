# Multi-stage Docker build for Babylon.js Multiplayer Game
FROM node:22-alpine AS builder

# Add labels for better container management
LABEL maintainer="SIGMA PRODUCTIONS"
LABEL description="Babylon.js Multiplayer Game with Node 22"
LABEL version="1.0.0"

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./

# Copy scripts directory for postinstall
COPY scripts ./scripts/

# Install dependencies with npm ci for faster, reliable builds
# Skip postinstall script in Docker (no need for local SSL certs)
RUN npm ci --include=dev --ignore-scripts

# Copy source code
COPY src ./src/
COPY index.html ./
COPY assets ./assets/

# Build the application
RUN npm run build

# Production stage
FROM node:22-alpine AS production

# Set working directory
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy built application
COPY --from=builder /app/dist ./dist/
COPY --from=builder /app/src/server/dist ./dist/server/
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/assets ./assets/

# Install only production dependencies with npm ci for faster builds
# Skip postinstall script in Docker (no need for local SSL certs)
RUN npm ci --omit=dev --ignore-scripts

# Set production environment variables for Node 22 optimization
ENV NODE_ENV=production
ENV PROD=true
ENV DOCKER=true
ENV NODE_OPTIONS="--max-old-space-size=2048 --enable-source-maps"
ENV UV_THREADPOOL_SIZE=16
ENV NODE_NO_WARNINGS=1

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S babylongame -u 1001

# Change ownership of the app directory
RUN chown -R babylongame:nodejs /app

# Switch to non-root user
USER babylongame

# Set working directory permissions
WORKDIR /app

# Expose Render.com default port (10000)
EXPOSE 10000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "const port = process.env.PORT || 10000; require('http').get(\`http://localhost:\${port}/health\`, (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Start the application with dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server/index.js"]
