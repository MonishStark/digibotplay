import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://127.0.0.1:5050';

test.describe('Extended Settings Coverage', () => {

    let authToken = '';
    const userEmail = 'monishkumarms3@gmail.com';

    test.beforeAll(async ({ request }) => {
        const response = await request.post(`${API_URL}/auth/login`, {
            data: { email: userEmail, password: 'Password123!' }
        });
        const body = await response.json();
        if (body.auth && body.auth.accessToken) {
            authToken = body.auth.accessToken;
        }
    });

    // 1. GET /settings/max-uploads
    test('GET /settings/max-uploads - Not Implemented', async ({ request }) => {
        const response = await request.get(`${API_URL}/settings/max-uploads`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        expect([404, 401, 403]).toContain(response.status());
    });

    // 2. GET /settings/recording-limit
    test('GET /settings/recording-limit - Not Implemented', async ({ request }) => {
        const response = await request.get(`${API_URL}/settings/recording-limit`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        expect([404, 401, 403]).toContain(response.status());
    });

    // 3. GET /settings/recording-prompt-time
    test('GET /settings/recording-prompt-time - Not Implemented', async ({ request }) => {
        const response = await request.get(`${API_URL}/settings/recording-prompt-time`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        expect([404, 401, 403]).toContain(response.status());
    });

});
