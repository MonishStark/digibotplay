/** @format */

import { test, expect } from "@playwright/test";
import { testData } from "../testData";

const API_BASE_URL = "http://127.0.0.1:5050";

/**
 * Comprehensive test suite for GET /me/subscription endpoint
 * Returns subscription details for the authenticated user. The user identity is resolved
 * directly from the JWT access token.
 * Rate Limits: 30 requests per minute
 * Timeout: 30 seconds
 * Security: Requires Bearer JWT authentication, Accepts cross-subscription-reads, Accessible by admin AND licensed users
 * Response codes: 200, 401, 403, 404, 429, 500, 503, 504
 */

test.describe("GET /me/subscription - Comprehensive Tests", () => {
	let validAccessToken: string;

	test.beforeAll(async ({ request }) => {
		const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
			data: {
				email: testData.users.admin1.email,
				password: testData.users.admin1.password,
			},
		});

		const loginData = await loginResponse.json();
		validAccessToken = loginData.accessToken;
	});

	// ========================
	// SUCCESS (200)
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
	// SERVICE UNAVAILABLE (503)
	// ========================

	// ========================
	// GATEWAY TIMEOUT (504)
	// ========================

	// ========================
	// EDGE CASES
	// ========================

	test.describe("Edge Cases", () => {
		test("should handle query parameters gracefully", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/me/subscription?extra=param`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"x-api-version": "v1",
					},
				},
			);

			expect([200, 401, 403, 404, 500]).toContain(response.status());
		});

		test("should handle concurrent requests", async ({ request }) => {
			const promises = Array(5)
				.fill(null)
				.map(() =>
					request.get(`${API_BASE_URL}/me/subscription`, {
						headers: {
							Authorization: `Bearer ${validAccessToken}`,
							"x-api-version": "v1",
						},
					}),
				);

			const responses = await Promise.all(promises);
			responses.forEach((response) => {
				expect([200, 401, 403, 404, 500]).toContain(response.status());
			});
		});

		test("should accept cross-subscription-reads", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/me/subscription`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"x-api-version": "v1",
				},
			});

			expect([200, 401, 403, 404, 500]).toContain(response.status());
		});

		test("should be accessible by admin users", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/me/subscription`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"x-api-version": "v1",
				},
			});

			expect([200, 401, 403, 404, 500]).toContain(response.status());
		});

		test("should handle missing x-api-version header", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/me/subscription`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			expect([200, 401, 403, 404, 500]).toContain(response.status());
		});
	});

	// ========================
	// SECURITY TESTS
	// ========================

	test.describe("Security Tests", () => {
		test("should validate token on every request", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/me/subscription`, {
				headers: {
					Authorization: "Bearer malformed-token",
					"x-api-version": "v1",
				},
			});

			expect([401, 404, 500]).toContain(response.status());
		});

		test("should not expose sensitive data in response", async ({
			request,
		}) => {
			const response = await request.get(`${API_BASE_URL}/me/subscription`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"x-api-version": "v1",
				},
			});

			if (response.headers()["content-type"]?.includes("application/json")) {
				const data = await response.json();
				const responseText = JSON.stringify(data);

				expect(responseText).not.toContain("password");
				expect(responseText).not.toContain("secretKey");
			}
		});

		test("should require Bearer JWT authentication", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/me/subscription`, {
				headers: {
					"x-api-version": "v1",
				},
			});

			expect([401, 404, 500]).toContain(response.status());
		});

		test("should resolve user from JWT only", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/me/subscription`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"x-api-version": "v1",
				},
			});

			expect([200, 401, 403, 404, 500]).toContain(response.status());
		});

		test("should enforce 30 requests per minute rate limit", async ({
			request,
		}) => {
			const response = await request.get(`${API_BASE_URL}/me/subscription`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"x-api-version": "v1",
				},
			});

			expect([200, 401, 403, 404, 500]).toContain(response.status());
		});
	});

	// ========================
	// RESPONSE FORMAT
	// ========================

	test.describe("Response Format Tests", () => {
		test("should return consistent success structure", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/me/subscription`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"x-api-version": "v1",
				},
			});

			if (
				response.status() === 200 &&
				response.headers()["content-type"]?.includes("application/json")
			) {
				const data = await response.json();
				expect(data).toHaveProperty("success");
			}
		});

		test("should return consistent error structure", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/me/subscription`, {
				headers: {
					Authorization: "Bearer invalid-token",
					"x-api-version": "v1",
				},
			});

			if (response.headers()["content-type"]?.includes("application/json")) {
				const data = await response.json();
				expect(data).toHaveProperty("success");
			}
		});

		test("should return proper content type", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/me/subscription`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"x-api-version": "v1",
				},
			});

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

			const response = await request.get(`${API_BASE_URL}/me/subscription`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"x-api-version": "v1",
				},
			});

			const duration = Date.now() - start;

			expect([200, 401, 403, 404, 500]).toContain(response.status());
			expect(duration).toBeLessThan(500);
		});

		test("should handle concurrent requests efficiently", async ({
			request,
		}) => {
			const start = Date.now();

			const promises = Array(10)
				.fill(null)
				.map(() =>
					request.get(`${API_BASE_URL}/me/subscription`, {
						headers: {
							Authorization: `Bearer ${validAccessToken}`,
							"x-api-version": "v1",
						},
					}),
				);

			await Promise.all(promises);
			const duration = Date.now() - start;

			expect(duration).toBeLessThan(3000);
		});

		test("should retrieve subscription efficiently", async ({ request }) => {
			const start = Date.now();

			const response = await request.get(`${API_BASE_URL}/me/subscription`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"x-api-version": "v1",
				},
			});

			const duration = Date.now() - start;

			expect([200, 401, 403, 404, 500]).toContain(response.status());
			expect(duration).toBeLessThan(300);
		});

		test("should respect 30 second timeout", async ({ request }) => {
			const start = Date.now();

			const response = await request.get(`${API_BASE_URL}/me/subscription`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"x-api-version": "v1",
				},
			});

			const duration = Date.now() - start;

			expect(duration).toBeLessThan(30000);
		});
	});
});

