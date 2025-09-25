#!/bin/bash

# 241 Runners Awareness - App Icon Setup Script
# This script helps set up app icons from your main logo

echo "🎯 241 Runners Awareness - App Icon Setup"
echo "========================================"

# Check if the main logo exists
if [ ! -f "assets/241runners-logo.png" ]; then
    echo "❌ Please save your 241 Runners Awareness logo as 'assets/241runners-logo.png'"
    echo "   Requirements:"
    echo "   - Format: PNG"
    echo "   - Size: 1024x1024 pixels minimum"
    echo "   - Background: Transparent or white"
    echo ""
    echo "   Once you've saved the logo, run this script again."
    exit 1
fi

echo "✅ Found 241runners-logo.png"
echo ""

# Create backup of original
cp assets/241runners-logo.png assets/241runners-logo-backup.png

echo "📱 Setting up app icons..."

# Copy the main logo to be the primary icon
cp assets/241runners-logo.png assets/icon.png
echo "✅ Created icon.png"

# Copy for adaptive icon (Android)
cp assets/241runners-logo.png assets/adaptive-icon.png
echo "✅ Created adaptive-icon.png"

# Copy for splash screen
cp assets/241runners-logo.png assets/splash-icon.png
echo "✅ Created splash-icon.png"

# Copy for favicon (web)
cp assets/241runners-logo.png assets/favicon.png
echo "✅ Created favicon.png"

echo ""
echo "🎉 App icons setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Build the app to test the new icons:"
echo "   eas build --platform ios --profile preview"
echo ""
echo "2. If you need different sizes, you can use online tools like:"
echo "   - https://appicon.co/"
echo "   - https://icon.kitchen/"
echo ""
echo "3. The app config is already updated to use your logo"
echo ""
echo "🔧 Files created:"
echo "   - assets/icon.png (main app icon)"
echo "   - assets/adaptive-icon.png (Android adaptive icon)"
echo "   - assets/splash-icon.png (splash screen)"
echo "   - assets/favicon.png (web favicon)"
echo "   - assets/241runners-logo-backup.png (backup of original)"