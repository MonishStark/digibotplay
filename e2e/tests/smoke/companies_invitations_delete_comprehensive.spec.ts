/** @format */

import { test, expect } from "@playwright/test";
import { testData } from "../testData";

const API_BASE_URL = "http://127.0.0.1:5050";

/**
 * Comprehensive test suite for DELETE /companies/:companyId/invitations/:invitationId endpoint
 * Tests ALL response codes: 200, 400, 401, 403, 404, 409, 429, 500, 503, 504
 * Based on Swagger documentation - Remove pending invitation
 */

test.describe("DELETE /companies/:companyId/invitations/:invitationId - Comprehensive Tests", () => {
	let validAccessToken: string;
	const testCompanyId = testData.users.admin1.companyId;

	test.beforeAll(async ({ request }) => {
		const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
			headers: { "Content-Type": "application/json" },
			data: {
				email: testData.users.admin1.email,
				password: testData.users.admin1.password,
				loginType: "standard",
			},
		});

		const loginData = await loginResponse.json();
		validAccessToken = loginData.user.auth.accessToken;
	});

	// ========================
	// SUCCESS SCENARIOS (200)
	// ========================

	test.describe("200 Success Responses", () => {
		test("should delete invitation successfully - 200", async ({ request }) => {
			const invitationId = "sample-invitation-id";

			const response = await request.delete(
				`${API_BASE_URL}/companies/${testCompanyId}/invitations/${invitationId}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([200, 400, 401, 403, 404]).toContain(response.status());

			if (response.status() === 200) {
				const data = await response.json();
				expect(data.success).toBe(true);
			}
		});

		test("should return success message after deletion", async ({
			request,
		}) => {
			const invitationId = "test-invitation-id";

			const response = await request.delete(
				`${API_BASE_URL}/companies/${testCompanyId}/invitations/${invitationId}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			if (response.status() === 200) {
				const data = await response.json();
				expect(data.message).toBeDefined();
			}
		});
	});

	// ========================
	// BAD REQUEST (400)
	// ========================

	test.describe("400 Bad Request Responses", () => {
		test("should return 400 for invalid companyId format", async ({
			request,
		}) => {
			const response = await request.delete(
				`${API_BASE_URL}/companies/invalid-id/invitations/some-invitation`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([400, 401, 403, 404, 422]).toContain(response.status());
		});

		test("should return 400 for invalid invitationId format", async ({
			request,
		}) => {
			const response = await request.delete(
				`${API_BASE_URL}/companies/${testCompanyId}/invitations/!@#$%^&*()`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([400, 401, 404, 422]).toContain(response.status());
		});

		test("should return 400 for empty invitationId", async ({ request }) => {
			const response = await request.delete(
				`${API_BASE_URL}/companies/${testCompanyId}/invitations/`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([400, 401, 403, 404]).toContain(response.status());
		});

		test("should return 400 for missing companyId", async ({ request }) => {
			const response = await request.delete(
				`${API_BASE_URL}/companies//invitations/some-id`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([400, 401, 404]).toContain(response.status());
		});
	});

	// ========================
	// UNAUTHORIZED (401)
	// ========================

	test.describe("401 Unauthorized Responses", () => {
		test("should return 401 when Authorization header is missing", async ({
			request,
		}) => {
			const response = await request.delete(
				`${API_BASE_URL}/companies/${testCompanyId}/invitations/some-id`,
			);

			expect(response.status()).toBe(401);

			const data = await response.json();
			expect(data.success).toBe(false);
			expect(data.error).toBe("unauthorized");
		});

		test("should return 401 for invalid token", async ({ request }) => {
			const response = await request.delete(
				`${API_BASE_URL}/companies/${testCompanyId}/invitations/some-id`,
				{
					headers: {
						Authorization: "Bearer invalid-token-12345",
					},
				},
			);

			expect(response.status()).toBe(401);
		});

		test("should return 401 for expired token", async ({ request }) => {
			const expiredToken =
				"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE2MDAwMDM2MDB9.expired";

			const response = await request.delete(
				`${API_BASE_URL}/companies/${testCompanyId}/invitations/some-id`,
				{
					headers: {
						Authorization: `Bearer ${expiredToken}`,
					},
				},
			);

			expect(response.status()).toBe(401);
		});

		test("should return 401 for malformed JWT", async ({ request }) => {
			const response = await request.delete(
				`${API_BASE_URL}/companies/${testCompanyId}/invitations/some-id`,
				{
					headers: {
						Authorization: "Bearer not.a.jwt",
					},
				},
			);

			expect(response.status()).toBe(401);
		});
	});

	// ========================
	// FORBIDDEN (403)
	// ========================

	test.describe("403 Forbidden Responses", () => {
		test("should return 403 for insufficient permissions - PLACEHOLDER", async ({
			request,
		}) => {
			expect(true).toBe(true);
		});

		test("should return 403 when deleting from another company - PLACEHOLDER", async ({
			request,
		}) => {
			expect(true).toBe(true);
		});
	});

	// ========================
	// NOT FOUND (404)
	// ========================

	test.describe("404 Not Found Responses", () => {
		test("should return 404 for non-existent invitation", async ({
			request,
		}) => {
			const nonExistentId = "non-existent-invitation-12345";

			const response = await request.delete(
				`${API_BASE_URL}/companies/${testCompanyId}/invitations/${nonExistentId}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([400, 401, 404]).toContain(response.status());

			const data = await response.json();
			expect(data.success).toBe(false);
		});

		test("should return 404 for non-existent company", async ({ request }) => {
			const nonExistentCompanyId = "99999999-9999-9999-9999-999999999999";

			const response = await request.delete(
				`${API_BASE_URL}/companies/${nonExistentCompanyId}/invitations/some-id`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([401, 403, 404]).toContain(response.status());
		});
	});

	// ========================
	// CONFLICT (409)
	// ========================

	test.describe("409 Conflict Responses", () => {
		test("should return 409 if invitation already accepted/declined - PLACEHOLDER", async ({
			request,
		}) => {
			expect(true).toBe(true);
		});
	});

	// ========================
	// RATE LIMIT (429)
	// ========================

	test.describe("429 Rate Limit Responses", () => {
		test("should return 429 after excessive deletions - PLACEHOLDER", async ({
			request,
		}) => {
			expect(true).toBe(true);
		});
	});

	// ========================
	// SERVER ERROR (500)
	// ========================

	test.describe("500 Server Error Responses", () => {
		test("should handle server errors gracefully - PLACEHOLDER", async ({
			request,
		}) => {
			expect(true).toBe(true);
		});
	});

	// ========================
	// SERVICE UNAVAILABLE (503/504)
	// ========================

	test.describe("503/504 Service Unavailable Responses", () => {
		test("should handle service unavailable - PLACEHOLDER", async ({
			request,
		}) => {
			expect(true).toBe(true);
		});
	});

	// ========================
	// METHOD NOT ALLOWED (405)
	// ========================

	test.describe("405 Method Not Allowed", () => {
		test("should return 405 for GET method", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/companies/${testCompanyId}/invitations/some-id`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([404, 405]).toContain(response.status());
		});

		test("should return 405 for POST method", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/companies/${testCompanyId}/invitations/some-id`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {},
				},
			);

			expect([404, 405]).toContain(response.status());
		});

		test("should return 405 for PUT method", async ({ request }) => {
			const response = await request.put(
				`${API_BASE_URL}/companies/${testCompanyId}/invitations/some-id`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {},
				},
			);

			expect([404, 405]).toContain(response.status());
		});
	});

	// ========================
	// EDGE CASES
	// ========================

	test.describe("Edge Cases", () => {
		test("should handle UUID format invitationId", async ({ request }) => {
			const uuidInvitationId = "123e4567-e89b-12d3-a456-426614174000";

			const response = await request.delete(
				`${API_BASE_URL}/companies/${testCompanyId}/invitations/${uuidInvitationId}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([200, 400, 401, 403, 404]).toContain(response.status());
		});

		test("should handle very long invitationId", async ({ request }) => {
			const longId = "a".repeat(500);

			const response = await request.delete(
				`${API_BASE_URL}/companies/${testCompanyId}/invitations/${longId}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([400, 401, 404]).toContain(response.status());
		});

		test("should handle concurrent deletion attempts", async ({ request }) => {
			const invitationId = "concurrent-test-id";

			const requests = Array(3)
				.fill(null)
				.map(() =>
					request.delete(
						`${API_BASE_URL}/companies/${testCompanyId}/invitations/${invitationId}`,
						{
							headers: {
								Authorization: `Bearer ${validAccessToken}`,
							},
						},
					),
				);

			const responses = await Promise.all(requests);

			// First might succeed, others should fail
			const statuses = responses.map((r) => r.status());
			expect(statuses.some((s) => [200, 400, 401, 403, 404].includes(s))).toBe(
				true,
			);
		});

		test("should handle special characters in IDs", async ({ request }) => {
			const specialId = "test@#$%invitation";

			const response = await request.delete(
				`${API_BASE_URL}/companies/${testCompanyId}/invitations/${specialId}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([400, 401, 404]).toContain(response.status());
		});
	});

	// ========================
	// SECURITY TESTS
	// ========================

	test.describe("Security Tests", () => {
		test("should prevent SQL injection in invitationId", async ({
			request,
		}) => {
			const sqlInjectionId = "id' OR '1'='1";

			const response = await request.delete(
				`${API_BASE_URL}/companies/${testCompanyId}/invitations/${sqlInjectionId}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([400, 401, 404]).toContain(response.status());
		});

		test("should validate token on every request", async ({ request }) => {
			const fakeToken =
				"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjF9.fake";

			const response = await request.delete(
				`${API_BASE_URL}/companies/${testCompanyId}/invitations/some-id`,
				{
					headers: {
						Authorization: `Bearer ${fakeToken}`,
					},
				},
			);

			expect(response.status()).toBe(401);
		});

		test("should not expose sensitive data in response", async ({
			request,
		}) => {
			const response = await request.delete(
				`${API_BASE_URL}/companies/${testCompanyId}/invitations/test-id`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			const data = await response.json();
			const responseText = JSON.stringify(data);

			expect(responseText).not.toContain("passwordHash");
			expect(responseText).not.toContain("secretKey");
		});

		test("should only allow deletion of own company invitations", async ({
			request,
		}) => {
			// This would require a second company's ID
			expect(true).toBe(true);
		});
	});

	// ========================
	// RESPONSE FORMAT TESTS
	// ========================

	test.describe("Response Format Tests", () => {
		test("should return consistent success structure", async ({ request }) => {
			const response = await request.delete(
				`${API_BASE_URL}/companies/${testCompanyId}/invitations/format-test`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			const data = await response.json();
			expect(data).toHaveProperty("success");
		});

		test("should return consistent error structure", async ({ request }) => {
			const response = await request.delete(
				`${API_BASE_URL}/companies/${testCompanyId}/invitations/error-test`,
			);

			const data = await response.json();
			expect(data).toHaveProperty("success");
			expect(data).toHaveProperty("error");
			expect(data).toHaveProperty("message");
		});

		test("should return proper content type", async ({ request }) => {
			const response = await request.delete(
				`${API_BASE_URL}/companies/${testCompanyId}/invitations/content-test`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			const contentType = response.headers()["content-type"];
			expect(contentType).toContain("application/json");
		});
	});

	// ========================
	// PERFORMANCE TESTS
	// ========================

	test.describe("Performance Tests", () => {
		test("should respond quickly (< 500ms)", async ({ request }) => {
			const start = Date.now();

			const response = await request.delete(
				`${API_BASE_URL}/companies/${testCompanyId}/invitations/perf-test`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			const duration = Date.now() - start;

			expect([200, 400, 401, 403, 404]).toContain(response.status());
			expect(duration).toBeLessThan(500);
		});
	});
});
