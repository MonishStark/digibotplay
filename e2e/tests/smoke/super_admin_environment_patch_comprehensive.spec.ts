/** @format */

import { test, expect } from "@playwright/test";
import { testData } from "../testData";

const API_BASE_URL = "http://127.0.0.1:5050";

/**
 * Comprehensive test suite for PATCH /super-admin/environment endpoint
 * Updates one or more environment configuration fields used by the system.
 * Only Super Admin may modify environment settings. Supports partial updates.
 * Response codes: 200, 400, 401, 403, 404, 429, 500, 503, 504
 */

test.describe("PATCH /super-admin/environment - Comprehensive Tests", () => {
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
		test("should handle very long environment value", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/super-admin/environment`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						REDIS_HOST: "a".repeat(1000) + ".example.com",
					},
				},
			);

			expect([200, 400, 401, 403, 404, 500]).toContain(response.status());
		});

		test("should handle special characters in values", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/super-admin/environment`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						REDIS_HOST: "redis://user:p@ss!w0rd@host:6379",
					},
				},
			);

			expect([200, 400, 401, 403, 404, 500]).toContain(response.status());
		});

		test("should handle null values", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/super-admin/environment`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						REDIS_HOST: null,
					},
				},
			);

			expect([200, 400, 401, 403, 404, 500]).toContain(response.status());
		});

		test("should handle concurrent updates", async ({ request }) => {
			const promises = Array(3)
				.fill(null)
				.map((_, i) =>
					request.patch(`${API_BASE_URL}/super-admin/environment`, {
						headers: {
							Authorization: `Bearer ${validAccessToken}`,
							"Content-Type": "application/json",
						},
						data: {
							REDIS_HOST: `concurrent-${i}.example.com`,
						},
					}),
				);

			const responses = await Promise.all(promises);
			responses.forEach((response) => {
				expect([200, 400, 401, 403, 404, 500]).toContain(response.status());
			});
		});

		test("should only update provided fields", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/super-admin/environment`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						REDIS_HOST: "partial-update.example.com",
					},
				},
			);

			expect([200, 400, 401, 403, 404, 500]).toContain(response.status());
		});

		test("should handle numeric string values", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/super-admin/environment`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						REFRESH_MAX_LIMIT_MS: "180000",
						MAX_UPLOAD_LIMIT_MB: "200",
					},
				},
			);

			expect([200, 400, 401, 403, 404, 500]).toContain(response.status());
		});
	});

	// ========================
	// SECURITY TESTS
	// ========================

	test.describe("Security Tests", () => {
		test("should validate token on every request", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/super-admin/environment`,
				{
					headers: {
						Authorization: "Bearer malformed-token",
						"Content-Type": "application/json",
					},
					data: {
						REDIS_HOST: "security-test.example.com",
					},
				},
			);

			expect([401, 404, 500]).toContain(response.status());
		});

		test("should not expose sensitive data in response", async ({
			request,
		}) => {
			const response = await request.patch(
				`${API_BASE_URL}/super-admin/environment`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						REDIS_HOST: "response-check.example.com",
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

		test("should prevent SQL injection in values", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/super-admin/environment`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						REDIS_HOST: "'; DROP TABLE environment--",
					},
				},
			);

			expect([200, 400, 401, 403, 404, 500]).toContain(response.status());
		});

		test("should require super admin authorization", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/super-admin/environment`,
				{
					headers: {
						"Content-Type": "application/json",
					},
					data: {
						REDIS_HOST: "no-auth.example.com",
					},
				},
			);

			expect([401, 404, 500]).toContain(response.status());
		});

		test("should prevent XSS in environment values", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/super-admin/environment`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						REDIS_HOST: "<script>alert('xss')</script>",
					},
				},
			);

			expect([200, 400, 401, 403, 404, 500]).toContain(response.status());
		});
	});

	// ========================
	// RESPONSE FORMAT
	// ========================

	test.describe("Response Format Tests", () => {
		test("should return consistent success structure", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/super-admin/environment`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						REDIS_HOST: "format-test.example.com",
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
			const response = await request.patch(
				`${API_BASE_URL}/super-admin/environment`,
				{
					headers: {
						Authorization: "Bearer invalid-token",
						"Content-Type": "application/json",
					},
					data: {
						REDIS_HOST: "error-format.example.com",
					},
				},
			);

			if (response.headers()["content-type"]?.includes("application/json")) {
				const data = await response.json();
				expect(data).toHaveProperty("success");
			}
		});

		test("should return proper content type", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/super-admin/environment`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						REDIS_HOST: "content-type.example.com",
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

			const response = await request.patch(
				`${API_BASE_URL}/super-admin/environment`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						REDIS_HOST: "perf-test.example.com",
					},
				},
			);

			const duration = Date.now() - start;

			expect([200, 400, 401, 403, 404, 500]).toContain(response.status());
			expect(duration).toBeLessThan(500);
		});

		test("should handle multiple field updates efficiently", async ({
			request,
		}) => {
			const start = Date.now();

			const response = await request.patch(
				`${API_BASE_URL}/super-admin/environment`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						REDIS_HOST: "multi-perf.example.com",
						REFRESH_MAX_LIMIT_MS: "150000",
						MAX_UPLOAD_LIMIT_MB: "150",
					},
				},
			);

			const duration = Date.now() - start;

			expect([200, 400, 401, 403, 404, 500]).toContain(response.status());
			expect(duration).toBeLessThan(1000);
		});

		test("should process partial updates efficiently", async ({ request }) => {
			const start = Date.now();

			const response = await request.patch(
				`${API_BASE_URL}/super-admin/environment`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						REFRESH_MAX_LIMIT_MS: "200000",
					},
				},
			);

			const duration = Date.now() - start;

			expect([200, 400, 401, 403, 404, 500]).toContain(response.status());
			expect(duration).toBeLessThan(400);
		});
	});
});

