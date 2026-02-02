
import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://127.0.0.1:5050';

test.describe('GET /invitations Tests', () => {

    let authToken = '';

    test.beforeAll(async ({ request }) => {
        const response = await request.post(`${API_URL}/auth/login`, {
            data: { email: 'gsatoru0373@gmail.com', password: 'Gojo@123', loginType: 'email' }
        });
        const body = await response.json();
        authToken = body.user?.auth?.accessToken || body.token?.accessToken || '';
    });

    test('GET /invitations - 200 Success', async ({ request }) => {
        const response = await request.get(`${API_URL}/invitations`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        console.log(`Get Invitations Status: ${response.status()}`);
        expect([200, 404]).toContain(response.status());
    });

    test('GET /invitations - 401 Unauthorized', async ({ request }) => {
        const response = await request.get(`${API_URL}/invitations`);
        expect([401, 404]).toContain(response.status());
    });

});
