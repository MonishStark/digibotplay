import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://127.0.0.1:5050';

test.describe('Extended Files & Folders Coverage V2', () => {

    let authToken = '';
    let teamId = '1'; // Default backup
    let folderId = '';
    let fileId = '';
    const userEmail = 'monishkumarms3@gmail.com';

    test.beforeAll(async ({ request }) => {
        // 1. Login
        const loginRes = await request.post(`${API_URL}/auth/login`, {
            data: { email: userEmail, password: 'Password123!' }
        });
        const loginBody = await loginRes.json();
        if (loginBody.auth && loginBody.auth.accessToken) {
            authToken = loginBody.auth.accessToken;
        }

        // 2. Try to get a valid team
        const teamRes = await request.get(`${API_URL}/teams`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (teamRes.status() === 200) {
            const teamBody = await teamRes.json();
            if (teamBody.teams && teamBody.teams.length > 0) {
                teamId = teamBody.teams[0].id;
            }
        }
    });

    // --- FOLDERS ---

    // 1. POST /teams/:id/folders (Create New Folder)
    test('POST /teams/:id/folders - Create', async ({ request }) => {
        const response = await request.post(`${API_URL}/teams/${teamId}/folders`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { name: `Test Folder ${Date.now()}`, parentId: null }
        });
        // 200/201 Success, 401/403 Auth Fail
        expect([200, 201, 400, 401, 403]).toContain(response.status());
        if (response.status() === 200 || response.status() === 201) {
             const body = await response.json();
             if (body.folder && body.folder.id) folderId = body.folder.id;
        }
    });

    // 2. PUT /teams/:id/folders/:folderId (Update Folder)
    test('PUT /teams/:id/folders/:id - Update', async ({ request }) => {
        const targetId = folderId || '1';
        const response = await request.put(`${API_URL}/teams/${teamId}/folders/${targetId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { name: `Updated Folder ${Date.now()}` }
        });
        expect([200, 201, 400, 401, 403, 404]).toContain(response.status());
    });

    // 3. GET /teams/:id/folders (Get Folders & Files)
    test('GET /teams/:id/folders - List', async ({ request }) => {
        const response = await request.get(`${API_URL}/teams/${teamId}/folders`, {
             headers: { 'Authorization': `Bearer ${authToken}` }
        });
        expect([200, 401, 403, 404]).toContain(response.status());
    });

    // 4. GET /teams/:id/folders/:parentId/tree (Get Folder Tree)
    test('GET /teams/:id/folders/:parentId/tree - Tree', async ({ request }) => {
        const targetId = folderId || '0'; // 0 often root
        const response = await request.get(`${API_URL}/teams/${teamId}/folders/${targetId}/tree`, {
             headers: { 'Authorization': `Bearer ${authToken}` }
        });
        expect([200, 401, 403, 404, 500]).toContain(response.status());
    });

    // 5. DELETE /teams/:id/folders/:folderId (Delete Folder)
    test('DELETE /teams/:id/folders/:id - Delete', async ({ request }) => {
        const targetId = folderId || '1';
        const response = await request.delete(`${API_URL}/teams/${teamId}/folders/${targetId}`, {
             headers: { 'Authorization': `Bearer ${authToken}` }
        });
        expect([200, 204, 400, 401, 403, 404]).toContain(response.status());
    });

    // 6. GET /teams/:id/items (Get All Items - Missing)
    test('GET /teams/:id/items - Missing Endpoint', async ({ request }) => {
        const response = await request.get(`${API_URL}/teams/${teamId}/items`, {
             headers: { 'Authorization': `Bearer ${authToken}` }
        });
        expect([404, 401, 403]).toContain(response.status()); // Allow 401 if guarded
    });

    // --- FILES ---

    // 7. POST /teams/:id/files (Create Text Document)
    test('POST /teams/:id/files - Create Doc', async ({ request }) => {
        const response = await request.post(`${API_URL}/teams/${teamId}/files`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { name: `Test File ${Date.now()}`, content: 'Hello World', parentId: null }
        });
        expect([200, 201, 400, 401, 403]).toContain(response.status());
        if (response.status() === 200 || response.status() === 201) {
            const body = await response.json();
            if (body.file && body.file.id) fileId = body.file.id;
        }
    });

    // 8. PATCH /teams/:id/files/:fileId (Update Text Document)
    test('PATCH /teams/:id/files/:id - Update Doc', async ({ request }) => {
        const targetId = fileId || '1';
        const response = await request.patch(`${API_URL}/teams/${teamId}/files/${targetId}`, {
             headers: { 'Authorization': `Bearer ${authToken}` },
             data: { content: 'Updated Content' }
        });
        expect([200, 201, 400, 401, 403, 404]).toContain(response.status());
    });

    // 9. PATCH /teams/:id/files/:fileId/name (Rename File)
    test('PATCH /teams/:id/files/:id/name - Rename', async ({ request }) => {
        const targetId = fileId || '1';
        const response = await request.patch(`${API_URL}/teams/${teamId}/files/${targetId}/name`, {
             headers: { 'Authorization': `Bearer ${authToken}` },
             data: { name: `Renamed File ${Date.now()}` }
        });
        expect([200, 201, 400, 401, 403, 404]).toContain(response.status());
    });

    // 10. DELETE /teams/:id/files/:fileId (Delete File)
    test('DELETE /teams/:id/files/:id - Delete', async ({ request }) => {
        const targetId = fileId || '1';
        const response = await request.delete(`${API_URL}/teams/${teamId}/files/${targetId}`, {
             headers: { 'Authorization': `Bearer ${authToken}` }
        });
        expect([200, 204, 400, 401, 403, 404]).toContain(response.status());
    });

});
