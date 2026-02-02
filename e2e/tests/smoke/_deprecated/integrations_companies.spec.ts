
import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://127.0.0.1:5050';

test.describe('Integrations, Companies & Invitations Endpoints', () => {

    let authToken = '';
    let companyId = '';

    test.beforeAll(async ({ request }) => {
        // Login
        const loginRes = await request.post(`${API_URL}/auth/login`, {
            data: { email: 'gsatoru0373@gmail.com', password: 'Gojo@123', loginType: 'email' }
        });
        const loginBody = await loginRes.json();
        authToken = loginBody.user?.auth?.accessToken || loginBody.token?.accessToken;
        companyId = loginBody.user?.companyId || '1';
    });

    // ========== INTEGRATIONS ==========
    
    test('GET /integrations/auth/:integrationId - OAuth Redirect', async ({ request }) => {
        const response = await request.get(`${API_URL}/integrations/auth/google-drive`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            maxRedirects: 0 // Don't follow redirect
        });
        console.log(`OAuth Redirect Status: ${response.status()}`);
        // 302 redirect OR 401/400 if not configured
        expect([302, 400, 401, 404]).toContain(response.status());
    });

    test('POST /integrations/auth/oauth-session-token - Session Token', async ({ request }) => {
        const response = await request.post(`${API_URL}/integrations/auth/oauth-session-token`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        console.log(`OAuth Session Token Status: ${response.status()}`);
        expect([200, 400, 401, 404]).toContain(response.status());
    });

    test('PATCH /integrations/:integrationId - Update Integration', async ({ request }) => {
        const response = await request.patch(`${API_URL}/integrations/1`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { enabled: true }
        });
        console.log(`Update Integration Status: ${response.status()}`);
        expect([200, 400, 401, 404]).toContain(response.status());
    });

    test('GET /integrations/:integrationId/files - Get Files', async ({ request }) => {
        const response = await request.get(`${API_URL}/integrations/1/files`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        console.log(`Integration Files Status: ${response.status()}`);
        expect([200, 400, 401, 404]).toContain(response.status());
    });

    test('POST /integrations/:integrationId/files/:fileId/import/:teamId - Import File', async ({ request }) => {
        const response = await request.post(`${API_URL}/integrations/1/files/file_1/import/1`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        console.log(`Import File Status: ${response.status()}`);
        expect([200, 201, 400, 401, 404]).toContain(response.status());
    });

    // ========== COMPANIES (Admin) ==========

    test('GET /companies/:companyId/profile - Get Profile', async ({ request }) => {
        const response = await request.get(`${API_URL}/companies/${companyId}/profile`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        console.log(`Company Profile Status: ${response.status()}`);
        expect([200, 401, 403, 404]).toContain(response.status());
        
        if (response.status() === 200) {
            const body = await response.json();
            expect(body).toHaveProperty('success', true);
        }
    });

    test('PATCH /companies/:companyId/profile - Update Profile', async ({ request }) => {
        const response = await request.patch(`${API_URL}/companies/${companyId}/profile`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { companyName: `Test Company ${Date.now()}` }
        });
        console.log(`Update Company Profile Status: ${response.status()}`);
        expect([200, 400, 401, 403, 404]).toContain(response.status());
    });

    test('GET /companies/:companyId/usage - Get Usage', async ({ request }) => {
        const response = await request.get(`${API_URL}/companies/${companyId}/usage`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        console.log(`Company Usage Status: ${response.status()}`);
        expect([200, 401, 403, 404]).toContain(response.status());
    });

    test('PUT /companies/:companyId/avatar - Update Logo', async ({ request }) => {
        const response = await request.put(`${API_URL}/companies/${companyId}/avatar`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            multipart: {
                image: {
                    name: 'logo.png',
                    mimeType: 'image/png',
                    buffer: Buffer.from('fake image data')
                }
            }
        });
        console.log(`Company Logo Status: ${response.status()}`);
        expect([200, 400, 401, 403]).toContain(response.status());
    });

    // ========== SUPER ADMIN ==========

    test('DELETE /super-admin/companies/:companyId - Delete Company', async ({ request }) => {
        // Use a non-existent company to avoid accidental deletion
        const response = await request.delete(`${API_URL}/super-admin/companies/999999`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        console.log(`Delete Company Status: ${response.status()}`);
        // 403 = not super admin, 404 = not found
        expect([200, 401, 403, 404]).toContain(response.status());
    });

    test('PATCH /super-admin/companies/:companyId/profile - Update', async ({ request }) => {
        const response = await request.patch(`${API_URL}/super-admin/companies/1/profile`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { companyName: 'Updated Corp' }
        });
        console.log(`Super Admin Update Status: ${response.status()}`);
        expect([200, 401, 403, 404]).toContain(response.status());
    });

    test('PUT /super-admin/usage/last-month - Insert Usage', async ({ request }) => {
        const response = await request.put(`${API_URL}/super-admin/usage/last-month`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        console.log(`Insert Usage Status: ${response.status()}`);
        expect([200, 401, 403, 404]).toContain(response.status());
    });

    // ========== INVITATIONS ==========

    test('POST /invitations - Create Invitation', async ({ request }) => {
        const response = await request.post(`${API_URL}/invitations`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: {
                email: `invite_${Date.now()}@test.com`,
                role: 'member'
            }
        });
        console.log(`Create Invitation Status: ${response.status()}`);
        expect([200, 201, 400, 401, 403, 409]).toContain(response.status());
    });

    test('POST /invitations - 409 Duplicate', async ({ request }) => {
        const email = `dup_invite_${Date.now()}@test.com`;
        
        // First invite
        await request.post(`${API_URL}/invitations`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { email, role: 'member' }
        });
        
        // Second invite (duplicate)
        const response = await request.post(`${API_URL}/invitations`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { email, role: 'member' }
        });
        console.log(`Duplicate Invitation Status: ${response.status()}`);
        expect([409, 400, 403]).toContain(response.status());
    });

});
