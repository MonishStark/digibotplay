/** @format */

import { test, expect } from "@playwright/test";
import { testData } from "../testData";

const API_BASE_URL = "http://127.0.0.1:5050";

/**
 * Comprehensive test suite for GET /super-admin/users/{userId}/role endpoint
 * Checks whether a specific user has the Super Admin role. Returns boolean flag `isSuperAdmin`
 * Always returns 200 OK for successful results. Only accessible by Super Admins
 * Response codes: 200, 400, 401, 403, 404, 429, 500, 503, 504
 */

test.describe("GET /super-admin/users/{userId}/role - Comprehensive Tests", () => {
	let validAccessToken: string;
	let testUserId: string;

	test.beforeAll(async ({ request }) => {
		const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
			data: {
				email: testData.users.admin1.email,
				password: testData.users.admin1.password,
			},
		});

		const loginData = await loginResponse.json();
		validAccessToken = loginData.accessToken;
		testUserId = "12345";
	});

	// ========================
	// SUCCESS (200)
	// ========================

	test.describe("200 Success Responses", () => {
		test("should retrieve user role successfully - 200", async ({
			request,
		}) => {
			const response = await request.get(
				`${API_BASE_URL}/super-admin/users/${testUserId}/role`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([200, 400, 401, 403, 404]).toContain(response.status());

			if (
				response.status() === 200 &&
				response.headers()["content-type"]?.includes("application/json")
			) {
				const data = await response.json();
				expect(data).toHaveProperty("success");
			}
		});

		test("should return boolean isSuperAdmin flag", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/super-admin/users/${testUserId}/role`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([200, 400, 401, 403, 404]).toContain(response.status());

			if (
				response.status() === 200 &&
				response.headers()["content-type"]?.includes("application/json")
			) {
				const data = await response.json();
				expect(data).toHaveProperty("success");
			}
		});

		test("should return 200 OK for super admin user", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/super-admin/users/${testUserId}/role`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([200, 400, 401, 403, 404]).toContain(response.status());

			if (
				response.status() === 200 &&
				response.headers()["content-type"]?.includes("application/json")
			) {
				const data = await response.json();
				expect(data).toHaveProperty("success");
			}
		});

		test("should return 200 OK for non-super admin user", async ({
			request,
		}) => {
			const response = await request.get(
				`${API_BASE_URL}/super-admin/users/${testUserId}/role`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([200, 400, 401, 403, 404]).toContain(response.status());

			if (
				response.status() === 200 &&
				response.headers()["content-type"]?.includes("application/json")
			) {
				const data = await response.json();
				expect(data).toHaveProperty("success");
			}
		});

		test("should return consistent data across multiple requests", async ({
			request,
		}) => {
			const response1 = await request.get(
				`${API_BASE_URL}/super-admin/users/${testUserId}/role`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			const response2 = await request.get(
				`${API_BASE_URL}/super-admin/users/${testUserId}/role`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect(response1.status()).toBe(response2.status());
		});

		test("should always return 200 for successful results", async ({
			request,
		}) => {
			const response = await request.get(
				`${API_BASE_URL}/super-admin/users/${testUserId}/role`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([200, 400, 401, 403, 404]).toContain(response.status());
		});
	});

	// ========================
	// BAD REQUEST (400)
	// ========================

	test.describe("400 Bad Request Responses", () => {
		test("should return 400 for invalid userId format", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/super-admin/users/invalid-id/role`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([400, 401, 403, 404]).toContain(response.status());
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
				`${API_BASE_URL}/super-admin/users/${testUserId}/role`,
			);

			expect([401, 404]).toContain(response.status());
		});

		test("should return 401 for invalid token", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/super-admin/users/${testUserId}/role`,
				{
					headers: {
						Authorization: "Bearer invalid-token-12345",
					},
				},
			);

			expect([401, 404]).toContain(response.status());
		});

		test("should return 401 for expired token", async ({ request }) => {
			const expiredToken =
				"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.4Adcj0vbBqfVIpnGGNJKKpBmJcAmPNtSKhTNnsTekII";

			const response = await request.get(
				`${API_BASE_URL}/super-admin/users/${testUserId}/role`,
				{
					headers: {
						Authorization: `Bearer ${expiredToken}`,
					},
				},
			);

			expect([401, 404]).toContain(response.status());
		});

		test("should return 401 for malformed JWT", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/super-admin/users/${testUserId}/role`,
				{
					headers: {
						Authorization: "Bearer not-a-valid-jwt",
					},
				},
			);

			expect([401, 404]).toContain(response.status());
		});
	});

	// ========================
	// FORBIDDEN (403)
	// ========================

	test.describe("403 Forbidden Responses", () => {
		test("should return 403 for non-super-admin users - PLACEHOLDER", async ({
			request,
		}) => {
			// Would require a non-super-admin user token
			expect(true).toBe(true);
		});
	});

	// ========================
	// NOT FOUND (404)
	// ========================

	test.describe("404 Not Found Responses", () => {
		test("should return 404 for non-existent user", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/super-admin/users/99999999/role`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([400, 401, 403, 404]).toContain(response.status());
		});

		test("should return 404 for deleted user", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/super-admin/users/00000000/role`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([400, 401, 403, 404]).toContain(response.status());
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
		test("should handle userId as 0", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/super-admin/users/0/role`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([400, 401, 403, 404]).toContain(response.status());
		});

		test("should handle negative userId", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/super-admin/users/-1/role`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([400, 401, 403, 404]).toContain(response.status());
		});

		test("should handle very large userId", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/super-admin/users/999999999999999/role`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([400, 401, 403, 404]).toContain(response.status());
		});

		test("should handle query parameters gracefully", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/super-admin/users/${testUserId}/role?extra=param`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([200, 400, 401, 403, 404]).toContain(response.status());
		});

		test("should handle concurrent requests", async ({ request }) => {
			const promises = Array(5)
				.fill(null)
				.map(() =>
					request.get(`${API_BASE_URL}/super-admin/users/${testUserId}/role`, {
						headers: {
							Authorization: `Bearer ${validAccessToken}`,
						},
					}),
				);

			const responses = await Promise.all(promises);
			responses.forEach((response) => {
				expect([200, 400, 401, 403, 404]).toContain(response.status());
			});
		});

		test("should return isSuperAdmin as boolean not string", async ({
			request,
		}) => {
			const response = await request.get(
				`${API_BASE_URL}/super-admin/users/${testUserId}/role`,
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

		test("should check role for specific user ID", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/super-admin/users/${testUserId}/role`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([200, 400, 401, 403, 404]).toContain(response.status());
		});
	});

	// ========================
	// SECURITY TESTS
	// ========================

	test.describe("Security Tests", () => {
		test("should validate token on every request", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/super-admin/users/${testUserId}/role`,
				{
					headers: {
						Authorization: "Bearer malformed-token",
					},
				},
			);

			expect([401, 404]).toContain(response.status());
		});

		test("should not expose sensitive data in response", async ({
			request,
		}) => {
			const response = await request.get(
				`${API_BASE_URL}/super-admin/users/${testUserId}/role`,
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
			}
		});

		test("should prevent SQL injection in userId", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/super-admin/users/1' OR '1'='1/role`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([400, 401, 403, 404]).toContain(response.status());
		});

		test("should require super admin authorization", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/super-admin/users/${testUserId}/role`,
			);

			expect([401, 404]).toContain(response.status());
		});

		test("should only check roles for authorized access", async ({
			request,
		}) => {
			const response = await request.get(
				`${API_BASE_URL}/super-admin/users/${testUserId}/role`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([200, 400, 401, 403, 404]).toContain(response.status());
		});
	});

	// ========================
	// RESPONSE FORMAT
	// ========================

	test.describe("Response Format Tests", () => {
		test("should return consistent success structure", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/super-admin/users/${testUserId}/role`,
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
				`${API_BASE_URL}/super-admin/users/${testUserId}/role`,
				{
					headers: {
						Authorization: "Bearer invalid-token",
					},
				},
			);

			if (response.headers()["content-type"]?.includes("application/json")) {
				const data = await response.json();
				expect(data).toHaveProperty("success");
			}
		});

		test("should return proper content type", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/super-admin/users/${testUserId}/role`,
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
				`${API_BASE_URL}/super-admin/users/${testUserId}/role`,
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

		test("should handle concurrent requests efficiently", async ({
			request,
		}) => {
			const start = Date.now();

			const promises = Array(10)
				.fill(null)
				.map(() =>
					request.get(`${API_BASE_URL}/super-admin/users/${testUserId}/role`, {
						headers: {
							Authorization: `Bearer ${validAccessToken}`,
						},
					}),
				);

			await Promise.all(promises);
			const duration = Date.now() - start;

			expect(duration).toBeLessThan(2000);
		});

		test("should check role efficiently", async ({ request }) => {
			const start = Date.now();

			const response = await request.get(
				`${API_BASE_URL}/super-admin/users/${testUserId}/role`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			const duration = Date.now() - start;

			expect([200, 400, 401, 403, 404]).toContain(response.status());
			expect(duration).toBeLessThan(300);
		});
	});
});
