#!/bin/bash

# 241RA Mobile - API Keys Setup Script
# This script helps you configure API keys for EAS builds

set -e

echo "🔑 241RA Mobile - API Keys Setup"
echo "================================="
echo ""

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI is not installed. Please install it first:"
    echo "   npm install -g @expo/eas-cli"
    exit 1
fi

echo "✅ EAS CLI is installed"
echo ""

# Function to add secret
add_secret() {
    local name=$1
    local description=$2
    local current_value=""
    
    echo "📝 Setting up: $description"
    echo "   Secret name: $name"
    
    # Check if secret already exists
    if eas secret:list --scope project | grep -q "$name"; then
        echo "   ⚠️  Secret '$name' already exists"
        read -p "   Do you want to update it? (y/n): " update_choice
        if [[ $update_choice != "y" ]]; then
            echo "   ⏭️  Skipping $name"
            return
        fi
    fi
    
    # Get the value
    read -p "   Enter the value for $name: " current_value
    
    if [[ -z "$current_value" ]]; then
        echo "   ⚠️  Empty value provided, skipping $name"
        return
    fi
    
    # Add the secret
    echo "   🔄 Adding secret to EAS..."
    if eas secret:create --scope project --name "$name" --value "$current_value" --force; then
        echo "   ✅ Secret '$name' added successfully"
    else
        echo "   ❌ Failed to add secret '$name'"
    fi
    echo ""
}

# Function to encode file to base64
encode_file() {
    local file_path=$1
    if [[ -f "$file_path" ]]; then
        base64 -i "$file_path" | tr -d '\n'
    else
        echo ""
    fi
}

echo "🚀 Starting API keys configuration..."
echo ""

# 1. Google Maps API Key
echo "🗺️  Google Maps API Key Setup"
echo "   Get your API key from: https://console.cloud.google.com/"
echo "   Make sure to enable: Maps SDK for Android, Maps SDK for iOS, Places API"
echo ""
add_secret "GOOGLE_MAPS_API_KEY" "Google Maps API Key"

# 2. Sentry DSN
echo "🐛 Sentry DSN Setup"
echo "   Get your DSN from: https://sentry.io/"
echo "   Go to your project settings > Client Keys (DSN)"
echo ""
add_secret "SENTRY_DSN" "Sentry DSN for error tracking"

# 3. Firebase iOS Configuration
echo "🔥 Firebase iOS Configuration"
echo "   Download GoogleService-Info.plist from Firebase Console"
echo "   Bundle ID should be: org.runners241.app"
echo ""
read -p "   Enter path to GoogleService-Info.plist (or press Enter to skip): " firebase_ios_path

if [[ -n "$firebase_ios_path" && -f "$firebase_ios_path" ]]; then
    echo "   🔄 Encoding GoogleService-Info.plist..."
    encoded_plist=$(encode_file "$firebase_ios_path")
    if [[ -n "$encoded_plist" ]]; then
        echo "   🔄 Adding Firebase iOS config to EAS..."
        if eas secret:create --scope project --name "GOOGLE_SERVICE_INFO_PLIST" --value "$encoded_plist" --force; then
            echo "   ✅ Firebase iOS config added successfully"
        else
            echo "   ❌ Failed to add Firebase iOS config"
        fi
    else
        echo "   ❌ Failed to encode GoogleService-Info.plist"
    fi
else
    echo "   ⏭️  Skipping Firebase iOS config"
fi
echo ""

# 4. Firebase Android Configuration
echo "🤖 Firebase Android Configuration"
echo "   Download google-services.json from Firebase Console"
echo "   Package name should be: org.runners241.app"
echo ""
read -p "   Enter path to google-services.json (or press Enter to skip): " firebase_android_path

if [[ -n "$firebase_android_path" && -f "$firebase_android_path" ]]; then
    echo "   📁 Copying google-services.json to android/app/..."
    cp "$firebase_android_path" "android/app/google-services.json"
    echo "   ✅ Firebase Android config copied successfully"
else
    echo "   ⏭️  Skipping Firebase Android config"
fi
echo ""

# 5. Create local .env file
echo "📄 Creating local .env file for development..."
cat > .env << EOF
# 241RA Mobile - Local Development Environment Variables
# Copy this file and add your actual API keys for local development

EXPO_PUBLIC_API_URL=https://241runners-api-v2.azurewebsites.net
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
EXPO_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
EOF

echo "   ✅ Created .env file template"
echo "   📝 Edit .env file with your actual API keys for local development"
echo ""

# 6. Verify configuration
echo "🔍 Verifying configuration..."
echo ""

# List all secrets
echo "📋 Current EAS secrets:"
eas secret:list --scope project
echo ""

# Check if required files exist
echo "📁 Checking required files:"
if [[ -f "android/app/google-services.json" ]]; then
    echo "   ✅ android/app/google-services.json exists"
else
    echo "   ⚠️  android/app/google-services.json missing"
fi

if [[ -f ".env" ]]; then
    echo "   ✅ .env file exists"
else
    echo "   ⚠️  .env file missing"
fi

echo ""
echo "🎉 API Keys setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Edit .env file with your actual API keys for local development"
echo "   2. Test your configuration by running: npm run start"
echo "   3. Create a preview build: eas build --profile preview --platform all"
echo "   4. Test the preview build on physical devices"
echo "   5. Create production build when ready: eas build --profile production --platform all"
echo ""
echo "📚 For detailed setup instructions, see: API_KEYS_SETUP.md"
echo ""
echo "🔒 Security reminder:"
echo "   - Never commit .env file to version control"
echo "   - Keep your API keys secure"
echo "   - Monitor API usage and costs"
echo ""
