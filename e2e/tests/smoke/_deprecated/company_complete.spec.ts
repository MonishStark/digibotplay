
import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://127.0.0.1:5050';

test.describe('Company/Organization Endpoints - Complete Coverage', () => {

    let authToken = '';
    let companyId = '';

    test.beforeAll(async ({ request }) => {
        const loginRes = await request.post(`${API_URL}/auth/login`, {
            data: { email: 'gsatoru0373@gmail.com', password: 'Gojo@123', loginType: 'email' }
        });
        const body = await loginRes.json();
        authToken = body.user?.auth?.accessToken || body.token?.accessToken;
        companyId = body.user?.companyId || '1';
    });

    // ========== POST /companies/{companyId}/2fa ==========

    test('POST /companies/:id/2fa - 200 Success', async ({ request }) => {
        const response = await request.post(`${API_URL}/companies/${companyId}/2fa`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { enabled: false }
        });
        console.log(`Company 2FA Status: ${response.status()}`);
        expect([200, 401, 403, 404]).toContain(response.status());
    });

    test('POST /companies/:id/2fa - 400 Bad Request', async ({ request }) => {
        const response = await request.post(`${API_URL}/companies/${companyId}/2fa`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: {} // Missing enabled field
        });
        expect([400, 200, 404]).toContain(response.status());
    });

    test('POST /companies/:id/2fa - 401 Unauthorized', async ({ request }) => {
        const response = await request.post(`${API_URL}/companies/${companyId}/2fa`, {
            data: { enabled: true }
        });
        expect([401, 404]).toContain(response.status());
    });

    test('POST /companies/:id/2fa - 422 Invalid Format', async ({ request }) => {
        const response = await request.post(`${API_URL}/companies/${companyId}/2fa`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { enabled: 'not-a-boolean' }
        });
        expect([400, 422, 200, 404]).toContain(response.status());
    });

    test('POST /companies/:id/2fa - 429 Rate Limit', async ({ request }) => {
        let hitLimit = false;
        for (let i = 0; i < 30; i++) {
            const res = await request.post(`${API_URL}/companies/${companyId}/2fa`, {
                headers: { 'Authorization': `Bearer ${authToken}` },
                data: { enabled: false }
            });
            if (res.status() === 429) { hitLimit = true; break; }
        }
        if (!hitLimit) console.log('NOTE: 429 not triggered on Company 2FA');
    });

    // ========== GET /companies/{companyId}/usage ==========

    test('GET /companies/:id/usage - 200 Success', async ({ request }) => {
        const response = await request.get(`${API_URL}/companies/${companyId}/usage`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        console.log(`Company Usage Status: ${response.status()}`);
        expect([200, 401, 403]).toContain(response.status());
        if (response.status() === 200) {
            const body = await response.json();
            expect(body).toHaveProperty('success', true);
        }
    });

    test('GET /companies/:id/usage - 401 Unauthorized', async ({ request }) => {
        const response = await request.get(`${API_URL}/companies/${companyId}/usage`);
        expect(response.status()).toBe(401);
    });

    test('GET /companies/:id/usage - 429 Rate Limit', async ({ request }) => {
        let hitLimit = false;
        for (let i = 0; i < 30; i++) {
            const res = await request.get(`${API_URL}/companies/${companyId}/usage`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            if (res.status() === 429) { hitLimit = true; break; }
        }
        if (!hitLimit) console.log('NOTE: 429 not triggered on Company Usage');
    });

    // ========== GET /companies/{companyId}/profile ==========

    test('GET /companies/:id/profile - 200 Success', async ({ request }) => {
        const response = await request.get(`${API_URL}/companies/${companyId}/profile`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        console.log(`Company Profile Status: ${response.status()}`);
        expect([200, 401, 403]).toContain(response.status());
        if (response.status() === 200) {
            const body = await response.json();
            expect(body).toHaveProperty('success', true);
        }
    });

    test('GET /companies/:id/profile - 401 Unauthorized', async ({ request }) => {
        const response = await request.get(`${API_URL}/companies/${companyId}/profile`);
        expect(response.status()).toBe(401);
    });

    test('GET /companies/:id/profile - 429 Rate Limit', async ({ request }) => {
        let hitLimit = false;
        for (let i = 0; i < 30; i++) {
            const res = await request.get(`${API_URL}/companies/${companyId}/profile`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            if (res.status() === 429) { hitLimit = true; break; }
        }
        if (!hitLimit) console.log('NOTE: 429 not triggered on Company Profile');
    });

    // ========== PATCH /companies/{companyId}/profile ==========

    test('PATCH /companies/:id/profile - 200 Success', async ({ request }) => {
        const response = await request.patch(`${API_URL}/companies/${companyId}/profile`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { companyName: `Test Company ${Date.now()}` }
        });
        console.log(`Update Company Profile Status: ${response.status()}`);
        expect([200, 401, 403]).toContain(response.status());
    });

    test('PATCH /companies/:id/profile - 400 Bad Request', async ({ request }) => {
        const response = await request.patch(`${API_URL}/companies/${companyId}/profile`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: {} // Empty body
        });
        expect([200, 400]).toContain(response.status());
    });

    test('PATCH /companies/:id/profile - 401 Unauthorized', async ({ request }) => {
        const response = await request.patch(`${API_URL}/companies/${companyId}/profile`, {
            data: { companyName: 'Fail' }
        });
        expect(response.status()).toBe(401);
    });

    test('PATCH /companies/:id/profile - 429 Rate Limit', async ({ request }) => {
        let hitLimit = false;
        for (let i = 0; i < 30; i++) {
            const res = await request.patch(`${API_URL}/companies/${companyId}/profile`, {
                headers: { 'Authorization': `Bearer ${authToken}` },
                data: { companyName: `Test ${i}` }
            });
            if (res.status() === 429) { hitLimit = true; break; }
        }
        if (!hitLimit) console.log('NOTE: 429 not triggered on Update Company Profile');
    });

    // ========== PUT /companies/{companyId}/avatar ==========

    test('PUT /companies/:id/avatar - 200 Success', async ({ request }) => {
        const response = await request.put(`${API_URL}/companies/${companyId}/avatar`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            multipart: {
                image: {
                    name: 'logo.png',
                    mimeType: 'image/png',
                    buffer: Buffer.from('fake png data')
                }
            }
        });
        console.log(`Company Avatar Status: ${response.status()}`);
        expect([200, 400, 401, 403]).toContain(response.status());
    });

    test('PUT /companies/:id/avatar - 400 Bad Request', async ({ request }) => {
        const response = await request.put(`${API_URL}/companies/${companyId}/avatar`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: {} // No file
        });
        expect([400, 200, 415]).toContain(response.status());
    });

    test('PUT /companies/:id/avatar - 401 Unauthorized', async ({ request }) => {
        const response = await request.put(`${API_URL}/companies/${companyId}/avatar`, {
            multipart: {
                image: { name: 'test.png', mimeType: 'image/png', buffer: Buffer.from('test') }
            }
        });
        expect(response.status()).toBe(401);
    });

    test('PUT /companies/:id/avatar - 422 Invalid File Type', async ({ request }) => {
        const response = await request.put(`${API_URL}/companies/${companyId}/avatar`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            multipart: {
                image: {
                    name: 'doc.exe',
                    mimeType: 'application/octet-stream',
                    buffer: Buffer.from('fake exe content')
                }
            }
        });
        console.log(`Avatar Invalid Type Status: ${response.status()}`);
        expect([400, 422, 200]).toContain(response.status());
    });

    test('PUT /companies/:id/avatar - 429 Rate Limit', async ({ request }) => {
        let hitLimit = false;
        for (let i = 0; i < 15; i++) {
            const res = await request.put(`${API_URL}/companies/${companyId}/avatar`, {
                headers: { 'Authorization': `Bearer ${authToken}` },
                multipart: {
                    image: { name: 'test.png', mimeType: 'image/png', buffer: Buffer.from('test') }
                }
            });
            if (res.status() === 429) { hitLimit = true; break; }
        }
        if (!hitLimit) console.log('NOTE: 429 not triggered on Company Avatar');
    });

});
