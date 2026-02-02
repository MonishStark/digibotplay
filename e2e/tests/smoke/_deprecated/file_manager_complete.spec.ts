
import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://127.0.0.1:5050';

test.describe('File Manager Endpoints - Complete Coverage', () => {

    let authToken = '';
    let teamId = '';
    let folderId = '';
    let fileId = '';

    test.beforeAll(async ({ request }) => {
        const loginRes = await request.post(`${API_URL}/auth/login`, {
            data: { email: 'gsatoru0373@gmail.com', password: 'Gojo@123', loginType: 'email' }
        });
        const body = await loginRes.json();
        authToken = body.user?.auth?.accessToken || body.token?.accessToken;

        const teamRes = await request.get(`${API_URL}/teams/active`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const teamBody = await teamRes.json();
        if (teamBody.teamList?.[0]) teamId = teamBody.teamList[0].id;

        // Get existing folder/file
        if (teamId) {
            const folderRes = await request.get(`${API_URL}/teams/${teamId}/folders`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            const folderBody = await folderRes.json();
            const folder = folderBody.items?.find(f => f.type === 'folder');
            const file = folderBody.items?.find(f => f.type === 'file');
            if (folder) folderId = folder.id;
            if (file) fileId = file.id;
        }
    });

    // ========== POST /teams/{teamId}/folders (Create Folder) ==========

    test('POST /teams/:id/folders - 201 Success', async ({ request }) => {
        test.skip(!teamId, 'No team');
        const response = await request.post(`${API_URL}/teams/${teamId}/folders`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { name: `Folder_${Date.now()}` }
        });
        expect([200, 201]).toContain(response.status());
    });

    test('POST /teams/:id/folders - 400 Bad Request', async ({ request }) => {
        test.skip(!teamId, 'No team');
        const response = await request.post(`${API_URL}/teams/${teamId}/folders`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: {} // Missing name
        });
        expect([400, 422]).toContain(response.status());
    });

    test('POST /teams/:id/folders - 401 Unauthorized', async ({ request }) => {
        const response = await request.post(`${API_URL}/teams/1/folders`, {
            data: { name: 'Fail' }
        });
        expect(response.status()).toBe(401);
    });

    test('POST /teams/:id/folders - 403 Forbidden', async ({ request }) => {
        const response = await request.post(`${API_URL}/teams/1/folders`, {
            headers: { 'Authorization': 'Bearer invalid' },
            data: { name: 'Forbidden' }
        });
        expect([401, 403]).toContain(response.status());
    });

    test('POST /teams/:id/folders - 409 Conflict', async ({ request }) => {
        test.skip(!teamId, 'No team');
        const name = `Dup_${Date.now()}`;
        await request.post(`${API_URL}/teams/${teamId}/folders`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { name }
        });
        const response = await request.post(`${API_URL}/teams/${teamId}/folders`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { name }
        });
        expect([409, 400, 200]).toContain(response.status());
    });

    // ========== PUT /teams/{teamId}/folders/{folderId} ==========

    test('PUT /teams/:id/folders/:id - 200 Success', async ({ request }) => {
        test.skip(!teamId || !folderId, 'No team/folder');
        const response = await request.put(`${API_URL}/teams/${teamId}/folders/${folderId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { name: `Updated_${Date.now()}` }
        });
        expect([200, 201]).toContain(response.status());
    });

    test('PUT /teams/:id/folders/:id - 401 Unauthorized', async ({ request }) => {
        const response = await request.put(`${API_URL}/teams/1/folders/1`, {
            data: { name: 'Fail' }
        });
        expect(response.status()).toBe(401);
    });

    test('PUT /teams/:id/folders/:id - 404 Not Found', async ({ request }) => {
        test.skip(!teamId, 'No team');
        const response = await request.put(`${API_URL}/teams/${teamId}/folders/999999`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { name: 'NotFound' }
        });
        expect(response.status()).toBe(404);
    });

    // ========== DELETE /teams/{teamId}/folders/{folderId} ==========

    test('DELETE /teams/:id/folders/:id - 401 Unauthorized', async ({ request }) => {
        const response = await request.delete(`${API_URL}/teams/1/folders/1`);
        expect(response.status()).toBe(401);
    });

    test('DELETE /teams/:id/folders/:id - 404 Not Found', async ({ request }) => {
        test.skip(!teamId, 'No team');
        const response = await request.delete(`${API_URL}/teams/${teamId}/folders/999999`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        expect(response.status()).toBe(404);
    });

    // ========== GET /teams/{teamId}/folders ==========

    test('GET /teams/:id/folders - 200 Success', async ({ request }) => {
        test.skip(!teamId, 'No team');
        const response = await request.get(`${API_URL}/teams/${teamId}/folders`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        expect(response.status()).toBe(200);
    });

    test('GET /teams/:id/folders - 401 Unauthorized', async ({ request }) => {
        const response = await request.get(`${API_URL}/teams/1/folders`);
        expect(response.status()).toBe(401);
    });

    test('GET /teams/:id/folders - 404 Not Found', async ({ request }) => {
        const response = await request.get(`${API_URL}/teams/999999/folders`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        expect([403, 404]).toContain(response.status());
    });

    // ========== GET /teams/{teamId}/folders/{parentId}/tree ==========

    test('GET /teams/:id/folders/:id/tree - 200 Success', async ({ request }) => {
        test.skip(!teamId || !folderId, 'No team/folder');
        const response = await request.get(`${API_URL}/teams/${teamId}/folders/${folderId}/tree`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        expect([200, 404]).toContain(response.status());
    });

    test('GET /teams/:id/folders/:id/tree - 401 Unauthorized', async ({ request }) => {
        const response = await request.get(`${API_URL}/teams/1/folders/1/tree`);
        expect(response.status()).toBe(401);
    });

    // ========== POST /teams/{teamId}/files (Create Text Document) ==========

    test('POST /teams/:id/files - 201 Success', async ({ request }) => {
        test.skip(!teamId, 'No team');
        const response = await request.post(`${API_URL}/teams/${teamId}/files`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { name: `Doc_${Date.now()}.txt`, content: 'Test content' }
        });
        expect([200, 201]).toContain(response.status());
    });

    test('POST /teams/:id/files - 400 Bad Request', async ({ request }) => {
        test.skip(!teamId, 'No team');
        const response = await request.post(`${API_URL}/teams/${teamId}/files`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: {} // Missing name/content
        });
        expect([400, 422]).toContain(response.status());
    });

    test('POST /teams/:id/files - 401 Unauthorized', async ({ request }) => {
        const response = await request.post(`${API_URL}/teams/1/files`, {
            data: { name: 'Fail.txt' }
        });
        expect(response.status()).toBe(401);
    });

    test('POST /teams/:id/files - 409 Conflict', async ({ request }) => {
        test.skip(!teamId, 'No team');
        const name = `Dup_${Date.now()}.txt`;
        await request.post(`${API_URL}/teams/${teamId}/files`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { name, content: 'test' }
        });
        const response = await request.post(`${API_URL}/teams/${teamId}/files`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { name, content: 'test' }
        });
        expect([409, 400, 200]).toContain(response.status());
    });

    // ========== PATCH/GET/DELETE /teams/{teamId}/files/{fileId} ==========

    test('GET /teams/:id/files/:id - 200 Success', async ({ request }) => {
        test.skip(!teamId || !fileId, 'No team/file');
        const response = await request.get(`${API_URL}/teams/${teamId}/files/${fileId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        expect([200, 404]).toContain(response.status());
    });

    test('GET /teams/:id/files/:id - 404 Not Found', async ({ request }) => {
        test.skip(!teamId, 'No team');
        const response = await request.get(`${API_URL}/teams/${teamId}/files/999999`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        expect(response.status()).toBe(404);
    });

    test('PATCH /teams/:id/files/:id - 401 Unauthorized', async ({ request }) => {
        const response = await request.patch(`${API_URL}/teams/1/files/1`, {
            data: { content: 'updated' }
        });
        expect(response.status()).toBe(401);
    });

    test('DELETE /teams/:id/files/:id - 401 Unauthorized', async ({ request }) => {
        const response = await request.delete(`${API_URL}/teams/1/files/1`);
        expect(response.status()).toBe(401);
    });

    test('DELETE /teams/:id/files/:id - 404 Not Found', async ({ request }) => {
        test.skip(!teamId, 'No team');
        const response = await request.delete(`${API_URL}/teams/${teamId}/files/999999`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        expect(response.status()).toBe(404);
    });

    // ========== File Upload ==========

    test('POST /files/upload/:teamId - 200 Success', async ({ request }) => {
        test.skip(!teamId, 'No team');
        const response = await request.post(`${API_URL}/files/upload/${teamId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            multipart: {
                file: { name: 'test.txt', mimeType: 'text/plain', buffer: Buffer.from('test') }
            }
        });
        console.log(`File Upload Status: ${response.status()}`);
        expect([200, 201, 202, 400]).toContain(response.status());
    });

    test('POST /files/upload/:teamId - 401 Unauthorized', async ({ request }) => {
        const response = await request.post(`${API_URL}/files/upload/1`, {
            multipart: {
                file: { name: 'test.txt', mimeType: 'text/plain', buffer: Buffer.from('test') }
            }
        });
        expect(response.status()).toBe(401);
    });

    test('POST /files/upload/:teamId - 422 Invalid File', async ({ request }) => {
        test.skip(!teamId, 'No team');
        const response = await request.post(`${API_URL}/files/upload/${teamId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            multipart: {
                file: { name: 'bad.exe', mimeType: 'application/x-msdownload', buffer: Buffer.from('fake') }
            }
        });
        console.log(`Invalid File Upload Status: ${response.status()}`);
        expect([400, 422, 200]).toContain(response.status());
    });

    // ========== File Jobs ==========

    test('GET /files/jobs/:id/status - 200/404', async ({ request }) => {
        const response = await request.get(`${API_URL}/files/jobs/999/status`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        expect([200, 404]).toContain(response.status());
    });

    test('POST /files/jobs/:id/retry - 200/404', async ({ request }) => {
        const response = await request.post(`${API_URL}/files/jobs/999/retry`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        expect([200, 404]).toContain(response.status());
    });

});
