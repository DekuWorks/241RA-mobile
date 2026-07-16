# Screenshots (iPhone 6.7")

Target: **1290 × 2796**

## Ready to upload
- `01-login.png` — Sign in (email/password only; no Apple/Google)
- `01b-signup.png` — Create account
- `03-cases.png` — Cases screen (may show empty state if API has no cases)

## Still capture after demo login
- Profile / Home
- Map (needs Maps key in local env; production EAS secret is set)
- Report Sighting / Report Case
- Runner Profile create

```bash
xcrun simctl io booted screenshot store-assets/screenshots/NN-name-raw.png
sips -z 2796 1290 store-assets/screenshots/NN-name-raw.png --out store-assets/screenshots/NN-name.png
```

Upload in ASC → version → Previews and Screenshots → iPhone 6.7" Display.
