import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://127.0.0.1:5050';

test.describe('Data-Driven Team Folder Read', () => {

    async function getToken(request, email, password) {
        const response = await request.post(`${API_URL}/auth/login`, {
            data: { email, password, loginType: 'standard' }
        });
        const body = await response.json();
        return body.user?.auth?.accessToken || body.token?.accessToken;
    }

    test('User 69 GET /teams/21/folders (Success)', async ({ request }) => {
        const token = await getToken(request, 'mad.quelea.bilt@protectsmail.net', 'Qwerty@123');
        const response = await request.get(`${API_URL}/teams/21/folders`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body).toHaveProperty('success', true);
        expect(Array.isArray(body.folders || body.data)).toBeTruthy();
    });

    test('User 69 GET /teams/23/folders (Unauthorized)', async ({ request }) => {
        const token = await getToken(request, 'mad.quelea.bilt@protectsmail.net', 'Qwerty@123');
        const response = await request.get(`${API_URL}/teams/23/folders`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        // Expect 403 Forbidden or 401/404
        expect([401, 403, 404]).toContain(response.status());
    });

    test('User 70 GET /teams/23/folders (Success)', async ({ request }) => {
        const token = await getToken(request, 'kind.urial.tyol@protectsmail.net', 'Qwerty@123');
        const response = await request.get(`${API_URL}/teams/23/folders`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        expect(response.status()).toBe(200);
    });

});
