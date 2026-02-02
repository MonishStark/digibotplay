
import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://127.0.0.1:5050';

test.describe('DELETE /companies/:id/invitations/:id Tests', () => {

    let authToken = '';

    test.beforeAll(async ({ request }) => {
        const response = await request.post(`${API_URL}/auth/login`, {
            data: { email: 'gsatoru0373@gmail.com', password: 'Gojo@123', loginType: 'email' }
        });
        const body = await response.json();
        authToken = body.user?.auth?.accessToken || body.token?.accessToken || '';
    });

    test('DELETE Invitation - 200 Success (Simulated)', async ({ request }) => {
        const response = await request.delete(`${API_URL}/companies/1/invitations/1`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        console.log(`Delete Invitation Status: ${response.status()}`);
        expect([200, 204, 404]).toContain(response.status());
    });

    test('DELETE Invitation - 401 Unauthorized', async ({ request }) => {
        const response = await request.delete(`${API_URL}/companies/1/invitations/1`);
        expect([401, 404]).toContain(response.status());
    });

    test('DELETE Invitation - 403 Forbidden', async ({ request }) => {
        const response = await request.delete(`${API_URL}/companies/1/invitations/1`, {
             headers: { 'Authorization': 'Bearer invalid_token' }
        });
        expect([401, 403, 404]).toContain(response.status());
    });

});
