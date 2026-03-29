# FinVest Backend Audit & Improvement Recommendations

After thoroughly auditing the current state of the backend transition from a Flask monolith to a JSON API, several critical optimizations and technical debt items must be addressed before production deployment.

## 1. Authentication: Migrate from Cookies to JWT Headers
**Current State:** The backend relies on Flask Session Cookies (`session['user_id']`).
**The Bug/Risk:** Browser security policies heavily restrict cross-origin cookies. While we patched this with CORS `credentials: "include"`, this approach is brittle and will completely break if you ever build a mobile app (React Native/Flutter).
**Recommendation:** Migrate to **Stateless JWT Headers**. When a user logs in, the API should return a token string (`eyJ...`). The Next.js frontend saves this token in `localStorage` and attaches it as `Authorization: Bearer <token>` to every subsequent `fetch` request.

## 2. Encryption Key Management
**Current State:** `DataCipher` (in `encryption_utils.py`) creates and reads a local file named `.key` to store the AES-256 master key.
**The Bug/Risk:** In cloud deployments like Vercel or Render, local files are ephemeral and deleted upon restart. This means the encryption key will be lost, rendering all database data permanently unreadable.
**Recommendation:** Move the encryption key to an environment variable in `.env` (e.g., `AES_ENCRYPTION_KEY=your-secure-key`). Update `DataCipher` to read `os.environ.get('AES_ENCRYPTION_KEY')` directly.

## 3. Residual Legacy Endpoints
**Current State:** `dashboard.py`, `auth.py`, and `tracker.py` have been converted to JSON APIs.
**The Bug/Risk:** Files like `portfolio.py`, `reports.py`, and `events.py` are still using `render_template` and expecting the old Jinja2 HTML views to exist. If the frontend attempts to query them, it will crash or receive HTML instead of JSON.
**Recommendation:** Systematically rewrite the remaining blueprints to return `jsonify()` payloads and consume the new `repositories/` layer.

## 4. Supabase Service Role vs. Anon Key
**Current State:** The backend is using the `Anon Key` with RLS disabled on the tables.
**The Bug/Risk:** Disabling RLS is fine if the database is strictly accessed by a secure backend, but it's not best practice. 
**Recommendation:** Inject the Supabase `SERVICE_ROLE` key into the backend `.env`. The `service_role` key explicitly bypasses all RLS natively, allowing you to re-enable RLS on the tables to protect them from external client-side attacks.

## 5. Cleanup Obsolete Assets
**Recommendation:** Delete the `templates/` and `static/` directories in the root folder, as well as the 1,200-line `models.py` file, once the repository migration is entirely verified. This removes massive amounts of dead code.
