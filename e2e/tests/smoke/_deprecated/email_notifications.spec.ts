
import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://127.0.0.1:5050';

test.describe('Email Templates & Notifications Endpoints', () => {

    let authToken = '';

    test.beforeAll(async ({ request }) => {
        const loginRes = await request.post(`${API_URL}/auth/login`, {
            data: { email: 'gsatoru0373@gmail.com', password: 'Gojo@123', loginType: 'email' }
        });
        const loginBody = await loginRes.json();
        authToken = loginBody.user?.auth?.accessToken || loginBody.token?.accessToken;
    });

    // ========== EMAIL TEMPLATES (Super Admin) ==========
    
    test('GET /super-admin/email/templates - List Templates', async ({ request }) => {
        const response = await request.get(`${API_URL}/super-admin/email/templates`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        console.log(`Email Templates: ${response.status()}`);
        expect([200, 401, 403]).toContain(response.status());
        
        if (response.status() === 200) {
            const body = await response.json();
            expect(body).toHaveProperty('success', true);
        }
    });

    test('PATCH /super-admin/email/templates/:templateId - Update', async ({ request }) => {
        const response = await request.patch(`${API_URL}/super-admin/email/templates/1`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: { subject: 'Updated Subject' }
        });
        console.log(`Update Template: ${response.status()}`);
        expect([200, 400, 401, 403, 404]).toContain(response.status());
    });

    // ========== NOTIFICATIONS ==========

    test('GET /notifications - List Notifications', async ({ request }) => {
        const response = await request.get(`${API_URL}/notifications`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        console.log(`List Notifications: ${response.status()}`);
        expect([200, 401]).toContain(response.status());
        
        if (response.status() === 200) {
            const body = await response.json();
            expect(body).toHaveProperty('success', true);
        }
    });

    test('PATCH /notifications/viewed - Mark All Viewed', async ({ request }) => {
        const response = await request.patch(`${API_URL}/notifications/viewed`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        console.log(`Mark Viewed: ${response.status()}`);
        expect([200, 401]).toContain(response.status());
    });

    test('DELETE /notification/:id - Delete Notification', async ({ request }) => {
        const response = await request.delete(`${API_URL}/notification/999`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        console.log(`Delete Notification: ${response.status()}`);
        expect([200, 401, 404]).toContain(response.status());
    });

    // ========== 401 Unauthorized Tests ==========

    test('GET /notifications - 401 No Token', async ({ request }) => {
        const response = await request.get(`${API_URL}/notifications`);
        expect(response.status()).toBe(401);
    });

    test('PATCH /notifications/viewed - 401 No Token', async ({ request }) => {
        const response = await request.patch(`${API_URL}/notifications/viewed`);
        expect(response.status()).toBe(401);
    });

});
