FROM oven/bun:1-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

# Prisma generate only reads the schema, never connects — but the CLI still
# requires the variable to be set, so a throwaway value is enough here.
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/placeholder"
RUN bun run prisma:generate
RUN bun run build

# Reinstall with production deps only, so dev dependencies never reach runtime.
RUN rm -rf node_modules && bun install --frozen-lockfile --production

# Production
FROM node:22-alpine
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs appuser

COPY --from=builder --chown=appuser:nodejs /app/dist ./dist
COPY --from=builder --chown=appuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:nodejs /app/package.json ./
COPY --from=builder --chown=appuser:nodejs /app/prisma ./prisma
COPY --from=builder --chown=appuser:nodejs /app/generated ./generated

USER appuser

EXPOSE 3001

CMD ["node", "dist/src/main"]
