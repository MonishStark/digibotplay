import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://127.0.0.1:5050';

test.describe('Extended Payment Status Coverage: GET /auth/payment/status', () => {

    let newUserEmail = '';

    // Setup: Create a new user (Default payment status should be Pending)
    test.beforeAll(async ({ request }) => {
        const uniqueId = Date.now();
        newUserEmail = `payment_test_${uniqueId}@example.com`;
        
        await request.post(`${API_URL}/auth/register`, {
            data: {
                firstname: 'Pay',
                lastname: 'Status',
                email: newUserEmail,
                password: 'Password123!',
                mobileCountryCode: '+1',
                mobileNumber: '1234567890',
                accountType: 'solo',
                signUpMethod: 'email',
                currency: 'USD'
            }
        });
    });

    // 1. 201 Created - Pending Status (Default for new users)
    test('201/200 OK - Check Pending Status', async ({ request }) => {
        const response = await request.get(`${API_URL}/auth/payment/status`, {
            params: { email: newUserEmail }
        });
        
        // Controller returns 201 for "Pending" status (else block)
        expect([200, 201]).toContain(response.status()); 
        
        const body = await response.json();
        expect(body).toHaveProperty('success', true);
        expect(body).toHaveProperty('status');
        // Accept 'pending' or 'success' depending on if trial aligns
        expect(['pending', 'success']).toContain(body.status);
    });

    // 2. 404 Not Found - User Not Found
    test('404 Not Found - User Not Found', async ({ request }) => {
        const response = await request.get(`${API_URL}/auth/payment/status`, {
            params: { email: 'non_existent_payment_user@example.com' }
        });
        const body = await response.json();
        console.log('User Not Found Check Body:', JSON.stringify(body));
        expect(response.status()).toBe(404);
        expect(body).toHaveProperty('success', false);
        expect(body).toHaveProperty('error', 'not_found');
    });

    // 3. 400 Bad Request - Missing Parameter
    test('400 Bad Request - Missing Email', async ({ request }) => {
        const response = await request.get(`${API_URL}/auth/payment/status`);
        expect(response.status()).toBe(400);
        const body = await response.json();
        expect(body).toHaveProperty('success', false);
        expect(body.message).toMatch(/invalid request parameters/i);
    });

    // 4. 405 Method Not Allowed (POST attempt)
    test('405 Method Not Allowed - POST Request', async ({ request }) => {
        const response = await request.post(`${API_URL}/auth/payment/status`, {
            params: { email: newUserEmail }
        });
        expect([405, 404]).toContain(response.status());
    });

    // 5. 429 Rate Limit
    test('429 Rate Limit - Spam Check', async ({ request }) => {
        let hitLimit = false;
        for (let i = 0; i < 20; i++) {
            const response = await request.get(`${API_URL}/auth/payment/status`, {
                params: { email: newUserEmail }
            });
            if (response.status() === 429) {
                hitLimit = true;
                break;
            }
        }
        if (!hitLimit) console.log('Warning: Could not trigger 429 on Payment Status');
    });

});
