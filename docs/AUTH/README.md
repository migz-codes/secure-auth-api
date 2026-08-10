# Authentication System

This document describes the authentication logic for the Logistics API.

## Overview

The application uses **JWT (JSON Web Tokens)** for authentication with a **dual-token strategy**:
- **Access Token**: Short-lived (5 minutes), used for API authorization
- **Refresh Token**: Long-lived (7 days), used to obtain new access tokens

## Token Configuration

Defined in `src/modules/auth/jwt.strategy.ts`:

```typescript
export const TOKEN_EXPIRY = {
  ACCESS: '5m',   // 5 minutes
  REFRESH: '7d'   // 7 days
} as const
```

## Authentication Flow

### 1. Registration / Login

```
User → login/register mutation → Server validates credentials
                                      ↓
                              Creates RefreshToken record in DB
                                      ↓
                              Generates Access Token (5m)
                              Generates Refresh Token (7d) with jti = DB record ID
                                      ↓
                              Returns { accessToken, refreshToken, user }
```

### 2. Accessing Protected Resources

```
Client → Request with Authorization: Bearer <accessToken>
                    ↓
            AuthGuard validates token
                    ↓
            Checks token.type === 'access'
                    ↓
            Attaches user to request
                    ↓
            Proceeds to resolver
```

### 3. Refreshing Tokens

```
Client → refreshToken mutation with current refresh token
                    ↓
            Validates JWT signature and expiry
                    ↓
            Extracts jti (JWT ID) from token
                    ↓
            Looks up RefreshToken record by ID
                    ↓
            DELETES the record (single-use token)
                    ↓
            Creates NEW RefreshToken record
                    ↓
            Returns new { accessToken, refreshToken, user }
```

### 4. Logout


Client → logout mutation with refresh token
                    ↓
            Extracts jti from token
                    ↓
            Deletes RefreshToken record
                    ↓
            Token is now invalid
```

### 5. Logout All Devices

```
Client → logoutAll mutation (requires authentication)
                    ↓
            Gets userId from access token
                    ↓
            Deletes ALL RefreshToken records for user
                    ↓
            All sessions invalidated
```

## Security Features

### Single-Use Refresh Tokens (Token Rotation)

Each refresh token can only be used **once**. When used:
1. The old token's database record is deleted
2. A new token with a new `jti` is generated
3. If someone tries to reuse an old token, it fails

This prevents token replay attacks.

### JWT ID (jti) for Database Lookup

The refresh token contains a `jti` claim that matches the database record ID:

```typescript
// JWT Payload
{
  sub: "user_id",
  email: "user@example.com",
  type: "refresh",
  jti: "cuid_database_record_id",  // Links to RefreshToken.id
  iat: 1234567890,
  exp: 1234567890
}
```

This allows direct database lookup by ID instead of comparing hashed tokens.

### Cascade Delete

When a user is deleted, all their refresh tokens are automatically deleted:

```prisma
model RefreshToken {
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### Automatic Token Cleanup

Expired tokens are automatically cleaned up daily at 2 AM:

```typescript
@Cron(CronExpression.EVERY_DAY_AT_2AM)
async handleCleanup() {
  await this.refreshTokenService.cleanupExpiredTokens()
}
```

## Database Schema

```prisma
model RefreshToken {
  id        String   @id @default(cuid())
  userId    String
  expiresAt DateTime
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

## GraphQL API

### Mutations

| Mutation | Auth Required | Description |
|----------|---------------|-------------|
| `login(input: LoginInput)` | No | Authenticate with email/password |
| `register(input: CreateUserInput)` | No | Create new account |
| `refreshToken(refreshToken: String)` | No | Get new tokens using refresh token |
| `logout(refreshToken: String)` | No | Invalidate specific refresh token |
| `logoutAll` | Yes | Invalidate all user's refresh tokens |

### Example Queries

**Login:**
```graphql
mutation Login($input: LoginInput!) {
  login(input: $input) {
    accessToken
    refreshToken
    user {
      id
      name
      email
    }
  }
}
```

**Refresh Token:**
```graphql
mutation RefreshToken($refreshToken: String!) {
  refreshToken(refreshToken: $refreshToken) {
    accessToken
    refreshToken
    user {
      id
    }
  }
}
```

**Logout:**
```graphql
mutation Logout($refreshToken: String!) {
  logout(refreshToken: $refreshToken) {
    success
  }
}
```

## File Structure

```
src/modules/auth/
├── auth.module.ts          # Module configuration
├── auth.resolver.ts        # GraphQL resolvers
├── auth.service.ts         # Business logic
├── auth.guard.ts           # Route protection
├── jwt.strategy.ts         # JWT signing/validation
├── refresh-token.service.ts # Token storage/invalidation
├── token-cleanup.task.ts   # Scheduled cleanup job
└── dtos.ts                 # Input/Output types
```

## Error Codes

| Code | Description |
|------|-------------|
| `INVALID_CREDENTIALS` | Wrong email or password |
| `INVALID_REFRESH_TOKEN` | Token expired, already used, or invalid |
| `UNAUTHORIZED` | Missing or invalid access token |

## Best Practices for Clients

1. **Store tokens securely** - Use httpOnly cookies or secure storage
2. **Refresh proactively** - Refresh before access token expires
3. **Handle refresh failures** - Redirect to login if refresh fails
4. **Clear tokens on logout** - Remove from storage after logout API call
