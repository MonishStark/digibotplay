
import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://127.0.0.1:5050';

test.describe('Folder Tree: GET /teams/{teamId}/folders/{parentId}/tree', () => {

    let authToken = '';
    let teamId = '';
    let folderId = '';

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

        // Get a folder to query its tree
        const folderRes = await request.get(`${API_URL}/teams/${teamId}/folders`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const folderBody = await folderRes.json();
        if (folderBody.items && Array.isArray(folderBody.items)) {
            const folder = folderBody.items.find(f => f.type === 'folder');
            if (folder) {
                folderId = folder.id;
            }
        }
    });

    test('200 OK - Get Folder Tree', async ({ request }) => {
        test.skip(!teamId || !folderId, 'No Team or Folder found');

        const response = await request.get(`${API_URL}/teams/${teamId}/folders/${folderId}/tree`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        console.log(`Folder Tree Status: ${response.status()}`);
        const body = await response.json();
        console.log(`Folder Tree Body: ${JSON.stringify(body)}`);

        expect(response.status()).toBe(200);
        expect(body.success).toBe(true);
        expect(Array.isArray(body.predecessors)).toBe(true);
    });

    test('400 Bad Request - Missing parentId', async ({ request }) => {
        test.skip(!teamId, 'No Team found');

        // Calling without parentId (invalid route pattern)
        const response = await request.get(`${API_URL}/teams/${teamId}/folders//tree`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        // This should either 400 or 404
        expect([400, 404]).toContain(response.status());
    });

});
