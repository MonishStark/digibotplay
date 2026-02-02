
import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://127.0.0.1:5050';

test.describe('Extended Team Update: PUT /teams/{id}', () => {

    let authToken = '';
    let teamId = '';
    const userEmail = 'gsatoru0373@gmail.com'; // Admin user
    const password = 'Gojo@123';

    test.beforeAll(async ({ request }) => {
        // 1. Login
        const loginRes = await request.post(`${API_URL}/auth/login`, {
            data: { email: userEmail, password: password, loginType: 'email' }
        });
        const loginBody = await loginRes.json();
        authToken = loginBody.user?.auth?.accessToken || loginBody.token?.accessToken;
        console.log('Login Body Keys:', Object.keys(loginBody));
        console.log('User Props:', JSON.stringify(loginBody.user));

        // 2. Fetch Existing Teams
        const listRes = await request.get(`${API_URL}/teams`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const listBody = await listRes.json();
        console.log('List Teams Status:', listRes.status());
        
        if (listBody.teamList && listBody.teamList.length > 0) {
             teamId = listBody.teamList[0].id;
             console.log(`Setup: Using Existing Team ID ${teamId}`);
        } else {
             console.log('Setup: No existing teams found (teamList is empty).');
             // Proceeding will fail, but at least we know why.
        }
    });

    test('200/201 OK - Update Team Success', async ({ request }) => {
        expect(teamId).toBeTruthy();

        const newName = `Updated Team ${Date.now()}`;
        const newAlias = `upd_alias_${Date.now()}`;

        const response = await request.put(`${API_URL}/teams/${teamId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: {
                teamName: newName,
                teamAlias: newAlias
            }
        });

        console.log(`Update Team Status: ${response.status()}`);
        const body = await response.json();
        console.log(`Update Team Body: ${JSON.stringify(body)}`);

        // Controller returns 201 for success? (Line 800 of controller)
        expect([200, 201]).toContain(response.status());
        expect(body.success).toBe(true);
        expect(body.team.teamName).toBe(newName);
    });

    test('400 Bad Request - Missing Fields', async ({ request }) => {
        const response = await request.put(`${API_URL}/teams/${teamId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: {
                teamName: '' // Missing
            }
        });
        expect(response.status()).toBe(400);
    });

});
