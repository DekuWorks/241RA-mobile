# Screenshots (iPhone 6.7" ASC slot)

**Target size:** 1290 × 2796 pixels

**Device used:** booted iOS Simulator (e.g. iPhone 17 Pro @ 1206×2622 native, resized with `sips`).

## Files

| File | Screen |
|------|--------|
| `01-login.png` | Login |
| `01b-signup.png` | Create account |
| `02-map.png` | Public missing cases map |
| `03-cases.png` | Cases list |
| `04-profile-map.png` | My Map (profile mode) |
| `05-profile.png` | Profile (signed in) |
| `06-report-case.png` | Report case |

## Capture (uses booted sim only)

```bash
./scripts/capture-asc-screenshots.sh
```

Or manually:

```bash
xcrun simctl openurl booted "org.runners241.app://login"
sleep 4
xcrun simctl io booted screenshot store-assets/screenshots/01-login-raw.png
sips -z 2796 1290 store-assets/screenshots/01-login-raw.png --out store-assets/screenshots/01-login.png
```

Upload in ASC → version → **Previews and Screenshots** → **iPhone 6.7" Display**.
