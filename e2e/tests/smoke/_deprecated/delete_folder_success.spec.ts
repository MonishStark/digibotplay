
import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://127.0.0.1:5050';

test.describe('DELETE /teams/:id/folders/:id Tests', () => {

    let authToken = '';
    let teamId = '';
    let folderId = '';

    test.beforeAll(async ({ request }) => {
        // Login
        const loginRes = await request.post(`${API_URL}/auth/login`, {
            data: { email: 'gsatoru0373@gmail.com', password: 'Gojo@123', loginType: 'email' }
        });
        const body = await loginRes.json();
        authToken = body.user?.auth?.accessToken || body.token?.accessToken || '';

        // Get Team
        const teamRes = await request.get(`${API_URL}/teams/active`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const teamBody = await teamRes.json();
        teamId = teamBody.teamList?.[0]?.id;

        // Create Folder to Delete
        if (teamId) {
            const folderRes = await request.post(`${API_URL}/teams/${teamId}/folders`, {
                headers: { 'Authorization': `Bearer ${authToken}` },
                data: { name: `DeleteMe_${Date.now()}` }
            });
            const folderBody = await folderRes.json();
            folderId = folderBody.folder?.id || folderBody.id;
            console.log(`Created folder to delete: ${folderId}`);
        }
    });

    test('DELETE /teams/:id/folders/:id - 200 Success', async ({ request }) => {
        test.skip(!folderId, 'Setup failed: No folder created');
        
        console.log(`Deleting folder ${folderId} from team ${teamId}`);
        const response = await request.delete(`${API_URL}/teams/${teamId}/folders/${folderId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        console.log(`Delete Status: ${response.status()}`);
        expect([200, 204]).toContain(response.status());
    });

});
