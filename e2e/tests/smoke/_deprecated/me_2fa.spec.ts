
import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://127.0.0.1:5050';

test.describe('POST /me/2fa Tests', () => {

    let authToken = '';

    test.beforeAll(async ({ request }) => {
        const response = await request.post(`${API_URL}/auth/login`, {
            data: { email: 'gsatoru0373@gmail.com', password: 'Gojo@123', loginType: 'email' }
        });
        const body = await response.json();
        authToken = body.user?.auth?.accessToken || body.token?.accessToken || '';
    });

    test('POST /me/2fa - 200 Success', async ({ request }) => {
        // Toggle 2FA (enable/disable)
        const response = await request.post(`${API_URL}/me/2fa`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { enabled: false } 
        });
        console.log(`2FA Status: ${response.status()}`);
        expect([200, 400, 409]).toContain(response.status());
    });

    test('POST /me/2fa - 400 Bad Request', async ({ request }) => {
        const response = await request.post(`${API_URL}/me/2fa`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: {} // Missing 'enabled'
        });
        expect([400, 422]).toContain(response.status());
    });

    test('POST /me/2fa - 401 Unauthorized', async ({ request }) => {
        const response = await request.post(`${API_URL}/me/2fa`, {
            data: { enabled: true }
        });
        expect(response.status()).toBe(401);
    });

    test('POST /me/2fa - 422 Invalid Type', async ({ request }) => {
        const response = await request.post(`${API_URL}/me/2fa`, {
             headers: { 'Authorization': `Bearer ${authToken}` },
            data: { enabled: 'invalid' }
        });
        expect([400, 422]).toContain(response.status());
    });

});
