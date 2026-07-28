# =============================================================================
# THIRD-EYE FRONTEND - PRODUCTION CONTAINER
# =============================================================================
# Next.js App Router frontend for Gray Zone Monitor.
# Connects to GZM API (8080), MCP (8090), GEOINT (8080), ISR (8087).
#
# Build:
#   docker build -t gzm-third-eye:latest .
#
# Run:
#   docker run -p 3000:3000 --network gzm-network gzm-third-eye:latest
#
# DARPA SBIR: DPA26BZ04-DV015 | CAGE: 22HU5
# =============================================================================

# Stage 1: Install dependencies
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Stage 2: Build application
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time env vars (public, safe to embed)
ENV NEXT_PUBLIC_GZM_API_URL=http://gzm-api:8080
ENV NEXT_PUBLIC_GZM_MCP_URL=http://gzm-mcp:8090
ENV NEXT_PUBLIC_GZM_GEOINT_URL=http://gzm-geoint:8080
ENV NEXT_PUBLIC_GZM_ISR_URL=http://gzm-isr:8087
ENV NEXT_PUBLIC_GZM_REPORTING_URL=http://gzm-reporting:8086
ENV NEXT_PUBLIC_GZM_WS_URL=ws://gzm-gods-eye:9090/ws
ENV NEXT_PUBLIC_MAP_URL=https://map.grayzonemonitor.com
ENV NEXT_PUBLIC_APP_URL=https://grayzonemonitor.com

RUN npm run build

# Stage 3: Production runtime (minimal)
FROM node:22-alpine AS runner
WORKDIR /app

LABEL maintainer="Connor Vandenberg <connorm.vandenberg@outlook.com>"
LABEL org.opencontainers.image.title="GZM Third-Eye Frontend"
LABEL org.opencontainers.image.description="Next.js OSINT intelligence dashboard for Gray Zone Monitor"
LABEL org.opencontainers.image.version="1.0.0"
LABEL org.opencontainers.image.vendor="Connor M Vandenberg"
LABEL org.opencontainers.image.licenses="Proprietary"
LABEL mil.dod.cage="22HU5"
LABEL gov.darpa.sbir="DPA26BZ04-DV015"

ENV NODE_ENV=production

# Create non-root user (STIG V-222386)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root
USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=10s \
    CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
