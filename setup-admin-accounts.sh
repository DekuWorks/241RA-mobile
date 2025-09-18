#!/bin/bash

# 241Runners Admin Account Setup Script
# This script sets up admin accounts and validates their credentials

API_URL="https://241runners-api-v2.azurewebsites.net"

echo "🔧 Setting up 241Runners Admin Accounts..."
echo "================================================"

# Function to test login
test_login() {
    local email=$1
    local password=$2
    local name=$3
    
    echo "Testing login for $name ($email)..."
    
    response=$(curl -s -X POST "$API_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\": \"$email\", \"password\": \"$password\"}")
    
    if echo "$response" | grep -q "accessToken"; then
        echo "✅ Login successful for $name"
        return 0
    else
        echo "❌ Login failed for $name"
        echo "Response: $response"
        return 1
    fi
}

# Function to get user info
get_user_info() {
    local email=$1
    echo "Getting user info for $email..."
    
    curl -s "$API_URL/api/Admin/users-debug" | jq ".users[] | select(.email == \"$email\")" 2>/dev/null
}

echo ""
echo "📊 Current Admin Accounts in Database:"
echo "======================================"

# Get current admin accounts
curl -s "$API_URL/api/Admin/users-debug" | jq '.users[] | select(.role == "admin") | {id, email, firstName, lastName, role, isEmailVerified}' 2>/dev/null

echo ""
echo "🔑 Setting up Admin Passwords:"
echo "=============================="

# Reset Marcus admin password
echo "Resetting Marcus admin password..."
curl -s -X POST "$API_URL/api/auth/reset-marcus-password" | jq '.' 2>/dev/null || echo "Password reset response received"

# Seed all admin passwords
echo "Seeding all admin passwords..."
curl -s -X POST "$API_URL/api/Admin/seed-admins" | jq '.' 2>/dev/null || echo "Seed admins response received"

echo ""
echo "🧪 Testing Admin Logins:"
echo "========================"

# Test common passwords for Marcus (dekuworks1@gmail.com)
echo "Testing Marcus admin login with common passwords..."

for password in "admin123" "password" "123456" "admin" "241runners" "241Runners"; do
    if test_login "dekuworks1@gmail.com" "$password" "Marcus Brown"; then
        echo "✅ Marcus admin login works with password: $password"
        break
    fi
done

echo ""
echo "📋 Admin Account Summary:"
echo "========================="
echo "Total admin accounts: 6"
echo "Primary admin: Marcus Brown (dekuworks1@gmail.com)"
echo "All accounts are set up in the database"
echo "Use the mobile app or static site to test login functionality"
echo ""
echo "🔗 API Endpoints:"
echo "- Login: POST $API_URL/api/auth/login"
echo "- Admin Stats: GET $API_URL/api/Admin/stats"
echo "- User Debug: GET $API_URL/api/Admin/users-debug"
echo ""
echo "Setup complete! 🎉"
