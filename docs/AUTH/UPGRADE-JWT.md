# JWT Authentication — Security Upgrade Plan

Audit of the current authentication implementation and the changes required to make it production-grade.

Audited on 2026-08-10 against `src/modules/auth/`, `src/main.ts`, `src/config/env.validation.ts` and `prisma/schema.prisma`.

---

## Summary

| # | Issue | Severity | File |
|---|-------|----------|------|
| 1 | CORS reflects any origin with credentials enabled | **Critical** | `src/main.ts:12` |
| 2 | User enumeration + timing oracle on login | **Critical** | `src/modules/auth/auth.service.ts:29` |
| 3 | No rate limiting on login / register / refresh | **Critical** | — |
| 4 | No refresh-token reuse detection | **High** | `src/modules/auth/refresh-token.service.ts:17` |
| 5 | Password change does not revoke sessions | **High** | `src/modules/users/users.service.ts` |
| 6 | Access and refresh tokens share one secret, no `iss`/`aud` | **High** | `src/modules/auth/token.service.ts` |
| 7 | JWT verification does not pin the algorithm | **High** | `src/modules/auth/token.service.ts:28` |
| 8 | No security headers (`helmet`) | **High** | `src/main.ts` |
| 9 | Hardcoded fallback JWT secret | **Medium** | `src/modules/auth/auth.config.ts:14` |
| 10 | bcrypt cost factor 10 | **Medium** | `src/modules/users/users.service.ts:73` |
| 11 | Weak password policy (length only) | **Medium** | `src/modules/users/user.dtos.ts` |
| 12 | `RefreshToken` model has no session metadata | **Medium** | `prisma/schema.prisma:36` |
| 13 | No authentication audit log | **Medium** | — |
| 14 | Token storage strategy not decided (header vs cookie) | **Medium** | — |
| 15 | No email verification on register | **Low** | — |
| 16 | Refresh expiry documented as 7d, configured as 14d | **Low** | `docs/AUTH/README.md:9` |

---

## Critical

### 1. CORS reflects any origin with credentials enabled

`src/main.ts:12-17`:

```ts
app.enableCors({
  credentials: true,
  origin: true,        // reflects the caller's Origin header
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
})
```

`origin: true` echoes back whatever `Origin` the request carries, and `credentials: true` tells the browser to honor it. Any website can therefore issue an authenticated request to this API and **read the response body**.

Today the blast radius is limited because the access token travels in the `Authorization` header, which a third-party site cannot set from the victim's browser. The moment authentication moves to cookies, this becomes a full account-takeover vector.

`CORS_ORIGIN` is already declared and validated in `src/config/env.validation.ts` — it is simply never read.

**Fix:**

```ts
const origins = process.env.CORS_ORIGIN.split(',').map((o) => o.trim())

app.enableCors({
  credentials: true,
  origin: origins,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'apollo-require-preflight']
})
```

Loosen `CORS_ORIGIN` validation to accept a comma-separated list, or introduce `CORS_ORIGINS`.

---

### 2. User enumeration and timing oracle on login

`src/modules/auth/auth.service.ts:29-41`:

```ts
async login(input: LoginInput) {
  const user = await this.userService.findByEmail(input.email)
  const isPasswordValid = await compare(input.password, user.password)

  if (!isPasswordValid || !user)
    throw new AppError('Invalid credentials', HttpStatus.UNAUTHORIZED)
```

Three distinct problems:

1. **Enumeration.** `findByEmail` (`users.service.ts:87`) throws `User not found` with `404` for an unknown address, while a wrong password yields `Invalid credentials` with `401`. An attacker distinguishes registered accounts from unregistered ones with a single request each, then targets only the real ones.
2. **Timing side channel.** No `bcrypt.compare` runs when the address does not exist, so that path returns in single-digit milliseconds while a real address costs ~100ms. The difference survives even if both responses are made identical.
3. **Dead ordering.** `user.password` is dereferenced on the line before `!user` is checked. If `findByEmail` ever returns `null` instead of throwing, the request crashes with a `TypeError` rather than returning `401`. The `!user` clause is unreachable as written.

**Fix** — one response shape, one timing profile:

```ts
private static readonly DUMMY_HASH =
  '$2b$12$abcdefghijklmnopqrstuv.wxyzABCDEFGHIJKLMNOPQRSTUVWXYZ012'

async login(input: LoginInput) {
  const user = await this.userService.findByEmail(input.email).catch(() => null)

  // always spend the bcrypt cost, even for unknown addresses
  const isPasswordValid = await compare(
    input.password,
    user?.password ?? AuthService.DUMMY_HASH
  )

  if (!user || !isPasswordValid)
    throw new AppError('Invalid credentials', HttpStatus.UNAUTHORIZED)

  delete user.password
  ...
}
```

`DUMMY_HASH` must be a **real** bcrypt hash at the same cost factor as your stored hashes — generate it once with `bcrypt.hash('x', 12)` and paste the result. A malformed string makes `compare` fail fast, which restores exactly the timing difference the change is meant to remove.

Add a `findByEmailOrNull` to `UserService` rather than relying on `.catch()` if you prefer the intent explicit.

The same treatment applies to `register`: a duplicate-email error also reveals that an account exists. Consider returning success and sending a "this address is already registered" email instead — only worth doing once email delivery exists.

---

### 3. No rate limiting

`login`, `register` and `refreshToken` accept unlimited attempts. With an 8-character minimum password and no throttle, credential stuffing is unopposed.

**Fix:**

```bash
npm i @nestjs/throttler
```

```ts
// app.module.ts
ThrottlerModule.forRoot([
  { name: 'short', ttl: 1000, limit: 3 },
  { name: 'medium', ttl: 60_000, limit: 20 }
])
```

Apply a stricter per-resolver limit to the auth mutations:

```ts
@Throttle({ default: { limit: 5, ttl: 60_000 } })
@Mutation(() => AuthResponse)
async login(@Args('input') input: LoginInput) { ... }
```

Two caveats specific to this project:

- The default `ThrottlerGuard` reads `req.ip`, which is not resolved automatically in the GraphQL context. Subclass it and override `getRequestResponse` using `GqlExecutionContext`, mirroring the pattern in `auth.guard.ts:29`.
- Behind a proxy, enable `app.set('trust proxy', 1)` or every request appears to come from the same IP.

Per-IP limits alone do not stop distributed attacks. Add a per-account counter as well: after N consecutive failures for one email, apply a backoff regardless of source IP.

---

## High

### 4. No refresh-token reuse detection

`refresh-token.service.ts:17-30` deletes the record on use, so a replayed token fails. That is rotation, but it stops one step short: a replay is *evidence that the token leaked*, and the current code discards that signal.

If an attacker steals a refresh token and uses it first, the legitimate user's next refresh fails — they log back in and the attacker keeps their own valid token. Detection is the whole point of rotation.

**Fix** — a failed lookup for a correctly-signed token means compromise; revoke the whole family:

```ts
async validateAndInvalidateToken(jti: string, userId: string) {
  const token = await this.prisma.refreshToken.findUnique({ where: { id: jti } })

  if (!token) {
    // signature valid, record gone: this token was already redeemed
    await this.prisma.refreshToken.deleteMany({ where: { user_id: userId } })
    throw new AppError('Invalid or expired refresh token', HttpStatus.UNAUTHORIZED)
  }

  if (token.expires_at < new Date()) {
    await this.prisma.refreshToken.delete({ where: { id: jti } }).catch(() => {})
    throw new AppError('Invalid or expired refresh token', HttpStatus.UNAUTHORIZED)
  }

  await this.prisma.refreshToken.delete({ where: { id: jti } })

  return { userId: token.user_id }
}
```

`auth.service.ts:60` already holds `payload.sub`, so passing `userId` through costs nothing.

Race condition worth knowing about: a client firing two refreshes concurrently (two tabs) triggers a false positive and logs the user out everywhere. Mitigate by keeping a short grace window — add `replaced_at` and accept a redeemed token for ~10 seconds after rotation, but only to reissue the *same* successor.

`validateToken` (line 32) has no callers and can be deleted.

---

### 5. Password change does not revoke sessions

`UpdatePasswordInput` exists in `user.dtos.ts`, but nothing in the update path calls `refreshTokenService.invalidateAllUserTokens`. A user who suspects compromise changes their password, and the attacker's refresh token keeps working for another 14 days.

**Fix:** call `invalidateAllUserTokens(userId)` inside the password-change flow, then issue a fresh token pair so the caller stays logged in on the current device. Do the same on email change.

---

### 6. Access and refresh tokens share one secret, with no `iss`/`aud`

`token.service.ts` signs both token types with the single `auth.secret`, and `validate()` verifies without `audience` or `issuer` constraints. Only the `type` claim distinguishes them, and that claim is checked solely in `auth.guard.ts:21`.

Every future code path that verifies a token must remember to re-check `type`. One that forgets accepts a 14-day refresh token as a 5-minute access token.

**Fix** — make the two token classes cryptographically distinct so the check cannot be skipped:

```ts
// auth.config.ts
accessSecret: process.env.JWT_ACCESS_SECRET,
refreshSecret: process.env.JWT_REFRESH_SECRET,
issuer: process.env.JWT_ISSUER ?? 'logistics-api',
```

```ts
async signAccess(payload: Omit<JwtPayload, 'type'>) {
  return this.jwtService.signAsync(
    { ...payload, type: 'access' },
    {
      secret: this.accessSecret,
      issuer: this.issuer,
      audience: 'access',
      expiresIn: convertToSeconds(this.accessExpiry)
    }
  )
}

async validateAccess(token: string) {
  try {
    return await this.jwtService.verifyAsync<JwtPayload>(token, {
      secret: this.accessSecret,
      issuer: this.issuer,
      audience: 'access',
      algorithms: ['HS256']
    })
  } catch {
    return null
  }
}
```

Split `validate()` into `validateAccess` / `validateRefresh` and update `auth.guard.ts` and `auth.service.ts` accordingly. Add both secrets to `env.validation.ts` with `Joi.string().min(32).required()`.

If the API ever needs to hand tokens to a service it does not control, move to RS256 so verifiers get a public key instead of the signing secret.

---

### 7. JWT verification does not pin the algorithm

`token.service.ts:28`:

```ts
const payload = await this.jwtService.verifyAsync<JwtPayload>(token)
```

No `algorithms` option. `jsonwebtoken` rejects `alg: none` when a secret is supplied, so this is not exploitable today, but the protection is incidental rather than declared. Pin it explicitly — it becomes load-bearing the moment anyone introduces an asymmetric key.

```ts
{ algorithms: ['HS256'] }
```

---

### 8. No security headers

`helmet` is not in `package.json`. The API serves static files from `/uploads/` (`main.ts:19`), so a user-uploaded HTML or SVG file is served from the API origin and executes with it.

```bash
npm i helmet
```

```ts
app.use(helmet({ crossOriginResourcePolicy: { policy: 'same-site' } }))
```

Also serve uploads with `Content-Disposition: attachment` and a strict `Content-Type`, or move them to object storage on a separate domain. Uploaded SVG files are executable HTML in a browser.

---

## Medium

### 9. Hardcoded fallback JWT secret

`auth.config.ts:14`:

```ts
secret: process.env.JWT_SECRET || 'default-secret-change-in-production'
```

Unreachable today because `env.validation.ts` requires `JWT_SECRET` at 32+ characters, so the app cannot boot without it. Delete the fallback anyway — it survives only until someone relaxes the Joi schema, and a committed signing secret means anyone with the repo can mint valid tokens.

### 10. bcrypt cost factor

`users.service.ts:73` uses `bcrypt.hash(input.password, 10)`. Raise to 12 and move it to config. Rehash on next successful login when a stored hash is below the current cost.

### 11. Weak password policy

`user.dtos.ts` enforces `@MinLength(8)` only. `password123` passes. Add a complexity rule, or better, check candidates against a breached-password list (`zxcvbn` for strength scoring, or the Pwned Passwords k-anonymity API).

### 12. `RefreshToken` model has no session metadata

`prisma/schema.prisma:36-43` stores only `id`, `expires_at`, `created_at`, `user_id`. That prevents an "active sessions" screen, blocks the grace-window fix from issue 4, and leaves nothing to investigate after a breach.

```prisma
model RefreshToken {
  id          String   @id @default(uuid())
  expires_at  DateTime
  created_at  DateTime @default(now())
  replaced_at DateTime?
  user_agent  String?
  ip          String?

  user_id String
  user    User     @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@index([user_id])
}
```

The `@@index([user_id])` matters on its own: `invalidateAllUserTokens` and the reuse-detection `deleteMany` both filter on `user_id` and currently do a sequential scan.

### 13. No authentication audit log

Nothing records failed logins, refresh-token reuse, or `logoutAll`. Without it there is no way to detect a slow brute-force or to reconstruct an incident. Log these events with user id, IP and user agent — to a table or to structured logs consumed by something that can alert.

### 14. Token storage strategy is undecided

`docs/AUTH/README.md:231` tells clients to "use httpOnly cookies or secure storage", but the API only returns tokens in the GraphQL response body — the client decides, and most clients decide wrong (`localStorage`).

Two workable options:

**A. Both tokens in `HttpOnly` cookies.** XSS can no longer exfiltrate the tokens. It does not stop an attacker from calling the API from the victim's page with `credentials: 'include'` — it caps the damage at the session's lifetime instead of handing over a 14-day refresh token. Requires: `cookie-parser`, `res` exposed in the GraphQL context, `res.cookie(...)` in the resolver, cookie fallback in `auth.guard.ts`, and `SameSite=Lax` plus the CORS fix from issue 1.

Note the GraphQL-specific cost: with a single `/graphql` endpoint you cannot scope the refresh cookie with `Path=/auth/refresh`, so the 14-day token rides along on every query. The workaround is a dedicated REST route for refresh — see option B.

**B. Access token in memory, refresh token in an `HttpOnly` cookie scoped to a REST refresh endpoint.** The access token lives in a JavaScript variable (never `localStorage`), and the refresh cookie carries `Path=/auth/refresh`, so it never travels with normal queries. Slightly more client work; strictly better isolation.

Either way `SameSite=Lax` only protects when the frontend shares a registrable domain with the API (`app.example.com` + `api.example.com`). On a different domain you need `SameSite=None`, which reopens CSRF and forces an explicit `Origin` check or a double-submit token. **Prefer same-domain deployment** — it removes the problem rather than patching it.

Apollo Server 4 enables `csrfPrevention` by default, which requires a preflight for non-simple content types. It is not disabled in `src/lib/graphql/graphql.module.ts` — keep it that way.

---

## Low

### 15. No email verification

`register` (`auth.service.ts:43`) issues a full session immediately for any address. Anyone can sign up with someone else's email. Gate account creation behind a verification link once email delivery exists.

### 16. Documentation drift

`docs/AUTH/README.md:9` and line 18 state a 7-day refresh token. `auth.config.ts:13` and `env.validation.ts` default to `14d`. The README also references `src/modules/auth/jwt.strategy.ts` and a `TOKEN_EXPIRY` constant that no longer exist — the file is now `token.service.ts`, and the file-structure section at line 207 is likewise stale (missing `auth.config.ts`, `auth.types.ts`; still listing `jwt.strategy.ts`, `dtos.ts`).

---

## Suggested order

Each stage is independently shippable.

**Stage 1 — close what is open now.** Nothing here depends on the cookie decision.

1. CORS allowlist (issue 1)
2. Login enumeration and timing (issue 2)
3. Rate limiting (issue 3)
4. Remove the fallback secret (issue 9)
5. `helmet` (issue 8)

**Stage 2 — harden the token layer.**

6. Split secrets, add `iss`/`aud`, pin the algorithm (issues 6, 7)
7. Refresh-token reuse detection (issue 4)
8. Revoke sessions on password change (issue 5)
9. Schema fields and the `user_id` index (issue 12)

**Stage 3 — storage and operations.**

10. Decide header vs cookie and implement (issue 14)
11. Audit logging (issue 13)
12. bcrypt cost, password policy (issues 10, 11)

**Stage 4 — account lifecycle.**

13. Email verification (issue 15)
14. Update `README.md` to match the code (issue 16)

---

## Open decision

Stage 3 cannot start until this is settled: **will the frontend be served from the same registrable domain as the API?**

- **Same domain** (`app.example.com` + `api.example.com`) — `SameSite=Lax` handles CSRF, cookies are straightforward, option A or B both work cleanly.
- **Different domain** — `SameSite=None; Secure` is mandatory, CSRF protection falls entirely on the CORS allowlist plus an explicit `Origin` check, and a double-submit CSRF token becomes worth adding.
