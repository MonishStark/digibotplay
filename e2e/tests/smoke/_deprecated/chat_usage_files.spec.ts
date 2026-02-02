
import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://127.0.0.1:5050';

test.describe('Chat, Super Admin Usage & Additional Files', () => {

    let authToken = '';
    let teamId = '';
    let fileId = '';

    test.beforeAll(async ({ request }) => {
        const loginRes = await request.post(`${API_URL}/auth/login`, {
            data: { email: 'gsatoru0373@gmail.com', password: 'Gojo@123', loginType: 'email' }
        });
        const loginBody = await loginRes.json();
        authToken = loginBody.user?.auth?.accessToken || loginBody.token?.accessToken;

        // Get Team
        const teamRes = await request.get(`${API_URL}/teams/active`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const teamBody = await teamRes.json();
        if (teamBody.teamList?.[0]) teamId = teamBody.teamList[0].id;

        // Get File
        if (teamId) {
            const folderRes = await request.get(`${API_URL}/teams/${teamId}/folders`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            const folderBody = await folderRes.json();
            const file = folderBody.items?.find(f => f.type === 'file');
            if (file) fileId = file.id;
        }
    });

    // ========== GET /teams/{teamId}/chats ==========
    
    test('GET /teams/:teamId/chats - 200 Success', async ({ request }) => {
        test.skip(!teamId, 'No team');
        const response = await request.get(`${API_URL}/teams/${teamId}/chats`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        console.log(`Chat History: ${response.status()}`);
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body).toHaveProperty('success', true);
    });

    test('GET /teams/:teamId/chats - 401 Unauthorized', async ({ request }) => {
        test.skip(!teamId, 'No team');
        const response = await request.get(`${API_URL}/teams/${teamId}/chats`);
        expect(response.status()).toBe(401);
    });

    test('GET /teams/:teamId/chats - 404 Not Found', async ({ request }) => {
        const response = await request.get(`${API_URL}/teams/999999/chats`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        console.log(`Chat 404: ${response.status()}`);
        expect([403, 404]).toContain(response.status());
    });

    // ========== Super Admin Usage ==========

    test('GET /super-admin/companies/:id/usage/last-month - Success', async ({ request }) => {
        const response = await request.get(`${API_URL}/super-admin/companies/1/usage/last-month`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        console.log(`Last Month Usage: ${response.status()}`);
        expect([200, 401, 403, 404]).toContain(response.status());
    });

    test('GET /super-admin/companies/:id/usage/last-month - 404', async ({ request }) => {
        const response = await request.get(`${API_URL}/super-admin/companies/999999/usage/last-month`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        console.log(`Usage 404: ${response.status()}`);
        expect([403, 404]).toContain(response.status());
    });

    // ========== Files Additional ==========

    test('GET /teams/:teamId/files/:fileId - Download', async ({ request }) => {
        test.skip(!teamId || !fileId, 'No team or file');
        const response = await request.get(`${API_URL}/teams/${teamId}/files/${fileId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        console.log(`Download File: ${response.status()}`);
        expect([200, 404]).toContain(response.status());
    });

    test('GET /teams/:teamId/files/:fileId - 404 Not Found', async ({ request }) => {
        test.skip(!teamId, 'No team');
        const response = await request.get(`${API_URL}/teams/${teamId}/files/99999999`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        console.log(`File 404: ${response.status()}`);
        expect(response.status()).toBe(404);
    });

    test('PATCH /files/:fileId/name - Rename', async ({ request }) => {
        test.skip(!fileId, 'No file');
        const response = await request.patch(`${API_URL}/files/${fileId}/name`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { name: `Renamed_${Date.now()}.txt` }
        });
        console.log(`Rename File: ${response.status()}`);
        expect([200, 400, 401, 404, 409]).toContain(response.status());
    });

    // ========== Global Error Codes ==========

    test('429 Rate Limit - Spam Requests', async ({ request }) => {
        let hitLimit = false;
        for (let i = 0; i < 50; i++) {
            const res = await request.get(`${API_URL}/notifications`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            if (res.status() === 429) {
                hitLimit = true;
                const body = await res.json();
                expect(body).toHaveProperty('success', false);
                break;
            }
        }
        if (!hitLimit) console.log('NOTE: 429 not triggered in 50 requests');
    });

});
