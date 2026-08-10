# CLAUDE.md

Conventions for this repo. Several are non-obvious and easy for tooling to violate.

This is a **JWT authentication study project**: login, access/refresh tokens, guards. Nothing else belongs here — no marketplace integrations, no LLM calls, no queues.

## Package management

- **Bun, not npm.** Only `bun.lock` exists. Use `bun add` / `bun remove` / `bun run`.
- **Exact versions, no `^` or `~`.** `.npmrc` sets `save-exact=true` and every dependency is pinned. Preserve this when adding deps.

## Code style — Biome, not ESLint/Prettier

`biome.json` is authoritative. `@typescript-eslint` is *not* installed and there is no ESLint config.

- **No semicolons** (`semicolons: "asNeeded"`)
- Single quotes
- No trailing commas
- 2-space indent
- `lineWidth: 100`

Run `bun run format` to apply fixes, `bun run lint` to check (`biome lint` + `tsc --noEmit`).

## Prisma

Prisma 7 with the **`prisma-client` generator** (not `prisma-client-js`). The client is generated as TypeScript source into `generated/prisma/`.

```typescript
// correct
import { PrismaClient } from '../../../generated/prisma/client'

// wrong — this package is a transitive dep, not the generated client
import { PrismaClient } from '@prisma/client'
```

- The datasource URL lives in `prisma.config.ts`, not in `schema.prisma`.
- Schema conventions: `snake_case` fields, `String @id @default(uuid())` primary keys, `created_at` / `updated_at` timestamps.
- `generated/` and `dist/` are excluded from Biome.
- Two models only: `User` and `RefreshToken`. One `RefreshToken` row per issued token, with the row id as the token's `jti` — revocation is a row delete.

## NestJS

- **Nest 11**, Express platform (`NestExpressApplication`), port **3001**, bound `0.0.0.0`.
- Config namespaces use `registerAs('name', () => ({...}))` with an exported interface — see `src/app.config.ts`.
- Env vars are validated by a Joi schema in `src/config/env.validation.ts`. `@nestjs/config` passes `allowUnknown: true` by default; don't override `validationOptions` without re-adding it.
- `PrismaModule` is `@Global()` — feature modules don't need to import it.
- The global `ValidationPipe` sets `whitelist: true` and `forbidNonWhitelisted: true`, so any unmodelled property in a request body is a 400. Every payload needs a DTO.
