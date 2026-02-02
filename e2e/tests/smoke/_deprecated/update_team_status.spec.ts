
import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://127.0.0.1:5050';

test.describe('Team Status: PATCH /teams/:id/status', () => {

    let authToken = '';
    let teamId = '';

    test.beforeAll(async ({ request }) => {
        const response = await request.post(`${API_URL}/auth/login`, {
            data: { email: 'gsatoru0373@gmail.com', password: 'Gojo@123', loginType: 'email' }
        });
        const body = await response.json();
        authToken = body.user?.auth?.accessToken || body.token?.accessToken;

        // Fetch teams
        const listRes = await request.get(`${API_URL}/teams`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const listBody = await listRes.json();
        if (listBody.teamList && listBody.teamList.length > 0) {
            teamId = listBody.teamList[0].id; // Use first team
        } else {
            console.log('Setup: No teams found, cannot test status update.');
        }
    });

    test('200 OK - Deactivate Team', async ({ request }) => {
        test.skip(!teamId, 'No team to test');

        const response = await request.patch(`${API_URL}/teams/${teamId}/status`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { active: false }
        });
        
        console.log(`Deactivate Status: ${response.status()}`);
        const body = await response.json();
        console.log('Deactivate Body:', JSON.stringify(body));

        expect(response.status()).toBe(200);
        expect(body.success).toBe(true);
        expect(body.team.active).toBe(false);
    });

    test('200 OK - Activate Team', async ({ request }) => {
        test.skip(!teamId, 'No team to test');

        const response = await request.patch(`${API_URL}/teams/${teamId}/status`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { active: true }
        });
        
        console.log(`Activate Status: ${response.status()}`);
        const body = await response.json();
        
        expect(response.status()).toBe(200);
        expect(body.success).toBe(true);
        expect(body.team.active).toBe(true);
    });

});
