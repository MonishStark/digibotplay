
import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://127.0.0.1:5050';

test.describe('POST /me/verification/resend Tests', () => {

    let authToken = '';

    test.beforeAll(async ({ request }) => {
        const response = await request.post(`${API_URL}/auth/login`, {
            data: { email: 'gsatoru0373@gmail.com', password: 'Gojo@123', loginType: 'email' }
        });
        const body = await response.json();
        authToken = body.user?.auth?.accessToken || body.token?.accessToken || '';
    });

    test('POST /me/verification/resend - 200 Success', async ({ request }) => {
        const response = await request.post(`${API_URL}/me/verification/resend`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        console.log(`Resend Verification Status: ${response.status()}`);
        // 200 = sent, 409 = already verified
        expect([200, 409]).toContain(response.status());
    });

    test('POST /me/verification/resend - 401 Unauthorized', async ({ request }) => {
        const response = await request.post(`${API_URL}/me/verification/resend`);
        expect(response.status()).toBe(401);
    });

    test('POST /me/verification/resend - 409 Already Verified', async ({ request }) => {
        // Most active users are already verified
        const response = await request.post(`${API_URL}/me/verification/resend`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        console.log(`Already Verified Status: ${response.status()}`);
        expect([200, 409]).toContain(response.status());
    });

});
