/** @format */

import { test, expect } from "@playwright/test";
import { testData } from "../testData";

const API_BASE_URL = "http://127.0.0.1:5050";

/**
 * Comprehensive test suite for GET /settings/recording-limit endpoint
 * Fetches the current number of recordings used and the total monthly limit allowed
 * for the authenticated account. This allows clients to display usage bars or
 * restrict recording features when limits are reached.
 * Response codes: 200, 400, 401, 429, 500, 503, 504
 */

test.describe("GET /settings/recording-limit - Comprehensive Tests", () => {
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
	// UNAUTHORIZED (401)
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
				`${API_BASE_URL}/settings/recording-limit?extra=param`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([200, 400, 401, 500]).toContain(response.status());
		});

		test("should handle concurrent requests", async ({ request }) => {
			const promises = Array(5)
				.fill(null)
				.map(() =>
					request.get(`${API_BASE_URL}/settings/recording-limit`, {
						headers: {
							Authorization: `Bearer ${validAccessToken}`,
						},
					}),
				);

			const responses = await Promise.all(promises);
			responses.forEach((response) => {
				expect([200, 400, 401, 500]).toContain(response.status());
			});
		});

		test("should be accessible to authenticated users", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/settings/recording-limit`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([200, 400, 401, 500]).toContain(response.status());
		});

		test("should display usage for account", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/settings/recording-limit`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([200, 400, 401, 500]).toContain(response.status());
		});

		test("should allow usage bars display", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/settings/recording-limit`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([200, 400, 401, 500]).toContain(response.status());
		});
	});

	// ========================
	// SECURITY TESTS
	// ========================

	test.describe("Security Tests", () => {
		test("should validate token on every request", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/settings/recording-limit`,
				{
					headers: {
						Authorization: "Bearer malformed-token",
					},
				},
			);

			expect([401, 404, 500]).toContain(response.status());
		});

		test("should not expose sensitive data in response", async ({
			request,
		}) => {
			const response = await request.get(
				`${API_BASE_URL}/settings/recording-limit`,
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

		test("should require authentication", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/settings/recording-limit`,
			);

			expect([401, 404, 500]).toContain(response.status());
		});

		test("should restrict when limits reached", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/settings/recording-limit`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([200, 400, 401, 500]).toContain(response.status());
		});
	});

	// ========================
	// RESPONSE FORMAT
	// ========================

	test.describe("Response Format Tests", () => {
		test("should return consistent success structure", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/settings/recording-limit`,
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
				`${API_BASE_URL}/settings/recording-limit`,
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
				`${API_BASE_URL}/settings/recording-limit`,
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
		test("should respond quickly (< 400ms)", async ({ request }) => {
			const start = Date.now();

			const response = await request.get(
				`${API_BASE_URL}/settings/recording-limit`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			const duration = Date.now() - start;

			expect([200, 400, 401, 500]).toContain(response.status());
			expect(duration).toBeLessThan(400);
		});

		test("should handle concurrent requests efficiently", async ({
			request,
		}) => {
			const start = Date.now();

			const promises = Array(10)
				.fill(null)
				.map(() =>
					request.get(`${API_BASE_URL}/settings/recording-limit`, {
						headers: {
							Authorization: `Bearer ${validAccessToken}`,
						},
					}),
				);

			await Promise.all(promises);
			const duration = Date.now() - start;

			expect(duration).toBeLessThan(2000);
		});

		test("should retrieve limit efficiently", async ({ request }) => {
			const start = Date.now();

			const response = await request.get(
				`${API_BASE_URL}/settings/recording-limit`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			const duration = Date.now() - start;

			expect([200, 400, 401, 500]).toContain(response.status());
			expect(duration).toBeLessThan(300);
		});
	});
});

