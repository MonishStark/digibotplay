
import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://127.0.0.1:5050';

test.describe('Extended Forgot Password Coverage: POST /auth/password/forgot', () => {

    let validEmail = '';

    test.beforeAll(async ({ request }) => {
        const uniqueId = Date.now();
        validEmail = `forgot_pw_${uniqueId}@example.com`;
        
        await request.post(`${API_URL}/auth/register`, {
            data: {
                firstname: 'Forgot',
                lastname: 'Password',
                email: validEmail,
                password: 'Password123!',
                mobileCountryCode: '+1',
                mobileNumber: '1234567890',
                accountType: 'solo',
                signUpMethod: 'email',
                currency: 'USD'
            }
        });
    });

    // 1. 200 OK - Valid Email
    test('200 OK - Valid Email', async ({ request }) => {
        const response = await request.post(`${API_URL}/auth/password/forgot`, {
            data: { email: validEmail }
        });
        console.log(`Forgot Password Status: ${response.status()}`);
        const body = await response.json();
        console.log(`Forgot Password Body: ${JSON.stringify(body)}`);
        
        expect(response.status()).toBe(200);
        expect(body.success).toBe(true);
    });

    // 2. 404 Not Found - Invalid Email
    test('404 Not Found - Invalid Email (Hypothetical)', async ({ request }) => {
        const response = await request.post(`${API_URL}/auth/password/forgot`, {
            data: { email: "nonexistent@example.com" }
        });
        expect(response.status()).toBe(404);
    });

    // 3. 400 Bad Request - Missing Parameter
    test('400 Bad Request - Missing Email', async ({ request }) => {
        const response = await request.post(`${API_URL}/auth/password/forgot`, {
            data: {}
        });
        expect(response.status()).toBe(400);
    });

    // 4. 405 Method Not Allowed - GET Request
    test('405 Method Not Allowed - GET Request', async ({ request }) => {
        const response = await request.get(`${API_URL}/auth/password/forgot`);
        expect([405, 404]).toContain(response.status());
    });

});
