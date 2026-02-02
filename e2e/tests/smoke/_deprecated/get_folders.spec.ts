
import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://127.0.0.1:5050';

test.describe('Get Folders: GET /teams/{teamId}/folders', () => {

    let authToken = '';
    let teamId = '';

    test.beforeAll(async ({ request }) => {
        const loginRes = await request.post(`${API_URL}/auth/login`, {
            data: { email: 'gsatoru0373@gmail.com', password: 'Gojo@123', loginType: 'email' }
        });
        const loginBody = await loginRes.json();
        authToken = loginBody.user?.auth?.accessToken || loginBody.token?.accessToken;

        const teamRes = await request.get(`${API_URL}/teams/active`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const teamBody = await teamRes.json();
        if (teamBody.teamList && teamBody.teamList.length > 0) {
            teamId = teamBody.teamList[0].id;
        }
    });

    test('200 OK - Get Root Items', async ({ request }) => {
        test.skip(!teamId, 'No Team found');

        const response = await request.get(`${API_URL}/teams/${teamId}/folders`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        console.log(`Get Folders Status: ${response.status()}`);
        const body = await response.json();

        expect(response.status()).toBe(200);
        expect(body.success).toBe(true);
        expect(Array.isArray(body.items)).toBe(true);
        expect(body.pagination).toBeDefined();
        console.log(`Items found: ${body.items.length}`);
    });

    test('200 OK - With Pagination', async ({ request }) => {
        test.skip(!teamId, 'No Team found');

        const response = await request.get(`${API_URL}/teams/${teamId}/folders?offset=0&limit=5`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.pagination.limit).toBe(5);
    });

    test('200 OK - Search Query', async ({ request }) => {
        test.skip(!teamId, 'No Team found');

        const response = await request.get(`${API_URL}/teams/${teamId}/folders?search=test`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.message).toContain('Search results');
    });

});
