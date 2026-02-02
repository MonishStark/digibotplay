
import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://127.0.0.1:5050';

test.describe('Update Text Document: PATCH /teams/{teamId}/files/{fileId}', () => {

    let authToken = '';
    let teamId = '';
    let fileId = '';

    test.beforeAll(async ({ request }) => {
        // 1. Login
        const loginRes = await request.post(`${API_URL}/auth/login`, {
            data: { email: 'gsatoru0373@gmail.com', password: 'Gojo@123', loginType: 'email' }
        });
        const loginBody = await loginRes.json();
        authToken = loginBody.user?.auth?.accessToken || loginBody.token?.accessToken;

        // 2. Get Active Team
        const teamRes = await request.get(`${API_URL}/teams/active`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const teamBody = await teamRes.json();
        if (teamBody.teamList && teamBody.teamList.length > 0) {
            teamId = teamBody.teamList[0].id;
        } else {
            console.log('Setup: No active teams found.');
            return;
        }

        // 3. Get files from folder list
        const folderRes = await request.get(`${API_URL}/teams/${teamId}/folders`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const folderBody = await folderRes.json();
        
        if (folderBody.items && Array.isArray(folderBody.items)) {
            const file = folderBody.items.find(f => f.type === 'file');
            if (file) {
                fileId = file.id;
                console.log(`Setup: Using existing File ID ${fileId}`);
            } else {
                console.log('Setup: No files found in folder list.');
            }
        }
    });

    test('200 OK - Update File Content', async ({ request }) => {
        test.skip(!teamId || !fileId, 'No Team or File created');

        const response = await request.patch(`${API_URL}/teams/${teamId}/files/${fileId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: {
                fileName: `UpdatedFile_${Date.now()}`,
                htmlString: '<p>Updated content from test</p>',
                parentId: 4
            }
        });

        console.log(`Update File Status: ${response.status()}`);
        const body = await response.json();
        console.log(`Update File Body: ${JSON.stringify(body)}`);

        expect(response.status()).toBe(200);
        expect(body.success).toBe(true);
    });

    test('400 Bad Request - Missing Fields', async ({ request }) => {
        test.skip(!teamId || !fileId, 'No Team or File created');

        const response = await request.patch(`${API_URL}/teams/${teamId}/files/${fileId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: {} // Missing required fields
        });

        expect(response.status()).toBe(400);
        const body = await response.json();
        expect(body.success).toBe(false);
    });

});
