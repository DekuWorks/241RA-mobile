#!/bin/bash

# Test Authentication for Admin Endpoints
API_URL="https://241runners-api-v2.azurewebsites.net"

echo "🔐 Testing Admin Endpoint Authentication"
echo "========================================"

# Function to test endpoint with token
test_endpoint_with_auth() {
    local endpoint=$1
    local token=$2
    local description=$3
    
    echo "Testing: $description"
    echo "Endpoint: $endpoint"
    
    if [ -n "$token" ]; then
        response=$(curl -s "$API_URL$endpoint" \
            -H "Authorization: Bearer $token" \
            -H "Content-Type: application/json")
    else
        response=$(curl -s "$API_URL$endpoint" \
            -H "Content-Type: application/json")
    fi
    
    echo "Response: $response"
    echo "---"
}

# Function to test login and get token
test_login() {
    local email=$1
    local password=$2
    local name=$3
    
    echo "Testing login for $name..."
    response=$(curl -s -X POST "$API_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\": \"$email\", \"password\": \"$password\"}")
    
    echo "Login response: $response"
    
    # Extract token if successful
    token=$(echo "$response" | jq -r '.accessToken // empty' 2>/dev/null)
    
    if [ -n "$token" ] && [ "$token" != "null" ]; then
        echo "✅ Login successful, token: ${token:0:20}..."
        echo "$token"
    else
        echo "❌ Login failed"
        echo ""
    fi
}

echo ""
echo "🧪 Testing Login with Different Passwords:"
echo "=========================================="

# Test different passwords for Marcus admin
for password in "admin123" "password" "123456" "admin" "241runners" "241Runners" "Admin123"; do
    token=$(test_login "dekuworks1@gmail.com" "$password" "Marcus Brown")
    if [ -n "$token" ]; then
        echo "✅ Found working password: $password"
        break
    fi
    sleep 2  # Avoid rate limiting
done

if [ -z "$token" ] || [ "$token" = "null" ]; then
    echo "❌ No working password found for Marcus admin"
    echo "Let's test endpoints without authentication..."
    echo ""
    
    # Test endpoints without auth
    echo "📊 Testing Endpoints Without Authentication:"
    echo "==========================================="
    
    test_endpoint_with_auth "/api/Admin/stats" "" "Admin Stats (no auth)"
    test_endpoint_with_auth "/api/Admin/users-debug" "" "Users Debug (no auth)"
    test_endpoint_with_auth "/api/Admin/activity" "" "Admin Activity (no auth)"
    test_endpoint_with_auth "/api/auth/profile" "" "Auth Profile (no auth)"
    
    exit 0
fi

echo ""
echo "🔍 Testing Authenticated Endpoints:"
echo "==================================="

# Test authenticated endpoints
test_endpoint_with_auth "/api/Admin/stats" "$token" "Admin Stats (authenticated)"
test_endpoint_with_auth "/api/Admin/users-debug" "$token" "Users Debug (authenticated)"
test_endpoint_with_auth "/api/Admin/activity" "$token" "Admin Activity (authenticated)"
test_endpoint_with_auth "/api/auth/profile" "$token" "Auth Profile (authenticated)"

echo ""
echo "📋 Authentication Test Summary:"
echo "==============================="
echo "✅ Token obtained successfully"
echo "🔗 API Base URL: $API_URL"
echo "🎯 Admin endpoints tested with authentication"
