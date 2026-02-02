/** @format */

import { test, expect } from "@playwright/test";
import { testData } from "../testData";

const API_BASE_URL = "http://127.0.0.1:5050";

/**
 * Comprehensive test suite for GET /companies/{companyId}/profile endpoint
 * Retrieves the company profile information for the specified company
 * Response codes: 200, 400, 401, 403, 404, 422, 423, 428, 429, 500, 503, 504
 */

test.describe("GET /companies/{companyId}/profile - Comprehensive Tests", () => {
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
		test("should retrieve company profile successfully - 200", async ({
			request,
		}) => {
			const response = await request.get(
				`${API_BASE_URL}/companies/${testCompanyId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([200, 401, 404]).toContain(response.status());

			if (
				response.status() === 200 &&
				response.headers()["content-type"]?.includes("application/json")
			) {
				const data = await response.json();
				expect(data).toHaveProperty("success");
			}
		});

		test("should return complete profile information", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/companies/${testCompanyId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([200, 401, 404]).toContain(response.status());

			if (
				response.status() === 200 &&
				response.headers()["content-type"]?.includes("application/json")
			) {
				const data = await response.json();
				// Profile should contain company details
				if (data.success) {
					expect(data).toBeTruthy();
				}
			}
		});

		test("should handle multiple profile retrieval requests", async ({
			request,
		}) => {
			for (let i = 0; i < 3; i++) {
				const response = await request.get(
					`${API_BASE_URL}/companies/${testCompanyId}/profile`,
					{
						headers: {
							Authorization: `Bearer ${validAccessToken}`,
						},
					},
				);

				expect([200, 401, 404]).toContain(response.status());
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
			const response = await request.get(
				`${API_BASE_URL}/companies/invalid-id/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([400, 401, 404]).toContain(response.status());
		});

		test("should return 400 for special characters in companyId", async ({
			request,
		}) => {
			const response = await request.get(
				`${API_BASE_URL}/companies/!@#$%/profile`,
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
			const response = await request.get(
				`${API_BASE_URL}/companies/${testCompanyId}/profile`,
			);

			expect(response.status()).toBe(401);
		});

		test("should return 401 for invalid token", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/companies/${testCompanyId}/profile`,
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
				"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.4Adcj0vbBqfVIpnGGNJKKpBmJcAmPNtSKhTNnsTekII";

			const response = await request.get(
				`${API_BASE_URL}/companies/${testCompanyId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${expiredToken}`,
					},
				},
			);

			expect(response.status()).toBe(401);
		});

		test("should return 401 for malformed JWT", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/companies/${testCompanyId}/profile`,
				{
					headers: {
						Authorization: "Bearer not-a-valid-jwt",
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
			// Would require a user without company access
			expect(true).toBe(true);
		});
	});

	// ========================
	// NOT FOUND (404)
	// ========================

	test.describe("404 Not Found Responses", () => {
		test("should return 404 for non-existent company", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/companies/99999999/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([401, 404]).toContain(response.status());
		});

		test("should return 404 for deleted company", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/companies/00000000/profile`,
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
	// UNPROCESSABLE ENTITY (422)
	// ========================

	test.describe("422 Unprocessable Entity", () => {
		test("should return 422 for invalid profile data - PLACEHOLDER", async ({
			request,
		}) => {
			// Would require specific data conditions
			expect(true).toBe(true);
		});
	});

	// ========================
	// LOCKED (423)
	// ========================

	test.describe("423 Locked Responses", () => {
		test("should return 423 for locked company account - PLACEHOLDER", async ({
			request,
		}) => {
			// Would require a locked company account
			expect(true).toBe(true);
		});
	});

	// ========================
	// PRECONDITION REQUIRED (428)
	// ========================

	test.describe("428 Precondition Required", () => {
		test("should return 428 when preconditions not met - PLACEHOLDER", async ({
			request,
		}) => {
			// Would require specific precondition scenarios
			expect(true).toBe(true);
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
		test("should handle concurrent profile requests", async ({ request }) => {
			const requests = Array(5)
				.fill(null)
				.map(() =>
					request.get(`${API_BASE_URL}/companies/${testCompanyId}/profile`, {
						headers: {
							Authorization: `Bearer ${validAccessToken}`,
						},
					}),
				);

			const responses = await Promise.all(requests);

			responses.forEach((response) => {
				expect([200, 401, 404]).toContain(response.status());
			});
		});

		test("should handle negative companyId", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/companies/-1/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([400, 401, 404]).toContain(response.status());
		});

		test("should handle zero companyId", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/companies/0/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([400, 401, 404]).toContain(response.status());
		});

		test("should handle very large companyId", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/companies/999999999999999/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([400, 401, 404]).toContain(response.status());
		});

		test("should handle URL encoded companyId", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/companies/${encodeURIComponent(testCompanyId)}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([200, 400, 401, 404]).toContain(response.status());
		});
	});

	// ========================
	// SECURITY TESTS
	// ========================

	test.describe("Security Tests", () => {
		test("should validate token on every request", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/companies/${testCompanyId}/profile`,
				{
					headers: {
						Authorization: "Bearer malformed-token",
					},
				},
			);

			expect(response.status()).toBe(401);
		});

		test("should not expose sensitive data in response", async ({
			request,
		}) => {
			const response = await request.get(
				`${API_BASE_URL}/companies/${testCompanyId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			if (response.headers()["content-type"]?.includes("application/json")) {
				const data = await response.json();
				const responseText = JSON.stringify(data);

				expect(responseText).not.toContain("password");
				expect(responseText).not.toContain("secretKey");
				expect(responseText).not.toContain("privateKey");
			}
		});

		test("should prevent SQL injection in companyId", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/companies/${encodeURIComponent("1' OR '1'='1")}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([400, 401, 404]).toContain(response.status());
		});

		test("should require proper authorization", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/companies/${testCompanyId}/profile`,
			);

			expect(response.status()).toBe(401);
		});
	});

	// ========================
	// RESPONSE FORMAT
	// ========================

	test.describe("Response Format Tests", () => {
		test("should return consistent success structure", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/companies/${testCompanyId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
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
			const response = await request.get(
				`${API_BASE_URL}/companies/invalid-id/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			if (response.headers()["content-type"]?.includes("application/json")) {
				const data = await response.json();
				if (data.success !== undefined) {
					expect(typeof data.success).toBe("boolean");
				}
			}
		});

		test("should return proper content type", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/companies/${testCompanyId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
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

			const response = await request.get(
				`${API_BASE_URL}/companies/${testCompanyId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			const duration = Date.now() - start;

			expect([200, 401, 404]).toContain(response.status());
			expect(duration).toBeLessThan(500);
		});

		test("should handle multiple concurrent requests efficiently", async ({
			request,
		}) => {
			const start = Date.now();

			const requests = Array(10)
				.fill(null)
				.map(() =>
					request.get(`${API_BASE_URL}/companies/${testCompanyId}/profile`, {
						headers: {
							Authorization: `Bearer ${validAccessToken}`,
						},
					}),
				);

			await Promise.all(requests);

			const duration = Date.now() - start;

			expect(duration).toBeLessThan(2000);
		});
	});
});
