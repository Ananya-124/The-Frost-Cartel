# FROST CARTEL — Security Hardening & Threat Model

## 1. Access Control & Portal Hardening

### Admin Vault Isolation
- **No Public Trace**: The public homepage (`/`) contains zero buttons, links, or comments pointing to the Admin Portal.
- **Route Protection**: The Admin Vault is strictly mapped to `#/admin` and `/admin`, protected by session token validation.
- **Credential Storage**: Admin credentials are never embedded in the frontend bundle. They reside strictly on the server or in the database.

### Bootstrap Admin Protocol
- Configure `ADMIN_BOOTSTRAP_USER` and `ADMIN_BOOTSTRAP_PASSWORD` for initial setup.
- The PostgreSQL bootstrap creates an administrator only when none exists; it never resets existing credentials on restart.
- No sample admin or team credentials are created. Store bootstrap values in a secret manager and remove them after first login.

---

## 2. Cryptographic Security & Password Storage

### Scrypt Password Hashing
Passwords are never stored in plaintext in the database:
- **Algorithm**: `node:crypto.scryptSync` with 64-byte key length.
- **Salt Generation**: 16 cryptographically secure random bytes generated per password (`crypto.randomBytes(16)`).
- **Unique Hash Verification**: Even identical passwords produce completely distinct hashes due to individualized salts.
- **Timing Attack Mitigation**: Verifications utilize `crypto.timingSafeEqual` to prevent side-channel timing attacks.

---

## 3. Session Security & Cookie Hardening

### Token Issuance
- **Admin Tokens**: Issued with `fc_admin_token` HttpOnly cookie and 12-hour expiration.
- **Team Tokens**: Issued with `fc_team_token` HttpOnly cookie and 24-hour expiration.
- **SameSite Policy**: `SameSite=Lax` prevents Cross-Site Request Forgery (CSRF).
- **Session Revocation**: Logging out deletes the session record from `admin_sessions` / `team_sessions` and clears client cookies.

---

## 4. SQL Injection Prevention & Transaction Isolation

### Parameterized PostgreSQL Statements
Database operations use PostgreSQL parameter binding:
```typescript
const result = await pool.query('SELECT * FROM teams WHERE lower(team_name) = lower($1)', [teamName]);
```
User-provided values are passed as parameters rather than interpolated into SQL.

### Atomic Financial Scoring Transactions
Credit score updates are isolated within transactions:
```sql
BEGIN;
-- Update round1_stage_progress and the team score.
-- Insert the idempotent score_transactions event and related activity history.
COMMIT;
```
Related state changes roll back together if any step fails.

---

## 5. Client-Side Input Sanitization & XSS Defense

- **React 19 Auto-Escaping**: All dynamic strings rendered in JSX are automatically escaped to prevent XSS.
- **No `dangerouslySetInnerHTML`**: The entire codebase avoids raw HTML injection.
- **Form Trimming & Sanitization**: Squad names, passkeys, and search terms are sanitized in `src/utils/validation.utils.ts`.

