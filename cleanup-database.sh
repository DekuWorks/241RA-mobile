#!/bin/bash

# Database Cleanup Script for 241Runners
# This script will help clean up the database to keep only the 6 admin users

API_URL="https://241runners-api-v2.azurewebsites.net"
ADMIN_EMAIL="dekuworks1@gmail.com"
ADMIN_PASSWORD="marcus2025"

echo "🧹 241Runners Database Cleanup"
echo "=============================="
echo ""

# Get authentication token
echo "🔐 Authenticating as admin..."
TOKEN=$(curl -s -X POST "${API_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"${ADMIN_EMAIL}\", \"password\": \"${ADMIN_PASSWORD}\"}" | jq -r '.accessToken')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
    echo "❌ Authentication failed!"
    exit 1
fi

echo "✅ Authentication successful"
echo ""

# Get current user breakdown
echo "📊 Current database status:"
curl -s "${API_URL}/api/Admin/users-debug" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" | jq '.users | group_by(.role) | map({role: .[0].role, count: length})'

echo ""
echo "👥 Current admin users (should be kept):"
curl -s "${API_URL}/api/Admin/users-debug" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" | jq '.users[] | select(.role == "admin") | {id, email, firstName, lastName, role}'

echo ""
echo "⚠️  WARNING: This will delete all non-admin users!"
echo "The following users will be DELETED:"
curl -s "${API_URL}/api/Admin/users-debug" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" | jq '.users[] | select(.role != "admin") | {id, email, firstName, lastName, role}'

echo ""
read -p "Do you want to proceed with cleanup? (yes/no): " confirm

if [ "$confirm" = "yes" ]; then
    echo ""
    echo "🗑️  Starting database cleanup..."
    
    # Get all non-admin user IDs
    USER_IDS=$(curl -s "${API_URL}/api/Admin/users-debug" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" | jq -r '.users[] | select(.role != "admin") | .id')
    
    deleted_count=0
    for user_id in $USER_IDS; do
        echo "Deleting user ID: $user_id"
        response=$(curl -s -X DELETE "${API_URL}/api/Admin/users/${user_id}" \
          -H "Authorization: Bearer ${TOKEN}" \
          -H "Content-Type: application/json")
        
        if echo "$response" | grep -q "success\|deleted"; then
            echo "✅ Deleted user ID: $user_id"
            ((deleted_count++))
        else
            echo "❌ Failed to delete user ID: $user_id"
            echo "Response: $response"
        fi
        sleep 1  # Avoid rate limiting
    done
    
    echo ""
    echo "🎉 Cleanup completed!"
    echo "Deleted $deleted_count non-admin users"
    
    # Show final status
    echo ""
    echo "📊 Final database status:"
    curl -s "${API_URL}/api/Admin/users-debug" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" | jq '.users | group_by(.role) | map({role: .[0].role, count: length})'
    
    echo ""
    echo "👥 Remaining admin users:"
    curl -s "${API_URL}/api/Admin/users-debug" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" | jq '.users[] | select(.role == "admin") | {id, email, firstName, lastName, role}'
    
else
    echo "❌ Cleanup cancelled"
fi

echo ""
echo "🔗 API Endpoints used:"
echo "- Login: POST ${API_URL}/api/auth/login"
echo "- Users Debug: GET ${API_URL}/api/Admin/users-debug"
echo "- Delete User: DELETE ${API_URL}/api/Admin/users/{id}"
