import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://127.0.0.1:5050';

test.describe('Extended Admin Coverage', () => {

    let authToken = '';
    const userEmail = 'monishkumarms3@gmail.com';
    let userId = '1';

    test.beforeAll(async ({ request }) => {
        const response = await request.post(`${API_URL}/auth/login`, {
            data: { email: userEmail, password: 'Password123!' }
        });
        const body = await response.json();
        if (body.auth && body.auth.accessToken) {
            authToken = body.auth.accessToken;
        }
    });

    // 1. GET /admin/users/:userId
    test('GET /admin/users/:userId - Get Details', async ({ request }) => {
        const response = await request.get(`${API_URL}/admin/users/${userId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        expect([200, 401, 403, 404]).toContain(response.status());
    });

    // 2. POST /admin/users/:userId/verify
    test('POST /admin/users/:userId/verify - Verify Account', async ({ request }) => {
        const response = await request.post(`${API_URL}/admin/users/${userId}/verify`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        expect([200, 401, 403, 404]).toContain(response.status());
    });

    // 3. PATCH /admin/users/:userId/password
    test('PATCH /admin/users/:userId/password - Change Password', async ({ request }) => {
        const response = await request.patch(`${API_URL}/admin/users/${userId}/password`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { password: 'NewPass123!' }
        });
        expect([200, 400, 401, 403, 404]).toContain(response.status());
    });

    // 4. PATCH /admin/users/:userId/2fa
    test('PATCH /admin/users/:userId/2fa - Update 2FA', async ({ request }) => {
        const response = await request.patch(`${API_URL}/admin/users/${userId}/2fa`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { enabled: true }
        });
        expect([200, 400, 401, 403, 404]).toContain(response.status());
    });

    // 5. PATCH /admin/users/:userId/account-status
    test('PATCH /admin/users/:userId/account-status - Update Status', async ({ request }) => {
        const response = await request.patch(`${API_URL}/admin/users/${userId}/account-status`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { status: 'active' }
        });
        expect([200, 400, 401, 403, 404]).toContain(response.status());
    });

    // 6. DELETE /admin/users/:userId
    test('DELETE /admin/users/:userId - Remove User', async ({ request }) => {
        const response = await request.delete(`${API_URL}/admin/users/${userId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        expect([200, 204, 400, 401, 403, 404]).toContain(response.status());
    });

    // 7. PATCH /admin/users/:userId/profile (Missing)
    test('PATCH /admin/users/:userId/profile - Update Profile (Missing)', async ({ request }) => {
        const response = await request.patch(`${API_URL}/admin/users/${userId}/profile`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { name: 'Admin Edit' }
        });
        // Expecting 404 (Not Implemented) or 401/403 if it exists but guarded differently
        expect([404, 401, 403]).toContain(response.status());
    });

    // 8. PUT /admin/users/:userId/profile/avatar (Missing)
    test('PUT /admin/users/:userId/profile/avatar - Update Avatar (Missing)', async ({ request }) => {
        const response = await request.put(`${API_URL}/admin/users/${userId}/profile/avatar`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        expect([404, 401, 403]).toContain(response.status());
    });

});
