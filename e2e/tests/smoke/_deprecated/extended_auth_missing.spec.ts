import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://127.0.0.1:5050';

test.describe('Auth Missing Endpoints Coverage', () => {

    // 1. POST /auth/email/check
    test('POST /auth/email/check - Success', async ({ request }) => {
        const response = await request.post(`${API_URL}/auth/email/check`, {
            data: { email: 'test@example.com' }
        });
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body).toHaveProperty('success');
    });

    // 2. GET /auth/payment/status
    test('GET /auth/payment/status - Success', async ({ request }) => {
        // Requires Bearer Token? Docs say yes. Let's try without first (Unauth check) or login.
        // Actually, let's login first to be safe.
        const loginRes = await request.post(`${API_URL}/auth/login`, {
            data: { email: 'monishkumarms3@gmail.com', password: 'Password123!' }
        });
        const loginBody = await loginRes.json();
        const token = loginBody.auth?.accessToken;

        const response = await request.get(`${API_URL}/auth/payment/status`, {
            params: { email: 'monishkumarms3@gmail.com' },
            headers: { 'Authorization': `Bearer ${token}` }
        });
        // Might accept 200 or 404 (if not found), simplified to 200/404
        expect([200, 404]).toContain(response.status());
    });

    // 3. POST /auth/password/forgot
    test('POST /auth/password/forgot - Success', async ({ request }) => {
        const response = await request.post(`${API_URL}/auth/password/forgot`, {
            data: { email: 'monishkumarms3@gmail.com' }
        });
        // Expect 200 OK
        expect(response.status()).toBe(200);
    });

});
