// Test Admin Login for 241Runners Mobile App
// This script tests the admin login functionality

const API_URL = 'https://241runners-api-v2.azurewebsites.net';

// Test admin login
async function testAdminLogin() {
    console.log('🔐 Testing Admin Login');
    console.log('====================');
    
    const credentials = {
        email: 'dekuworks1@gmail.com',
        password: 'admin123'
    };
    
    try {
        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials)
        });
        
        const data = await response.json();
        
        if (data.accessToken) {
            console.log('✅ Login successful!');
            console.log('Token:', data.accessToken.substring(0, 20) + '...');
            console.log('User:', data.user || 'No user data');
            
            // Test admin endpoints with token
            await testAdminEndpoints(data.accessToken);
            
            return data.accessToken;
        } else {
            console.log('❌ Login failed:', data);
            return null;
        }
    } catch (error) {
        console.log('❌ Login error:', error.message);
        return null;
    }
}

// Test admin endpoints with authentication
async function testAdminEndpoints(token) {
    console.log('\n🔍 Testing Admin Endpoints');
    console.log('==========================');
    
    const endpoints = [
        { url: '/api/Admin/stats', name: 'Admin Stats' },
        { url: '/api/Admin/users-debug', name: 'Users Debug' },
        { url: '/api/Admin/activity', name: 'Admin Activity' },
        { url: '/api/auth/profile', name: 'Auth Profile' }
    ];
    
    for (const endpoint of endpoints) {
        try {
            const response = await fetch(`${API_URL}${endpoint.url}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (response.ok) {
                console.log(`✅ ${endpoint.name}: Success`);
                if (data && Object.keys(data).length > 0) {
                    console.log(`   Data: ${JSON.stringify(data).substring(0, 100)}...`);
                } else {
                    console.log(`   Data: Empty response`);
                }
            } else {
                console.log(`❌ ${endpoint.name}: ${response.status} - ${data.message || 'Error'}`);
            }
        } catch (error) {
            console.log(`❌ ${endpoint.name}: ${error.message}`);
        }
    }
}

// Run the test
if (typeof fetch !== 'undefined') {
    testAdminLogin();
} else {
    console.log('This script requires a browser environment with fetch support.');
    console.log('Run this in the browser console or use a Node.js environment with fetch.');
}
