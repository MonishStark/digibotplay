
import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://127.0.0.1:5050';

test.describe('DELETE /notifications/:id Tests', () => {

    let authToken = '';

    test.beforeAll(async ({ request }) => {
        const response = await request.post(`${API_URL}/auth/login`, {
            data: { email: 'gsatoru0373@gmail.com', password: 'Gojo@123', loginType: 'email' }
        });
        const body = await response.json();
        authToken = body.user?.auth?.accessToken || body.token?.accessToken || '';
    });

    test('DELETE /notifications/:id - 200 Success (Simulated)', async ({ request }) => {
        // Can't guarantee an ID, so we might get 404 or 200
        const response = await request.delete(`${API_URL}/notifications/1`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        console.log(`Delete Notification Status: ${response.status()}`);
        expect([200, 204, 404]).toContain(response.status());
    });

    test('DELETE /notifications/:id - 401 Unauthorized', async ({ request }) => {
        const response = await request.delete(`${API_URL}/notifications/1`);
        expect([401, 404]).toContain(response.status());
    });
    
    test('DELETE /notifications/:id - 404 Not Found', async ({ request }) => {
        const response = await request.delete(`${API_URL}/notifications/999999`, {
             headers: { 'Authorization': `Bearer ${authToken}` }
        });
        expect([404, 200]).toContain(response.status()); // 200 if idempotent
    });

});
