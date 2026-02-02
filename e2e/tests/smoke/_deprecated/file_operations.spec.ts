
import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://127.0.0.1:5050';

test.describe('File Operations: Comprehensive Tests', () => {

    let authToken = '';
    let teamId = '';
    let existingFileId = '';
    let createdFileId = '';

    test.beforeAll(async ({ request }) => {
        // Login
        const loginRes = await request.post(`${API_URL}/auth/login`, {
            data: { email: 'gsatoru0373@gmail.com', password: 'Gojo@123', loginType: 'email' }
        });
        const loginBody = await loginRes.json();
        authToken = loginBody.user?.auth?.accessToken || loginBody.token?.accessToken;

        // Get Active Team
        const teamRes = await request.get(`${API_URL}/teams/active`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const teamBody = await teamRes.json();
        if (teamBody.teamList && teamBody.teamList.length > 0) {
            teamId = teamBody.teamList[0].id;
        }

        // Get existing file
        const folderRes = await request.get(`${API_URL}/teams/${teamId}/folders`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const folderBody = await folderRes.json();
        if (folderBody.items && Array.isArray(folderBody.items)) {
            const file = folderBody.items.find(f => f.type === 'file');
            if (file) {
                existingFileId = file.id;
            }
        }
    });

    // ========== POST /teams/{teamId}/files - Create Text Document ==========
    test('POST /files - Create Text Document', async ({ request }) => {
        test.skip(!teamId, 'No Team found');

        const response = await request.post(`${API_URL}/teams/${teamId}/files`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: {
                fileName: `TestCreateFile_${Date.now()}`,
                parentId: null,
                htmlString: '<p>Test content for created file</p>'
            }
        });

        console.log(`Create File Status: ${response.status()}`);
        const body = await response.json();
        console.log(`Create File Body: ${JSON.stringify(body)}`);

        expect([200, 201]).toContain(response.status());
        expect(body.success).toBe(true);
    });

    // ========== GET /teams/{teamId}/files/{fileId} - Get File ==========
    test('GET /files/{id} - Get File', async ({ request }) => {
        test.skip(!teamId || !existingFileId, 'No Team or File found');

        const response = await request.get(`${API_URL}/teams/${teamId}/files/${existingFileId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        console.log(`Get File Status: ${response.status()}`);
        expect(response.status()).toBe(200);
    });

    // ========== PATCH /teams/{teamId}/files/{fileId}/name - Rename File ==========
    test('PATCH /files/{id}/name - Rename File', async ({ request }) => {
        test.skip(!teamId || !existingFileId, 'No Team or File found');

        const newName = `Renamed_${Date.now()}`;
        const response = await request.patch(`${API_URL}/teams/${teamId}/files/${existingFileId}/name`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { fileName: newName }
        });

        console.log(`Rename File Status: ${response.status()}`);
        const body = await response.json();
        console.log(`Rename File Body: ${JSON.stringify(body)}`);

        expect(response.status()).toBe(200);
        expect(body.success).toBe(true);
    });

    // ========== DELETE /teams/{teamId}/files/{fileId} - Delete File ==========
    test('DELETE /files/{id} - Delete File (Create then Delete)', async ({ request }) => {
        test.skip(!teamId, 'No Team found');

        // Create a file to delete
        const createRes = await request.post(`${API_URL}/teams/${teamId}/files`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: {
                fileName: `ToDelete_${Date.now()}`,
                parentId: null,
                htmlString: '<p>This will be deleted</p>'
            }
        });
        expect([200, 201]).toContain(createRes.status());

        // Get the newly created file from list
        const folderRes = await request.get(`${API_URL}/teams/${teamId}/folders`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const folderBody = await folderRes.json();
        const files = folderBody.items?.filter(f => f.type === 'file' && f.name.startsWith('ToDelete_'));
        
        if (files && files.length > 0) {
            const fileToDelete = files[0].id;
            
            const deleteRes = await request.delete(`${API_URL}/teams/${teamId}/files/${fileToDelete}`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });

            console.log(`Delete File Status: ${deleteRes.status()}`);
            expect(deleteRes.status()).toBe(200);
        }
    });

    // ========== Missing Routes (Will 404) ==========
    test('POST /files/upload/{teamId} - File Upload (MISSING ROUTE)', async ({ request }) => {
        test.skip(!teamId, 'No Team found');

        const response = await request.post(`${API_URL}/files/upload/${teamId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            multipart: {
                file: {
                    name: 'test.txt',
                    mimeType: 'text/plain',
                    buffer: Buffer.from('Test content')
                }
            }
        });

        console.log(`File Upload Status: ${response.status()}`);
        // Route may not exist
        if (response.status() === 404) {
            console.log('ROUTE NOT IMPLEMENTED: POST /files/upload/{teamId}');
        }
    });

    test('GET /files/jobs/{id}/status - Job Status (MISSING ROUTE)', async ({ request }) => {
        const response = await request.get(`${API_URL}/files/jobs/123/status`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        console.log(`Job Status: ${response.status()}`);
        if (response.status() === 404) {
            console.log('ROUTE NOT IMPLEMENTED: GET /files/jobs/{id}/status');
        }
    });

    test('GET /files/{fileId}/summary - File Summary (MISSING ROUTE)', async ({ request }) => {
        test.skip(!teamId || !existingFileId, 'No Team or File found');

        const response = await request.get(`${API_URL}/teams/${teamId}/files/${existingFileId}/summary`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        console.log(`File Summary Status: ${response.status()}`);
        if (response.status() === 404) {
            console.log('ROUTE NOT IMPLEMENTED: GET /teams/{id}/files/{id}/summary');
        }
    });

});
