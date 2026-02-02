
import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://127.0.0.1:5050';

test.describe('Extended Usage Verification: GET /me/usage', () => {

    let authToken = '';
    const userEmail = 'gsatoru0373@gmail.com';
    const password = 'Gojo@123';

    test.beforeAll(async ({ request }) => {
        const response = await request.post(`${API_URL}/auth/login`, {
            data: { email: userEmail, password: password, loginType: 'email' }
        });
        const body = await response.json();
        if (body.user && body.user.auth && body.user.auth.accessToken) {
            authToken = body.user.auth.accessToken;
        } else if (body.token) {
            authToken = body.token.accessToken || body.token;
        }
        console.log('Usage Test Login:', response.status(), authToken ? 'Token Acquired' : 'No Token');
    });

    // 1. 200 OK - Get Usage (No Params)
    test('200 OK - Get Usage Data (Default)', async ({ request }) => {
        const response = await request.get(`${API_URL}/me/usage`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        console.log(`Usage Status: ${response.status()}`);
        const body = await response.json();
        console.log(`Usage Body: ${JSON.stringify(body).substring(0, 500)}...`);

        expect(response.status()).toBe(200);
        expect(body.success).toBe(true);
        expect(body).toHaveProperty('queries');
        // The screenshot showed "queries" object, or "User data"? 
        // Logic shows it returns "queries" object and upload sources.
    });

    // 2. 400 Bad Request - Invalid Params (Year without Month)
    test('400 Bad Request - Year without Month', async ({ request }) => {
        const response = await request.get(`${API_URL}/me/usage?year=2023`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        expect(response.status()).toBe(400);
    });
    
    // 3. 401 Unauthorized
    test('401 Unauthorized - No Token', async ({ request }) => {
         const response = await request.get(`${API_URL}/me/usage`);
         expect([401, 403]).toContain(response.status());
    });

    // 4. 403 Forbidden - Invalid Token (Different User Context)
    test('403 Forbidden - Invalid Token', async ({ request }) => {
        const response = await request.get(`${API_URL}/me/usage`, {
            headers: { 'Authorization': 'Bearer invalid_or_other_user_token' }
        });
        // May return 401 or 403 depending on implementation
        expect([401, 403]).toContain(response.status());
        
        const body = await response.json();
        expect(body).toHaveProperty('success', false);
    });

    // 5. 405 Method Not Allowed - POST Request
    test('405 Method Not Allowed - POST Request', async ({ request }) => {
        const response = await request.post(`${API_URL}/me/usage`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: {}
        });
        expect([405, 404]).toContain(response.status());
    });

});
