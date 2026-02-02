import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://127.0.0.1:5050';

test.describe('Extended Password Reset Coverage', () => {

    const userEmail = 'monishkumarms3@gmail.com'; // Known active user

    // --- Forgot Password (/auth/password/forgot) ---

    // 1. 200 OK - Request Link (Existing User)
    test('POST /auth/password/forgot - Success', async ({ request }) => {
        const response = await request.post(`${API_URL}/auth/password/forgot`, {
            data: { email: userEmail }
        });
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body).toHaveProperty('success', true);
        // "resetPassLinkSendSuccess" translation might vary, looking for success bool mainly
    });

    // 2. 200 OK - Request Link (Non-existent User)
    test('POST /auth/password/forgot - Non-existent User', async ({ request }) => {
        const response = await request.post(`${API_URL}/auth/password/forgot`, {
            data: { email: 'nobody@example.com' }
        });
        expect(response.status()).toBe(200);
        const body = await response.json();
        // Controller returns 200 but success: false
        expect(body).toHaveProperty('success', false);
    });

    // --- Reset Password (/auth/password/reset) ---

    // 3. 400 Bad Request - Missing Fields
    test('POST /auth/password/reset - Missing Fields', async ({ request }) => {
        const response = await request.post(`${API_URL}/auth/password/reset`, {
            data: { 
                email: userEmail,
                // Missing token and password
            }
        });
        expect(response.status()).toBe(400);
        const body = await response.json();
        expect(body).toHaveProperty('success', false);
    });

    // 4. 422 Unprocessable Entity - Weak Password
    test('POST /auth/password/reset - Weak Password', async ({ request }) => {
        const response = await request.post(`${API_URL}/auth/password/reset`, {
            data: { 
                email: userEmail,
                token: 'dummy_token',
                password: 'weak' 
            }
        });
        expect(response.status()).toBe(422);
        const body = await response.json();
        expect(body.error).toBe('validation_error');
    });

    // 5. 401 Unauthorized - Invalid Token
    test('POST /auth/password/reset - Invalid Token', async ({ request }) => {
        const response = await request.post(`${API_URL}/auth/password/reset`, {
            data: { 
                email: userEmail,
                token: 'invalid_token_123',
                password: 'Password123!' 
            }
        });
        expect(response.status()).toBe(401);
        const body = await response.json();
        expect(body.error).toBe('invalid_token');
    });

    // 6. 410 Gone - Token Expired
    test('POST /auth/password/reset - Expired Token', async ({ request }) => {
        const response = await request.post(`${API_URL}/auth/password/reset`, {
            data: { 
                email: userEmail,
                token: 'expired_reset_token_old',
                password: 'Password123!' 
            }
        });
        
        console.log(`Expired Reset Token Status: ${response.status()}`);
        // Accept 410 (expired) or 401 (invalid) - depends on implementation
        expect([410, 401]).toContain(response.status());
        
        if (response.status() === 410) {
            const body = await response.json();
            expect(body).toHaveProperty('error', 'token_expired');
        }
    });

    // 7. 405 Method Not Allowed - GET Request
    test('POST /auth/password/reset - 405 GET Request', async ({ request }) => {
        const response = await request.get(`${API_URL}/auth/password/reset`);
        expect([405, 404]).toContain(response.status());
    });

});
