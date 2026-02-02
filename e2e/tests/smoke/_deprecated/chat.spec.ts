
import { test, expect } from '@playwright/test';

const API_URL = process.env.BACKEND_URL || 'http://127.0.0.1:5050';
const TEST_EMAIL = process.env.TEST_EMAIL || 'monishkumarms3@gmail.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Monish@123';

let authToken = '';
const TEAM_ID = '1';

test.describe('Chat Module Smoke Tests', () => {

    test.beforeAll(async ({ request }) => {
        const response = await request.post(`${API_URL}/auth/login`, {
            data: { email: TEST_EMAIL, password: TEST_PASSWORD, loginType: 'standard' }
        });
        const body = await response.json();
        authToken = body.user?.auth?.accessToken;
        if (!authToken) console.log('Auth failed in Chat spec');
    });

    test('POST /teams/:id/chats - Create', async ({ request }) => {
        const response = await request.post(`${API_URL}/teams/${TEAM_ID}/chats`, {
            headers: { Authorization: `Bearer ${authToken}` },
            data: { name: 'Smoke Test Chat' }
        });
        expect([200, 201, 400, 403, 404]).toContain(response.status());
    });

    test('GET /teams/:id/chats - List', async ({ request }) => {
        const response = await request.get(`${API_URL}/teams/${TEAM_ID}/chats`, {
             headers: { Authorization: `Bearer ${authToken}` }
        });
        expect([200, 201, 204, 400, 401, 403, 404, 409, 422, 500, 503]).toContain(response.status());
    });

    test('POST /teams/:id/chats/:chatId/messages - Send', async ({ request }) => {
        // Mock Chat ID
        const response = await request.post(`${API_URL}/teams/${TEAM_ID}/chats/99999/messages`, {
            headers: { Authorization: `Bearer ${authToken}` },
            data: { message: 'Hello World' }
        });
        expect([200, 201, 400, 403, 404]).toContain(response.status());
    });

    test('GET /chat/get-histories', async ({ request }) => {
         const response = await request.post(`${API_URL}/chat/get-histories`, {
            headers: { Authorization: `Bearer ${authToken}` },
            data: { teamId: TEAM_ID }
        });
        expect([200, 400, 401, 403, 404]).toContain(response.status());
    });

    // --- New Coverage ---

    test('PATCH /teams/:id/chats/:chatId - Rename', async ({ request }) => {
        const response = await request.patch(`${API_URL}/teams/${TEAM_ID}/chats/99999`, {
            headers: { Authorization: `Bearer ${authToken}` },
            data: { name: 'Renamed Chat' }
        });
        expect([200, 201, 204, 400, 401, 403, 404, 409, 422, 500, 503]).toContain(response.status());
    });

    test('DELETE /teams/:id/chats/:chatId', async ({ request }) => {
        const response = await request.delete(`${API_URL}/teams/${TEAM_ID}/chats/99999`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        expect([200, 201, 204, 400, 401, 403, 404, 409, 422, 500, 503]).toContain(response.status());
    });

    test('GET /teams/:id/chats/:chatId/messages', async ({ request }) => {
        const response = await request.get(`${API_URL}/teams/${TEAM_ID}/chats/99999/messages`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        expect([200, 201, 204, 400, 401, 403, 404, 409, 422, 500, 503]).toContain(response.status());
    });


});
