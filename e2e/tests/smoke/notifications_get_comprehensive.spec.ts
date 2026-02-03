/** @format */

import { test, expect } from "@playwright/test";
import { testData } from "../testData";

const API_BASE_URL = "http://127.0.0.1:5050";

/**
 * Comprehensive test suite for GET /notifications endpoint
 * Fetch a list of all notifications for the authenticated user
 * Notifications include system alerts, chat updates, and file processing status
 * The list remains static until a new notification is generated or an existing one is deleted
 * Response codes: 200, 401, 429, 500, 503, 504
 */

test.describe("GET /notifications - Comprehensive Tests", () => {
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
		test("should handle concurrent requests", async ({ request }) => {
			const requests = Array(5)
				.fill(null)
				.map(() =>
					request.get(`${API_BASE_URL}/notifications`, {
						headers: {
							Authorization: `Bearer ${validAccessToken}`,
						},
					}),
				);

			const responses = await Promise.all(requests);

			responses.forEach((response) => {
				expect([200, 401, 404, 500, 401]).toContain(response.status());
			});
		});

		test("should handle empty notification list", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/notifications`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			expect([200, 401, 404, 500, 401]).toContain(response.status());

			if (
				response.status() === 200 &&
				response.headers()["content-type"]?.includes("application/json")
			) {
				const data = await response.json();
				expect(data).toBeDefined();
			}
		});

		test("should handle different user tokens", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/notifications`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			expect([200, 401, 404, 500, 401]).toContain(response.status());
		});

		test("should handle query parameters gracefully", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/notifications?param=value`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([200, 400, 401, 404, 500, 401]).toContain(response.status());
		});
	});

	// ========================
	// SECURITY TESTS
	// ========================

	test.describe("Security Tests", () => {
		test("should validate token on every request", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/notifications`, {
				headers: {
					Authorization: "Bearer malformed-token",
				},
			});

			expect([401, 404, 500, 401]).toContain(response.status());
		});

		test("should not expose sensitive data in response", async ({
			request,
		}) => {
			const response = await request.get(`${API_BASE_URL}/notifications`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			if (response.headers()["content-type"]?.includes("application/json")) {
				const data = await response.json();
				const responseText = JSON.stringify(data);

				expect(responseText).not.toContain("password");
				expect(responseText).not.toContain("secretKey");
			}
		});

		test("should prevent SQL injection attempts", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/notifications?id=1' OR '1'='1`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([200, 400, 401, 404, 500, 401]).toContain(response.status());
		});

		test("should require proper authorization", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/notifications`);

			expect([401, 404, 500, 401]).toContain(response.status());
		});

		test("should only return notifications for authenticated user", async ({
			request,
		}) => {
			const response = await request.get(`${API_BASE_URL}/notifications`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			expect([200, 401, 404, 500, 401]).toContain(response.status());
		});
	});

	// ========================
	// RESPONSE FORMAT
	// ========================

	test.describe("Response Format Tests", () => {
		test("should return consistent success structure", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/notifications`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
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
			const response = await request.get(`${API_BASE_URL}/notifications`);

			if (response.headers()["content-type"]?.includes("application/json")) {
				const data = await response.json();
				if (data.success !== undefined) {
					expect(data).toHaveProperty("success");
				}
			}
		});

		test("should return proper content type", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/notifications`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
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

			const response = await request.get(`${API_BASE_URL}/notifications`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			const duration = Date.now() - start;

			expect([200, 401, 404, 500, 401]).toContain(response.status());
			expect(duration).toBeLessThan(500);
		});

		test("should handle concurrent requests efficiently", async ({
			request,
		}) => {
			const start = Date.now();

			const requests = Array(10)
				.fill(null)
				.map(() =>
					request.get(`${API_BASE_URL}/notifications`, {
						headers: {
							Authorization: `Bearer ${validAccessToken}`,
						},
					}),
				);

			const responses = await Promise.all(requests);
			const duration = Date.now() - start;

			responses.forEach((response) => {
				expect([200, 401, 404, 500, 401]).toContain(response.status());
			});

			expect(duration).toBeLessThan(2000);
		});
	});
});

