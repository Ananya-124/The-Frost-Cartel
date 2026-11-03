# FROST CARTEL — Security Hardening & Threat Model

## 1. Access Control & Portal Hardening

### Admin Vault Isolation
- **No Public Trace**: The public homepage (`/`) contains zero buttons, links, or comments pointing to the Admin Portal.
- **Route Protection**: The Admin Vault is strictly mapped to `#/admin` and `/admin`, protected by session token validation.
- **Credential Storage**: Admin credentials are never embedded in the frontend bundle. They reside strictly on the server or in the database.

### Bootstrap Admin Protocol
- Local development provisions a temporary bootstrap administrator:
  - Username: `admin123`
  - Temporary Password: `admin@1`
- **Forced Password Rotation**: The database record stores `must_change_password = 1`. Upon initial login, the admin is prompted to rotate credentials.
- **Production Defense**: In production (`NODE_ENV=production`), the server verifies that default bootstrap passwords are not active without an explicit override from a secure secrets manager.

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

### 100% Parameterized Statements
All database operations utilize SQLite prepared statements with parameter binding:
```typescript
const stmt = db.prepare('SELECT * FROM teams WHERE LOWER(team_name) = LOWER(?)');
stmt.get(teamName);
```
Zero string concatenation or dynamic SQL assembly is permitted in any database query.

### Atomic Financial Scoring Transactions
Credit score updates are isolated within transactions:
```sql
BEGIN TRANSACTION;
-- 1. Update stages_progress
-- 2. Unlock subsequent stage if eligible
-- 3. Update teams.score (enforcing 500 CR ceiling)
-- 4. Insert into append-only score_transactions
-- 5. Insert into activity_history
COMMIT;
```
If any step fails, the entire transaction rolls back cleanly, preventing partial scoring or credit desynchronization.

---

## 5. Client-Side Input Sanitization & XSS Defense

- **React 19 Auto-Escaping**: All dynamic strings rendered in JSX are automatically escaped to prevent XSS.
- **No `dangerouslySetInnerHTML`**: The entire codebase avoids raw HTML injection.
- **Form Trimming & Sanitization**: Squad names, passkeys, and search terms are sanitized in `src/utils/validation.utils.ts`.

