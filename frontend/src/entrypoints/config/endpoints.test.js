/**
 * Simple test file to verify endpoints configuration
 * This can be run in development to check all URLs are correctly configured
 */

import { API_ENDPOINTS, WS_ENDPOINTS, SERVICE_CONFIG, buildUrl, buildWsUrl } from './endpoints.js';

// Test function to log all configurations
export function testEndpointsConfiguration() {
    console.group('🔧 Testing Endpoints Configuration');
    
    // Test API endpoints
    console.group('📡 API Endpoints:');
    console.log('Accounts Base:', API_ENDPOINTS.accounts.base);
    console.log('Accounts Auth Login:', API_ENDPOINTS.accounts.auth.login);
    console.log('Finance Base:', API_ENDPOINTS.finance.base);
    console.log('Sports Base:', API_ENDPOINTS.sports.base);
    console.groupEnd();
    
    // Test WebSocket endpoints
    console.group('🔌 WebSocket Endpoints:');
    console.log('Finance WS:', WS_ENDPOINTS.finance);
    console.log('Sports WS:', WS_ENDPOINTS.sports);
    console.groupEnd();
    
    // Test service configuration
    console.group('⚙️ Service Configuration:');
    console.log('Accounts:', SERVICE_CONFIG.accounts);
    console.log('Finance:', SERVICE_CONFIG.finance);
    console.log('Sports:', SERVICE_CONFIG.sports);
    console.groupEnd();
    
    // Test helper functions
    console.group('🛠️ Helper Functions:');
    try {
        console.log('buildUrl(accounts, /health):', buildUrl('accounts', '/health'));
        console.log('buildUrl(finance, /api/trades):', buildUrl('finance', '/api/trades'));
        console.log('buildWsUrl(finance):', buildWsUrl('finance'));
        console.log('buildWsUrl(sports):', buildWsUrl('sports'));
    } catch (error) {
        console.error('Helper function error:', error);
    }
    console.groupEnd();
    
    // Test validation
    console.group('✅ Validation:');
    const expectedPorts = { accounts: 5000, finance: 4001, sports: 4000 };
    let allValid = true;
    
    Object.entries(expectedPorts).forEach(([service, expectedPort]) => {
        const actualPort = SERVICE_CONFIG[service]?.port;
        const isValid = actualPort === expectedPort;
        allValid = allValid && isValid;
        console.log(`${service} port: ${actualPort} (expected: ${expectedPort}) ${isValid ? '✅' : '❌'}`);
    });
    
    // Check URL formats
    const urlPattern = /^https?:\/\/.+:\d+/;
    const wsPattern = /^wss?:\/\/.+:\d+/;
    
    const apiUrlValid = urlPattern.test(API_ENDPOINTS.accounts.base);
    const wsUrlValid = wsPattern.test(WS_ENDPOINTS.finance);
    
    console.log(`API URL format: ${apiUrlValid ? '✅' : '❌'}`);
    console.log(`WebSocket URL format: ${wsUrlValid ? '✅' : '❌'}`);
    console.log(`Overall configuration: ${allValid && apiUrlValid && wsUrlValid ? '✅ VALID' : '❌ INVALID'}`);
    console.groupEnd();
    
    console.groupEnd();
    
    return allValid && apiUrlValid && wsUrlValid;
}

// Auto-run test in development
if (typeof window !== 'undefined' && window.location?.hostname === 'localhost') {
    // Small delay to ensure imports are loaded
    setTimeout(() => {
        testEndpointsConfiguration();
    }, 100);
}