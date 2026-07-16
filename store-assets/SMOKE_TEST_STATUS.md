# Smoke test status (2026-07-16)

## Blocker (owner action required)

**Azure App Service API is down and cannot be restarted from CLI.**

- App: `241runners-api-v2` (`241raLinux_group`)
- State: `AdminDisabled` (HTTP 403 “This web app is stopped”)
- Subscriptions are `Warned` / `ReadOnlyDisabledSubscription` on write:
  - Azure Cloud Sub (`21864b8e-adc5-4f22-9f39-0f936aae95d4`)
  - DekuWorksLLC (`6285edb9-9935-4795-8ac3-9700402c3b71`)
- Azure SQL `241runners-sql-2025` / DB `241RunnersAwarenessDB` is **Online** and reachable

**To unblock App Store review login:** re-enable / settle billing on the Azure subscription, then:

```bash
az account set --subscription "Azure Cloud Sub"
az webapp start -g 241raLinux_group -n 241runners-api-v2
# optional: gh workflow run azure-restore.yml -R DekuWorks/241RunnersAwareness
```

Until the App Service is Running, production app + site auth against `https://241runners-api-v2.azurewebsites.net` will fail.

## Smoke / App Review account (seeded in production SQL)

Created directly in Azure SQL (API register unavailable while App Service stopped).

| Field | Value |
|-------|--------|
| Email | `apptestreview@dekuworks.com` |
| Password | see `store-assets/APP_REVIEW_INFORMATION.txt` |
| Role | `user` |
| 2FA | none |
| Profile | App Reviewer / phone set |
| Runner | Id 6 — “Alex Reviewer” (Active) |
| Case | Id 7 — private demo case (`IsPublic=0`) for sighting flow |

Password hash verified with bcrypt against the stored `PasswordHash`.

Fallback (exists in DB; dual-role admin — prefer dedicated account above for ASC):

- Email: `lthomas3350@gmail.com`
- Password: documented in historical mobile docs (`Lisa2025!`) — hash verified in SQL

## Endpoint smoke results

| Endpoint | Host | Result |
|----------|------|--------|
| `POST /api/v1/auth/login` | live `241runners-api-v2.azurewebsites.net` | **FAIL** — HTTP 403 App Service stopped |
| `GET /api/health` | live | **FAIL** — 403 / unavailable |
| `GET /api/public/map/missing` | live | **FAIL** — 403 |
| `POST /api/v1/auth/login` (seeded user) | live | **FAIL** — API down (user ready in DB) |
| DB user + bcrypt hash | Azure SQL | **PASS** |
| DB runner + private case seed | Azure SQL | **PASS** |
| Website `/`, `/login`, `/map` | `241runnersawareness.org` | **PASS** (static; API-backed actions need API up) |

Re-run after App Service is Running:

```bash
EMAIL=apptestreview@dekuworks.com
PASS='(from APP_REVIEW_INFORMATION.txt)'
curl -s -w "\n%{http_code}\n" --max-time 45 -X POST \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}" \
  https://241runners-api-v2.azurewebsites.net/api/v1/auth/login
# then with token: /api/v1/auth/me , /api/v1/enhanced-runner , /api/v1/cases , /api/public/map/missing
```

## Screenshot demo steps (Simulator / device)

1. Sign in with `apptestreview@dekuworks.com` (password in App Review Information).
2. **Profile** — show existing runner “Alex Reviewer”; optionally capture Create Runner form.
3. **Cases** — open private demo case → **Report a Sighting**.
4. **Cases / Profile** — **Report Case** / **Report a Safety Case** form.
5. **Map** — public missing markers (requires Maps key in local `.env` / EAS secret). Prefer email/password screens only (no Apple/Google).

Capture helpers: `store-assets/screenshots/README.md`
