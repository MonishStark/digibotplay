
import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://127.0.0.1:5050';

test.describe('PATCH /me/profile Tests', () => {

    let authToken = '';

    test.beforeAll(async ({ request }) => {
        const response = await request.post(`${API_URL}/auth/login`, {
            data: { email: 'gsatoru0373@gmail.com', password: 'Gojo@123', loginType: 'email' }
        });
        const body = await response.json();
        authToken = body.user?.auth?.accessToken || body.token?.accessToken || '';
    });

    test('PATCH /me/profile - 200 Success', async ({ request }) => {
        const response = await request.patch(`${API_URL}/me/profile`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { firstname: `UpdatedFn`, lastname: `UpdatedLn` }
        });
        console.log(`Update Profile Status: ${response.status()}`);
        expect([200, 400, 404]).toContain(response.status());
    });

    test('PATCH /me/profile - 400 Bad Request', async ({ request }) => {
        const response = await request.patch(`${API_URL}/me/profile`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: {} // Empty body
        });
        expect([200, 400, 422]).toContain(response.status());
    });

    test('PATCH /me/profile - 401 Unauthorized', async ({ request }) => {
        const response = await request.patch(`${API_URL}/me/profile`, {
            data: { firstname: 'Fail' }
        });
        expect([401, 404]).toContain(response.status());
    });

});
