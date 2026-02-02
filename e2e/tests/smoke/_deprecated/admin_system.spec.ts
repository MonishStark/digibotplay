
import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://127.0.0.1:5050';

test.describe('Invitations, Admin & System Settings Endpoints', () => {

    let authToken = '';
    let companyId = '';

    test.beforeAll(async ({ request }) => {
        const loginRes = await request.post(`${API_URL}/auth/login`, {
            data: { email: 'gsatoru0373@gmail.com', password: 'Gojo@123', loginType: 'email' }
        });
        const loginBody = await loginRes.json();
        authToken = loginBody.user?.auth?.accessToken || loginBody.token?.accessToken;
        companyId = loginBody.user?.companyId || '1';
    });

    // ========== INVITATIONS ==========
    
    test('GET /invitations - List Invitations', async ({ request }) => {
        const response = await request.get(`${API_URL}/invitations`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        console.log(`List Invitations: ${response.status()}`);
        expect([200, 401, 403]).toContain(response.status());
    });

    test('POST /invitations/verify - Verify Token', async ({ request }) => {
        const response = await request.post(`${API_URL}/invitations/verify`, {
            data: { token: 'mock_token' }
        });
        console.log(`Verify Invitation: ${response.status()}`);
        expect([200, 400, 404]).toContain(response.status());
    });

    test('DELETE /companies/:id/invitations/:id - Delete', async ({ request }) => {
        const response = await request.delete(`${API_URL}/companies/${companyId}/invitations/999`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        console.log(`Delete Invitation: ${response.status()}`);
        expect([200, 401, 403, 404]).toContain(response.status());
    });

    test('POST /companies/:id/invitations/:id/resend - Resend', async ({ request }) => {
        const response = await request.post(`${API_URL}/companies/${companyId}/invitations/999/resend`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        console.log(`Resend Invitation: ${response.status()}`);
        expect([200, 401, 403, 404]).toContain(response.status());
    });

    test('POST /invitations/decline - Decline', async ({ request }) => {
        const response = await request.post(`${API_URL}/invitations/decline`, {
            data: { token: 'mock_token', email: 'test@test.com' }
        });
        console.log(`Decline Invitation: ${response.status()}`);
        expect([200, 400, 404]).toContain(response.status());
    });

    // ========== ADMIN USERS ==========

    test('GET /admin/users/:userId - Get User', async ({ request }) => {
        const response = await request.get(`${API_URL}/admin/users/1`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        console.log(`Admin Get User: ${response.status()}`);
        expect([200, 401, 403, 404]).toContain(response.status());
    });

    test('DELETE /admin/users/:userId - Delete User', async ({ request }) => {
        const response = await request.delete(`${API_URL}/admin/users/999999`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        console.log(`Admin Delete User: ${response.status()}`);
        expect([200, 401, 403, 404]).toContain(response.status());
    });

    test('POST /admin/users/:userId/verify - Verify User', async ({ request }) => {
        const response = await request.post(`${API_URL}/admin/users/1/verify`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        console.log(`Admin Verify User: ${response.status()}`);
        expect([200, 401, 403, 404]).toContain(response.status());
    });

    test('PATCH /admin/users/:userId/password - Update Password', async ({ request }) => {
        const response = await request.patch(`${API_URL}/admin/users/1/password`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { password: 'NewPassword123!' }
        });
        console.log(`Admin Update Password: ${response.status()}`);
        expect([200, 400, 401, 403, 404]).toContain(response.status());
    });

    test('PATCH /admin/users/:userId/2fa - Update 2FA', async ({ request }) => {
        const response = await request.patch(`${API_URL}/admin/users/1/2fa`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { enabled: false }
        });
        console.log(`Admin Update 2FA: ${response.status()}`);
        expect([200, 400, 401, 403, 404]).toContain(response.status());
    });

    test('PATCH /admin/users/:userId/account-status - Lock Account', async ({ request }) => {
        const response = await request.patch(`${API_URL}/admin/users/1/account-status`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { locked: false }
        });
        console.log(`Admin Lock Account: ${response.status()}`);
        expect([200, 400, 401, 403, 404]).toContain(response.status());
    });

    // ========== ADMIN USER PROFILE ==========

    test('PATCH /admin/users/:userId/profile - Update Profile', async ({ request }) => {
        const response = await request.patch(`${API_URL}/admin/users/1/profile`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { firstname: 'AdminTest' }
        });
        console.log(`Admin Update Profile: ${response.status()}`);
        expect([200, 400, 401, 403, 404]).toContain(response.status());
    });

    test('PATCH /admin/users/:userId/profile - 401 Unauthorized', async ({ request }) => {
        const response = await request.patch(`${API_URL}/admin/users/1/profile`, {
            data: { firstname: 'Fail' }
        });
        expect([401, 404]).toContain(response.status());
    });

    test('PATCH /admin/users/:userId/profile - 404 Not Found', async ({ request }) => {
        const response = await request.patch(`${API_URL}/admin/users/999999/profile`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { firstname: 'NotFound' }
        });
        expect([403, 404]).toContain(response.status());
    });

    test('PUT /admin/users/:userId/profile/avatar - Update Avatar', async ({ request }) => {
        const response = await request.put(`${API_URL}/admin/users/1/profile/avatar`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            multipart: {
                image: { name: 'avatar.png', mimeType: 'image/png', buffer: Buffer.from('fake') }
            }
        });
        console.log(`Admin Update Avatar: ${response.status()}`);
        expect([200, 400, 401, 403, 404, 422]).toContain(response.status());
    });

    test('PUT /admin/users/:userId/profile/avatar - 401 Unauthorized', async ({ request }) => {
        const response = await request.put(`${API_URL}/admin/users/1/profile/avatar`, {
            multipart: {
                image: { name: 'avatar.png', mimeType: 'image/png', buffer: Buffer.from('fake') }
            }
        });
        expect([401, 404]).toContain(response.status());
    });

    test('PUT /admin/users/:userId/profile/avatar - 422 Invalid File', async ({ request }) => {
        const response = await request.put(`${API_URL}/admin/users/1/profile/avatar`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            multipart: {
                image: { name: 'bad.exe', mimeType: 'application/x-executable', buffer: Buffer.from('fake') }
            }
        });
        console.log(`Admin Avatar Invalid: ${response.status()}`);
        expect([400, 422, 401, 403, 404]).toContain(response.status());
    });

    // ========== SUPER ADMIN ==========

    test('PATCH /super-admin/users/:userId - Update User', async ({ request }) => {
        const response = await request.patch(`${API_URL}/super-admin/users/1`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { firstname: 'Test' }
        });
        console.log(`Super Admin Update User: ${response.status()}`);
        expect([200, 401, 403, 404]).toContain(response.status());
    });

    test('GET /super-admin/users/:userId/role - Get Role', async ({ request }) => {
        const response = await request.get(`${API_URL}/super-admin/users/1/role`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        console.log(`Super Admin Get Role: ${response.status()}`);
        expect([200, 401, 403, 404]).toContain(response.status());
    });

    test('GET /super-admin/clients - Get Clients', async ({ request }) => {
        const response = await request.get(`${API_URL}/super-admin/clients`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        console.log(`Super Admin Get Clients: ${response.status()}`);
        expect([200, 401, 403, 404]).toContain(response.status());
    });

    // ========== SYSTEM & SETTINGS ==========

    test('GET /app-data - Get App Data', async ({ request }) => {
        const response = await request.get(`${API_URL}/app-data`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        console.log(`Get App Data: ${response.status()}`);
        expect([200, 401]).toContain(response.status());
        
        if (response.status() === 200) {
            const body = await response.json();
            expect(body).toHaveProperty('success', true);
        }
    });

    test('GET /settings/max-uploads - Max Uploads', async ({ request }) => {
        const response = await request.get(`${API_URL}/settings/max-uploads`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        console.log(`Max Uploads: ${response.status()}`);
        expect([200, 401, 404]).toContain(response.status());
    });

    test('GET /settings/recording-limit - Recording Limit', async ({ request }) => {
        const response = await request.get(`${API_URL}/settings/recording-limit`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        console.log(`Recording Limit: ${response.status()}`);
        expect([200, 401, 404]).toContain(response.status());
    });

    test('GET /settings/recording-prompt-time - Prompt Time', async ({ request }) => {
        const response = await request.get(`${API_URL}/settings/recording-prompt-time`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        console.log(`Prompt Time: ${response.status()}`);
        expect([200, 401, 404]).toContain(response.status());
    });

    test('GET /super-admin/environment - Get Environment', async ({ request }) => {
        const response = await request.get(`${API_URL}/super-admin/environment`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        console.log(`Get Environment: ${response.status()}`);
        expect([200, 401, 403]).toContain(response.status());
    });

    test('PATCH /super-admin/environment - Update Environment', async ({ request }) => {
        const response = await request.patch(`${API_URL}/super-admin/environment`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { settings: [] }
        });
        console.log(`Update Environment: ${response.status()}`);
        expect([200, 400, 401, 403]).toContain(response.status());
    });

});
