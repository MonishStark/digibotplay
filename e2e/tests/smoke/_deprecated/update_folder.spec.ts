
import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://127.0.0.1:5050';

test.describe('Update Folder: PUT /teams/{teamId}/folders/{folderId}', () => {

    let authToken = '';
    let teamId = '';
    let folderId = '';

    test.beforeAll(async ({ request }) => {
        // 1. Login
        const loginRes = await request.post(`${API_URL}/auth/login`, {
            data: { email: 'gsatoru0373@gmail.com', password: 'Gojo@123', loginType: 'email' }
        });
        const loginBody = await loginRes.json();
        authToken = loginBody.user?.auth?.accessToken || loginBody.token?.accessToken;

        // 2. Get Team
        const teamRes = await request.get(`${API_URL}/teams/active`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const teamBody = await teamRes.json();
        if (teamBody.teamList && teamBody.teamList.length > 0) {
            teamId = teamBody.teamList[0].id; // Use first active team
            console.log(`Setup: Using Team ID ${teamId}`);
        } else {
            console.log('Setup: No active teams found.');
            return;
        }

        // 3. Get Folders
        const folderRes = await request.get(`${API_URL}/teams/${teamId}/folders`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const folderBody = await folderRes.json();
        console.log('List Folders Status:', folderRes.status());
        // console.log('List Folders Body:', JSON.stringify(folderBody));

        let folders = [];
        if (folderBody.items && Array.isArray(folderBody.items)) {
             folders = folderBody.items.filter(f => f.type === 'folder');
        }

        
        // Actually, let's look for any ID in the response if we can't parse easily.
        // But for now, let's try assuming Array or `folders` prop.
        if (folders.length > 0) {
            folderId = folders[0].id;
            console.log(`Setup: Using Folder ID ${folderId}`);
        } else {
            // Fallback: If no folders, maybe "Notes" exists but structure is different?
            // If the getFilesAndFolders returns mixed list.
             if (Array.isArray(folderBody)) {
                 const folder = folderBody.find(f => f.type === 'folder' || !f.type); // Default might be folder
                 if(folder) folderId = folder.id;
             }
        }
    });

    test('200 OK - Update Folder', async ({ request }) => {
        test.skip(!teamId || !folderId, 'No Team or Folder found');

        const newName = `Updated Folder ${Date.now()}`;
        const newDesc = `Desc ${Date.now()}`;

        const response = await request.put(`${API_URL}/teams/${teamId}/folders/${folderId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: {
                folderName: newName,
                folderDescription: newDesc
            }
        });

        console.log(`Update Folder Status: ${response.status()}`);
        const body = await response.json();
        console.log(`Update Folder Body: ${JSON.stringify(body)}`);

        expect(response.status()).toBe(200);
        expect(body.success).toBe(true);
        expect(body.folder.name).toBe(newName);
        // DB maps description to 'tooltip'
        expect(body.folder.tooltip).toBe(newDesc);
    });

});
