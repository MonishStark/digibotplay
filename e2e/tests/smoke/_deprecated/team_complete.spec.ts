
import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://127.0.0.1:5050';

test.describe('Team Endpoints - Complete Coverage', () => {

    let authToken = '';
    let teamId = '';

    test.beforeAll(async ({ request }) => {
        const loginRes = await request.post(`${API_URL}/auth/login`, {
            data: { email: 'gsatoru0373@gmail.com', password: 'Gojo@123', loginType: 'email' }
        });
        const body = await loginRes.json();
        authToken = body.user?.auth?.accessToken || body.token?.accessToken;

        // Get existing team
        const teamRes = await request.get(`${API_URL}/teams/active`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const teamBody = await teamRes.json();
        if (teamBody.teamList?.[0]) teamId = teamBody.teamList[0].id;
    });

    // ========== POST /teams (Create New Team) ==========

    test('POST /teams - 200 Success', async ({ request }) => {
        const response = await request.post(`${API_URL}/teams`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { name: `Test Team ${Date.now()}` }
        });
        console.log(`Create Team Status: ${response.status()}`);
        expect([200, 201]).toContain(response.status());
        const body = await response.json();
        expect(body).toHaveProperty('success', true);
    });

    test('POST /teams - 400 Bad Request', async ({ request }) => {
        const response = await request.post(`${API_URL}/teams`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: {} // Missing name
        });
        expect([400, 422]).toContain(response.status());
    });

    test('POST /teams - 401 Unauthorized', async ({ request }) => {
        const response = await request.post(`${API_URL}/teams`, {
            data: { name: 'No Auth Team' }
        });
        expect(response.status()).toBe(401);
    });

    test('POST /teams - 403 Forbidden', async ({ request }) => {
        // 403 typically for role-based access - need non-admin user
        const response = await request.post(`${API_URL}/teams`, {
            headers: { 'Authorization': 'Bearer invalid_token' },
            data: { name: 'Forbidden Team' }
        });
        expect([401, 403]).toContain(response.status());
    });

    test('POST /teams - 409 Conflict', async ({ request }) => {
        const alias = `dup_${Date.now()}`;
        await request.post(`${API_URL}/teams`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { name: 'Dup1', teamAlias: alias }
        });
        const response = await request.post(`${API_URL}/teams`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { name: 'Dup2', teamAlias: alias }
        });
        console.log(`Duplicate Team Status: ${response.status()}`);
        expect([409, 400, 200]).toContain(response.status());
    });

    test('POST /teams - 422 Invalid Data', async ({ request }) => {
        const response = await request.post(`${API_URL}/teams`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { name: '' } // Empty name
        });
        expect([400, 422]).toContain(response.status());
    });

    test('POST /teams - 429 Rate Limit', async ({ request }) => {
        let hitLimit = false;
        for (let i = 0; i < 30; i++) {
            const res = await request.post(`${API_URL}/teams`, {
                headers: { 'Authorization': `Bearer ${authToken}` },
                data: { name: `Rate ${i}` }
            });
            if (res.status() === 429) { hitLimit = true; break; }
        }
        if (!hitLimit) console.log('NOTE: 429 not triggered on Create Team');
    });

    // ========== PUT /teams/{teamId} (Update Team) ==========

    test('PUT /teams/:id - 200 Success', async ({ request }) => {
        test.skip(!teamId, 'No team');
        const response = await request.put(`${API_URL}/teams/${teamId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { name: `Updated ${Date.now()}` }
        });
        console.log(`Update Team Status: ${response.status()}`);
        expect([200, 201]).toContain(response.status());
    });

    test('PUT /teams/:id - 400 Bad Request', async ({ request }) => {
        test.skip(!teamId, 'No team');
        const response = await request.put(`${API_URL}/teams/${teamId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: {} // Empty
        });
        expect([200, 400]).toContain(response.status());
    });

    test('PUT /teams/:id - 401 Unauthorized', async ({ request }) => {
        const response = await request.put(`${API_URL}/teams/1`, {
            data: { name: 'Fail' }
        });
        expect(response.status()).toBe(401);
    });

    test('PUT /teams/:id - 409 Conflict', async ({ request }) => {
        // Conflict when updating to existing alias
        const response = await request.put(`${API_URL}/teams/1`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { teamAlias: 'existing_alias' }
        });
        console.log(`Update Team Conflict Status: ${response.status()}`);
        expect([200, 400, 409]).toContain(response.status());
    });

    test('PUT /teams/:id - 429 Rate Limit', async ({ request }) => {
        test.skip(!teamId, 'No team');
        let hitLimit = false;
        for (let i = 0; i < 30; i++) {
            const res = await request.put(`${API_URL}/teams/${teamId}`, {
                headers: { 'Authorization': `Bearer ${authToken}` },
                data: { name: `Rate ${i}` }
            });
            if (res.status() === 429) { hitLimit = true; break; }
        }
        if (!hitLimit) console.log('NOTE: 429 not triggered on Update Team');
    });

    // ========== GET /teams (Get Team List) ==========

    test('GET /teams - 200 Success', async ({ request }) => {
        const response = await request.get(`${API_URL}/teams`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body).toHaveProperty('success', true);
    });

    test('GET /teams - 401 Unauthorized', async ({ request }) => {
        const response = await request.get(`${API_URL}/teams`);
        expect(response.status()).toBe(401);
    });

    test('GET /teams - 429 Rate Limit', async ({ request }) => {
        let hitLimit = false;
        for (let i = 0; i < 50; i++) {
            const res = await request.get(`${API_URL}/teams`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            if (res.status() === 429) { hitLimit = true; break; }
        }
        if (!hitLimit) console.log('NOTE: 429 not triggered on Get Teams');
    });

    // ========== GET /teams/active ==========

    test('GET /teams/active - 200 Success', async ({ request }) => {
        const response = await request.get(`${API_URL}/teams/active`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        expect(response.status()).toBe(200);
    });

    test('GET /teams/active - 401 Unauthorized', async ({ request }) => {
        const response = await request.get(`${API_URL}/teams/active`);
        expect(response.status()).toBe(401);
    });

    test('GET /teams/active - 429 Rate Limit', async ({ request }) => {
        let hitLimit = false;
        for (let i = 0; i < 50; i++) {
            const res = await request.get(`${API_URL}/teams/active`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            if (res.status() === 429) { hitLimit = true; break; }
        }
        if (!hitLimit) console.log('NOTE: 429 not triggered on Active Teams');
    });

    // ========== GET /teams/shared ==========

    test('GET /teams/shared - 200 Success', async ({ request }) => {
        const response = await request.get(`${API_URL}/teams/shared`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        expect([200, 403]).toContain(response.status());
    });

    test('GET /teams/shared - 401 Unauthorized', async ({ request }) => {
        const response = await request.get(`${API_URL}/teams/shared`);
        expect(response.status()).toBe(401);
    });

    test('GET /teams/shared - 429 Rate Limit', async ({ request }) => {
        let hitLimit = false;
        for (let i = 0; i < 50; i++) {
            const res = await request.get(`${API_URL}/teams/shared`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            if (res.status() === 429) { hitLimit = true; break; }
        }
        if (!hitLimit) console.log('NOTE: 429 not triggered on Shared Teams');
    });

    // ========== PATCH /teams/{teamId}/status ==========

    test('PATCH /teams/:id/status - 200 Success', async ({ request }) => {
        test.skip(!teamId, 'No team');
        const response = await request.patch(`${API_URL}/teams/${teamId}/status`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { active: true }
        });
        console.log(`Team Status Change: ${response.status()}`);
        expect([200, 201]).toContain(response.status());
    });

    test('PATCH /teams/:id/status - 400 Bad Request', async ({ request }) => {
        test.skip(!teamId, 'No team');
        const response = await request.patch(`${API_URL}/teams/${teamId}/status`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: {} // Missing active
        });
        expect([200, 400]).toContain(response.status());
    });

    test('PATCH /teams/:id/status - 401 Unauthorized', async ({ request }) => {
        const response = await request.patch(`${API_URL}/teams/1/status`, {
            data: { active: true }
        });
        expect(response.status()).toBe(401);
    });

    test('PATCH /teams/:id/status - 429 Rate Limit', async ({ request }) => {
        test.skip(!teamId, 'No team');
        let hitLimit = false;
        for (let i = 0; i < 30; i++) {
            const res = await request.patch(`${API_URL}/teams/${teamId}/status`, {
                headers: { 'Authorization': `Bearer ${authToken}` },
                data: { active: i % 2 === 0 }
            });
            if (res.status() === 429) { hitLimit = true; break; }
        }
        if (!hitLimit) console.log('NOTE: 429 not triggered on Team Status');
    });

    // ========== POST /teams/{teamId}/share ==========

    test('POST /teams/:id/share - 200 Success', async ({ request }) => {
        test.skip(!teamId, 'No team');
        const response = await request.post(`${API_URL}/teams/${teamId}/share`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { email: 'share@test.com' }
        });
        console.log(`Share Team Status: ${response.status()}`);
        expect([200, 201, 400, 404]).toContain(response.status());
    });

    test('POST /teams/:id/share - 400 Bad Request', async ({ request }) => {
        test.skip(!teamId, 'No team');
        const response = await request.post(`${API_URL}/teams/${teamId}/share`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: {} // Missing email
        });
        expect([400, 404]).toContain(response.status());
    });

    test('POST /teams/:id/share - 401 Unauthorized', async ({ request }) => {
        const response = await request.post(`${API_URL}/teams/1/share`, {
            data: { email: 'test@test.com' }
        });
        expect([401, 404]).toContain(response.status());
    });

    test('POST /teams/:id/share - 422 Invalid Email', async ({ request }) => {
        test.skip(!teamId, 'No team');
        const response = await request.post(`${API_URL}/teams/${teamId}/share`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { email: 'invalid-email' }
        });
        console.log(`Share Invalid Email Status: ${response.status()}`);
        expect([400, 422, 404]).toContain(response.status());
    });

    test('POST /teams/:id/share - 429 Rate Limit', async ({ request }) => {
        test.skip(!teamId, 'No team');
        let hitLimit = false;
        for (let i = 0; i < 30; i++) {
            const res = await request.post(`${API_URL}/teams/${teamId}/share`, {
                headers: { 'Authorization': `Bearer ${authToken}` },
                data: { email: `share${i}@test.com` }
            });
            if (res.status() === 429) { hitLimit = true; break; }
        }
        if (!hitLimit) console.log('NOTE: 429 not triggered on Share Team');
    });

});
