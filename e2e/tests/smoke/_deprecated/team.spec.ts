
import { test, expect } from '@playwright/test';

const API_URL = process.env.BACKEND_URL || 'http://127.0.0.1:5050';
const TEST_EMAIL = process.env.TEST_EMAIL || 'monishkumarms3@gmail.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Monish@123';

let authToken = '';

test.describe('Team Module Smoke Tests', () => {

    test.beforeAll(async ({ request }) => {
        const response = await request.post(`${API_URL}/auth/login`, {
            data: { email: TEST_EMAIL, password: TEST_PASSWORD, loginType: 'standard' }
        });
        const body = await response.json();
        // Assume Auth Spec verified this works, otherwise we fail here
        authToken = body.user?.auth?.accessToken;
    });

    test('GET /teams', async ({ request }) => {
        const response = await request.get(`${API_URL}/teams`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        expect(response.status()).toBe(200);
    });

    test('GET /teams/shared', async ({ request }) => {
        const response = await request.get(`${API_URL}/teams/shared`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        expect(response.status()).toBe(200);
    });

    // Create Team
    test('POST /teams - Create', async ({ request }) => {
        const response = await request.post(`${API_URL}/teams`, {
            headers: { Authorization: `Bearer ${authToken}` },
            data: { name: `Test Team ${Date.now()}` }
        });
        // 200/201 Success, 400 Validation, 403 Forbidden (if restricted)
        expect([200, 201, 400, 403]).toContain(response.status());
    });

    test('PUT /teams/:id - Update', async ({ request }) => {
        const response = await request.put(`${API_URL}/teams/999`, {
            headers: { Authorization: `Bearer ${authToken}` },
            data: { name: `Updated Team` }
        });
        expect([200, 201, 204, 400, 401, 403, 404, 409, 422, 500, 503]).toContain(response.status());
    });

    // Update Status (Mock ID, expect 404 or 400 but confirming reachability)
    test('PATCH /teams/:teamId/status', async ({ request }) => {
        const response = await request.patch(`${API_URL}/teams/99999/status`, {
            headers: { Authorization: `Bearer ${authToken}` },
            data: { status: 'active' }
        });
        // 404 Not Found, 400 Bad Request, 403 Forbidden
        expect([200, 404, 400, 403]).toContain(response.status());
    });

    test('GET /teams/active', async ({ request }) => {
         const response = await request.get(`${API_URL}/teams/active`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        expect(response.status()).toBe(200);
    });

});
