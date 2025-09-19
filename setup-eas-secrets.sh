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
echo "   - Google OAuth Client IDs (from Google Cloud Console)"
echo "   - Firebase Configuration (from Firebase Console)"
echo ""

# Google Maps API Key
set_secret "EXPO_PUBLIC_GOOGLE_MAPS_API_KEY" "Google Maps API Key for map functionality"

# Sentry DSN
set_secret "EXPO_PUBLIC_SENTRY_DSN" "Sentry DSN for error tracking"

# Google OAuth Client IDs
set_secret "EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID" "Google OAuth Web Client ID"
set_secret "EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID" "Google OAuth iOS Client ID"
set_secret "EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID" "Google OAuth Android Client ID"

# Firebase Configuration
set_secret "EXPO_PUBLIC_FIREBASE_API_KEY" "Firebase API Key"
set_secret "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN" "Firebase Auth Domain (project-id.firebaseapp.com)"
set_secret "EXPO_PUBLIC_FIREBASE_PROJECT_ID" "Firebase Project ID"
set_secret "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET" "Firebase Storage Bucket (project-id.appspot.com)"
set_secret "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID" "Firebase Messaging Sender ID"
set_secret "EXPO_PUBLIC_FIREBASE_APP_ID" "Firebase App ID"

echo ""
echo "🎉 EAS Secrets setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Set up Firebase Console with your app bundle IDs"
echo "   2. Implement backend endpoints (see BACKEND_IMPLEMENTATION_GUIDE.md)"
echo "   3. Test with preview builds"
echo ""
echo "🔍 To verify your secrets, run:"
echo "   eas secret:list --scope project"
echo ""
echo "🏗️  To build with secrets, run:"
echo "   eas build --platform ios --profile preview"
echo "   eas build --platform android --profile preview"
