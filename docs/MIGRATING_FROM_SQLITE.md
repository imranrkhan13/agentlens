# Migrating an existing SQLite AgentLens deployment

Runtime AgentLens no longer opens SQLite files. This one-time procedure copies
the existing data to PostgreSQL while converting every plaintext API key to an
HMAC-SHA-256 digest. Keep the SQLite file offline after validating the import:
it still contains the old plaintext keys.

1. Stop every old API process so no new event is written while copying.
2. Back up the SQLite file and choose a dedicated PostgreSQL database.
3. Set a new, long random pepper and the target URL. The pepper must be kept
   for the lifetime of the imported keys; replacing it invalidates all keys.

   ```bash
   export AGENTLENS_DATABASE_URL='postgresql+psycopg://agentlens:...@db.example/agentlens'
   export AGENTLENS_API_KEY_PEPPER="$(python3 -c 'import secrets; print(secrets.token_urlsafe(48))')"
   ```

4. From `backend/`, apply the schema, then run a dry-run count and the import.

   ```bash
   alembic upgrade head
   python ../scripts/migrate_sqlite_to_postgres.py /absolute/path/agentlens.db --dry-run
   python ../scripts/migrate_sqlite_to_postgres.py /absolute/path/agentlens.db
   ```

   The importer refuses a nonempty destination, checks all event project IDs,
   and runs in a single destination transaction. It prints counts only, never
   API keys.

5. Start the new API, use an existing key to check a known project, and retain
   the SQLite backup in encrypted offline storage until the verification window
   has passed. Then securely remove the live plaintext-key database according
   to your retention policy.

Downtime is the interval between step 1 and the new API becoming healthy. For
near-zero downtime, temporarily queue telemetry at the old ingress and replay
it once the import's count verification has completed.
