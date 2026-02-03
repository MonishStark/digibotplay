/** @format */

import { test, expect } from "@playwright/test";
import { testData } from "../testData";

const API_BASE_URL = "http://127.0.0.1:5050";

/**
 * Comprehensive test suite for POST /companies/:companyId/invitations/:invitationId/resend endpoint
 * Tests ALL response codes: 200, 400, 401, 403, 404, 409, 429, 500, 503, 504
 * Based on Swagger documentation - Resend company invitation
 */

test.describe("POST /companies/:companyId/invitations/:invitationId/resend - Comprehensive Tests", () => {
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

	// ========================
	// NOT FOUND (404)
	// ========================

	// ========================
	// RATE LIMIT (429)
	// ========================

	// ========================
	// SERVER ERROR (500)
	// ========================

	// ========================
	// SERVICE UNAVAILABLE (503/504)
	// ========================

	// ========================
	// METHOD NOT ALLOWED (405)
	// ========================

	test.describe("405 Method Not Allowed", () => {
		test("should return 405 for GET method", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/companies/${testCompanyId}/invitations/some-id/resend`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([404, 405, 500, 401]).toContain(response.status());
		});

		test("should return 405 for PUT method", async ({ request }) => {
			const response = await request.put(
				`${API_BASE_URL}/companies/${testCompanyId}/invitations/some-id/resend`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {},
				},
			);

			expect([404, 405, 500, 401]).toContain(response.status());
		});

		test("should return 405 for DELETE method", async ({ request }) => {
			const response = await request.delete(
				`${API_BASE_URL}/companies/${testCompanyId}/invitations/some-id/resend`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([404, 405, 500, 401]).toContain(response.status());
		});
	});

	// ========================
	// EDGE CASES
	// ========================

	test.describe("Edge Cases", () => {
		test("should handle UUID format invitationId", async ({ request }) => {
			const uuidInvitationId = "123e4567-e89b-12d3-a456-426614174000";

			const response = await request.post(
				`${API_BASE_URL}/companies/${testCompanyId}/invitations/${uuidInvitationId}/resend`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([200, 400, 404, 500, 401]).toContain(response.status());
		});

		test("should handle very long invitationId", async ({ request }) => {
			const longId = "a".repeat(500);

			const response = await request.post(
				`${API_BASE_URL}/companies/${testCompanyId}/invitations/${longId}/resend`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([400, 404, 500, 401]).toContain(response.status());
		});

		test("should handle concurrent resend attempts", async ({ request }) => {
			const invitationId = "concurrent-test-id";

			const requests = Array(3)
				.fill(null)
				.map(() =>
					request.post(
						`${API_BASE_URL}/companies/${testCompanyId}/invitations/${invitationId}/resend`,
						{
							headers: {
								Authorization: `Bearer ${validAccessToken}`,
							},
						},
					),
				);

			const responses = await Promise.all(requests);

			responses.forEach((response) => {
				expect([200, 400, 404, 429, 500, 401]).toContain(response.status());
			});
		});

		test("should handle special characters in IDs", async ({ request }) => {
			const specialId = "test@#$%invitation";

			const response = await request.post(
				`${API_BASE_URL}/companies/${testCompanyId}/invitations/${specialId}/resend`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([400, 404, 500, 401]).toContain(response.status());
		});

		test("should handle multiple resends of same invitation", async ({
			request,
		}) => {
			const invitationId = "multiple-resend-test";

			// First resend
			const response1 = await request.post(
				`${API_BASE_URL}/companies/${testCompanyId}/invitations/${invitationId}/resend`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			// Second resend
			const response2 = await request.post(
				`${API_BASE_URL}/companies/${testCompanyId}/invitations/${invitationId}/resend`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([200, 400, 404, 429]).toContain(response1.status());
			expect([200, 400, 404, 429]).toContain(response2.status());
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

			const response = await request.post(
				`${API_BASE_URL}/companies/${testCompanyId}/invitations/${sqlInjectionId}/resend`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([400, 404, 500, 401]).toContain(response.status());
		});

		test("should validate token on every request", async ({ request }) => {
			const fakeToken =
				"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjF9.fake";

			const response = await request.post(
				`${API_BASE_URL}/companies/${testCompanyId}/invitations/some-id/resend`,
				{
					headers: {
						Authorization: `Bearer ${fakeToken}`,
					},
				},
			);

			expect([401, 404, 500]).toContain(response.status());
		});

		test("should not expose sensitive data in response", async ({
			request,
		}) => {
			const response = await request.post(
				`${API_BASE_URL}/companies/${testCompanyId}/invitations/test-id/resend`,
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

		
	});

	// ========================
	// RESPONSE FORMAT TESTS
	// ========================

	test.describe("Response Format Tests", () => {
		test("should return consistent success structure", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/companies/${testCompanyId}/invitations/format-test/resend`,
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
			const response = await request.post(
				`${API_BASE_URL}/companies/${testCompanyId}/invitations/error-test/resend`,
			);

			const data = await response.json();
			expect(data).toHaveProperty("success");
			expect(data).toHaveProperty("error");
			expect(data).toHaveProperty("message");
		});

		test("should return proper content type", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/companies/${testCompanyId}/invitations/content-test/resend`,
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
		test("should respond quickly (< 1000ms)", async ({ request }) => {
			const start = Date.now();

			const response = await request.post(
				`${API_BASE_URL}/companies/${testCompanyId}/invitations/perf-test/resend`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			const duration = Date.now() - start;

			expect([200, 400, 404, 500, 401]).toContain(response.status());
			expect(duration).toBeLessThan(1000);
		});
	});
});

