import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://127.0.0.1:5050';

test.describe('Infrastructure Error Coverage: 503/504', () => {

    // 1. 503 Service Unavailable
    test('503 Service Unavailable - Global Handler', async ({ request }) => {
        const response = await request.get(`${API_URL}/debug/simulate-error?status=503`);
        expect(response.status()).toBe(503);
        const body = await response.json();
        
        // Spec Verification
        expect(body).toEqual({
            success: false,
            error: 'service_unavailable',
            message: 'Service unavailable, please try again later'
        });
    });

    // 2. 504 Gateway Timeout
    test('504 Gateway Timeout - Global Handler', async ({ request }) => {
        const response = await request.get(`${API_URL}/debug/simulate-error?status=504`);
        expect(response.status()).toBe(504);
        const body = await response.json();
        
        // Spec Verification
        expect(body).toEqual({
            success: false,
            error: 'gateway_timeout',
            message: 'Server did not respond in time'
        });
    });

    // 3. Fallback/Standard Error Check
    test('500 Internal Server Error - Global Handler', async ({ request }) => {
        const response = await request.get(`${API_URL}/debug/simulate-error?status=500`);
        expect(response.status()).toBe(500);
        const body = await response.json();
        expect(body).toHaveProperty('success', false);
        expect(body).toHaveProperty('error', 'internal_server_error');
    });

});
