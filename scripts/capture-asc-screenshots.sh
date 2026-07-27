#!/usr/bin/env bash
# Capture App Store screenshots from the currently booted iOS Simulator.
# Does NOT boot or switch simulators.
set -euo pipefail

export PATH="/usr/bin:/bin:/usr/sbin:/sbin:/opt/homebrew/bin"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/store-assets/screenshots"
SCHEME="org.runners241.app"
W=1290
H=2796

mkdir -p "$OUT"

if ! xcrun simctl list devices | grep -q Booted; then
  echo "No booted simulator. Boot one in Xcode or Simulator.app first."
  exit 1
fi

echo "Booted simulator:"
xcrun simctl list devices | grep Booted

capture() {
  local name="$1"
  local path="$2"
  local raw="/tmp/${name}-raw.png"
  local final="$OUT/${name}.png"

  echo "→ $name ($path)"
  xcrun simctl openurl booted "${SCHEME}:/${path#/}"
  sleep 5
  xcrun simctl io booted screenshot "$raw"
  sips -z "$H" "$W" "$raw" --out "$final" >/dev/null
  rm -f "$raw"
  sips -g pixelWidth -g pixelHeight "$final" | grep pixel
}

xcrun simctl launch booted org.runners241.app 2>/dev/null || true
sleep 2

capture "01-login" "/login"
capture "01b-signup" "/signup"
capture "02-map" "/map"
capture "03-cases" "/cases"
capture "04-profile-map" "/map?source=profile"
capture "05-profile" "/profile"
capture "06-report-case" "/report-case"

echo "Done. Upload $OUT/*.png to ASC → iPhone 6.7\" Display."
