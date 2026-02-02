import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://127.0.0.1:5050';

test.describe('Data-Driven Team Folder Creation', () => {

    // Helper to get token
    async function getToken(request, email, password) {
        const response = await request.post(`${API_URL}/auth/login`, {
            data: { email, password, loginType: 'standard' }
        });
        const body = await response.json();
        return body.user?.auth?.accessToken || body.token?.accessToken;
    }

    const testCases = [
        { 
            desc: 'User 69 creates folder in Team 21',
            user: { email: 'mad.quelea.bilt@protectsmail.net', password: 'Qwerty@123' },
            teamId: 21,
            folderName: `DD_Test_Folder_69_${Date.now()}`,
            expectedStatus: 201
        },
        { 
            desc: 'User 70 creates folder in Team 23',
            user: { email: 'kind.urial.tyol@protectsmail.net', password: 'Qwerty@123' },
            teamId: 23,
            folderName: `DD_Test_Folder_70_${Date.now()}`,
            expectedStatus: 201
        },
        { 
            desc: 'User 69 FAILS to create folder in Team 23 (Unauthorized)',
            user: { email: 'mad.quelea.bilt@protectsmail.net', password: 'Qwerty@123' },
            teamId: 23,
            folderName: `DD_Exploit_Folder_${Date.now()}`,
            expectedStatus: 403 // Or 401/404 depending on implementation
        }
    ];

    for (const data of testCases) {
        test(data.desc, async ({ request }) => {
            const token = await getToken(request, data.user.email, data.user.password);
            expect(token, 'Login failed').toBeTruthy();

            const response = await request.post(`${API_URL}/teams/${data.teamId}/folders`, {
                headers: { 'Authorization': `Bearer ${token}` },
                data: {
                    name: data.folderName,
                    teamId: data.teamId // Include body param just in case
                }
            });

            if (response.status() !== data.expectedStatus) {
                console.error(`Failed ${data.desc}: Status ${response.status()}`);
                try { 
                    console.error('Response Body:', await response.text()); 
                } catch (e) {
                    console.error('Could not read response body');
                }
            }
            
            // Allow 403 or 401 for unauthorized access
             if (data.expectedStatus === 403) {
                expect([401, 403, 404]).toContain(response.status());
            } else {
                expect(response.status()).toBe(data.expectedStatus);
            }

            if (data.expectedStatus === 201) {
                const body = await response.json();
                expect(body).toHaveProperty('success', true);
                // Maybe verify folder structure if returned
            }
        });
    }

    // Missing Name Case
    test('Create Folder - Missing Name (400)', async ({ request }) => {
        const token = await getToken(request, 'mad.quelea.bilt@protectsmail.net', 'Qwerty@123');
        const response = await request.post(`${API_URL}/teams/21/folders`, {
            headers: { 'Authorization': `Bearer ${token}` },
            data: { } // Missing name
        });
        expect(response.status()).toBe(400);
    });

});
