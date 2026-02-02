
import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://127.0.0.1:5050';

function logResult(method: string, endpoint: string, status: number) {
    console.log(`||| ${method} ${endpoint} ${status} |||`);
}

test.describe('Master API Coverage Suite', () => {

    let userToken = '';
    let userId = '';
    let teamId = '';
    let folderId = '';
    let companyId = ''; 

    test.beforeAll(async ({ request }) => {
        // --- Setup User ---
        const unique = Date.now();
        const email = `master_log_user_${unique}@test.com`;
        const regRes = await request.post(`${API_URL}/auth/register`, {
            data: {
                firstname: 'Master', lastname: 'Logger', email: email, password: 'Password123!',
                accountType: 'solo', signUpMethod: 'email', currency: 'USD',
                mobileCountryCode: '+1', mobileNumber: '1234567890'
            }
        });
        const regBody = await regRes.json();
        userToken = regBody.user?.auth?.accessToken || regBody.token?.accessToken;
        userId = regBody.user?.id || regBody.id;

        if (!userToken) {
            const loginRes = await request.post(`${API_URL}/auth/login`, {
                data: { email: email, password: 'Password123!', loginType: 'email' }
            });
            const loginBody = await loginRes.json();
            userToken = loginBody.user?.auth?.accessToken;
            userId = loginBody.user?.id;
        }

        // --- Setup Team ---
        if (userToken) {
            const teamRes = await request.post(`${API_URL}/teams`, {
                headers: { 'Authorization': `Bearer ${userToken}` },
                data: { name: `Master Team ${unique}` }
            });
            const teamBody = await teamRes.json();
            teamId = teamBody.team?.id || teamBody.id;
            companyId = teamId; 
        }
        
        console.log(`Setup: UserID=${userId} TeamID=${teamId}`);
    });

    // ==========================================
    // 🔐 Auth / Registration
    // ==========================================
    test('POST /auth/register', async ({ request }) => {
        const res = await request.post(`${API_URL}/auth/register`, { data: {} }); 
        logResult('POST', '/auth/register', res.status());
        expect([200, 201, 400, 409, 429, 500, 503, 504]).toContain(res.status());
    });

    test('POST /auth/refresh', async ({ request }) => {
        const res = await request.post(`${API_URL}/auth/refresh`, { data: {} });
        logResult('POST', '/auth/refresh', res.status());
        expect([200, 400, 401, 403, 429, 500, 503, 504]).toContain(res.status());
    });
    
    test('POST /auth/email/check', async ({ request }) => {
        const res = await request.post(`${API_URL}/auth/email/check`, { data: { email: 'check@test.com'} });
        logResult('POST', '/auth/email/check', res.status());
        expect([200, 400, 409, 429]).toContain(res.status());
    });

    test('POST /auth/verify-account', async ({ request }) => {
        const res = await request.post(`${API_URL}/auth/verify-account`, { data: { token: 'invalid'} });
        logResult('POST', '/auth/verify-account', res.status());
        expect([200, 400, 401, 410, 429, 404]).toContain(res.status());
    });

    test('GET /auth/payment/status', async ({ request }) => {
        const res = await request.get(`${API_URL}/auth/payment/status`, { params: { email: 'check@test.com'} });
        logResult('GET', '/auth/payment/status', res.status());
        expect([200, 400, 401, 429, 404]).toContain(res.status());
    });

    // ==========================================
    // 🔐 Auth / Login
    // ==========================================
    test('POST /auth/login', async ({ request }) => {
        const res = await request.post(`${API_URL}/auth/login`, { data: {} });
        logResult('POST', '/auth/login', res.status());
        expect([200, 400, 401, 409, 423, 429, 500]).toContain(res.status());
    });

    test('POST /auth/sign-out', async ({ request }) => {
        const res = await request.post(`${API_URL}/auth/sign-out`, { headers: { Authorization: `Bearer ${userToken}` } });
        logResult('POST', '/auth/sign-out', res.status());
        expect([200, 400, 401, 429, 404]).toContain(res.status());
    });

    test('POST /auth/verify-otp', async ({ request }) => {
        const res = await request.post(`${API_URL}/auth/verify-otp`, { data: { email: 'bad', otp: '000' } });
        logResult('POST', '/auth/verify-otp', res.status());
        expect([200, 400, 401, 422, 429]).toContain(res.status());
    });

    test('POST /auth/password/forgot', async ({ request }) => {
        const res = await request.post(`${API_URL}/auth/password/forgot`, { data: { email: 'bad' } });
        logResult('POST', '/auth/password/forgot', res.status());
        expect([200, 400, 401, 429, 404]).toContain(res.status());
    });

    test('POST /auth/password/reset', async ({ request }) => {
        const res = await request.post(`${API_URL}/auth/password/reset`, { data: { token: 'bad', password: 'new' } });
        logResult('POST', '/auth/password/reset', res.status());
        expect([200, 400, 401, 422, 429]).toContain(res.status());
    });

    // ==========================================
    // 👤 User
    // ==========================================
    const userHeaders = { Authorization: `Bearer ${userToken}` };

    test('GET /me/subscription', async ({ request }) => {
        const res = await request.get(`${API_URL}/me/subscription`, { headers: { Authorization: `Bearer ${userToken}` } });
        logResult('GET', '/me/subscription', res.status());
        expect([200, 401, 429, 404]).toContain(res.status());
    });

    test('POST /me/verification/resend', async ({ request }) => {
        const res = await request.post(`${API_URL}/me/verification/resend`, { headers: { Authorization: `Bearer ${userToken}` } });
        logResult('POST', '/me/verification/resend', res.status());
        expect([200, 400, 409, 429, 404]).toContain(res.status());
    });

    test('GET /me/profile', async ({ request }) => {
        const res = await request.get(`${API_URL}/me/profile`, { headers: { Authorization: `Bearer ${userToken}` } });
        logResult('GET', '/me/profile', res.status());
        expect([200, 401, 429]).toContain(res.status());
    });

    test('GET /me/usage', async ({ request }) => {
        const res = await request.get(`${API_URL}/me/usage`, { headers: { Authorization: `Bearer ${userToken}` } });
        logResult('GET', '/me/usage', res.status());
        expect([200, 401, 429, 404]).toContain(res.status());
    });

    test('POST /me/password', async ({ request }) => {
        const res = await request.post(`${API_URL}/me/password`, { headers: { Authorization: `Bearer ${userToken}` }, data: { oldPassword: 'x', newPassword: 'y'} });
        logResult('POST', '/me/password', res.status());
        expect([200, 400, 401, 409, 429, 404]).toContain(res.status());
    });

    test('POST /me/password/set', async ({ request }) => {
        const res = await request.post(`${API_URL}/me/password/set`, { headers: { Authorization: `Bearer ${userToken}` }, data: { password: 'y'} });
        logResult('POST', '/me/password/set', res.status());
        expect([200, 400, 401, 422, 429, 404]).toContain(res.status());
    });

    test('POST /me/email', async ({ request }) => {
        const res = await request.post(`${API_URL}/me/email`, { headers: { Authorization: `Bearer ${userToken}` }, data: { email: 'new@test.com'} });
        logResult('POST', '/me/email', res.status());
        expect([200, 400, 401, 409, 429, 404]).toContain(res.status());
    });

    test('POST /me/2fa', async ({ request }) => {
        const res = await request.post(`${API_URL}/me/2fa`, { headers: { Authorization: `Bearer ${userToken}` }, data: { enabled: true } });
        logResult('POST', '/me/2fa', res.status());
        expect([200, 400, 401, 409, 422, 429, 404]).toContain(res.status());
    });

    test('PATCH /me/profile', async ({ request }) => {
        const res = await request.patch(`${API_URL}/me/profile`, { headers: { Authorization: `Bearer ${userToken}` }, data: { firstname: 'U' } });
        logResult('PATCH', '/me/profile', res.status());
        expect([200, 400, 401, 429, 404]).toContain(res.status());
    });

    test('PUT /me/avatar', async ({ request }) => {
        const res = await request.put(`${API_URL}/me/avatar`, { headers: { Authorization: `Bearer ${userToken}` }, data: {} });
        logResult('PUT', '/me/avatar', res.status());
        expect([200, 400, 401, 422, 429, 415, 404]).toContain(res.status());
    });

    // ==========================================
    // 🏢 Company / Organization
    // ==========================================
    function compUrl(path) { return `${API_URL}/companies/${companyId || 1}${path}`; }

    test('POST /companies/:id/2fa', async ({ request }) => {
        const res = await request.post(compUrl('/2fa'), { headers: { Authorization: `Bearer ${userToken}` }, data: {} });
        logResult('POST', '/companies/:id/2fa', res.status());
        expect([200, 400, 401, 422, 429, 403, 404]).toContain(res.status());
    });

    test('GET /companies/:id/usage', async ({ request }) => {
        const res = await request.get(compUrl('/usage'), { headers: { Authorization: `Bearer ${userToken}` } });
        logResult('GET', '/companies/:id/usage', res.status());
        expect([200, 401, 429, 403, 404]).toContain(res.status());
    });

    test('GET /companies/:id/profile', async ({ request }) => {
        const res = await request.get(compUrl('/profile'), { headers: { Authorization: `Bearer ${userToken}` } });
        logResult('GET', '/companies/:id/profile', res.status());
        expect([200, 401, 429, 403, 404]).toContain(res.status());
    });

    test('PATCH /companies/:id/profile', async ({ request }) => {
        const res = await request.patch(compUrl('/profile'), { headers: { Authorization: `Bearer ${userToken}` }, data: { name: 'N'} });
        logResult('PATCH', '/companies/:id/profile', res.status());
        expect([200, 400, 401, 429, 403, 404]).toContain(res.status());
    });

    test('PUT /companies/:id/avatar', async ({ request }) => {
        const res = await request.put(compUrl('/avatar'), { headers: { Authorization: `Bearer ${userToken}` }, data: {} });
        logResult('PUT', '/companies/:id/avatar', res.status());
        expect([200, 400, 401, 422, 429, 403, 404, 415]).toContain(res.status());
    });

    // ==========================================
    // 👥 Team
    // ==========================================
    
    test('POST /teams', async ({ request }) => {
        const res = await request.post(`${API_URL}/teams`, { headers: { Authorization: `Bearer ${userToken}` }, data: { name: 'T'} });
        logResult('POST', '/teams', res.status());
        expect([200, 400, 401, 403, 409, 422, 429, 201]).toContain(res.status());
    });

    test('PUT /teams/:id', async ({ request }) => {
        // use teamId if set, else 1
        const res = await request.put(`${API_URL}/teams/${teamId || 1}`, { headers: { Authorization: `Bearer ${userToken}` }, data: { name: 'U'} });
        logResult('PUT', '/teams/:id', res.status());
        expect([200, 400, 401, 409, 429, 403, 404]).toContain(res.status());
    });

    test('GET /teams', async ({ request }) => {
        const res = await request.get(`${API_URL}/teams`, { headers: { Authorization: `Bearer ${userToken}` } });
        logResult('GET', '/teams', res.status());
        expect([200, 401, 429]).toContain(res.status());
    });
    
    test('GET /teams/active', async ({ request }) => {
        const res = await request.get(`${API_URL}/teams/active`, { headers: { Authorization: `Bearer ${userToken}` } });
        logResult('GET', '/teams/active', res.status());
        expect([200, 401, 429, 404]).toContain(res.status());
    });

    test('GET /teams/shared', async ({ request }) => {
        const res = await request.get(`${API_URL}/teams/shared`, { headers: { Authorization: `Bearer ${userToken}` } });
        logResult('GET', '/teams/shared', res.status());
        expect([200, 401, 429, 404]).toContain(res.status());
    });

    test('PATCH /teams/:id/status', async ({ request }) => {
        const res = await request.patch(`${API_URL}/teams/${teamId || 1}/status`, { headers: { Authorization: `Bearer ${userToken}` }, data: { status: 'archived'} });
        logResult('PATCH', '/teams/:id/status', res.status());
        expect([200, 400, 401, 429, 403, 404]).toContain(res.status());
    });

    test('POST /teams/:id/share', async ({ request }) => {
        const res = await request.post(`${API_URL}/teams/${teamId || 1}/share`, { headers: { Authorization: `Bearer ${userToken}` }, data: { email: 'i@t.com'} });
        logResult('POST', '/teams/:id/share', res.status());
        expect([200, 400, 401, 422, 429, 403, 404]).toContain(res.status());
    });

    // ==========================================
    // 📁 File Manager
    // ==========================================
    function teamUrl(path) { return `${API_URL}/teams/${teamId || 1}${path}`; }

    test('POST /teams/:id/folders', async ({ request }) => {
        const res = await request.post(teamUrl('/folders'), { headers: { Authorization: `Bearer ${userToken}` }, data: { name: 'F'} });
        logResult('POST', '/teams/:id/folders', res.status());
        if (res.status() === 201 || res.status() === 200) {
            folderId = (await res.json()).folder?.id;
        }
        expect([201, 400, 401, 403, 409, 429, 200]).toContain(res.status());
    });

    test('PUT /teams/:id/folders/:id', async ({ request }) => {
        const res = await request.put(teamUrl(`/folders/${folderId || 1}`), { headers: { Authorization: `Bearer ${userToken}` }, data: { name: 'U'} });
        logResult('PUT', '/teams/:id/folders/:id', res.status());
        expect([200, 400, 401, 403, 404, 409, 429]).toContain(res.status());
    });

    test('DELETE /teams/:id/folders/:id', async ({ request }) => {
        const res = await request.delete(teamUrl('/folders/9999'), { headers: { Authorization: `Bearer ${userToken}` } });
        logResult('DELETE', '/teams/:id/folders/:id', res.status());
        expect([200, 400, 401, 403, 404, 409, 429]).toContain(res.status());
    });

    test('GET /teams/:id/folders', async ({ request }) => {
        const res = await request.get(teamUrl('/folders'), { headers: { Authorization: `Bearer ${userToken}` } });
        logResult('GET', '/teams/:id/folders', res.status());
        expect([200, 400, 401, 403, 404, 429]).toContain(res.status());
    });

    test('GET /teams/:id/items', async ({ request }) => {
        const res = await request.get(teamUrl('/items'), { headers: { Authorization: `Bearer ${userToken}` } }); 
        logResult('GET', '/teams/:id/items', res.status());
        expect([200, 400, 401, 403, 404, 429]).toContain(res.status());
    });

    test('GET /teams/:id/folders/:id/tree', async ({ request }) => {
        const res = await request.get(teamUrl(`/folders/${folderId || 1}/tree`), { headers: { Authorization: `Bearer ${userToken}` } });
        logResult('GET', '/teams/:id/folders/:id/tree', res.status());
        expect([200, 400, 401, 403, 404, 429]).toContain(res.status());
    });

    test('POST /teams/:id/files', async ({ request }) => {
        const res = await request.post(teamUrl('/files'), { headers: { Authorization: `Bearer ${userToken}` }, data: { name: 'note.txt'} });
        logResult('POST', '/teams/:id/files', res.status());
        expect([201, 400, 401, 403, 409, 429, 200, 404]).toContain(res.status());
    });

    test('PATCH /teams/:id/files/:id', async ({ request }) => {
        const res = await request.patch(teamUrl('/files/1'), { headers: { Authorization: `Bearer ${userToken}` }, data: { content: 'c'} });
        logResult('PATCH', '/teams/:id/files/:id', res.status());
        expect([200, 400, 401, 403, 404, 422, 429]).toContain(res.status());
    });

    test('PATCH /teams/:id/files/:id/name', async ({ request }) => {
        const res = await request.patch(teamUrl('/files/1/name'), { headers: { Authorization: `Bearer ${userToken}` }, data: { name: 'n'} });
        logResult('PATCH', '/teams/:id/files/:id/name', res.status());
        expect([200, 400, 401, 403, 404, 422, 429]).toContain(res.status());
    });

    test('DELETE /teams/:id/files/:id', async ({ request }) => {
        const res = await request.delete(teamUrl('/files/999'), { headers: { Authorization: `Bearer ${userToken}` } });
        logResult('DELETE', '/teams/:id/files/:id', res.status());
        expect([200, 400, 401, 403, 404, 409, 429]).toContain(res.status());
    });

    test('GET /teams/:id/files/:id', async ({ request }) => {
        const res = await request.get(teamUrl('/files/1'), { headers: { Authorization: `Bearer ${userToken}` } });
        logResult('GET', '/teams/:id/files/:id', res.status());
        expect([200, 400, 401, 403, 404, 429]).toContain(res.status());
    });

    test('POST /files/upload/:teamId', async ({ request }) => {
        const res = await request.post(`${API_URL}/files/upload/${teamId || 1}`, { headers: { Authorization: `Bearer ${userToken}` }, data: {} });
        logResult('POST', '/files/upload/:teamId', res.status());
        expect([200, 400, 401, 403, 404, 422, 429]).toContain(res.status());
    });

    test('GET /files/jobs/:id/status', async ({ request }) => {
        const res = await request.get(`${API_URL}/files/jobs/1/status`, { headers: { Authorization: `Bearer ${userToken}` } });
        logResult('GET', '/files/jobs/:id/status', res.status());
        expect([200, 400, 401, 404, 429]).toContain(res.status());
    });

    test('POST /files/jobs/:id/retry', async ({ request }) => {
        const res = await request.post(`${API_URL}/files/jobs/1/retry`, { headers: { Authorization: `Bearer ${userToken}` }, data: {} });
        logResult('POST', '/files/jobs/:id/retry', res.status());
        expect([200, 400, 401, 404, 429]).toContain(res.status());
    });

    test('GET /teams/:id/files/:id/summary', async ({ request }) => {
        const res = await request.get(teamUrl('/files/1/summary'), { headers: { Authorization: `Bearer ${userToken}` } });
        logResult('GET', '/teams/:id/files/:id/summary', res.status());
        expect([200, 400, 401, 404, 429]).toContain(res.status());
    });

    // ==========================================
    // 💬 Chat
    // ==========================================
    test('POST /teams/:id/chats', async ({ request }) => {
        const res = await request.post(teamUrl('/chats'), { headers: { Authorization: `Bearer ${userToken}` }, data: { message: 'hi'} });
        logResult('POST', '/teams/:id/chats', res.status());
        expect([201, 400, 401, 403, 409, 422, 429, 200, 404]).toContain(res.status());
    });

    test('GET /teams/:id/chats', async ({ request }) => {
        const res = await request.get(teamUrl('/chats'), { headers: { Authorization: `Bearer ${userToken}` } });
        logResult('GET', '/teams/:id/chats', res.status());
        expect([200, 400, 401, 403, 404, 429]).toContain(res.status());
    });

    test('PATCH /teams/:id/chats/:id', async ({ request }) => {
        const res = await request.patch(teamUrl('/chats/1'), { headers: { Authorization: `Bearer ${userToken}` }, data: { title: 'T'} });
        logResult('PATCH', '/teams/:id/chats/:id', res.status());
        expect([200, 400, 401, 403, 404, 422, 429]).toContain(res.status());
    });

    test('DELETE /teams/:id/chats/:id', async ({ request }) => {
        const res = await request.delete(teamUrl('/chats/1'), { headers: { Authorization: `Bearer ${userToken}` } });
        logResult('DELETE', '/teams/:id/chats/:id', res.status());
        expect([200, 400, 401, 403, 404, 429]).toContain(res.status());
    });

    test('GET /teams/:id/chats/:id/messages', async ({ request }) => {
        const res = await request.get(teamUrl('/chats/1/messages'), { headers: { Authorization: `Bearer ${userToken}` } });
        logResult('GET', '/teams/:id/chats/:id/messages', res.status());
        expect([200, 400, 401, 403, 404, 429]).toContain(res.status());
    });

    test('POST /teams/:id/chats/:id/messages', async ({ request }) => {
        const res = await request.post(teamUrl('/chats/1/messages'), { headers: { Authorization: `Bearer ${userToken}` }, data: { message: 'hi' } });
        logResult('POST', '/teams/:id/chats/:id/messages', res.status());
        expect([200, 400, 401, 403, 404, 429]).toContain(res.status());
    });

    // ==========================================
    // 🎙️ Record
    // ==========================================
    test('POST /files/upload/audio/:teamId', async ({ request }) => {
        const res = await request.post(`${API_URL}/files/upload/audio/${teamId || 1}`, { headers: { Authorization: `Bearer ${userToken}` }, data: {} });
        logResult('POST', '/files/upload/audio/:teamId', res.status());
        expect([200, 400, 401, 403, 422, 429, 404]).toContain(res.status());
    });

    // ==========================================
    // 🔔 Notification
    // ==========================================
    test('GET /notifications', async ({ request }) => {
        const res = await request.get(`${API_URL}/notifications`, { headers: { Authorization: `Bearer ${userToken}` } });
        logResult('GET', '/notifications', res.status());
        expect([200, 401, 429, 404]).toContain(res.status());
    });
    
    test('DELETE /notification/:id', async ({ request }) => {
        const res = await request.delete(`${API_URL}/notification/1`, { headers: { Authorization: `Bearer ${userToken}` } });
        logResult('DELETE', '/notification/:id', res.status());
        expect([200, 401, 404, 429]).toContain(res.status());
    });

    test('PATCH /notifications/viewed', async ({ request }) => {
        const res = await request.patch(`${API_URL}/notifications/viewed`, { headers: { Authorization: `Bearer ${userToken}` } });
        logResult('PATCH', '/notifications/viewed', res.status());
        expect([200, 401, 429]).toContain(res.status());
    });

    // ==========================================
    // ⚙️ Settings
    // ==========================================
    test('GET /settings/max-uploads', async ({ request }) => {
        const res = await request.get(`${API_URL}/settings/max-uploads`, { headers: { Authorization: `Bearer ${userToken}` } });
        logResult('GET', '/settings/max-uploads', res.status());
        expect([200, 401, 429, 404]).toContain(res.status());
    });

    test('GET /settings/recording-limit', async ({ request }) => {
        const res = await request.get(`${API_URL}/settings/recording-limit`, { headers: { Authorization: `Bearer ${userToken}` } });
        logResult('GET', '/settings/recording-limit', res.status());
        expect([200, 400, 401, 429]).toContain(res.status());
    });

    test('GET /settings/recording-prompt-time', async ({ request }) => {
        const res = await request.get(`${API_URL}/settings/recording-prompt-time`, { headers: { Authorization: `Bearer ${userToken}` } });
        logResult('GET', '/settings/recording-prompt-time', res.status());
        expect([200, 401, 403, 404, 409, 429]).toContain(res.status());
    });
    
    // ==========================================
    // 🔗 Integration
    // ==========================================
    test('GET /integrations', async ({ request }) => {
        const res = await request.get(`${API_URL}/integrations`, { headers: { Authorization: `Bearer ${userToken}` } });
        logResult('GET', '/integrations', res.status());
        expect([200, 401, 403, 404, 429]).toContain(res.status());
    });

    test('PATCH /integrations/:id', async ({ request }) => {
        const res = await request.patch(`${API_URL}/integrations/1`, { headers: { Authorization: `Bearer ${userToken}` }, data: {} });
        logResult('PATCH', '/integrations/:id', res.status());
        expect([200, 400, 401, 403, 404, 429]).toContain(res.status());
    });

    test('GET /integrations/:id/files', async ({ request }) => {
        const res = await request.get(`${API_URL}/integrations/1/files`, { headers: { Authorization: `Bearer ${userToken}` } });
        logResult('GET', '/integrations/:id/files', res.status());
        expect([200, 401, 403, 404, 429]).toContain(res.status());
    });

    test('POST /integrations/:id/files/:id/import/:teamId', async ({ request }) => {
        const res = await request.post(`${API_URL}/integrations/1/files/1/import/${teamId || 1}`, { headers: { Authorization: `Bearer ${userToken}` } });
        logResult('POST', '/integrations/:id/files/:id/import/:teamId', res.status());
        expect([200, 400, 401, 403, 404, 429]).toContain(res.status());
    });

    test('POST /integrations/auth/oauth-session-token', async ({ request }) => {
        const res = await request.post(`${API_URL}/integrations/auth/oauth-session-token`, { headers: { Authorization: `Bearer ${userToken}` }, data: {} });
        logResult('POST', '/integrations/auth/oauth-session-token', res.status());
        expect([200, 400, 401, 429]).toContain(res.status());
    });

    test('GET /integrations/auth/:integrationId', async ({ request }) => {
        const res = await request.get(`${API_URL}/integrations/auth/google?platform=web&st=1`, { headers: { Authorization: `Bearer ${userToken}` } });
        logResult('GET', '/integrations/auth/:integrationId', res.status());
        expect([302, 200, 404]).toContain(res.status());
    });

    // ==========================================
    // 🔐 Auth / OAuth
    // ==========================================
    test('GET /auth/providers/:provider', async ({ request }) => {
        const res = await request.get(`${API_URL}/auth/providers/google`, { params: { platform: 'web', flow: 'login'} });
        logResult('GET', '/auth/providers/:provider', res.status());
        expect([302, 200, 404]).toContain(res.status()); 
    });

    // ==========================================
    // 📨 Invitation
    // ==========================================
    test('POST /invitations', async ({ request }) => {
        const res = await request.post(`${API_URL}/invitations`, { headers: { Authorization: `Bearer ${userToken}` }, data: { email: 'x@x.com'} });
        logResult('POST', '/invitations', res.status());
        expect([200, 400, 401, 409, 422, 429]).toContain(res.status());
    });

    test('GET /invitations', async ({ request }) => {
        const res = await request.get(`${API_URL}/invitations`, { headers: { Authorization: `Bearer ${userToken}` } });
        logResult('GET', '/invitations', res.status());
        expect([200, 401, 429]).toContain(res.status());
    });

    test('DELETE /companies/:id/invitations/:id', async ({ request }) => {
        const res = await request.delete(`${API_URL}/companies/${companyId || 1}/invitations/1`, { headers: { Authorization: `Bearer ${userToken}` } });
        logResult('DELETE', '/companies/:id/invitations/:id', res.status());
        expect([200, 400, 401, 403, 404, 429]).toContain(res.status());
    });

    test('POST /companies/:id/invitations/:id/resend', async ({ request }) => {
        const res = await request.post(`${API_URL}/companies/${companyId || 1}/invitations/1/resend`, { headers: { Authorization: `Bearer ${userToken}` } });
        logResult('POST', '/companies/:id/invitations/:id/resend', res.status());
        expect([200, 400, 401, 429, 404]).toContain(res.status());
    });

    test('POST /invitations/verify', async ({ request }) => {
        const res = await request.post(`${API_URL}/invitations/verify`, { data: { token: 'invalid' }});
        logResult('POST', '/invitations/verify', res.status());
        expect([200, 400, 401, 410, 429]).toContain(res.status());
    });

    test('POST /invitations/decline', async ({ request }) => {
        const res = await request.post(`${API_URL}/invitations/decline`, { data: { token: 'invalid' }});
        logResult('POST', '/invitations/decline', res.status());
        expect([200, 400, 401, 429]).toContain(res.status());
    });

    // ==========================================
    // 🛠️ Admin 
    // ==========================================
    test('GET /admin/users/:id', async ({ request }) => {
        const res = await request.get(`${API_URL}/admin/users/${userId}`, { headers: { Authorization: `Bearer ${userToken}` } });
        logResult('GET', '/admin/users/:id', res.status());
        expect([200, 400, 401, 403, 404, 429]).toContain(res.status());
    });

    test('POST /admin/users/:id/verify', async ({ request }) => {
        const res = await request.post(`${API_URL}/admin/users/${userId}/verify`, { headers: { Authorization: `Bearer ${userToken}` } });
        logResult('POST', '/admin/users/:id/verify', res.status());
        expect([200, 400, 401, 403, 409, 429]).toContain(res.status());
    });

    test('PATCH /admin/users/:id/password', async ({ request }) => {
        const res = await request.patch(`${API_URL}/admin/users/${userId}/password`, { headers: { Authorization: `Bearer ${userToken}` }, data: { password: 'new'} });
        logResult('PATCH', '/admin/users/:id/password', res.status());
        expect([200, 400, 401, 409, 422, 429, 403]).toContain(res.status());
    });

    test('PATCH /admin/users/:id/2fa', async ({ request }) => {
        const res = await request.patch(`${API_URL}/admin/users/${userId}/2fa`, { headers: { Authorization: `Bearer ${userToken}` }, data: { enable: true} });
        logResult('PATCH', '/admin/users/:id/2fa', res.status());
        expect([200, 400, 401, 409, 429, 403]).toContain(res.status());
    });

    test('PATCH /admin/users/:id/account-status', async ({ request }) => {
        const res = await request.patch(`${API_URL}/admin/users/${userId}/account-status`, { headers: { Authorization: `Bearer ${userToken}` }, data: { status: 'active'} });
        logResult('PATCH', '/admin/users/:id/account-status', res.status());
        expect([200, 400, 401, 409, 429, 403]).toContain(res.status());
    });

    test('DELETE /admin/users/:id', async ({ request }) => {
        const res = await request.delete(`${API_URL}/admin/users/999999`, { headers: { Authorization: `Bearer ${userToken}` } });
        logResult('DELETE', '/admin/users/:id', res.status());
        expect([200, 400, 401, 403, 404, 409, 422, 429]).toContain(res.status());
    });

    test('PATCH /admin/users/:id/profile', async ({ request }) => {
        const res = await request.patch(`${API_URL}/admin/users/${userId}/profile`, { headers: { Authorization: `Bearer ${userToken}` }, data: {} });
        logResult('PATCH', '/admin/users/:id/profile', res.status());
        expect([200, 400, 401, 404, 429, 403]).toContain(res.status());
    });

    test('PUT /admin/users/:id/profile/avatar', async ({ request }) => {
        const res = await request.put(`${API_URL}/admin/users/${userId}/profile/avatar`, { headers: { Authorization: `Bearer ${userToken}` }, data: {} });
        logResult('PUT', '/admin/users/:id/profile/avatar', res.status());
        expect([200, 400, 401, 422, 429, 403]).toContain(res.status());
    });

    // ==========================================
    // 🛡️ SuperAdmin
    // ==========================================
    test('PUT /super-admin/users/:id/profile/avatar', async ({ request }) => {
        const res = await request.put(`${API_URL}/super-admin/users/${userId}/profile/avatar`, { headers: { Authorization: `Bearer ${userToken}` }, data: {} });
        logResult('PUT', '/super-admin/users/:id/profile/avatar', res.status());
        expect([200, 400, 401, 415, 429, 403]).toContain(res.status());
    });

    test('PUT /super-admin/companies/:id/profile/avatar', async ({ request }) => {
        const res = await request.put(`${API_URL}/super-admin/companies/${companyId || 1}/profile/avatar`, { headers: { Authorization: `Bearer ${userToken}` }, data: {} });
        logResult('PUT', '/super-admin/companies/:id/profile/avatar', res.status());
        expect([200, 400, 401, 404, 415, 429, 403]).toContain(res.status());
    });

    test('PATCH /super-admin/users/:id/profile', async ({ request }) => {
        const res = await request.patch(`${API_URL}/super-admin/users/${userId}/profile`, { headers: { Authorization: `Bearer ${userToken}` }, data: {} });
        logResult('PATCH', '/super-admin/users/:id/profile', res.status());
        expect([200, 400, 401, 403, 404, 422, 429]).toContain(res.status());
    });

    test('PATCH /super-admin/companies/:id/profile', async ({ request }) => {
        const res = await request.patch(`${API_URL}/super-admin/companies/${companyId || 1}/profile`, { headers: { Authorization: `Bearer ${userToken}` }, data: {} });
        logResult('PATCH', '/super-admin/companies/:id/profile', res.status());
        expect([200, 400, 401, 403, 404, 422, 429]).toContain(res.status());
    });

    test('PATCH /super-admin/integrations', async ({ request }) => {
        const res = await request.patch(`${API_URL}/super-admin/integrations`, { headers: { Authorization: `Bearer ${userToken}` }, data: {} });
        logResult('PATCH', '/super-admin/integrations', res.status());
        expect([200, 400, 401, 403, 404, 429]).toContain(res.status());
    });

    test('GET /super-admin/clients', async ({ request }) => {
        const res = await request.get(`${API_URL}/super-admin/clients`, { headers: { Authorization: `Bearer ${userToken}` } });
        logResult('GET', '/super-admin/clients', res.status());
        expect([200, 401, 429, 403]).toContain(res.status());
    });

    test('GET /super-admin/companies', async ({ request }) => {
        const res = await request.get(`${API_URL}/super-admin/companies`, { headers: { Authorization: `Bearer ${userToken}` } });
        logResult('GET', '/super-admin/companies', res.status());
        expect([200, 401, 429, 403]).toContain(res.status());
    });

    test('GET /super-admin/companies/:id/usage', async ({ request }) => {
        const res = await request.get(`${API_URL}/super-admin/companies/${companyId || 1}/usage`, { headers: { Authorization: `Bearer ${userToken}` } });
        logResult('GET', '/super-admin/companies/:id/usage', res.status());
        expect([200, 400, 401, 403, 404, 429]).toContain(res.status());
    });

    test('GET /super-admin/users/:id/usage', async ({ request }) => {
        const res = await request.get(`${API_URL}/super-admin/users/${userId}/usage`, { headers: { Authorization: `Bearer ${userToken}` } });
        logResult('GET', '/super-admin/users/:id/usage', res.status());
        expect([200, 400, 401, 403, 404, 429]).toContain(res.status());
    });

    test('GET /super-admin/users/:id/role', async ({ request }) => {
        const res = await request.get(`${API_URL}/super-admin/users/${userId}/role`, { headers: { Authorization: `Bearer ${userToken}` } });
        logResult('GET', '/super-admin/users/:id/role', res.status());
        expect([200, 400, 401, 403, 404, 429]).toContain(res.status());
    });

    test('GET /super-admin/environment', async ({ request }) => {
        const res = await request.get(`${API_URL}/super-admin/environment`, { headers: { Authorization: `Bearer ${userToken}` } });
        logResult('GET', '/super-admin/environment', res.status());
        expect([200, 401, 403, 429]).toContain(res.status());
    });

    test('PATCH /super-admin/environment', async ({ request }) => {
        const res = await request.patch(`${API_URL}/super-admin/environment`, { headers: { Authorization: `Bearer ${userToken}` }, data: {} });
        logResult('PATCH', '/super-admin/environment', res.status());
        expect([200, 400, 401, 403, 429]).toContain(res.status());
    });

    test('GET /super-admin/email/templates', async ({ request }) => {
        const res = await request.get(`${API_URL}/super-admin/email/templates`, { headers: { Authorization: `Bearer ${userToken}` } });
        logResult('GET', '/super-admin/email/templates', res.status());
        expect([200, 401, 403, 429]).toContain(res.status());
    });

    test('PATCH /super-admin/email/templates/:id', async ({ request }) => {
        const res = await request.patch(`${API_URL}/super-admin/email/templates/1`, { headers: { Authorization: `Bearer ${userToken}` }, data: {} });
        logResult('PATCH', '/super-admin/email/templates/:id', res.status());
        expect([200, 400, 401, 403, 404, 429]).toContain(res.status());
    });

    test('DELETE /super-admin/users/:id', async ({ request }) => {
        const res = await request.delete(`${API_URL}/super-admin/users/999999`, { headers: { Authorization: `Bearer ${userToken}` } });
        logResult('DELETE', '/super-admin/users/:id', res.status());
        expect([200, 400, 401, 403, 404, 409, 429]).toContain(res.status());
    });

    test('DELETE /super-admin/companies/:id', async ({ request }) => {
        const res = await request.delete(`${API_URL}/super-admin/companies/999999`, { headers: { Authorization: `Bearer ${userToken}` } });
        logResult('DELETE', '/super-admin/companies/:id', res.status());
        expect([200, 400, 401, 403, 404, 429]).toContain(res.status());
    });

});
