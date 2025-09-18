#!/bin/bash

# 241 Runners App Icon Setup Script
# This script helps you set up app icons from your logo file

echo "🎨 241 Runners App Icon Setup"
echo "=============================="
echo ""

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick is not installed."
    echo "Please install it with: brew install imagemagick"
    echo "Or download from: https://imagemagick.org/script/download.php"
    exit 1
fi

# Check if logo file exists
LOGO_FILE="241runners-logo.png"
if [ ! -f "$LOGO_FILE" ]; then
    echo "❌ Logo file not found: $LOGO_FILE"
    echo ""
    echo "Please:"
    echo "1. Save your 241 Runners logo as '$LOGO_FILE'"
    echo "2. Place it in the project root directory"
    echo "3. Run this script again"
    exit 1
fi

echo "✅ Found logo file: $LOGO_FILE"
echo ""

# Create backup of existing icons
echo "📁 Creating backup of existing icons..."
mkdir -p backup-icons
cp assets/icon.png backup-icons/icon.png.backup 2>/dev/null || true
cp assets/adaptive-icon.png backup-icons/adaptive-icon.png.backup 2>/dev/null || true

# Generate iOS icons
echo "🍏 Generating iOS icons..."
convert "$LOGO_FILE" -resize 1024x1024 assets/icon.png
echo "   ✅ 1024x1024px - App Store icon"

# Generate Android icons  
echo "🤖 Generating Android icons..."
convert "$LOGO_FILE" -resize 512x512 assets/adaptive-icon.png
echo "   ✅ 512x512px - Google Play Store icon"

# Generate additional sizes for reference
echo "📱 Generating additional sizes..."
mkdir -p generated-icons

# iOS sizes
convert "$LOGO_FILE" -resize 180x180 generated-icons/icon-180.png
convert "$LOGO_FILE" -resize 167x167 generated-icons/icon-167.png
convert "$LOGO_FILE" -resize 152x152 generated-icons/icon-152.png
convert "$LOGO_FILE" -resize 120x120 generated-icons/icon-120.png
convert "$LOGO_FILE" -resize 87x87 generated-icons/icon-87.png
convert "$LOGO_FILE" -resize 80x80 generated-icons/icon-80.png
convert "$LOGO_FILE" -resize 76x76 generated-icons/icon-76.png
convert "$LOGO_FILE" -resize 60x60 generated-icons/icon-60.png
convert "$LOGO_FILE" -resize 58x58 generated-icons/icon-58.png
convert "$LOGO_FILE" -resize 40x40 generated-icons/icon-40.png
convert "$LOGO_FILE" -resize 29x29 generated-icons/icon-29.png

# Android sizes
convert "$LOGO_FILE" -resize 192x192 generated-icons/adaptive-icon-192.png
convert "$LOGO_FILE" -resize 144x144 generated-icons/adaptive-icon-144.png
convert "$LOGO_FILE" -resize 96x96 generated-icons/adaptive-icon-96.png
convert "$LOGO_FILE" -resize 72x72 generated-icons/adaptive-icon-72.png
convert "$LOGO_FILE" -resize 48x48 generated-icons/adaptive-icon-48.png
convert "$LOGO_FILE" -resize 36x36 generated-icons/adaptive-icon-36.png

echo "   ✅ All sizes generated in generated-icons/ folder"

echo ""
echo "🎉 App icons setup complete!"
echo ""
echo "Next steps:"
echo "1. Review the generated icons in the assets/ folder"
echo "2. Test the icons at different sizes"
echo "3. Run: eas build --profile preview --platform all"
echo "4. Test the builds with your new icons"
echo ""
echo "📁 Files updated:"
echo "   - assets/icon.png (iOS main icon)"
echo "   - assets/adaptive-icon.png (Android main icon)"
echo "   - generated-icons/ (all other sizes for reference)"
echo ""
echo "🔄 To restore original icons:"
echo "   cp backup-icons/icon.png.backup assets/icon.png"
echo "   cp backup-icons/adaptive-icon.png.backup assets/adaptive-icon.png"
