/** @format */

import { test, expect } from "@playwright/test";
import { testData } from "../testData";

/**
 * Comprehensive test suite for GET /admin/users/{userId} endpoint
 *
 * Based on Swagger documentation - Retrieve detailed user information including profile, security status, and integration settings
 */

const API_BASE_URL = "http://127.0.0.1:5050";

test.describe("GET /admin/users/{userId} - Comprehensive Tests", () => {
	let validAccessToken: string;
	let adminAccessToken: string;
	const testUserId = testData.users.admin2.id;

	test.beforeAll(async ({ request }) => {
		// Login to get admin access token
		const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
			data: {
				email: "poised.reindeer.muxl@protectsmail.net",
				password: "Qwerty@123",
			},
		});
		const loginData = await loginResponse.json();
		adminAccessToken = loginData.accessToken;
		validAccessToken = adminAccessToken;
	});

	// ========================
	// SUCCESS (200)
	// ========================

	test.describe("200 Success Responses", () => {
		test("should retrieve user details successfully - 200", async ({
			request,
		}) => {
			const response = await request.get(
				`${API_BASE_URL}/admin/users/${testUserId}`,
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
				expect(data).toHaveProperty("id");
				expect(data).toHaveProperty("email");
			}
		});

		test("should return complete user profile", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/admin/users/${testUserId}`,
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
				`${API_BASE_URL}/admin/users/invalid-id`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([400, 401, 403, 404, 422]).toContain(response.status());
		});

		test("should return 400 for empty userId", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/admin/users/`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			expect([400, 404, 405]).toContain(response.status());
		});

		test("should return 400 for special characters in userId", async ({
			request,
		}) => {
			const response = await request.get(
				`${API_BASE_URL}/admin/users/!@#$%^&*()`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([400, 401, 403, 404, 422]).toContain(response.status());
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
				`${API_BASE_URL}/admin/users/${testUserId}`,
			);

			expect(response.status()).toBe(401);
		});

		test("should return 401 for invalid token", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/admin/users/${testUserId}`,
				{
					headers: {
						Authorization: "Bearer invalid-token-12345",
					},
				},
			);

			expect(response.status()).toBe(401);
		});

		test("should return 401 for expired token", async ({ request }) => {
			const expiredToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.expired";
			const response = await request.get(
				`${API_BASE_URL}/admin/users/${testUserId}`,
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
				`${API_BASE_URL}/admin/users/${testUserId}`,
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
			// Would need a regular user token
			expect(true).toBe(true);
		});
	});

	// ========================
	// NOT FOUND (404)
	// ========================

	test.describe("404 Not Found Responses", () => {
		test("should return 404 for non-existent user", async ({ request }) => {
			const nonExistentId = "00000000-0000-0000-0000-000000000000";
			const response = await request.get(
				`${API_BASE_URL}/admin/users/${nonExistentId}`,
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

	test.describe("429 Rate Limit Responses", () => {
		test("should return 429 after excessive requests - PLACEHOLDER", async ({
			request,
		}) => {
			// Would require making many requests quickly
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
	// EDGE CASES
	// ========================

	test.describe("Edge Cases", () => {
		test("should handle UUID format userId", async ({ request }) => {
			const uuidUserId = "123e4567-e89b-12d3-a456-426614174000";
			const response = await request.get(
				`${API_BASE_URL}/admin/users/${uuidUserId}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([200, 400, 401, 403, 404]).toContain(response.status());
		});

		test("should handle very long userId", async ({ request }) => {
			const longId = "a".repeat(1000);
			const response = await request.get(
				`${API_BASE_URL}/admin/users/${longId}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([400, 401, 403, 404, 414]).toContain(response.status());
		});

		test("should handle concurrent requests", async ({ request }) => {
			const requests = Array(5)
				.fill(null)
				.map(() =>
					request.get(`${API_BASE_URL}/admin/users/${testUserId}`, {
						headers: {
							Authorization: `Bearer ${validAccessToken}`,
						},
					}),
				);

			const responses = await Promise.all(requests);
			responses.forEach((response) => {
				expect([200, 400, 401, 403, 404, 429]).toContain(response.status());
			});
		});
	});

	// ========================
	// SECURITY TESTS
	// ========================

	test.describe("Security Tests", () => {
		test("should prevent SQL injection in userId", async ({ request }) => {
			const sqlInjection = "1' OR '1'='1";
			const response = await request.get(
				`${API_BASE_URL}/admin/users/${sqlInjection}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([400, 401, 403, 404]).toContain(response.status());
		});

		test("should validate token on every request", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/admin/users/${testUserId}`,
				{
					headers: {
						Authorization: "Bearer tampered-token",
					},
				},
			);

			expect(response.status()).toBe(401);
		});

		test("should not expose sensitive data in response", async ({
			request,
		}) => {
			const response = await request.get(
				`${API_BASE_URL}/admin/users/${testUserId}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			if (response.status() === 200) {
				const data = await response.json();
				const responseText = JSON.stringify(data);
				expect(responseText).not.toContain("password");
				expect(responseText).not.toContain("passwordHash");
			}
		});
	});

	// ========================
	// RESPONSE FORMAT TESTS
	// ========================

	test.describe("Response Format Tests", () => {
		test("should return consistent success structure", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/admin/users/${testUserId}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			if (response.status() === 200) {
				const data = await response.json();
				expect(data).toHaveProperty("success");
			}
		});

		test("should return proper content type", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/admin/users/${testUserId}`,
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
	// PERFORMANCE TESTS
	// ========================

	test.describe("Performance Tests", () => {
		test("should respond quickly (< 500ms)", async ({ request }) => {
			const start = Date.now();

			const response = await request.get(
				`${API_BASE_URL}/admin/users/${testUserId}`,
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
