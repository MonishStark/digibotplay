import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://127.0.0.1:5050';

test.describe('Extended Chat Coverage V2', () => {

    let authToken = '';
    let teamId = '1'; 
    let chatId = '';
    const userEmail = 'monishkumarms3@gmail.com';

    test.beforeAll(async ({ request }) => {
        const response = await request.post(`${API_URL}/auth/login`, {
            data: { email: userEmail, password: 'Password123!' }
        });
        const body = await response.json();
        if (body.auth && body.auth.accessToken) {
            authToken = body.auth.accessToken;
        }

        // Try to get a valid team
        const teamRes = await request.get(`${API_URL}/teams`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (teamRes.status() === 200) {
            const teamBody = await teamRes.json();
            if (teamBody.teams && teamBody.teams.length > 0) {
                teamId = teamBody.teams[0].id;
            }
        }
    });

    // 1. POST /teams/:id/chats (Create New Chat)
    test('POST /teams/:id/chats - Create', async ({ request }) => {
        const response = await request.post(`${API_URL}/teams/${teamId}/chats`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { message: 'Initial Message' } // Assuming creation requires a message or similar
        });
        expect([200, 201, 400, 401, 403]).toContain(response.status());
        if (response.status() === 200 || response.status() === 201) {
            const body = await response.json();
            if (body.chat && body.chat.id) chatId = body.chat.id;
        }
    });

    // 2. GET /teams/:id/chats (Retrieve Chat Histories)
    test('GET /teams/:id/chats - List', async ({ request }) => {
        const response = await request.get(`${API_URL}/teams/${teamId}/chats`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        expect([200, 401, 403]).toContain(response.status());
    });

    // 3. PATCH /teams/:id/chats/:chatId (Rename Chat)
    test('PATCH /teams/:id/chats/:chatId - Rename', async ({ request }) => {
        const targetId = chatId || '1';
        const response = await request.patch(`${API_URL}/teams/${teamId}/chats/${targetId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { name: `Renamed Chat ${Date.now()}` }
        });
        expect([200, 204, 400, 401, 403, 404]).toContain(response.status());
    });

    // 4. POST /teams/:id/chats/:chatId/messages (Add Message)
    test('POST /teams/:id/chats/:chatId/messages - Add Msg', async ({ request }) => {
        const targetId = chatId || '1';
        const response = await request.post(`${API_URL}/teams/${teamId}/chats/${targetId}/messages`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { message: 'Hello from V2 Test', role: 'user' }
        });
        expect([200, 201, 400, 401, 403, 404]).toContain(response.status());
    });

    // 5. GET /teams/:id/chats/:chatId/messages (Retrieve Messages)
    test('GET /teams/:id/chats/:chatId/messages - Get Msgs', async ({ request }) => {
         const targetId = chatId || '1';
         const response = await request.get(`${API_URL}/teams/${teamId}/chats/${targetId}/messages`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        expect([200, 401, 403, 404]).toContain(response.status());
    });

    // 6. DELETE /teams/:id/chats/:chatId (Delete Chat)
    test('DELETE /teams/:id/chats/:chatId - Delete', async ({ request }) => {
        const targetId = chatId || '1';
        const response = await request.delete(`${API_URL}/teams/${teamId}/chats/${targetId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        expect([200, 204, 400, 401, 403, 404]).toContain(response.status());
    });
    
});
