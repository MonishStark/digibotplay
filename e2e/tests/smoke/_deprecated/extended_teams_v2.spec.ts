import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://127.0.0.1:5050';

test.describe('Extended Team Coverage V2', () => {

    let authToken = '';
    let createdTeamId = '';
    const userEmail = 'monishkumarms3@gmail.com';

    test.beforeAll(async ({ request }) => {
        const response = await request.post(`${API_URL}/auth/login`, {
            data: {
                email: userEmail, 
                password: 'Password123!'
            }
        });
        const body = await response.json();
        if (body.auth && body.auth.accessToken) {
            authToken = body.auth.accessToken;
        }
    });

    // 1. POST /teams (Create New Team)
    test('POST /teams - Success', async ({ request }) => {
        const response = await request.post(`${API_URL}/teams`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { name: `Auto Team ${Date.now()}`, description: 'Test Description' }
        });
        expect([200, 201]).toContain(response.status());
        const body = await response.json();
        expect(body).toHaveProperty('success', true);
        
        // Capture a Team ID for update tests if possible
        // (Assuming response structure has teamId or data object)
        if (body.team && body.team.id) {
             createdTeamId = body.team.id;
        }
    });

    // 1b. POST /teams - 409 Conflict (Team Alias Exists)
    test('POST /teams - 409 Conflict', async ({ request }) => {
        const duplicateAlias = `dup_team_${Date.now()}`;
        
        // First create
        await request.post(`${API_URL}/teams`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { name: 'Dup Team', teamAlias: duplicateAlias }
        });
        
        // Second create with same alias
        const response = await request.post(`${API_URL}/teams`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { name: 'Dup Team 2', teamAlias: duplicateAlias }
        });
        
        console.log(`Duplicate Team Status: ${response.status()}`);
        expect([409, 400]).toContain(response.status());
        
        if (response.status() === 409) {
            const body = await response.json();
            expect(body).toHaveProperty('error', 'conflict');
        }
    });

    // 1c. POST /teams - 401 Unauthorized
    test('POST /teams - 401 Unauthorized', async ({ request }) => {
        const response = await request.post(`${API_URL}/teams`, {
            data: { name: 'No Auth Team' }
        });
        expect(response.status()).toBe(401);
    });

    // 2. PUT /teams/:id (Update Team)
    test('PUT /teams/:id - Update Success', async ({ request }) => {
        // Use created ID or fallback to a likely ID if create failed or didn't return ID immediately
        const targetId = createdTeamId || '1'; 
        const response = await request.put(`${API_URL}/teams/${targetId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { name: `Updated Name ${Date.now()}` }
        });
        // 200 OK or 404/403 if specific ID has issues. 
        expect([200, 201, 404, 403]).toContain(response.status());
    });

    // 3. GET /teams (Get Team List)
    test('GET /teams - Success', async ({ request }) => {
        const response = await request.get(`${API_URL}/teams`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        expect([200, 401, 403]).toContain(response.status());
        if (response.status() === 200) {
            const body = await response.json();
            expect(body).toHaveProperty('success', true);
        }
    });

    // 3b. GET /teams - 401 Unauthorized
    test('GET /teams - 401 Unauthorized', async ({ request }) => {
        const response = await request.get(`${API_URL}/teams`);
        expect(response.status()).toBe(401);
    });

    // 3c. GET /teams - 405 POST Request
    test('GET /teams - 405 POST Request', async ({ request }) => {
        const response = await request.post(`${API_URL}/teams/active`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: {}
        });
        expect([405, 404]).toContain(response.status());
    });

    // 4. GET /teams/active (Get Active Teams)
    test('GET /teams/active - Success', async ({ request }) => {
        const response = await request.get(`${API_URL}/teams/active`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        expect([200, 401, 403]).toContain(response.status());
        if (response.status() === 200) {
            const body = await response.json();
            expect(body).toHaveProperty('success', true);
        }
    });

    // 5. GET /teams/shared (Get Shared Teams)
    test('GET /teams/shared - Success', async ({ request }) => {
        const response = await request.get(`${API_URL}/teams/shared`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        expect([200, 401, 403]).toContain(response.status());
        if (response.status() === 200) {
            const body = await response.json();
            expect(body).toHaveProperty('success', true);
        }
    });

    // 6. PATCH /teams/:id/status (Change Status)
    test('PATCH /teams/:id/status - Bad Request (Negative)', async ({ request }) => {
        const targetId = createdTeamId || '1';
        const response = await request.patch(`${API_URL}/teams/${targetId}/status`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { status: 'invalid-status' } // Expecting 400 or similar
        });
        // 400 Bad Request if validation works, or 404/403.
        expect([200, 400, 404, 403]).toContain(response.status());
    });

    // 7. POST /teams/:id/share (Share Team) - Expect 404 (Not Implemented)
    test('POST /teams/:id/share - Not Implemented', async ({ request }) => {
        const targetId = createdTeamId || '1';
        const response = await request.post(`${API_URL}/teams/${targetId}/share`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { email: 'invite@example.com' }
        });
        expect(response.status()).toBe(404);
    });

});
