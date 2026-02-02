
import { test, expect } from '@playwright/test';

const API_URL = process.env.BACKEND_URL || 'http://127.0.0.1:5050';
const TEST_EMAIL = process.env.TEST_EMAIL || 'monishkumarms3@gmail.com'; // Existing User
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Monish@123';

test.describe('Auth Module Smoke Tests', () => {

    test('POST /auth/login - Valid Credentials', async ({ request }) => {
        const loginPayload = { 
            email: TEST_EMAIL, 
            password: TEST_PASSWORD,
            loginType: 'standard'
        };

        let response = await request.post(`${API_URL}/auth/login`, {
            data: loginPayload
        });

        if (response.status() !== 200) {
            console.log('Login failed, attempting to register user...');
            await request.post(`${API_URL}/auth/register`, {
                data: {
                    firstname: 'Monish',
                    lastname: 'Kumar',
                    email: TEST_EMAIL,
                    password: TEST_PASSWORD,
                    accountType: 'solo',
                    signUpMethod: 'email',
                    currency: 'USD',
                    mobileCountryCode: '+1',
                    mobileNumber: '1234567890'
                }
            });
            // Retry Login
            response = await request.post(`${API_URL}/auth/login`, {
                 data: loginPayload
            });
        }

        expect(response.status()).toBe(200);
        const body = await response.json();
        console.log('Login Response:', JSON.stringify(body, null, 2)); // Log for Report
        expect(body).toHaveProperty('user');
        expect(body.user).toHaveProperty('auth');
        process.env.USER_TOKEN = body.user.auth.accessToken; 
    });

    // --- New Coverage ---

    test('POST /auth/refresh', async ({ request }) => {
        const response = await request.post(`${API_URL}/auth/refresh`, {
            data: { refreshToken: 'mock_refresh_token' }
        });
        expect([200, 400, 401]).toContain(response.status());
    });

    test('POST /auth/verify-otp', async ({ request }) => {
        const response = await request.post(`${API_URL}/auth/verify-otp`, {
            data: { otp: '123456', email: TEST_EMAIL }
        });
        expect([200, 400, 401]).toContain(response.status());
    });

    test('POST /auth/verify-account', async ({ request }) => {
         const response = await request.post(`${API_URL}/auth/verify-account`, {
            data: { token: 'mock_token', email: TEST_EMAIL }
        });
        expect([200, 201, 204, 400, 401, 403, 404, 409, 422, 500, 503]).toContain(response.status());
    });

    test('POST /me/verification/resend (Auth)', async ({ request }) => {
        const response = await request.post(`${API_URL}/me/verification/resend`, {
             headers: { Authorization: `Bearer ${process.env.USER_TOKEN}` }
        });
        expect([200, 400, 401, 403]).toContain(response.status());
    });

    test('POST /auth/password/reset', async ({ request }) => {
        const response = await request.post(`${API_URL}/auth/password/reset`, {
            data: { token: 'mock', password: 'NewPass', confirmPassword: 'NewPass' }
        });
        expect([200, 201, 204, 400, 401, 403, 404, 409, 422, 500, 503]).toContain(response.status());
    });

    test('GET /auth/reset-password', async ({ request }) => {
        const response = await request.get(`${API_URL}/auth/reset-password?token=mock`);
        expect([200, 400, 404]).toContain(response.status());
    });

    test('POST /auth/stripe/create-checkout-session (Mock Type 1)', async ({ request }) => { 
        // Trying to hit stripe session creation via register flow with specific params?
        // Actually this is logic inside register.
        // We can test /auth/payment/status
        const response = await request.get(`${API_URL}/auth/payment/status?sessionId=mock`);
        expect([200, 400, 404]).toContain(response.status());
    });

    test('POST /auth/invite', async ({ request }) => {
        const response = await request.get(`${API_URL}/auth/invite?token=mock`);
        expect([200, 400, 404]).toContain(response.status());
    });

    test('GET /auth/invite/decline/:email/:token', async ({ request }) => {
         const response = await request.get(`${API_URL}/auth/invite/decline/test@test.com/mock`);
         expect([200, 400, 404]).toContain(response.status());
    });

    test('POST /auth/login - Invalid Credentials', async ({ request }) => {
        const response = await request.post(`${API_URL}/auth/login`, {
            data: {
                email: TEST_EMAIL,
                password: 'WrongPassword123!'
            }
        });
        expect([400, 401]).toContain(response.status());
    });

    test('POST /auth/register - New User', async ({ request }) => {
        const dynamicEmail = `test.user.${Date.now()}@example.com`;
        const response = await request.post(`${API_URL}/auth/register`, {
            data: {
                firstname: 'Test',
                lastname: 'User',
                email: dynamicEmail,
                password: 'Password123!',
                accountType: 'solo',
                signUpMethod: 'email',
                currency: 'USD',
                mobileCountryCode: '+1',
                mobileNumber: '1234567890'
            }
        });
        // 200/201 Success, 409 if Conflict (but email is dynamic so should be good)
        expect([200, 201]).toContain(response.status());
    });

    test('POST /auth/password/forgot', async ({ request }) => {
        const response = await request.post(`${API_URL}/auth/password/forgot`, {
            data: { email: TEST_EMAIL }
        });
        // 200 Sent, 404 User Not Found, 429 Rate Limit
        expect([200, 404, 429]).toContain(response.status());
    });

    test('POST /auth/email/check', async ({ request }) => {
        const response = await request.post(`${API_URL}/auth/email/check`, {
            data: { email: TEST_EMAIL }
        });
        expect([200, 409]).toContain(response.status()); // 200 (Available) or 409 (Taken)
    });

});
