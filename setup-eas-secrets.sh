#!/bin/bash

# EAS Secrets Setup Script for 241RA Mobile App
# This script helps you set up all required EAS secrets for the project

echo "🚀 Setting up EAS Secrets for 241RA Mobile App"
echo "=============================================="

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI is not installed. Please install it first:"
    echo "   npm install -g eas-cli"
    exit 1
fi

echo "✅ EAS CLI is installed"

# Check if user is logged in
if ! eas whoami &> /dev/null; then
    echo "❌ You are not logged in to EAS. Please log in first:"
    echo "   eas login"
    exit 1
fi

echo "✅ You are logged in to EAS"

# Function to set secret with validation
set_secret() {
    local secret_name=$1
    local secret_description=$2
    local secret_value=""
    
    echo ""
    echo "🔧 Setting up: $secret_name"
    echo "   Description: $secret_description"
    
    # Check if secret already exists
    if eas secret:list --scope project | grep -q "$secret_name"; then
        echo "   ⚠️  Secret already exists. Do you want to update it? (y/n)"
        read -r update_choice
        if [[ $update_choice != "y" ]]; then
            echo "   ⏭️  Skipping $secret_name"
            return
        fi
    fi
    
    echo "   Enter the value for $secret_name:"
    read -r secret_value
    
    if [[ -z "$secret_value" ]]; then
        echo "   ❌ Empty value provided. Skipping $secret_name"
        return
    fi
    
    # Set the secret
    if eas secret:create --scope project --name "$secret_name" --value "$secret_value" --force; then
        echo "   ✅ Successfully set $secret_name"
    else
        echo "   ❌ Failed to set $secret_name"
    fi
}

echo ""
echo "📋 You'll need the following values:"
echo "   - Google Maps API Key (from Google Cloud Console)"
echo "   - Sentry DSN (from Sentry.io)"
echo "   - Supabase URL and anon key (from supabase.com)"
echo ""

# Google Maps API Key
set_secret "EXPO_PUBLIC_GOOGLE_MAPS_API_KEY" "Google Maps API Key for map functionality"

# Sentry DSN
set_secret "EXPO_PUBLIC_SENTRY_DSN" "Sentry DSN for error tracking"

# Supabase Configuration
set_secret "EXPO_PUBLIC_SUPABASE_URL" "Supabase project URL (https://xxx.supabase.co)"
set_secret "EXPO_PUBLIC_SUPABASE_ANON_KEY" "Supabase anon/public API key"

echo ""
echo "🎉 EAS Secrets setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Create a Supabase project and add URL + anon key to EAS secrets"
echo "   2. Implement backend endpoints (see BACKEND_IMPLEMENTATION_GUIDE.md)"
echo "   3. Test with preview builds"
echo ""
echo "🔍 To verify your secrets, run:"
echo "   eas secret:list --scope project"
echo ""
echo "🏗️  To build with secrets, run:"
echo "   eas build --platform ios --profile preview"
echo "   eas build --platform android --profile preview"
