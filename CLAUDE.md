# CLAUDE.md

Conventions for this repo. Several are non-obvious and easy for tooling to violate.

This is a **JWT authentication study project**: login, access/refresh tokens, guards. Nothing else belongs here — no marketplace integrations, no LLM calls, no queues.

Companion frontend: `../secure-auth-web` (Next.js). The cookie contract below is shared with it — changing a cookie name, flag, or path is a breaking change on both sides.

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

---

# Auth architecture

The target design, and the contract `secure-auth-web` codes against. Sections marked **TODO** describe code that does not exist yet — implement toward this spec, never away from it.

## The one rule

**Tokens travel in cookies only. No token value ever appears in a response body, a URL, a log line, or an error message.**

A response body carries the user object and nothing else:

```jsonc
// POST /auth/login → 200
{ "user": { "id": "…", "name": "…", "email": "…" } }
```

If you are adding a field named `accessToken` or `refreshToken` to a DTO or a return type, you are working against this document. `AuthResult` in `src/modules/auth/auth.service.ts` currently returns both — that is the pre-cookie shape and is being removed, not extended.

## Deployment topology — sibling subdomains, same registrable domain

Two separate deploys, two hosts, one registrable domain:

```
app.example.com   → secure-auth-web  (Next)
api.example.com   → secure-auth-api  (this repo)
```

`SameSite` is computed on the **registrable domain** (eTLD+1), not the host, so these two are **same-site**. The auth cookies are first-party. This is the whole reason the topology was chosen, and every rule below depends on it:

- `SameSite=Lax` is correct in both dev and production. Never switch to `None` — that only becomes necessary on a cross-site topology, and reaching for it is the signal that someone broke the domain layout.
- No third-party-cookie blocking applies. Safari ITP, Firefox strict mode and the Chrome mitigations all target cross-site cookies; none of them touch this setup.
- Local dev (`localhost:3000` → `localhost:3001`) is same-site for the same reason — ports are ignored when computing site — so dev behavior matches production here. That is a deliberate property, not a coincidence to rely on blindly.

Two traps:

- **Provider subdomains do not count.** `*.vercel.app`, `*.railway.app`, `*.fly.dev` and friends are on the Public Suffix List, so `web.vercel.app` and `api.vercel.app` are *different* registrable domains and therefore cross-site. A custom domain on both sides is mandatory for the cookie contract to hold.
- **Same-site is not same-origin.** CORS is still required, with an explicit allowlist and `credentials: true`. See the CORS section.

`Domain` is left unset on every cookie — they are host-only, bound to `api.example.com`. Consequence: the frontend's Next.js server cannot read them, so it cannot authenticate a request. Authenticated fetching is client-side; do not design endpoints that assume a trusted server-side caller. Setting `Domain=.example.com` would unlock Server Component auth at the cost of exposing the session to every subdomain ever deployed — a deliberate future decision, not a default.

## Cookies

Three cookies. Names are exact and are part of the public contract.

| Cookie | HttpOnly | Path | Max-Age | Purpose |
|---|---|---|---|---|
| `access_token` | yes | `/` | `JWT_ACCESS_EXPIRY` (15m) | Credential for every protected route |
| `refresh_token` | yes | `/auth` | `JWT_REFRESH_EXPIRY` (14d) | Redeemed only at `POST /auth/refresh` |
| `csrf_token` | **no** | `/` | same as refresh | Read by JS, echoed in `X-CSRF-Token` |

Shared flags, identical in dev and production: `HttpOnly` per the table, `Secure` always (Chrome and Firefox treat `http://localhost` as trustworthy, so this holds in dev too), `SameSite=Lax`, `Domain` unset — host-only cookies.

Rules:

- `refresh_token` is scoped `Path=/auth` so the 14-day credential is not attached to ordinary API traffic. Never widen this path. This is why refresh and logout are REST routes under `/auth` rather than one catch-all endpoint.
- `csrf_token` is deliberately **not** `HttpOnly` — the frontend must read it. It is not a credential; it is only ever compared against the header.
- **Clearing a cookie must repeat every attribute it was set with** (`path`, `sameSite`, `secure`, `domain`). A `res.clearCookie('refresh_token')` without `{ path: '/auth' }` is a no-op and leaves a live refresh token in the browser — a logout that does not log out.
- Cookie `Max-Age` and the JWT `exp` are set from the same config value. Do not let them drift.

Set-Cookie is emitted by the controller layer (`@Res({ passthrough: true })`), never by a service. Services return values; controllers own the HTTP envelope.

**TODO:** `cookie-parser` is not installed. `bun add cookie-parser` and `bun add -d @types/cookie-parser`, then `app.use(cookieParser())` in `src/main.ts`.

## CSRF — signed double-submit

`SameSite=Lax` is the first layer: it stops a cross-site `POST` from carrying the cookies at all. It is not the last layer. Lax is scoped to the *site*, so a compromised sibling — `blog.example.com`, a stray preview deploy — is same-site and can forge authenticated requests. The double-submit token and the Origin check cover that gap.

Required on every state-changing request (`POST`, `PUT`, `PATCH`, `DELETE`):

1. `csrf_token` cookie value must equal the `X-CSRF-Token` header value, compared with `crypto.timingSafeEqual` — never `===`.
2. The token is an HMAC over the session's `jti` keyed by a server secret, so it cannot be forged by an attacker who can set cookies on a sibling subdomain.
3. `Origin` (falling back to `Referer`) must be in the CORS allowlist. Reject with 403 when absent — a missing `Origin` on a cross-site POST is not a browser this API serves.

`GET`/`HEAD`/`OPTIONS` skip the check, which means **no GET route may mutate state**. Exempt only `POST /auth/login` and `POST /auth/register`, which run before any session exists.

Implement as a global guard alongside `AuthGuard`, with a `@SkipCsrf()` decorator mirroring the existing `@Public()` in `src/modules/auth/public.decorator.ts`.

## CORS

`src/main.ts` already reads `app.corsOrigin` and sets `credentials: true`. Two things must stay true:

- `origin` is an explicit allowlist — never `true`, never `'*'`. With `credentials: true`, a reflected origin is account takeover.
- `allowedHeaders` must include `X-CSRF-Token`. `Authorization` can be dropped once the guard stops reading it.

`CORS_ORIGIN` accepts a comma-separated list; split and trim it. Widen the Joi rule in `src/config/env.validation.ts` accordingly — it currently validates a single URI.

## Token layer

`src/modules/auth/token.service.ts`. Non-negotiable when signing or verifying:

- **Separate secrets** per token class: `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`, each `Joi.string().min(32).required()`. A single shared secret makes the two token types differ only by a `type` claim, and one forgotten check turns a 14-day refresh token into an access token.
- **Pin the algorithm** on verify: `algorithms: ['HS256']`. Never call `verifyAsync` without it.
- Set and verify `issuer` and `audience` (`access` / `refresh`).
- Split `validate()` into `validateAccess()` and `validateRefresh()`. A generic "validate any token" helper is how type confusion gets reintroduced.
- Verification failures return `null` and the caller throws a **generic** 401. Never surface `jwt expired` vs `invalid signature` to the client.

## Guard

`src/modules/auth/auth.guard.ts` reads `request.cookies.access_token`. **No `Authorization: Bearer` fallback** — one code path, no ambiguity about which credential authenticated a request. The Bearer branch there today is legacy and is removed as part of the cookie migration.

Rejections are always a bare 401 with no detail about which check failed.

## Refresh rotation and reuse detection

`src/modules/auth/refresh-token.service.ts` already rotates: the row is deleted on redemption, so a token cannot be used twice.

**TODO — reuse detection.** A correctly-signed refresh token whose row is gone means the token leaked and was already redeemed. Today that is treated as an ordinary expiry. It must revoke the entire family: `deleteMany({ where: { user_id } })`. The user id is available from the verified payload's `sub`, so nothing extra needs to be passed in.

Known false positive: two browser tabs refreshing concurrently trip the detector and log the user out everywhere. If that shows up, add a `replaced_at` column and a ~10 second grace window that reissues the *same* successor pair — do not solve it by weakening the detection.

**TODO — revoke on password change.** `UsersService.updatePassword` does not call `invalidateAllUserTokens`. A user changing their password after a suspected compromise currently leaves the attacker's refresh token valid for 14 more days. Same for email change.

## Rate limiting

**TODO.** `@nestjs/throttler` is not installed. `login`, `register` and `refresh` accept unlimited attempts.

Global baseline plus a stricter per-route limit on the auth endpoints. Behind a proxy, set `app.set('trust proxy', 1)` or every request shares one IP. Per-IP limits alone do not stop distributed credential stuffing — add a per-account failure counter as well.

## Password handling

- `bcrypt` cost is `BCRYPT_ROUNDS` in `src/modules/users/users.service.ts`, currently **10**. Raise to 12 and move it to config.
- The dummy-hash comparison in `AuthService.login` exists so an unknown email costs the same time as a wrong password. **The dummy must be a real bcrypt hash at the current cost factor** — a malformed string makes `compare` fail fast and restores exactly the timing oracle it was added to remove. Re-generate it if the cost factor changes.
- Login failures return one message and one status for every cause. Registration still leaks existence via a 409 on duplicate email; that is a known, accepted gap in this study project.
- Password policy is length-only. Complexity or a breached-password check is a wanted improvement.

## Endpoints

| Route | Auth | CSRF | Notes |
|---|---|---|---|
| `POST /auth/register` | public | exempt | Sets all three cookies |
| `POST /auth/login` | public | exempt | Sets all three cookies |
| `POST /auth/refresh` | refresh cookie | required | Rotates; re-sets all three cookies |
| `POST /auth/logout` | refresh cookie | required | Deletes the row, clears cookies with matching attributes |
| `POST /auth/logout-all` | access cookie | required | Revokes every session for the user |
| `GET /auth/me` | access cookie | n/a | The frontend's session probe |

`GET /auth/me` returning 200 is the definition of "logged in". There is no client-readable token to inspect.

## Docs

`docs/AUTH/README.md` describes a GraphQL API that no longer exists (`jwt.strategy.ts`, `TOKEN_EXPIRY`, mutations, 7-day refresh). Treat `docs/AUTH/UPGRADE-JWT.md` and this file as current; rewrite the README rather than citing it.
