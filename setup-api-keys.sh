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

# 3. Supabase Configuration (optional)
echo "⚡ Supabase Configuration"
echo "   Get your project URL and anon key from: https://supabase.com/dashboard"
echo ""
add_secret "EXPO_PUBLIC_SUPABASE_URL" "Supabase project URL"
add_secret "EXPO_PUBLIC_SUPABASE_ANON_KEY" "Supabase anon/public key"

# 4. Create local .env file
echo "📄 Creating local .env file for development..."
cat > .env << EOF
# 241RA Mobile - Local Development Environment Variables
# Copy this file and add your actual API keys for local development

EXPO_PUBLIC_API_URL=https://241runners-api-v2.azurewebsites.net
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
EXPO_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
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
