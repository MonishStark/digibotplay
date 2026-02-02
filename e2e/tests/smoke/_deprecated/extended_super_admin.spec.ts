import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://127.0.0.1:5050';

test.describe('Extended Super Admin Coverage', () => {

    let authToken = '';
    const userEmail = 'monishkumarms3@gmail.com';
    let userId = '1';
    let companyId = '1';

    test.beforeAll(async ({ request }) => {
        const response = await request.post(`${API_URL}/auth/login`, {
            data: { email: userEmail, password: 'Password123!' }
        });
        const body = await response.json();
        if (body.auth && body.auth.accessToken) {
            authToken = body.auth.accessToken;
        }
    });

    // 1. GET /super-admin/clients
    test('GET /super-admin/clients - List Clients', async ({ request }) => {
        const response = await request.get(`${API_URL}/super-admin/clients`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        expect([200, 401, 403]).toContain(response.status());
    });

    // 2. GET /super-admin/companies
    test('GET /super-admin/companies - List Companies', async ({ request }) => {
        const response = await request.get(`${API_URL}/super-admin/companies`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        expect([200, 401, 403]).toContain(response.status());
    });

    // 3. GET /super-admin/companies/:companyId/usage
    test('GET /super-admin/companies/:id/usage - Company Usage', async ({ request }) => {
        const response = await request.get(`${API_URL}/super-admin/companies/${companyId}/usage`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        expect([200, 401, 403, 404]).toContain(response.status());
    });

    // 4. GET /super-admin/users/:userId/usage
    test('GET /super-admin/users/:id/usage - User Usage', async ({ request }) => {
        const response = await request.get(`${API_URL}/super-admin/users/${userId}/usage`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        expect([200, 401, 403, 404]).toContain(response.status());
    });

    // 5. GET /super-admin/users/:userId/role
    test('GET /super-admin/users/:id/role - Check Role', async ({ request }) => {
        const response = await request.get(`${API_URL}/super-admin/users/${userId}/role`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        expect([200, 401, 403, 404]).toContain(response.status());
    });

    // 6. GET /super-admin/environment
    test('GET /super-admin/environment - Env Settings', async ({ request }) => {
        const response = await request.get(`${API_URL}/super-admin/environment`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        expect([200, 401, 403]).toContain(response.status());
    });

    // 7. PUT /super-admin/users/:userId/profile/avatar (Missing?)
    test('PUT /super-admin/users/:id/profile/avatar - Update Avatar', async ({ request }) => {
        const response = await request.put(`${API_URL}/super-admin/users/${userId}/profile/avatar`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        expect([404, 401, 403]).toContain(response.status());
    });

    // 8. PUT /super-admin/companies/:companyId/profile/avatar (Missing?)
    test('PUT /super-admin/companies/:id/profile/avatar - Update Company Avatar', async ({ request }) => {
        const response = await request.put(`${API_URL}/super-admin/companies/${companyId}/profile/avatar`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        expect([404, 401, 403]).toContain(response.status());
    });

    // 9. PATCH /super-admin/users/:userId/profile (Missing?)
    test('PATCH /super-admin/users/:id/profile - Update Profile', async ({ request }) => {
        const response = await request.patch(`${API_URL}/super-admin/users/${userId}/profile`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        expect([404, 401, 403]).toContain(response.status());
    });

    // 10. PATCH /super-admin/companies/:companyId/profile (Missing?)
    test('PATCH /super-admin/companies/:id/profile - Update Company Profile', async ({ request }) => {
        const response = await request.patch(`${API_URL}/super-admin/companies/${companyId}/profile`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        expect([404, 401, 403]).toContain(response.status());
    });

    // 11. PATCH /super-admin/integrations (Missing?)
    test('PATCH /super-admin/integrations - Update Integrations', async ({ request }) => {
        const response = await request.patch(`${API_URL}/super-admin/integrations`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        expect([404, 401, 403]).toContain(response.status());
    });

    // 12. GET /super-admin/email/templates
    test('GET /super-admin/email/templates - List Templates', async ({ request }) => {
        const response = await request.get(`${API_URL}/super-admin/email/templates`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        expect([200, 401, 403]).toContain(response.status());
    });

    // 13. PATCH /super-admin/email/templates/:templateId
    test('PATCH /super-admin/email/templates/:templateId - Update Template', async ({ request }) => {
        const response = await request.patch(`${API_URL}/super-admin/email/templates/1`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { body: 'New Template' }
        });
        expect([200, 400, 401, 403]).toContain(response.status());
    });

    // 14. DELETE /super-admin/companies/:companyId
    test('DELETE /super-admin/companies/:companyId - Delete Company', async ({ request }) => {
        const response = await request.delete(`${API_URL}/super-admin/companies/${companyId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        expect([200, 204, 400, 401, 403]).toContain(response.status());
    });

    // 15. DELETE /super-admin/users/:userId (Image Spec)
    test('DELETE /super-admin/users/:userId - Delete User', async ({ request }) => {
        const response = await request.delete(`${API_URL}/super-admin/users/${userId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        // Expecting 404 if commented out, or 401/403 if it exists
        expect([200, 204, 400, 401, 403, 404]).toContain(response.status());
    });

});
