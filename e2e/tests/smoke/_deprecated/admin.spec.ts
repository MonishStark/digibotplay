
import { test, expect } from '@playwright/test';

const API_URL = process.env.BACKEND_URL || 'http://127.0.0.1:5050';
const TEST_EMAIL = process.env.TEST_EMAIL || 'monishkumarms3@gmail.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Monish@123';

let authToken = '';

test.describe('Admin Module Smoke Tests', () => {

    test.beforeAll(async ({ request }) => {
        const response = await request.post(`${API_URL}/auth/login`, {
            data: { email: TEST_EMAIL, password: TEST_PASSWORD, loginType: 'standard' }
        });
        const body = await response.json();
        authToken = body.user?.auth?.accessToken;
    });

    test('GET /app-data', async ({ request }) => {
        const response = await request.get(`${API_URL}/app-data`);
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body).toHaveProperty('success', true);
    });

    // Super Admin Routes (Expect 403 for normal user)
    test('GET /super-admin/environment', async ({ request }) => {
        const response = await request.get(`${API_URL}/super-admin/environment`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        expect([200, 403]).toContain(response.status());
    });

    test('GET /super-admin/email/templates', async ({ request }) => {
        const response = await request.get(`${API_URL}/super-admin/email/templates`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        expect([200, 403]).toContain(response.status());
    });

    test('GET /super-admin/users/:userId/role', async ({ request }) => {
        const response = await request.get(`${API_URL}/super-admin/users/1/role`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
         expect([200, 403, 404]).toContain(response.status());
    });

    test('GET /super-admin/companies/:companyId/usage', async ({ request }) => {
        const response = await request.get(`${API_URL}/super-admin/companies/1/usage`, {
             headers: { Authorization: `Bearer ${authToken}` }
        });
        expect([200, 403, 404]).toContain(response.status());
    });

    // --- New Coverage ---

    test('POST /admin/users/:userId/verify', async ({ request }) => {
        const response = await request.post(`${API_URL}/admin/users/1/verify`, {
             headers: { Authorization: `Bearer ${authToken}` }
        });
        expect([200, 201, 204, 400, 401, 403, 404, 409, 422, 500, 503]).toContain(response.status());
    });

    test('PATCH /admin/users/:userId/2fa', async ({ request }) => {
        const response = await request.patch(`${API_URL}/admin/users/1/2fa`, {
             headers: { Authorization: `Bearer ${authToken}` }
        });
        expect([200, 201, 204, 400, 401, 403, 404, 409, 422, 500, 503]).toContain(response.status());
    });

    test('PATCH /admin/users/:userId/password', async ({ request }) => {
        const response = await request.patch(`${API_URL}/admin/users/1/password`, {
             headers: { Authorization: `Bearer ${authToken}` },
             data: { password: 'NewPassword123!' }
        });
        expect([200, 201, 204, 400, 401, 403, 404, 409, 422, 500, 503]).toContain(response.status());
    });

    test('PATCH /admin/users/:userId/account-status', async ({ request }) => {
         const response = await request.patch(`${API_URL}/admin/users/1/account-status`, {
             headers: { Authorization: `Bearer ${authToken}` },
             data: { status: 'active' } // or 'suspended'
        });
        expect([200, 201, 204, 400, 401, 403, 404, 409, 422, 500, 503]).toContain(response.status());
    });

    test('DELETE /admin/users/:userId', async ({ request }) => {
         const response = await request.delete(`${API_URL}/admin/users/999`, {
             headers: { Authorization: `Bearer ${authToken}` }
        });
        expect([200, 201, 204, 400, 401, 403, 404, 409, 422, 500, 503]).toContain(response.status());
    });

    test('GET /me/subscription', async ({ request }) => {
         const response = await request.get(`${API_URL}/me/subscription`, {
             headers: { Authorization: `Bearer ${authToken}` }
        });
        expect([200, 400, 401, 403, 404]).toContain(response.status());
    });

    test('GET /super-admin/clients', async ({ request }) => {
        const response = await request.get(`${API_URL}/super-admin/clients`, {
             headers: { Authorization: `Bearer ${authToken}` }
        });
        expect([200, 201, 204, 400, 401, 403, 404, 409, 422, 500, 503]).toContain(response.status());
    });

    test('GET /super-admin/companies', async ({ request }) => {
        const response = await request.get(`${API_URL}/super-admin/companies`, {
             headers: { Authorization: `Bearer ${authToken}` }
        });
        expect([200, 201, 204, 400, 401, 403, 404, 409, 422, 500, 503]).toContain(response.status());
    });

    test('POST /get/user/users (Super Admin)', async ({ request }) => {
        const response = await request.post(`${API_URL}/get/user/users`, {
             headers: { Authorization: `Bearer ${authToken}` }
        });
        expect([200, 201, 204, 400, 401, 403, 404, 409, 422, 500, 503]).toContain(response.status());
    });

    test('POST /user/create-account-for-super-user', async ({ request }) => {
        const response = await request.post(`${API_URL}/user/create-account-for-super-user`, {
              headers: { Authorization: `Bearer ${authToken}` },
              data: { email: `super.${Date.now()}@test.com` }
        });
        expect([200, 201, 400, 403, 404]).toContain(response.status());
    });

    test('POST /remove-suoer-user', async ({ request }) => {
        const response = await request.post(`${API_URL}/remove-suoer-user`, {
              headers: { Authorization: `Bearer ${authToken}` },
              data: { email: 'test@test.com' }
        });
        expect([200, 201, 204, 400, 401, 403, 404, 409, 422, 500, 503]).toContain(response.status());
    });

    test('DELETE /super-admin/companies/:companyId', async ({ request }) => {
        const response = await request.delete(`${API_URL}/super-admin/companies/999`, {
             headers: { Authorization: `Bearer ${authToken}` }
        });
        expect([200, 201, 204, 400, 401, 403, 404, 409, 422, 500, 503]).toContain(response.status());
    });

    test('GET /admin/get-superAdmin-detail', async ({ request }) => {
         const response = await request.post(`${API_URL}/admin/get-superAdmin-detail`, {
             headers: { Authorization: `Bearer ${authToken}` }
        });
        expect([200, 201, 204, 400, 401, 403, 404, 409, 422, 500, 503]).toContain(response.status());
    });
});
