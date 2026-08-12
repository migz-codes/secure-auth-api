FROM oven/bun:1-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

ENV DATABASE_URL="postgresql://user:pass@localhost:5432/placeholder"
RUN bun run prisma:generate
RUN bun run build

RUN rm -rf node_modules && bun install --frozen-lockfile --production

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
