
import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://127.0.0.1:5050';

test.describe('Active Teams: GET /teams/active', () => {

    let authToken = '';

    test.beforeAll(async ({ request }) => {
        const response = await request.post(`${API_URL}/auth/login`, {
            data: { email: 'gsatoru0373@gmail.com', password: 'Gojo@123', loginType: 'email' }
        });
        const body = await response.json();
        authToken = body.user?.auth?.accessToken || body.token?.accessToken;
    });

    test('200 OK - Get Active Teams', async ({ request }) => {
        // We'll try query param if simple fails, but for now simple
        let response = await request.get(`${API_URL}/teams/active`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        console.log(`Active Teams Status: ${response.status()}`);
        if(response.status() !== 200) {
            const body = await response.json();
            console.log('Error Body:', JSON.stringify(body));
        }

        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);
        expect(Array.isArray(body.teamList)).toBe(true);
        console.log(`Active Teams Found: ${body.teamList.length}`);
    });

});
