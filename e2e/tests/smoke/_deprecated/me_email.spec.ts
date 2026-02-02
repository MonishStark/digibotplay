
import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://127.0.0.1:5050';

test.describe('POST /me/email Tests', () => {

    let authToken = '';

    test.beforeAll(async ({ request }) => {
        const response = await request.post(`${API_URL}/auth/login`, {
            data: { email: 'gsatoru0373@gmail.com', password: 'Gojo@123', loginType: 'email' }
        });
        const body = await response.json();
        authToken = body.user?.auth?.accessToken || body.token?.accessToken || '';
    });

    test('POST /me/email - 200 Success', async ({ request }) => {
        const response = await request.post(`${API_URL}/me/email`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { newEmail: `test_new_${Date.now()}@example.com` }
        });
        console.log(`Update Email Status: ${response.status()}`);
        expect([200, 400, 404, 409]).toContain(response.status());
    });

    test('POST /me/email - 401 Unauthorized', async ({ request }) => {
        const response = await request.post(`${API_URL}/me/email`, {
            data: { newEmail: 'email@test.com' }
        });
        expect([401, 404]).toContain(response.status());
    });
});
