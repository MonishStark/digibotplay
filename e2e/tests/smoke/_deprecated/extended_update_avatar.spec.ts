
import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const API_URL = process.env.API_URL || 'http://127.0.0.1:5050';

test.describe('Avatar Update: PUT /me/avatar', () => {

    let authToken = '';
    const userEmail = 'gsatoru0373@gmail.com';
    const password = 'Gojo@123';

    test.beforeAll(async ({ request }) => {
        const response = await request.post(`${API_URL}/auth/login`, {
            data: { email: userEmail, password: password, loginType: 'email' }
        });
        const body = await response.json();
        if (body.user && body.user.auth) {
            authToken = body.user.auth.accessToken;
        } else if (body.token) {
            authToken = body.token.accessToken || body.token;
        }
        
        // Create dummy image
        fs.writeFileSync('test_avatar.png', 'fake_image_content');
    });

    test('200 OK - Update Avatar (Multipart)', async ({ request }) => {
        // We will try to upload a file
        const buffer = fs.readFileSync('test_avatar.png');
        
        const response = await request.put(`${API_URL}/me/avatar`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            multipart: {
                image: {
                    name: 'test_avatar.png',
                    mimeType: 'image/png',
                    buffer: buffer
                }
            }
        });
        
        console.log(`Avatar Upload Status: ${response.status()}`);
        console.log(`Avatar Upload Body: ${await response.text()}`);
        
        expect(response.status()).toBe(200);
    });
});
