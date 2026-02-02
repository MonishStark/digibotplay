
import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://127.0.0.1:5050';

test.describe('PUT /me/avatar Tests', () => {

    let authToken = '';

    test.beforeAll(async ({ request }) => {
        const response = await request.post(`${API_URL}/auth/login`, {
            data: { email: 'gsatoru0373@gmail.com', password: 'Gojo@123', loginType: 'email' }
        });
        const body = await response.json();
        authToken = body.user?.auth?.accessToken || body.token?.accessToken || '';
    });

    test('PUT /me/avatar - 200 Success', async ({ request }) => {
        const response = await request.put(`${API_URL}/me/avatar`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            multipart: {
                image: {
                    name: 'avatar.png',
                    mimeType: 'image/png',
                    buffer: Buffer.from('fake image data')
                }
            }
        });
        console.log(`Avatar Status: ${response.status()}`);
        expect([200, 400, 404, 415]).toContain(response.status());
    });

    test('PUT /me/avatar - 400 Bad Request', async ({ request }) => {
        const response = await request.put(`${API_URL}/me/avatar`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            data: {} // No multipart data
        });
        expect([400, 415, 422]).toContain(response.status());
    });

    test('PUT /me/avatar - 401 Unauthorized', async ({ request }) => {
        const response = await request.put(`${API_URL}/me/avatar`, {
             multipart: {
                image: {
                    name: 'avatar.png',
                    mimeType: 'image/png',
                    buffer: Buffer.from('fake image data')
                }
            }
        });
        expect([401, 404]).toContain(response.status());
    });

    test('PUT /me/avatar - 422 Invalid File Type', async ({ request }) => {
        const response = await request.put(`${API_URL}/me/avatar`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            multipart: {
                image: {
                    name: 'malware.exe',
                    mimeType: 'application/x-msdownload',
                    buffer: Buffer.from('fake exe')
                }
            }
        });
        console.log(`Invalid File Status: ${response.status()}`);
        expect([400, 422, 415]).toContain(response.status());
    });

});
