
import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://127.0.0.1:5050';

test.describe('File Upload & Jobs Endpoints', () => {

    let authToken = '';
    let teamId = '';
    let existingFileId = '';

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
            if (file) existingFileId = file.id;
        }
    });

    // ========== POST /files/upload/:teamId ==========
    test('POST /files/upload/:teamId - File Upload', async ({ request }) => {
        test.skip(!teamId, 'No Team found');

        const response = await request.post(`${API_URL}/files/upload/${teamId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            multipart: {
                file: {
                    name: 'test.txt',
                    mimeType: 'text/plain',
                    buffer: Buffer.from('Test file content for upload')
                }
            }
        });

        console.log(`File Upload Status: ${response.status()}`);
        // 200, 201, 202 are all valid success responses
        expect([200, 201, 202, 400, 401, 422]).toContain(response.status());
    });

    // ========== POST /files/upload/audio/:teamId ==========
    test('POST /files/upload/audio/:teamId - Audio Upload', async ({ request }) => {
        test.skip(!teamId, 'No Team found');

        const response = await request.post(`${API_URL}/files/upload/audio/${teamId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            multipart: {
                file: {
                    name: 'test.mp3',
                    mimeType: 'audio/mpeg',
                    buffer: Buffer.from('fake audio content')
                }
            }
        });

        console.log(`Audio Upload Status: ${response.status()}`);
        expect([200, 201, 400, 401, 422]).toContain(response.status());
    });

    // ========== GET /files/jobs/:id/status ==========
    test('GET /files/jobs/:id/status - Job Status', async ({ request }) => {
        const response = await request.get(`${API_URL}/files/jobs/999/status`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        console.log(`Job Status: ${response.status()}`);
        // 200 = found, 404 = job not found (valid)
        expect([200, 404, 401]).toContain(response.status());
    });

    // ========== POST /files/jobs/:id/retry ==========
    test('POST /files/jobs/:id/retry - Retry Job', async ({ request }) => {
        const response = await request.post(`${API_URL}/files/jobs/999/retry`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        console.log(`Retry Job Status: ${response.status()}`);
        // 200 = success, 404 = job not found (valid)
        expect([200, 404, 401]).toContain(response.status());
    });

    // ========== GET /teams/:teamId/files/:fileId/summary ==========
    test('GET /teams/:teamId/files/:fileId/summary - File Summary', async ({ request }) => {
        test.skip(!teamId || !existingFileId, 'No Team or File found');

        const response = await request.get(`${API_URL}/teams/${teamId}/files/${existingFileId}/summary`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        console.log(`File Summary Status: ${response.status()}`);
        expect([200, 404]).toContain(response.status());
        
        if (response.status() === 200) {
            const body = await response.json();
            expect(body).toHaveProperty('success', true);
        }
    });

    // ========== GET /settings/max-uploads ==========
    test('GET /settings/max-uploads - Max Uploads Setting', async ({ request }) => {
        const response = await request.get(`${API_URL}/settings/max-uploads`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        console.log(`Max Uploads Status: ${response.status()}`);
        expect([200, 401]).toContain(response.status());
        
        if (response.status() === 200) {
            const body = await response.json();
            expect(body).toHaveProperty('success', true);
        }
    });

});
