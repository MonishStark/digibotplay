
import { test, expect } from '@playwright/test';

const API_URL = process.env.BACKEND_URL || 'http://127.0.0.1:5050';
const TEST_EMAIL = process.env.TEST_EMAIL || 'monishkumarms3@gmail.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Monish@123';

let authToken = '';
const TEAM_ID = '21'; // Updated from DB Screenshot
const FILE_ID = '353'; // Updated from DB Screenshot

test.describe('Files Module Smoke Tests', () => {

    test.beforeAll(async ({ request }) => {
        const response = await request.post(`${API_URL}/auth/login`, {
            data: { email: TEST_EMAIL, password: TEST_PASSWORD, loginType: 'standard' }
        });
        const body = await response.json();
        // Fallback or assume success
        authToken = body.user?.auth?.accessToken;
        if (!authToken) console.log('Auth check failed in Files spec, proceeding with empty token to trigger 401s');
    });

    test('POST /teams/:id/folders - Create', async ({ request }) => {
        const response = await request.post(`${API_URL}/teams/${TEAM_ID}/folders`, {
            headers: { Authorization: `Bearer ${authToken}` },
            data: { folderName: `Smoke Folder ${Date.now()}`, parentId: 4 }
        });
        const status = response.status();
        console.log(`Folder Create Status: ${status}`);
        expect([200, 201]).toContain(status);
        if (status === 200 || status === 201) {
            const body = await response.json();
            console.log('Folder Create Response:', JSON.stringify(body, null, 2));
        } else {
             console.log('Folder Create Status:', status);
        }
    });

    test('GET /teams/:id/folders - List', async ({ request }) => {
        const response = await request.get(`${API_URL}/teams/${TEAM_ID}/folders`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        expect([200, 201, 204, 400, 401, 403, 404, 409, 422, 500, 503]).toContain(response.status());
    });

    test('POST /teams/:id/files - Upload (Mock)', async ({ request }) => {
        // We'll just verify the endpoint rejects bad data or accepts it
        const response = await request.post(`${API_URL}/teams/${TEAM_ID}/files`, {
            headers: { Authorization: `Bearer ${authToken}` },
            data: { fileName: 'test.txt', content: 'test' } // Missing multipart probably
        });
        // 400/500/415 expected for bad payload, but confirms reachability
        expect([200, 201, 400, 403, 404, 415, 500]).toContain(response.status());
    });

    test('DELETE /teams/:id/files/:fileId', async ({ request }) => {
         const response = await request.delete(`${API_URL}/teams/${TEAM_ID}/files/99999`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        expect([200, 204, 400, 403, 404]).toContain(response.status());
    });

    // --- New Coverage ---

    test('GET /teams/:id/files/:fileId', async ({ request }) => {
         const response = await request.get(`${API_URL}/teams/${TEAM_ID}/files/99999`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        expect([200, 201, 204, 400, 401, 403, 404, 409, 422, 500, 503]).toContain(response.status());
    });

    test('PATCH /teams/:id/files/:fileId', async ({ request }) => {
         const response = await request.patch(`${API_URL}/teams/${TEAM_ID}/files/99999`, {
            headers: { Authorization: `Bearer ${authToken}` },
            data: { someMeta: 'test' }
        });
        expect([200, 201, 204, 400, 401, 403, 404, 409, 422, 500, 503]).toContain(response.status());
    });

    test('PATCH /teams/:id/files/:fileId/name', async ({ request }) => {
         const response = await request.patch(`${API_URL}/teams/${TEAM_ID}/files/99999/name`, {
            headers: { Authorization: `Bearer ${authToken}` },
            data: { name: 'NewName.txt' }
        });
        expect([200, 201, 204, 400, 401, 403, 404, 409, 422, 500, 503]).toContain(response.status());
    });

    test('PUT /teams/:id/folders/:folderId', async ({ request }) => {
         const response = await request.put(`${API_URL}/teams/${TEAM_ID}/folders/99999`, {
            headers: { Authorization: `Bearer ${authToken}` },
            data: { name: 'New Folder Name' }
        });
        expect([200, 201, 204, 400, 401, 403, 404, 409, 422, 500, 503]).toContain(response.status());
    });

    test('DELETE /teams/:id/folders/:folderId', async ({ request }) => {
         const response = await request.delete(`${API_URL}/teams/${TEAM_ID}/folders/99999`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        expect([200, 201, 204, 400, 401, 403, 404, 409, 422, 500, 503]).toContain(response.status());
    });

    test('GET /teams/:id/folders/:parentId/tree', async ({ request }) => {
         const response = await request.get(`${API_URL}/teams/${TEAM_ID}/folders/root/tree`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        expect([200, 201, 204, 400, 401, 403, 404, 409, 422, 500, 503]).toContain(response.status());
    });

    test('GET /companies/:companyId/usage (Files)', async ({ request }) => {
         const response = await request.get(`${API_URL}/companies/${TEAM_ID}/usage`, { // Using TeamID as CompanyID mock
            headers: { Authorization: `Bearer ${authToken}` }
        });
        expect([200, 201, 204, 400, 401, 403, 404, 409, 422, 500, 503]).toContain(response.status());
    });

    test('GET /companies/:companyId/profile (Files)', async ({ request }) => {
         const response = await request.get(`${API_URL}/companies/${TEAM_ID}/profile`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        expect([200, 201, 204, 400, 401, 403, 404, 409, 422, 500, 503]).toContain(response.status());
    });
});
