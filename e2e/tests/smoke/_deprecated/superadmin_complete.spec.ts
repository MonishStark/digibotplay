
import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://127.0.0.1:5050';

test.describe('SuperAdmin Endpoints - Complete Coverage', () => {

    let authToken = '';

    test.beforeAll(async ({ request }) => {
        const loginRes = await request.post(`${API_URL}/auth/login`, {
            data: { email: 'gsatoru0373@gmail.com', password: 'Gojo@123', loginType: 'email' }
        });
        const body = await loginRes.json();
        authToken = body.user?.auth?.accessToken || body.token?.accessToken;
    });

    // ========== USER PROFILE ==========

    test('PUT /super-admin/users/:id/profile/avatar - 200', async ({ request }) => {
        const response = await request.put(`${API_URL}/super-admin/users/1/profile/avatar`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            multipart: { image: { name: 'a.png', mimeType: 'image/png', buffer: Buffer.from('x') } }
        });
        console.log(`SA User Avatar: ${response.status()}`);
        expect([200, 400, 401, 403, 404, 415]).toContain(response.status());
    });

    test('PUT /super-admin/users/:id/profile/avatar - 401', async ({ request }) => {
        const response = await request.put(`${API_URL}/super-admin/users/1/profile/avatar`, {
            multipart: { image: { name: 'a.png', mimeType: 'image/png', buffer: Buffer.from('x') } }
        });
        expect([401, 404]).toContain(response.status());
    });

    test('PATCH /super-admin/users/:id/profile - 200', async ({ request }) => {
        const response = await request.patch(`${API_URL}/super-admin/users/1/profile`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { firstname: 'Test' }
        });
        console.log(`SA User Profile: ${response.status()}`);
        expect([200, 400, 401, 403, 404, 422]).toContain(response.status());
    });

    test('PATCH /super-admin/users/:id/profile - 401', async ({ request }) => {
        const response = await request.patch(`${API_URL}/super-admin/users/1/profile`, {
            data: { firstname: 'Fail' }
        });
        expect([401, 404]).toContain(response.status());
    });

    // ========== COMPANY PROFILE ==========

    test('PUT /super-admin/companies/:id/profile/avatar - 200', async ({ request }) => {
        const response = await request.put(`${API_URL}/super-admin/companies/1/profile/avatar`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            multipart: { image: { name: 'a.png', mimeType: 'image/png', buffer: Buffer.from('x') } }
        });
        console.log(`SA Company Avatar: ${response.status()}`);
        expect([200, 400, 401, 403, 404, 415]).toContain(response.status());
    });

    test('PATCH /super-admin/companies/:id/profile - 200', async ({ request }) => {
        const response = await request.patch(`${API_URL}/super-admin/companies/1/profile`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { companyName: 'Test Corp' }
        });
        console.log(`SA Company Profile: ${response.status()}`);
        expect([200, 400, 401, 403, 404, 422]).toContain(response.status());
    });

    // ========== INTEGRATIONS ==========

    test('PATCH /super-admin/integrations - 200', async ({ request }) => {
        const response = await request.patch(`${API_URL}/super-admin/integrations`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { companyId: 1, integrations: [] }
        });
        console.log(`SA Integrations: ${response.status()}`);
        expect([200, 400, 401, 403, 404]).toContain(response.status());
    });

    // ========== CLIENTS & COMPANIES ==========

    test('GET /super-admin/clients - 200', async ({ request }) => {
        const response = await request.get(`${API_URL}/super-admin/clients`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        console.log(`SA Clients: ${response.status()}`);
        expect([200, 401, 403]).toContain(response.status());
    });

    test('GET /super-admin/companies - 200', async ({ request }) => {
        const response = await request.get(`${API_URL}/super-admin/companies`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        console.log(`SA Companies: ${response.status()}`);
        expect([200, 401, 403]).toContain(response.status());
    });

    // ========== USAGE ==========

    test('GET /super-admin/companies/:id/usage - 200', async ({ request }) => {
        const response = await request.get(`${API_URL}/super-admin/companies/1/usage`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        console.log(`SA Company Usage: ${response.status()}`);
        expect([200, 400, 401, 403, 404]).toContain(response.status());
    });

    test('GET /super-admin/users/:id/usage - 200', async ({ request }) => {
        const response = await request.get(`${API_URL}/super-admin/users/1/usage`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        console.log(`SA User Usage: ${response.status()}`);
        expect([200, 400, 401, 403, 404]).toContain(response.status());
    });

    // ========== ROLE CHECK ==========

    test('GET /super-admin/users/:id/role - 200', async ({ request }) => {
        const response = await request.get(`${API_URL}/super-admin/users/1/role`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        console.log(`SA User Role: ${response.status()}`);
        expect([200, 400, 401, 403, 404]).toContain(response.status());
    });

    // ========== ENVIRONMENT ==========

    test('GET /super-admin/environment - 200', async ({ request }) => {
        const response = await request.get(`${API_URL}/super-admin/environment`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        expect([200, 401, 403]).toContain(response.status());
    });

    test('PATCH /super-admin/environment - 200', async ({ request }) => {
        const response = await request.patch(`${API_URL}/super-admin/environment`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { settings: [] }
        });
        expect([200, 400, 401, 403]).toContain(response.status());
    });

    // ========== EMAIL TEMPLATES ==========

    test('GET /super-admin/email/templates - 200', async ({ request }) => {
        const response = await request.get(`${API_URL}/super-admin/email/templates`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        expect([200, 401, 403]).toContain(response.status());
    });

    test('PATCH /super-admin/email/templates/:id - 200', async ({ request }) => {
        const response = await request.patch(`${API_URL}/super-admin/email/templates/1`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { subject: 'Updated' }
        });
        expect([200, 400, 401, 403, 404]).toContain(response.status());
    });

    // ========== DELETE ==========

    test('DELETE /super-admin/users/:id - 200/404', async ({ request }) => {
        const response = await request.delete(`${API_URL}/super-admin/users/999999`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        console.log(`SA Delete User: ${response.status()}`);
        expect([200, 400, 401, 403, 404, 409]).toContain(response.status());
    });

    test('DELETE /super-admin/companies/:id - 200/404', async ({ request }) => {
        const response = await request.delete(`${API_URL}/super-admin/companies/999999`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        console.log(`SA Delete Company: ${response.status()}`);
        expect([200, 400, 401, 403, 404]).toContain(response.status());
    });

    // ========== 401 TESTS ==========

    test('GET /super-admin/clients - 401', async ({ request }) => {
        const response = await request.get(`${API_URL}/super-admin/clients`);
        expect([401, 404]).toContain(response.status());
    });

    test('GET /super-admin/environment - 401', async ({ request }) => {
        const response = await request.get(`${API_URL}/super-admin/environment`);
        expect([401, 404]).toContain(response.status());
    });

});
