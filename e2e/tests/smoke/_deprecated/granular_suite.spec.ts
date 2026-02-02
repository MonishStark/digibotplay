
import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://127.0.0.1:5050';

test.describe.configure({ mode: 'serial' });

test.describe('Granular API Code Verification', () => {

    let superAdminToken = '';
    let userToken = '';
    let userId = '';
    let teamId = '';
    let companyId = '';

    test.beforeAll(async ({ request }) => {
        // Setup User
        const unique = Date.now();
        const email = `gran_${unique}@test.com`;
        const regRes = await request.post(`${API_URL}/auth/register`, {
            data: {
                firstname: 'Gran', lastname: 'Ular', email: email, password: 'Password123!',
                accountType: 'solo', signUpMethod: 'email', currency: 'USD',
                mobileCountryCode: '+1', mobileNumber: '1234567890'
            }
        });
        
        // Login to get token
        const loginRes = await request.post(`${API_URL}/auth/login`, {
            data: { email: email, password: 'Password123!', loginType: 'email' }
        });
        const body = await loginRes.json();
        userToken = body.user?.auth?.accessToken || body.token?.accessToken;
        userId = body.user?.id || body.id;

        // Create Team
        if(userToken) {
            const teamRes = await request.post(`${API_URL}/teams`, {
                headers: { Authorization: `Bearer ${userToken}` },
                data: { name: 'Gran Team' }
            });
            const teamBody = await teamRes.json();
            teamId = teamBody.team?.id || teamBody.id;
            companyId = teamId; 
        }
    });

    // ==========================================
    // 🔐 Auth / Login
    // Requested: 200, 400, 401, 409, 423, 429, 500
    // ==========================================
    test.describe('POST /auth/login', () => {
        
        test('200 OK - Valid Credentials (User)', async ({ request }) => {
             const e = `login_${Date.now()}@test.com`;
             await request.post(`${API_URL}/auth/register`, { data: { firstname:'T', lastname:'T', email: e, password: 'Password123!', accountType:'solo', signUpMethod:'email', currency:'USD', mobileCountryCode:'+1', mobileNumber:'123'} });
             
             const res = await request.post(`${API_URL}/auth/login`, { data: { email: e, password: 'Password123!', loginType: 'email'} });
             expect(res.status()).toBe(200);
        });

        test('400 Bad Request - Missing Password', async ({ request }) => {
            const res = await request.post(`${API_URL}/auth/login`, { data: { email: 'some@email.com' } });
            expect(res.status()).toBe(400);
        });

        test('401 Unauthorized - Wrong Password', async ({ request }) => {
             const res = await request.post(`${API_URL}/auth/login`, { data: { email: 'some@email.com', password: 'Wrong' } });
             expect([401, 400]).toContain(res.status()); 
        });
    });

    // ==========================================
    // 🔐 Auth / Registration
    // Requested: 200, 201, 400, 409
    // ==========================================
    test.describe('POST /auth/register', () => {
        const e = `reg_${Date.now()}@test.com`;
        test('201 Created - New User', async ({ request }) => {
            const res = await request.post(`${API_URL}/auth/register`, { 
                data: { firstname:'N', lastname:'N', email: e, password:'Password123!', accountType:'solo', signUpMethod:'email', currency:'USD', mobileCountryCode:'+1', mobileNumber:'123'} 
            });
            expect([200, 201]).toContain(res.status());
        });

        test('409 Conflict - Existing User', async ({ request }) => {
            // Re-use same email
            const res = await request.post(`${API_URL}/auth/register`, { 
                data: { firstname:'N', lastname:'N', email: e, password:'Password123!', accountType:'solo', signUpMethod:'email', currency:'USD', mobileCountryCode:'+1', mobileNumber:'123'} 
            });
            expect(res.status()).toBe(409);
        });

        test('400 Bad Request - Missing Email', async ({ request }) => {
             const res = await request.post(`${API_URL}/auth/register`, { data: { password: 'P' } });
             expect(res.status()).toBe(400);
        });
    });

    // ==========================================
    // 👥 Team / Create
    // Requested: 200, 400, 401, 403, 409
    // ==========================================
    test.describe('POST /teams', () => {
        test('201 Created - Valid Team', async ({ request }) => {
            const res = await request.post(`${API_URL}/teams`, { headers: { Authorization: `Bearer ${userToken}` }, data: { name: 'Valid Team' } });
            expect([200, 201]).toContain(res.status());
        });

        test('401 Unauthorized - No Token', async ({ request }) => {
            const res = await request.post(`${API_URL}/teams`, { data: { name: 'No Auth' } });
            expect(res.status()).toBe(401);
        });
        
        test('400 Bad Request - Missing Name', async ({ request }) => {
            const res = await request.post(`${API_URL}/teams`, { headers: { Authorization: `Bearer ${userToken}` }, data: {} });
            expect(res.status()).toBe(400);
        });
    });

    // ==========================================
    // 👤 User / Profile
    // Requested: 200, 401
    // ==========================================
    test.describe('GET /me/profile', () => {
        test('200 OK - Valid Token', async ({ request }) => {
            const res = await request.get(`${API_URL}/me/profile`, { headers: { Authorization: `Bearer ${userToken}` } });
            expect(res.status()).toBe(200);
        });

        test('401 Unauthorized - No Token', async ({ request }) => {
            const res = await request.get(`${API_URL}/me/profile`);
            expect(res.status()).toBe(401);
        });
    });

      // ==========================================
    // 💬 Chat / Create
    // Requested: 201, 400, 401, 403, 409
    // ==========================================
     test.describe('POST /teams/:id/chats', () => {
        test('201 Created - Valid Chat', async ({ request }) => {
            const res = await request.post(`${API_URL}/teams/${teamId}/chats`, { 
                headers: { Authorization: `Bearer ${userToken}` }, data: { message: 'Hello' } 
            });
            expect([201, 200]).toContain(res.status());
        });

        test('401 Unauthorized - No Token', async ({ request }) => {
            const res = await request.post(`${API_URL}/teams/${teamId}/chats`, { data: { message: 'Hello' } });
            expect(res.status()).toBe(401);
        });

        test('400 Bad Request - Missing Message', async ({ request }) => {
            const res = await request.post(`${API_URL}/teams/${teamId}/chats`, { 
                 headers: { Authorization: `Bearer ${userToken}` }, data: {}
            });
            expect(res.status()).toBe(400);
        });
    });

    // ==========================================
    // 🛠️ Admin / Get User
    // Requested: 200, 400, 401, 403, 404
    // ==========================================
     test.describe('GET /admin/users/:id', () => {
        test('403 Forbidden - Standard User', async ({ request }) => {
            const res = await request.get(`${API_URL}/admin/users/${userId}`, { headers: { Authorization: `Bearer ${userToken}` } });
            expect([403, 401]).toContain(res.status()); 
        });

        test('401 Unauthorized - No Token', async ({ request }) => {
             const res = await request.get(`${API_URL}/admin/users/${userId}`);
             expect(res.status()).toBe(401);
        });
    });
    
    // ==========================================
    // 🛡️ SuperAdmin / List Companies
    // Requested: 200, 401
    // ==========================================
    test.describe('GET /super-admin/companies', () => {
        test('403 Forbidden - Standard User', async ({ request }) => {
             const res = await request.get(`${API_URL}/super-admin/companies`, { headers: { Authorization: `Bearer ${userToken}` } });
             expect([403, 401]).toContain(res.status());
        });

        test('401 Unauthorized - No Token', async ({ request }) => {
             const res = await request.get(`${API_URL}/super-admin/companies`);
             expect(res.status()).toBe(401);
        });
    });

    // ==========================================
    // 🔔 Notifications / List
    // Requested: 200, 401
    // ==========================================
    test.describe('GET /notifications', () => {
        test('200 OK - Valid Token', async ({ request }) => {
             const res = await request.get(`${API_URL}/notifications`, { headers: { Authorization: `Bearer ${userToken}` } });
             expect(res.status()).toBe(200);
        });

        test('401 Unauthorized - No Token', async ({ request }) => {
             const res = await request.get(`${API_URL}/notifications`);
             expect(res.status()).toBe(401);
        });
    });

      // ==========================================
    // 📁 File Manager / Folders
    // Requested: 201, 400, 401, 403, 409
    // ==========================================
     test.describe('POST /teams/:id/folders', () => {
        test('201 Created - Valid Folder', async ({ request }) => {
            const res = await request.post(`${API_URL}/teams/${teamId}/folders`, { 
                headers: { Authorization: `Bearer ${userToken}` }, data: { name: 'New Folder' } 
            });
            expect([201, 200]).toContain(res.status());
        });

        test('401 Unauthorized - No Token', async ({ request }) => {
            const res = await request.post(`${API_URL}/teams/${teamId}/folders`, { data: { name: 'F' } });
            expect(res.status()).toBe(401);
        });

        test('400 Bad Request - Missing Name', async ({ request }) => {
            const res = await request.post(`${API_URL}/teams/${teamId}/folders`, { 
                 headers: { Authorization: `Bearer ${userToken}` }, data: {} 
            });
            expect(res.status()).toBe(400);
        });
    });

});
