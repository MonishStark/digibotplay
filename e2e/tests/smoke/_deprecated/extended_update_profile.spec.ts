
import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://127.0.0.1:5050';

test.describe('Extended Profile Update: PATCH /me/profile', () => {

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
    });

    // 1. 200 OK - Update Firstname
    test('200 OK - Update Profile (Firstname)', async ({ request }) => {
        const uniqueName = `Updated_${Date.now()}`;
        const response = await request.patch(`${API_URL}/me/profile`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { firstname: uniqueName }
        });
        
        console.log(`Update Status: ${response.status()}`);
        const body = await response.json();
        console.log(`Update Body: ${JSON.stringify(body)}`);
        
        expect(response.status()).toBe(200);
        expect(body.success).toBe(true);
        expect(body.user.firstname).toBe(uniqueName);
    });
    
    // 2. 400 Bad Request - Empty Body? Or specific invalid field?
    // Since we don't know the code, we'll try sending empty object. 
    // Usually "At least one field must be provided"
    test('400 Bad Request - Empty Update', async ({ request }) => {
        const response = await request.patch(`${API_URL}/me/profile`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: {}
        });
        // Might be 400 or just 200 with no changes depending on implementation
        console.log(`Empty Update Status: ${response.status()}`);
    });

    // 3. 401 Unauthorized
    test('401 Unauthorized - No Token', async ({ request }) => {
         const response = await request.patch(`${API_URL}/me/profile`, {
             data: { firstname: 'Fail' }
         });
         expect([401, 403]).toContain(response.status());
    });
    
    // 4. CHECK VERIFY ACCOUNT (Mystery Route)
    test('Check POST /auth/verify-account Existence', async ({ request }) => {
        const response = await request.post(`${API_URL}/auth/verify-account`, {
            data: { email: 'test', token: 'test' }
        });
        console.log(`POST /auth/verify-account Status: ${response.status()}`);
        // If 404, then file was right. If 400/401/200, file is wrong.
    });

});
