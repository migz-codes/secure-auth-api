# secure-auth-api

JWT authentication study project — NestJS 11 + Prisma 7 + PostgreSQL.

Access token / refresh token flow: short-lived access JWT, rotating refresh token persisted one row per `jti`, revocation by row deletion, and a scheduled sweep of expired rows.

---

## Stack

| Concern | Choice |
|---|---|
| Framework | NestJS 11 (Express) |
| Runtime / package manager | Bun |
| Database | PostgreSQL via Prisma 7 (`prisma-client` generator) |
| Auth | `@nestjs/jwt`, bcrypt |
| Lint / format | Biome |
| Tests | Jest + Supertest |

## Requirements

- [Bun](https://bun.sh) 1.3+
- Docker & Docker Compose (for Postgres)

---

## Getting started

```bash
# 1. Install dependencies
bun install

# 2. Configure the environment
cp .env.example .env
#    Then generate the two signing keys, one per token class:
#      openssl rand -hex 32   -> JWT_ACCESS_SECRET
#      openssl rand -hex 32   -> JWT_REFRESH_SECRET

# 3. Start infrastructure
docker compose up -d postgres

# 4. Set up the database
bun run prisma:generate
bun run prisma:migrate init

# 5. Run
bun run dev
```

The app listens on **port 3001**.

---

## Scripts

| Script | Purpose |
|---|---|
| `bun run dev` | Start in watch mode |
| `bun run build` | Compile to `dist/` |
| `bun run start:prod` | Run the compiled build |
| `bun run lint` | `biome lint` + `tsc --noEmit` |
| `bun run format` | Apply Biome fixes |
| `bun run test` | Unit tests |
| `bun run test:e2e` | End-to-end tests |
| `bun run test:cov` | Coverage report |
| `bun run prisma:generate` | Regenerate the Prisma client into `generated/prisma` |
| `bun run prisma:migrate <name>` | Create and apply a migration |
| `bun run prisma:reset` | Drop and recreate the database |

---

## Project structure

```
src/
├── config/            # Joi env schema + registerAs config namespaces
├── errors/            # AppError, global exception filter
├── interceptors/      # Request logging
├── lib/
│   └── prisma/        # PrismaService (global)
├── utils/             # Duration parsing helpers
└── modules/
    ├── auth/          # Login, refresh, logout, JwtAuthGuard, token services
    └── users/         # User lookup and creation (bcrypt hashing)
```

Data model: `User` and `RefreshToken` (see [`prisma/schema.prisma`](./prisma/schema.prisma)).

Auth notes and the token design live in [`docs/AUTH/`](./docs/AUTH).

---

## Conventions

See [`CLAUDE.md`](./CLAUDE.md). Briefly: Bun (not npm), exact dependency versions (no `^`), Biome with no semicolons and single quotes, and Prisma client imports from `generated/prisma/client` rather than `@prisma/client`.
