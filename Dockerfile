# ── Build stage ──
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# ── Production stage ──
FROM node:22-alpine
WORKDIR /app

# Non-root user for security
RUN addgroup -S atom && adduser -S atom -G atom

# Copy dependencies, then source
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Own everything by the non-root user
RUN chown -R atom:atom /app
USER atom

EXPOSE 3900
CMD ["node", "server.js"]
