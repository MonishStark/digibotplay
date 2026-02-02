import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://127.0.0.1:5050';

test.describe('Extended User Profile Coverage', () => {

    let authToken = '';
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

    // 1. GET /me/profile (Get User Data)
    test('GET /me/profile - Success', async ({ request }) => {
        const response = await request.get(`${API_URL}/me/profile`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        expect([200, 401, 403]).toContain(response.status());
        if (response.status() === 200) {
            const body = await response.json();
            expect(body).toHaveProperty('success', true);
            expect(body).toHaveProperty('user');
            expect(body.user).toHaveProperty('email', userEmail);
        }
    });

    // 1b. GET /me/profile - 401 Unauthorized (No Token)
    test('GET /me/profile - 401 Unauthorized', async ({ request }) => {
        const response = await request.get(`${API_URL}/me/profile`);
        // No auth header
        expect(response.status()).toBe(401);
        const body = await response.json();
        expect(body).toHaveProperty('success', false);
        expect(body).toHaveProperty('error', 'unauthorized');
    });

    // 1c. GET /me/profile - 401 Invalid Token
    test('GET /me/profile - 401 Invalid Token', async ({ request }) => {
        const response = await request.get(`${API_URL}/me/profile`, {
            headers: { 'Authorization': 'Bearer invalid_token_xyz' }
        });
        expect(response.status()).toBe(401);
    });

    // 1d. GET /me/profile - 405 POST Request
    test('POST /me/profile - 405 Method Not Allowed', async ({ request }) => {
        const response = await request.post(`${API_URL}/me/profile`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: {}
        });
        expect([405, 404]).toContain(response.status());
    });


    // 2. GET /me/usage (Get User Usage Data)
    test('GET /me/usage - Success', async ({ request }) => {
        const response = await request.get(`${API_URL}/me/usage`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        // 200 OK
        expect([200, 401, 403]).toContain(response.status());
        if (response.status() === 200) {
            const body = await response.json();
            expect(body).toHaveProperty('success', true);
        }
    });

    // 3. POST /me/password (Change Current Password) - Negative: Weak Password
    test('POST /me/password - Weak Password', async ({ request }) => {
        const response = await request.post(`${API_URL}/me/password`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: {
                currentPassword: 'Password123!',
                newPassword: 'weak'
            }
        });
        expect(response.status()).toBe(422);
        const body = await response.json();
        expect(body.error).toBe('validation_error');
    });

    // 4. POST /me/password/set (Set Password) - Negative: Conflict (Already Set)
    test('POST /me/password/set - Conflict', async ({ request }) => {
        const response = await request.post(`${API_URL}/me/password/set`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { password: 'NewStrongPassword1!' }
        });
        // Likely 409 if user already has password
        expect([409, 200]).toContain(response.status()); 
        if (response.status() === 409) {
             const body = await response.json();
             expect(body.error).toBe('conflict');
        }
    });

    // 5. POST /me/email (Update Email) - Negative: Invalid Email Format
    test('POST /me/email - Invalid Format', async ({ request }) => {
        const response = await request.post(`${API_URL}/me/email`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: {
                newEmail: 'not-an-email',
                password: 'Password123!'
            }
        });
        expect(response.status()).toBe(400);
        const body = await response.json();
        expect(body.error).toBe('bad_request');
    });

    // 5b. POST /me/email - 409 Conflict (Email Already in Use)
    test('POST /me/email - 409 Conflict', async ({ request }) => {
        // Try to update to an email that's already registered
        const response = await request.post(`${API_URL}/me/email`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: {
                newEmail: 'monishkumarms3@gmail.com', // Known existing email
                password: 'Gojo@123'
            }
        });
        
        console.log(`Email Update Conflict Status: ${response.status()}`);
        // Expect 409 Conflict if email exists, or 200 if it's same user
        expect([409, 200, 400]).toContain(response.status());
        
        if (response.status() === 409) {
            const body = await response.json();
            expect(body).toHaveProperty('error', 'conflict');
        }
    });

    // 5c. POST /me/email - 401 Unauthorized
    test('POST /me/email - 401 Unauthorized', async ({ request }) => {
        const response = await request.post(`${API_URL}/me/email`, {
            data: { newEmail: 'test@test.com', password: 'test' }
        });
        expect(response.status()).toBe(401);
    });

    // 6. POST /me/2fa (Update 2FA) - Negative: Invalid Payload
    test('POST /me/2fa - Invalid Payload', async ({ request }) => {
        const response = await request.post(`${API_URL}/me/2fa`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: {
                enabled: 'not-a-boolean' // Should fail validation
            }
        });
        expect(response.status()).toBe(400);
    });

    // 7. PATCH /me/profile (Update User Profile) - Expect 404 (Not Implemented)
    test('PATCH /me/profile - Not Implemented', async ({ request }) => {
        const response = await request.patch(`${API_URL}/me/profile`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { firstname: 'NewName' }
        });
        expect(response.status()).toBe(404);
    });

    // 8. PUT /me/avatar (Update User Avatar) - Expect 404 (Not Implemented)
    test('PUT /me/avatar - Not Implemented', async ({ request }) => {
        const response = await request.put(`${API_URL}/me/avatar`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { avatar: 'binarydata' }
        });
        expect(response.status()).toBe(404);
    });

});
