# Smoke test status (2026-07-16)

## Blocker (owner action required)

**Azure App Service API is down and cannot be restarted from CLI.**

Verified 2026-07-16 ~23:40 UTC:

| Item | Value |
|------|--------|
| App | `241runners-api-v2` in `241raLinux_group` (sub **Azure Cloud Sub** `21864b8e-adc5-4f22-9f39-0f936aae95d4`) |
| App state | `AdminDisabled` — HTTP **403** “This web app is stopped” |
| `az webapp start` | **FAIL** — `ReadOnlyDisabledSubscription` |
| Azure Cloud Sub | Management API `state: Warned` (CLI `az account show` may still say Enabled) |
| DekuWorksLLC | Also `Warned` + `ReadOnlyDisabledSubscription` on writes |
| Billing profile | **Marcus Brown** (`VNIG-RKNQ-BG7-PGB`) — `status: Disabled`, `statusReasonCode: PastDue` |
| Overdue invoice | **G169561565** — **$36.24 USD**, due **2026-07-09**, status **OverDue** |
| Google Maps (mobile) | `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` present in local `.env` / `.env.local` (len 39) — no rebuild needed for key presence |

Payment / re-enable cannot be done from this agent. Owner must settle billing in the portal, then start the webapp.

### Exact portal steps (owner)

1. Sign in as **marcusb0611@gmail.com** → [Azure Portal](https://portal.azure.com/)
2. Open **Cost Management + Billing** → billing account **Marcus Brown** → billing profile **Marcus Brown**  
   Direct: [Cost Management + Billing](https://portal.azure.com/#view/Microsoft_Azure_GTM/ModernBillingMenuBlade/~/Overview)
3. Pay overdue invoice **G169561565** ($36.24). Update payment method if charged failed.
4. Wait until billing profile status is no longer **Disabled / PastDue**, and both subscriptions leave **Warned** (often minutes–hours after payment clears).
5. Then start API (CLI or portal):

```bash
az account set --subscription "Azure Cloud Sub"
az webapp start -g 241raLinux_group -n 241runners-api-v2
az webapp show -g 241raLinux_group -n 241runners-api-v2 --query "{state:state,defaultHostName:defaultHostName}" -o json
# optional: gh workflow run azure-restore.yml -R DekuWorks/241RunnersAwareness
```

6. Re-run smoke curls below. Until App Service is **Running**, production app + site auth against `https://241runners-api-v2.azurewebsites.net` will fail.

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

## Mobile Metro note

Simulator showed Worklets crash when connected to Bookmarked Metro on :8081. This app's bundler was already on :8082 — reopen with:

```bash
xcrun simctl openurl booted 'exp+241runners://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8082'
```
