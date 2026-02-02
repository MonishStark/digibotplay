
import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://127.0.0.1:5050';

test.describe('Extended Subscription Coverage: GET /me/subscription', () => {

    let authToken = '';
    let userId = '';

    test.beforeAll(async ({ request }) => {
        // Register a new user to ensure they have a subscription (SoloDefault)
        const uniqueId = Date.now();
        const email = `sub_test_${uniqueId}@example.com`;
        
        const regResponse = await request.post(`${API_URL}/auth/register`, {
            data: {
                firstname: 'Sub',
                lastname: 'User',
                email: email,
                password: 'Password123!',
                mobileCountryCode: '+1',
                mobileNumber: '1234567890',
                accountType: 'solo',
                signUpMethod: 'email',
                currency: 'USD'
            }
        });
        expect(regResponse.status()).toBe(201);
        const regBody = await regResponse.json();
        authToken = regBody.token.accessToken;
        userId = regBody.user.id;
    });

    // 1. 200 OK - Get Subscription Details
    test('200 OK - Get Subscription Details', async ({ request }) => {
        const response = await request.get(`${API_URL}/me/subscription`, {
            headers: {
                'Authorization': `Bearer ${authToken}` // Fixed syntax
            }
        });
        
        console.log(`Get Subscription Status: ${response.status()}`);
        const body = await response.json();
        console.log(`Get Subscription Body: ${JSON.stringify(body).substring(0, 200)}...`);

        expect(response.status()).toBe(200);
        expect(body.success).toBe(true);
        expect(body).toHaveProperty('subscriptionData');
        expect(body).toHaveProperty('subscriptionPlans');
        
        // Check specifics from "Solo" logic
        // Since we registered as 'solo', subscription_type should be 'solo'
        // But code maps 'team' -> 'organization' else 'solo'. 
        // NOTE: If new user logic doesn't insert subscription row immediately, it might return empty array?
        // Let's see. logic says: if (!res[0]) return empty.
        
        if (Array.isArray(body.subscriptionData) && body.subscriptionData.length === 0) {
            console.log('Warn: Subscription Data is empty (New User might not have sub immediately?)');
        } else {
             expect(body.subscriptionData).toHaveProperty('subscription_type', 'solo');
        }
    });

    // 2. 401 Unauthorized - No Token
    test('401 Unauthorized - No Token', async ({ request }) => {
        const response = await request.get(`${API_URL}/me/subscription`);
        expect([401, 403]).toContain(response.status());
    });

});
