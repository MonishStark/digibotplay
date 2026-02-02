import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://127.0.0.1:5050';

test.describe('Data-Driven Auth Login Verification', () => {

    // Real Data from Database Context
    const users = [
        { id: 69, email: 'mad.quelea.bilt@protectsmail.net', password: 'Qwerty@123', role: 'User' },
        { id: 70, email: 'kind.urial.tyol@protectsmail.net', password: 'Qwerty@123', role: 'User' },
        { id: 71, email: 'poised.reindeer.muxl@protectsmail.net', password: 'Qwerty@123', role: 'Admin' }
    ];

    // 1. Success Cases
    for (const user of users) {
        test(`Login Success - User ${user.id} (${user.role}) - ${user.email}`, async ({ request }) => {
            const response = await request.post(`${API_URL}/auth/login`, {
                data: {
                    email: user.email,
                    password: user.password,
                    loginType: 'standard'
                }
            });
            
            if (response.status() !== 200) {
                console.log(`Failed Login for ${user.email} (User ${user.id}): Status ${response.status()}`);
                try {
                    console.log('Response Body:', await response.text());
                } catch (e) {
                    console.log('Response Body: Could not read text');
                }
            }

            expect(response.status(), `Expected 200 OK for ${user.email}`).toBe(200);
            
            const body = await response.json();
            expect(body).toHaveProperty('success', true);
            const token = body.user?.auth?.accessToken || body.token?.accessToken;
            expect(token).toBeTruthy();
        });
    }

    // 2. Error Case: Wrong Password
    test('Login Failure - Wrong Password', async ({ request }) => {
        const user = users[0];
        const response = await request.post(`${API_URL}/auth/login`, {
            data: {
                email: user.email,
                password: 'WrongPassword123!',
                loginType: 'standard'
            }
        });
        if (response.status() !== 401) {
            console.log(`Wrong Pass Status: ${response.status()}`);
            try { console.log('Response:', await response.text()); } catch {}
        }
        expect(response.status()).toBe(401);
    });

    // 3. Error Case: Missing Password (Bad Request)
    test('Login Failure - Missing Password (400)', async ({ request }) => {
        const user = users[0];
        const response = await request.post(`${API_URL}/auth/login`, {
            data: {
                email: user.email,
                // password missing
                loginType: 'standard'
            }
        });
        if (response.status() !== 400) {
            console.log(`Missing Pass Status: ${response.status()}`);
            try { console.log('Response:', await response.text()); } catch {}
        }
        expect(response.status()).toBe(400);
    });

    // 4. Error Case: Non-existent User
    test('Login Failure - Non-existent User', async ({ request }) => {
        const response = await request.post(`${API_URL}/auth/login`, {
            data: {
                email: 'definitely.not.real.user@example.com',
                password: 'Qwerty@123',
                loginType: 'standard'
            }
        });
        if (response.status() !== 401 && response.status() !== 404) {
             console.log(`Non-existent User Status: ${response.status()}`);
             console.log('Response:', await response.text());
        }
        expect([401, 404]).toContain(response.status());
    });

});
