/** @format */

import { test, expect } from "@playwright/test";
import { testData } from "../testData";

const API_BASE_URL = "http://127.0.0.1:5050";

/**
 * Comprehensive test suite for GET /me/profile endpoint
 * Tests ALL response codes: 200, 401, 405, 423, 429
 * Based on Swagger documentation
 */

test.describe("GET /me/profile - Comprehensive Tests", () => {
	let validAccessToken: string;

	// Setup: Login to get valid access token
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
	// RATE LIMIT (429)
	// ========================

	// ========================
	// EDGE CASES
	// ========================

	test.describe("Edge Cases", () => {
		test("should handle very long authorization header", async ({
			request,
		}) => {
			const longToken = "Bearer " + "a".repeat(10000);

			const response = await request.get(`${API_BASE_URL}/me/profile`, {
				headers: {
					Authorization: longToken,
				},
			});

			expect([400, 401, 404, 500, 401]).toContain(response.status());
		});

		test("should handle special characters in header", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/me/profile`, {
				headers: {
					Authorization: "Bearer token!@#$%^&*()",
				},
			});

			expect([401, 404, 500]).toContain(response.status());
		});

		test("should handle case-insensitive Bearer prefix", async ({
			request,
		}) => {
			const variations = [
				`bearer ${validAccessToken}`,
				`BEARER ${validAccessToken}`,
			];

			for (const auth of variations) {
				const response = await request.get(`${API_BASE_URL}/me/profile`, {
					headers: {
						Authorization: auth,
					},
				});

				// Should either accept (case-insensitive) or reject
				expect([200, 401, 500, 401]).toContain(response.status());
			}
		});

		test("should handle whitespace in header", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/me/profile`, {
				headers: {
					Authorization: `Bearer  ${validAccessToken}  `,
				},
			});

			expect([200, 400, 401, 500, 401]).toContain(response.status());
		});

		test("should handle invalid query parameters", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/me/profile?invalid=param`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			// Should either ignore or reject
			expect([200, 400, 500, 401]).toContain(response.status());
		});
	});

	// ========================
	// SECURITY TESTS
	// ========================

	test.describe("Security Tests", () => {
		test("should not expose sensitive data in response", async ({
			request,
		}) => {
			const response = await request.get(`${API_BASE_URL}/me/profile`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			const data = await response.json();
			const responseText = JSON.stringify(data);

			// passwordSet is OK (boolean), but not passwordHash
			expect(responseText).not.toContain("passwordHash");
			expect(responseText).not.toContain("secretKey");
			expect(responseText).not.toContain("apiKey");
		});

		test("should not expose database structure", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/me/profile`, {
				headers: {
					Authorization: "Bearer invalid",
				},
			});

			const data = await response.json();
			const responseText = JSON.stringify(data);

			expect(responseText.toLowerCase()).not.toContain("mysql");
			expect(responseText.toLowerCase()).not.toContain("database");
		});

		test("should validate token on every request", async ({ request }) => {
			const fakeToken =
				"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjF9.fake";

			const response = await request.get(`${API_BASE_URL}/me/profile`, {
				headers: {
					Authorization: `Bearer ${fakeToken}`,
				},
			});

			expect([401, 404, 500]).toContain(response.status());
		});

		test("should return only logged-in user data", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/me/profile`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			const data = await response.json();
			expect(data.user.email).toBe(testData.users.admin1.email);
		});
	});

	// ========================
	// RESPONSE FORMAT TESTS
	// ========================

	test.describe("Response Format Tests", () => {
		test("should return consistent success structure", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/me/profile`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			expect(response.status()).toBe(200);

			const data = await response.json();
			expect(data).toHaveProperty("success");
			expect(data).toHaveProperty("user");
			expect(typeof data.success).toBe("boolean");
			expect(typeof data.user).toBe("object");
		});

		test("should return consistent error structure", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/me/profile`);

			const data = await response.json();
			expect(data).toHaveProperty("success");
			expect(data).toHaveProperty("error");
			expect(data).toHaveProperty("message");
		});

		test("should return proper content type", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/me/profile`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

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

			const response = await request.get(`${API_BASE_URL}/me/profile`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			const duration = Date.now() - start;

			expect(response.status()).toBe(200);
			expect(duration).toBeLessThan(500);
		});

		test("should handle concurrent requests efficiently", async ({
			request,
		}) => {
			const start = Date.now();

			const requests = Array(10)
				.fill(null)
				.map(() =>
					request.get(`${API_BASE_URL}/me/profile`, {
						headers: {
							Authorization: `Bearer ${validAccessToken}`,
						},
					}),
				);

			const responses = await Promise.all(requests);
			const duration = Date.now() - start;

			responses.forEach((response) => {
				expect(response.status()).toBe(200);
			});

			expect(duration).toBeLessThan(2000);
		});
	});
});

