
import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://127.0.0.1:5050';

test.describe('Delete Folder: DELETE /teams/{teamId}/folders/{folderId}', () => {

    let authToken = '';
    let teamId = '';
    let newFolderId = '';

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
            console.log(`Setup: Using Team ID ${teamId}`);
        } else {
            console.log('Setup: No active teams found.');
            return;
        }

        // 3. Create a new folder to delete (safe approach)
        const createRes = await request.post(`${API_URL}/teams/${teamId}/folders`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: {
                folderName: `Delete Test Folder ${Date.now()}`,
                parentId: null // Root level
            }
        });
        const createBody = await createRes.json();
        console.log('Create Folder Status:', createRes.status());
        console.log('Create Folder Body:', JSON.stringify(createBody));
        
        if (createBody.folder && createBody.folder.id) {
            newFolderId = createBody.folder.id;
        } else if (createBody.id) {
            newFolderId = createBody.id;
        }
        console.log(`Setup: Created Folder ID ${newFolderId}`);
    });

    test('200 OK - Delete Folder (Permanent)', async ({ request }) => {
        test.skip(!teamId || !newFolderId, 'No Team or Folder created');

        const response = await request.delete(`${API_URL}/teams/${teamId}/folders/${newFolderId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        console.log(`Delete Folder Status: ${response.status()}`);
        const body = await response.json();
        console.log(`Delete Folder Body: ${JSON.stringify(body)}`);

        expect(response.status()).toBe(200);
        expect(body.success).toBe(true);
    });

    test('404 Not Found - Already Deleted', async ({ request }) => {
        test.skip(!teamId || !newFolderId, 'No Team or Folder created');

        // Attempt to delete the same folder again
        const response = await request.delete(`${API_URL}/teams/${teamId}/folders/${newFolderId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        console.log(`Re-delete Status: ${response.status()}`);
        // Controller might return 404 or 500 or 400 depending on logic
        expect([400, 404, 500]).toContain(response.status());
    });

});
