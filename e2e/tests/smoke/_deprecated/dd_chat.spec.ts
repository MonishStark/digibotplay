import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://127.0.0.1:5050';

test.describe('Data-Driven Chat Verification', () => {

    async function getToken(request, email, password) {
        const response = await request.post(`${API_URL}/auth/login`, {
            data: { email, password, loginType: 'standard' }
        });
        const body = await response.json();
        return body.user?.auth?.accessToken || body.token?.accessToken;
    }

    // Chat needs a file or resource.
    // DB Context: User 69, Team 21, File 353 (Chatgpt.pdf).
    // Chat 31 exists for this file.

    test('User 69 Create New Chat for File 353', async ({ request }) => {
        const token = await getToken(request, 'mad.quelea.bilt@protectsmail.net', 'Qwerty@123');
        const response = await request.post(`${API_URL}/chat`, {
            headers: { 'Authorization': `Bearer ${token}` },
            data: {
                teamId: 21,
                resourceId: 353,
                scope: 'file',
                chatName: 'DD_Test_Chat_' + Date.now()
            }
        });
        expect(response.status()).toBe(201);
        const body = await response.json();
        expect(body).toHaveProperty('success', true);
        expect(body.data?.id).toBeTruthy();
    });

    test('User 69 Send Message to Existing Chat 31', async ({ request }) => {
        const token = await getToken(request, 'mad.quelea.bilt@protectsmail.net', 'Qwerty@123');
        const response = await request.post(`${API_URL}/chat/31/messages`, {
            headers: { 'Authorization': `Bearer ${token}` },
            data: {
                message: 'Hello from Data Driven Test',
                source: 'user' // or whatever required
            }
        });
        
        if (response.status() !== 201 && response.status() !== 200) {
             console.log(`Msg Status: ${response.status()}`);
             try { console.log(await response.text()); } catch {}
        }
        
        expect([200, 201]).toContain(response.status());
    });

    test('User 70 Access Chat 31 (Unauthorized)', async ({ request }) => {
        // Chat 31 belongs to User 69/Team 21. User 70 (Team 23) should not access.
        const token = await getToken(request, 'kind.urial.tyol@protectsmail.net', 'Qwerty@123');
        const response = await request.post(`${API_URL}/chat/31/messages`, {
            headers: { 'Authorization': `Bearer ${token}` },
            data: { message: 'Intruder alert' }
        });
        expect([401, 403, 404]).toContain(response.status());
    });

});
