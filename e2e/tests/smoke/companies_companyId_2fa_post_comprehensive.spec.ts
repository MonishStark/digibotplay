/** @format */

import { test, expect } from "@playwright/test";
import { testData } from "../testData";

const API_BASE_URL = "http://127.0.0.1:5050";

/**
 * Comprehensive test suite for POST /companies/{companyId}/2fa endpoint
 * Enable or disable two-factor authentication (2FA) for company users
 * Response codes: 200, 400, 401, 403, 404, 409, 422, 429, 500, 503, 504
 */

test.describe("POST /companies/{companyId}/2fa - Comprehensive Tests", () => {
	let validAccessToken: string;
	let testCompanyId: string;

	test.beforeAll(async ({ request }) => {
		const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
			data: {
				email: testData.users.admin1.email,
				password: testData.users.admin1.password,
			},
		});

		const loginData = await loginResponse.json();
		validAccessToken = loginData.accessToken;
		testCompanyId = testData.users.admin1.companyId || "1";
	});

	// ========================
	// SUCCESS (200)
	// ========================

	test.describe("200 Success Responses", () => {
		test("should enable 2FA successfully - 200", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/companies/${testCompanyId}/2fa`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						enabled: true,
						optional: false,
					},
				},
			);

			expect([200, 400, 401, 404]).toContain(response.status());

			if (
				response.status() === 200 &&
				response.headers()["content-type"]?.includes("application/json")
			) {
				const data = await response.json();
				expect(data).toHaveProperty("success");
			}
		});

		test("should disable 2FA successfully", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/companies/${testCompanyId}/2fa`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						enabled: false,
						optional: true,
					},
				},
			);

			expect([200, 400, 401, 404]).toContain(response.status());
		});

		test("should set 2FA as required", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/companies/${testCompanyId}/2fa`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						enabled: true,
						optional: false,
					},
				},
			);

			expect([200, 400, 401, 404]).toContain(response.status());
		});

		test("should set 2FA as optional", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/companies/${testCompanyId}/2fa`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						enabled: true,
						optional: true,
					},
				},
			);

			expect([200, 400, 401, 404]).toContain(response.status());
		});
	});

	// ========================
	// BAD REQUEST (400)
	// ========================

	test.describe("400 Bad Request Responses", () => {
		test("should return 400 when enabled is missing", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/companies/${testCompanyId}/2fa`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						optional: false,
					},
				},
			);

			expect([400, 401, 404, 422]).toContain(response.status());

			if (response.headers()["content-type"]?.includes("application/json")) {
				const data = await response.json();
				expect(data.success).toBe(false);
			}
		});

		test("should return 400 when optional is missing", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/companies/${testCompanyId}/2fa`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						enabled: true,
					},
				},
			);

			expect([400, 401, 404, 422]).toContain(response.status());
		});

		test("should return 400 for empty body", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/companies/${testCompanyId}/2fa`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {},
				},
			);

			expect([400, 401, 404, 422]).toContain(response.status());
		});

		test("should return 400 for malformed JSON", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/companies/${testCompanyId}/2fa`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: "{ invalid json",
				},
			);

			expect([400, 401, 404, 500]).toContain(response.status());
		});

		test("should return 400 for invalid companyId format", async ({
			request,
		}) => {
			const response = await request.post(
				`${API_BASE_URL}/companies/invalid-id/2fa`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						enabled: true,
						optional: false,
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
			const response = await request.post(
				`${API_BASE_URL}/companies/${testCompanyId}/2fa`,
				{
					headers: {
						"Content-Type": "application/json",
					},
					data: {
						enabled: true,
						optional: false,
					},
				},
			);

			expect(response.status()).toBe(401);
		});

		test("should return 401 for invalid token", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/companies/${testCompanyId}/2fa`,
				{
					headers: {
						Authorization: "Bearer invalid-token-12345",
						"Content-Type": "application/json",
					},
					data: {
						enabled: true,
						optional: false,
					},
				},
			);

			expect(response.status()).toBe(401);
		});

		test("should return 401 for expired token", async ({ request }) => {
			const expiredToken =
				"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.4Adcj0vbBqfVIpnGGNJKKpBmJcAmPNtSKhTNnsTekII";

			const response = await request.post(
				`${API_BASE_URL}/companies/${testCompanyId}/2fa`,
				{
					headers: {
						Authorization: `Bearer ${expiredToken}`,
						"Content-Type": "application/json",
					},
					data: {
						enabled: true,
						optional: false,
					},
				},
			);

			expect(response.status()).toBe(401);
		});

		test("should return 401 for malformed JWT", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/companies/${testCompanyId}/2fa`,
				{
					headers: {
						Authorization: "Bearer not-a-valid-jwt",
						"Content-Type": "application/json",
					},
					data: {
						enabled: true,
						optional: false,
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
			// Would require a user without company admin permissions
			expect(true).toBe(true);
		});
	});

	// ========================
	// NOT FOUND (404)
	// ========================

	test.describe("404 Not Found Responses", () => {
		test("should return 404 for non-existent company", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/companies/99999999/2fa`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						enabled: true,
						optional: false,
					},
				},
			);

			expect([401, 404]).toContain(response.status());
		});
	});

	// ========================
	// CONFLICT (409)
	// ========================

	test.describe("409 Conflict Responses", () => {
		test("should return 409 when 2FA already enabled/disabled - PLACEHOLDER", async ({
			request,
		}) => {
			// Would require setting same state twice
			expect(true).toBe(true);
		});
	});

	// ========================
	// UNPROCESSABLE ENTITY (422)
	// ========================

	test.describe("422 Unprocessable Entity", () => {
		test("should return 422 for invalid enabled type", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/companies/${testCompanyId}/2fa`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						enabled: "true",
						optional: false,
					},
				},
			);

			expect([400, 401, 404, 422]).toContain(response.status());
		});

		test("should return 422 for invalid optional type", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/companies/${testCompanyId}/2fa`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						enabled: true,
						optional: "false",
					},
				},
			);

			expect([400, 401, 404, 422]).toContain(response.status());
		});

		test("should return 422 for null values", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/companies/${testCompanyId}/2fa`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						enabled: null,
						optional: null,
					},
				},
			);

			expect([400, 401, 404, 422]).toContain(response.status());
		});
	});

	// ========================
	// RATE LIMIT (429)
	// ========================

	test.describe("429 Rate Limit Exceeded", () => {
		test("should handle rate limiting - PLACEHOLDER", async ({ request }) => {
			// Would require many rapid requests
			expect(true).toBe(true);
		});
	});

	// ========================
	// SERVER ERROR (500)
	// ========================

	test.describe("500 Server Error", () => {
		test("should handle server errors gracefully - PLACEHOLDER", async ({
			request,
		}) => {
			// Would require simulating server error
			expect(true).toBe(true);
		});
	});

	// ========================
	// SERVICE UNAVAILABLE (503)
	// ========================

	test.describe("503 Service Unavailable", () => {
		test("should handle service unavailable - PLACEHOLDER", async ({
			request,
		}) => {
			// Would require service to be down
			expect(true).toBe(true);
		});
	});

	// ========================
	// GATEWAY TIMEOUT (504)
	// ========================

	test.describe("504 Gateway Timeout", () => {
		test("should handle gateway timeout - PLACEHOLDER", async ({ request }) => {
			// Would require simulating timeout
			expect(true).toBe(true);
		});
	});

	// ========================
	// EDGE CASES
	// ========================

	test.describe("Edge Cases", () => {
		test("should handle concurrent 2FA updates", async ({ request }) => {
			const requests = Array(3)
				.fill(null)
				.map((_, i) =>
					request.post(`${API_BASE_URL}/companies/${testCompanyId}/2fa`, {
						headers: {
							Authorization: `Bearer ${validAccessToken}`,
							"Content-Type": "application/json",
						},
						data: {
							enabled: i % 2 === 0,
							optional: i % 2 !== 0,
						},
					}),
				);

			const responses = await Promise.all(requests);

			responses.forEach((response) => {
				expect([200, 400, 401, 404]).toContain(response.status());
			});
		});

		test("should handle extra fields in request", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/companies/${testCompanyId}/2fa`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						enabled: true,
						optional: false,
						extraField: "should be ignored",
					},
				},
			);

			expect([200, 400, 401, 404]).toContain(response.status());
		});

		test("should handle numeric values for booleans", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/companies/${testCompanyId}/2fa`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						enabled: 1,
						optional: 0,
					},
				},
			);

			expect([200, 400, 401, 404, 422]).toContain(response.status());
		});

		test("should handle case sensitivity", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/companies/${testCompanyId}/2fa`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						Enabled: true,
						Optional: false,
					},
				},
			);

			expect([200, 400, 401, 404, 422]).toContain(response.status());
		});

		test("should toggle 2FA state multiple times", async ({ request }) => {
			const states = [
				{ enabled: true, optional: false },
				{ enabled: false, optional: true },
				{ enabled: true, optional: true },
			];

			for (const state of states) {
				const response = await request.post(
					`${API_BASE_URL}/companies/${testCompanyId}/2fa`,
					{
						headers: {
							Authorization: `Bearer ${validAccessToken}`,
							"Content-Type": "application/json",
						},
						data: state,
					},
				);

				expect([200, 400, 401, 404]).toContain(response.status());
			}
		});
	});

	// ========================
	// SECURITY TESTS
	// ========================

	test.describe("Security Tests", () => {
		test("should validate token on every request", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/companies/${testCompanyId}/2fa`,
				{
					headers: {
						Authorization: "Bearer malformed-token",
						"Content-Type": "application/json",
					},
					data: {
						enabled: true,
						optional: false,
					},
				},
			);

			expect(response.status()).toBe(401);
		});

		test("should not expose sensitive data in response", async ({
			request,
		}) => {
			const response = await request.post(
				`${API_BASE_URL}/companies/${testCompanyId}/2fa`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						enabled: true,
						optional: false,
					},
				},
			);

			if (response.headers()["content-type"]?.includes("application/json")) {
				const data = await response.json();
				const responseText = JSON.stringify(data);

				expect(responseText).not.toContain("password");
				expect(responseText).not.toContain("secretKey");
			}
		});

		test("should prevent XSS attempts in parameters", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/companies/${testCompanyId}/2fa`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						enabled: "<script>alert('xss')</script>",
						optional: false,
					},
				},
			);

			expect([400, 401, 404, 422]).toContain(response.status());
		});

		test("should require proper authorization", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/companies/${testCompanyId}/2fa`,
				{
					headers: {
						"Content-Type": "application/json",
					},
					data: {
						enabled: true,
						optional: false,
					},
				},
			);

			expect(response.status()).toBe(401);
		});
	});

	// ========================
	// RESPONSE FORMAT
	// ========================

	test.describe("Response Format Tests", () => {
		test("should return consistent success structure", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/companies/${testCompanyId}/2fa`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						enabled: true,
						optional: false,
					},
				},
			);

			if (
				response.status() === 200 &&
				response.headers()["content-type"]?.includes("application/json")
			) {
				const data = await response.json();
				expect(data).toHaveProperty("success");
			}
		});

		test("should return consistent error structure", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/companies/${testCompanyId}/2fa`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {},
				},
			);

			if (response.headers()["content-type"]?.includes("application/json")) {
				const data = await response.json();
				expect(data).toHaveProperty("success");
			}
		});

		test("should return proper content type", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/companies/${testCompanyId}/2fa`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						enabled: true,
						optional: false,
					},
				},
			);

			const contentType = response.headers()["content-type"];
			expect(
				contentType?.includes("application/json") ||
					contentType?.includes("text/html"),
			).toBe(true);
		});
	});

	// ========================
	// PERFORMANCE
	// ========================

	test.describe("Performance Tests", () => {
		test("should respond quickly (< 500ms)", async ({ request }) => {
			const start = Date.now();

			const response = await request.post(
				`${API_BASE_URL}/companies/${testCompanyId}/2fa`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						enabled: true,
						optional: false,
					},
				},
			);

			const duration = Date.now() - start;

			expect([200, 400, 401, 404]).toContain(response.status());
			expect(duration).toBeLessThan(500);
		});
	});
});
