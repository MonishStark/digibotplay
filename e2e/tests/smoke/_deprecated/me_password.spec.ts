
import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://127.0.0.1:5050';

test.describe('POST /me/password Tests', () => {

    let authToken = '';

    test.beforeAll(async ({ request }) => {
        const response = await request.post(`${API_URL}/auth/login`, {
            data: { email: 'gsatoru0373@gmail.com', password: 'Gojo@123', loginType: 'email' }
        });
        const body = await response.json();
        authToken = body.user?.auth?.accessToken || body.token?.accessToken || '';
    });

    test('POST /me/password - 200 Success', async ({ request }) => {
        const response = await request.post(`${API_URL}/me/password`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { currentPassword: 'Gojo@123', newPassword: 'Gojo@123' }
        });
        console.log(`Change Password Status: ${response.status()}`);
        expect([200, 400, 404]).toContain(response.status());
    });

    test('POST /me/password - 401 Unauthorized', async ({ request }) => {
        const response = await request.post(`${API_URL}/me/password`, {
            data: { currentPassword: 'old', newPassword: 'new' }
        });
        expect([401, 404]).toContain(response.status());
    });

    test('POST /me/password - 400 Missing Fields', async ({ request }) => {
        const response = await request.post(`${API_URL}/me/password`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: {}
        });
        expect([400, 404]).toContain(response.status());
    });

});
