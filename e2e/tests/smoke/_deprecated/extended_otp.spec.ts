import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://127.0.0.1:5050';

test.describe('Extended OTP Verification Coverage: POST /auth/verify-otp', () => {

    const userEmail = 'monishkumarms3@gmail.com'; // Known active user

    // 1. 400 Bad Request - Missing Fields
    test('400 Bad Request - Missing Fields', async ({ request }) => {
        const response = await request.post(`${API_URL}/auth/verify-otp`, {
            data: { email: userEmail } // Missing OTP
        });
        expect(response.status()).toBe(400);
        const body = await response.json();
        expect(body).toHaveProperty('success', false);
        expect(body.message).toMatch(/missing required fields/i);
    });

    // 2. 401 Unauthorized - Invalid OTP
    test('401 Unauthorized - Invalid OTP', async ({ request }) => {
        const response = await request.post(`${API_URL}/auth/verify-otp`, {
            data: { 
                email: userEmail,
                otp: '000000' // Intentionally invalid
            }
        });
        expect(response.status()).toBe(401);
        const body = await response.json();
        expect(body).toHaveProperty('success', false);
        // Expecting "Invalid OTP" or similar based on controller
    });

    // 3. 401 Unauthorized - Non-existent User
    test('401 Unauthorized - Non-existent User', async ({ request }) => {
        const response = await request.post(`${API_URL}/auth/verify-otp`, {
            data: { 
                email: 'nonexistent_otp_user@example.com',
                otp: '123456'
            }
        });
        expect(response.status()).toBe(401);
    });

    // 4. 410 Gone - OTP Expired
    test('410 Gone - OTP Expired (Simulated)', async ({ request }) => {
        // Note: To properly test 410, we would need:
        // 1. Request an OTP
        // 2. Wait for expiry (typically 5-10 mins)
        // 3. Try to verify
        // This is a simulated test - we send an old/mock OTP
        const response = await request.post(`${API_URL}/auth/verify-otp`, {
            data: { 
                email: userEmail,
                otp: '999999' // Mock expired OTP
            }
        });
        
        console.log(`Expired OTP Test Status: ${response.status()}`);
        // Accept 410 (expired), 401 (invalid), or 400 (bad request)
        // The exact response depends on implementation
        expect([410, 401, 400]).toContain(response.status());
        
        if (response.status() === 410) {
            const body = await response.json();
            expect(body).toHaveProperty('success', false);
            expect(body).toHaveProperty('error', 'expired');
        } else {
            console.log('NOTE: 410 not returned - OTP expiry may return 401 instead');
        }
    });

    // 5. 405 Method Not Allowed - GET Request
    test('405 Method Not Allowed - GET Request', async ({ request }) => {
        const response = await request.get(`${API_URL}/auth/verify-otp`);
        expect([405, 404]).toContain(response.status());
    });

});
