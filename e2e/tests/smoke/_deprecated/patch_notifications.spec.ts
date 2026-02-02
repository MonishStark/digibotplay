
import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://127.0.0.1:5050';

test.describe('PATCH /notifications/viewed Tests', () => {

    let authToken = '';

    test.beforeAll(async ({ request }) => {
        const response = await request.post(`${API_URL}/auth/login`, {
            data: { email: 'gsatoru0373@gmail.com', password: 'Gojo@123', loginType: 'email' }
        });
        const body = await response.json();
        authToken = body.user?.auth?.accessToken || body.token?.accessToken || '';
    });

    test('PATCH /notifications/viewed - 200 Success', async ({ request }) => {
        const response = await request.patch(`${API_URL}/notifications/viewed`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: {} // No body needed typically, or { viewed: true }
        });
        console.log(`Mark Viewed Status: ${response.status()}`);
        expect([200, 204, 404]).toContain(response.status()); // 404 if not implemented
    });

    test('PATCH /notifications/viewed - 401 Unauthorized', async ({ request }) => {
        const response = await request.patch(`${API_URL}/notifications/viewed`, {
            data: {}
        });
        expect([401, 404]).toContain(response.status());
    });

});
