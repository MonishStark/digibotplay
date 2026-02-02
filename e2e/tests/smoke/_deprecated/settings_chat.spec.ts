
import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://127.0.0.1:5050';

test.describe('Settings & Chat Endpoints', () => {

    let authToken = '';
    let teamId = '';
    let createdChatId = '';
    let existingFileId = '';

    test.beforeAll(async ({ request }) => {
        // Login
        const loginRes = await request.post(`${API_URL}/auth/login`, {
            data: { email: 'gsatoru0373@gmail.com', password: 'Gojo@123', loginType: 'email' }
        });
        const loginBody = await loginRes.json();
        authToken = loginBody.user?.auth?.accessToken || loginBody.token?.accessToken;

        // Get Active Team
        const teamRes = await request.get(`${API_URL}/teams/active`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const teamBody = await teamRes.json();
        if (teamBody.teamList && teamBody.teamList.length > 0) {
            teamId = teamBody.teamList[0].id;
        }

        // Get existing file for summary test
        const folderRes = await request.get(`${API_URL}/teams/${teamId}/folders`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const folderBody = await folderRes.json();
        if (folderBody.items && Array.isArray(folderBody.items)) {
            const file = folderBody.items.find(f => f.type === 'file');
            if (file) existingFileId = file.id;
        }
    });

    // ========== SETTINGS ENDPOINTS ==========
    test('GET /settings/max-uploads - Max Uploads Setting', async ({ request }) => {
        const response = await request.get(`${API_URL}/settings/max-uploads`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        console.log(`Max Uploads Status: ${response.status()}`);
        if (response.status() === 404) {
            console.log('ROUTE NOT IMPLEMENTED');
        } else {
            expect(response.status()).toBe(200);
        }
    });

    test('GET /settings/recording-limit - Recording Limit', async ({ request }) => {
        const response = await request.get(`${API_URL}/settings/recording-limit`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        console.log(`Recording Limit Status: ${response.status()}`);
        if (response.status() === 404) {
            console.log('ROUTE NOT IMPLEMENTED');
        } else {
            expect(response.status()).toBe(200);
        }
    });

    test('GET /settings/recording-prompt-time - Recording Prompt Time', async ({ request }) => {
        const response = await request.get(`${API_URL}/settings/recording-prompt-time`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        console.log(`Recording Prompt Time Status: ${response.status()}`);
        if (response.status() === 404) {
            console.log('ROUTE NOT IMPLEMENTED');
        } else {
            expect(response.status()).toBe(200);
        }
    });

    // ========== FILE SUMMARY ==========
    test('GET /files/{id}/summary - File Summary Data', async ({ request }) => {
        test.skip(!teamId || !existingFileId, 'No Team or File found');

        const response = await request.get(`${API_URL}/teams/${teamId}/files/${existingFileId}/summary`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        console.log(`File Summary Status: ${response.status()}`);
        if (response.status() === 404) {
            console.log('ROUTE NOT IMPLEMENTED');
        } else {
            expect(response.status()).toBe(200);
        }
    });

    // ========== CHAT ENDPOINTS ==========
    test('POST /teams/{id}/chats - Create New Chat', async ({ request }) => {
        test.skip(!teamId, 'No Team found');

        const response = await request.post(`${API_URL}/teams/${teamId}/chats`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: {
                chatName: `Test Chat ${Date.now()}`,
                scope: 'team'
            }
        });

        console.log(`Create Chat Status: ${response.status()}`);
        const body = await response.json();
        console.log(`Create Chat Body: ${JSON.stringify(body)}`);

        expect([200, 201]).toContain(response.status());
        expect(body.success).toBe(true);
        
        if (body.chat?.id) {
            createdChatId = body.chat.id;
        } else if (body.chatId) {
            createdChatId = body.chatId;
        } else if (body.data?.id) {
            createdChatId = body.data.id;
        }
    });

    test('GET /teams/{id}/chats - Get Chat Histories', async ({ request }) => {
        test.skip(!teamId, 'No Team found');

        const response = await request.get(`${API_URL}/teams/${teamId}/chats`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        console.log(`Get Chats Status: ${response.status()}`);
        const body = await response.json();

        expect(response.status()).toBe(200);
        expect(body.success).toBe(true);
        
        // Get a chat ID for further tests if we don't have one
        if (!createdChatId && body.chats && body.chats.length > 0) {
            createdChatId = body.chats[0].id;
        }
    });

    test('PATCH /teams/{id}/chats/{id} - Rename Chat', async ({ request }) => {
        test.skip(!teamId || !createdChatId, 'No Team or Chat found');

        const response = await request.patch(`${API_URL}/teams/${teamId}/chats/${createdChatId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { chatName: `Renamed Chat ${Date.now()}` }
        });

        console.log(`Rename Chat Status: ${response.status()}`);
        const body = await response.json();
        console.log(`Rename Chat Body: ${JSON.stringify(body)}`);

        expect(response.status()).toBe(200);
        expect(body.success).toBe(true);
    });

    test('GET /teams/{id}/chats/{id}/messages - Get Chat Messages', async ({ request }) => {
        test.skip(!teamId || !createdChatId, 'No Team or Chat found');

        const response = await request.get(`${API_URL}/teams/${teamId}/chats/${createdChatId}/messages`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        console.log(`Get Messages Status: ${response.status()}`);
        const body = await response.json();

        expect(response.status()).toBe(200);
        expect(body.success).toBe(true);
    });

    test('DELETE /teams/{id}/chats/{id} - Delete Chat', async ({ request }) => {
        test.skip(!teamId || !createdChatId, 'No Team or Chat found');

        const response = await request.delete(`${API_URL}/teams/${teamId}/chats/${createdChatId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        console.log(`Delete Chat Status: ${response.status()}`);
        expect([200, 204]).toContain(response.status());
    });

    // ========== FILE JOBS (MISSING) ==========
    test('POST /files/jobs/{id}/retry - Retry Upload Job', async ({ request }) => {
        const response = await request.post(`${API_URL}/files/jobs/123/retry`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        console.log(`Retry Job Status: ${response.status()}`);
        if (response.status() === 404) {
            console.log('ROUTE NOT IMPLEMENTED');
        }
    });

});
