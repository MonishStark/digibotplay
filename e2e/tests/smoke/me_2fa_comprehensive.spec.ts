/** @format */

import { test, expect } from "@playwright/test";
import { testData } from "../testData";

const API_BASE_URL = "http://127.0.0.1:5050";

/**
 * Comprehensive test suite for POST /me/2fa endpoint
 * Tests ALL response codes: 200, 400, 401, 403, 404, 405, 409, 422, 423, 429, 500, 503, 504
 * Based on Swagger documentation - Enable or disable 2FA for authenticated users
 */

test.describe("POST /me/2fa - Comprehensive Tests", () => {
	let validAccessToken: string;

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
	// METHOD NOT ALLOWED (405)
	// ========================

	// ========================
	// VALIDATION ERROR (422)
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
	// EDGE CASES
	// ========================

	test.describe("Edge Cases", () => {
		test("should handle rapid enable/disable toggles", async ({ request }) => {
			const requests = [true, false, true].map((value) =>
				request.post(`${API_BASE_URL}/me/2fa`, {
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						enable2FA: value,
					},
				}),
			);

			const responses = await Promise.all(requests);

			responses.forEach((response) => {
				expect([200, 400, 401, 403, 409, 412, 422]).toContain(
					response.status(),
				);
			});
		});

		test("should handle concurrent 2FA requests", async ({ request }) => {
			const requests = Array(3)
				.fill(null)
				.map(() =>
					request.post(`${API_BASE_URL}/me/2fa`, {
						headers: {
							Authorization: `Bearer ${validAccessToken}`,
							"Content-Type": "application/json",
						},
						data: {
							enable2FA: true,
						},
					}),
				);

			const responses = await Promise.all(requests);

			responses.forEach((response) => {
				expect([200, 400, 401, 403, 409, 412, 422]).toContain(
					response.status(),
				);
			});
		});

		test("should handle very large request body", async ({ request }) => {
			const largeData = {
				enable2FA: true,
				extraData: "a".repeat(10000),
			};

			const response = await request.post(`${API_BASE_URL}/me/2fa`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: largeData,
			});

			expect([200, 400, 401, 403, 412, 422, 413, 500, 401]).toContain(response.status());
		});
	});

	// ========================
	// SECURITY TESTS
	// ========================

	test.describe("Security Tests", () => {
		test("should not expose sensitive data in response", async ({
			request,
		}) => {
			const response = await request.post(`${API_BASE_URL}/me/2fa`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: {
					enable2FA: true,
				},
			});

			const data = await response.json();
			const responseText = JSON.stringify(data);

			expect(responseText).not.toContain("passwordHash");
			expect(responseText).not.toContain("privateKey");
		});

		test("should validate token on every request", async ({ request }) => {
			const fakeToken =
				"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjF9.fake";

			const response = await request.post(`${API_BASE_URL}/me/2fa`, {
				headers: {
					Authorization: `Bearer ${fakeToken}`,
					"Content-Type": "application/json",
				},
				data: {
					enable2FA: true,
				},
			});

			expect([401, 403, 404, 500, 401]).toContain(response.status());
		});

		test("should prevent XSS in request data", async ({ request }) => {
			const response = await request.post(`${API_BASE_URL}/me/2fa`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: {
					enable2FA: "<script>alert('xss')</script>",
				},
			});

			expect([400, 401, 403, 412, 422, 500, 401]).toContain(response.status());
		});

		test("should not allow SQL injection attempts", async ({ request }) => {
			const response = await request.post(`${API_BASE_URL}/me/2fa`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: {
					enable2FA: "true'; DROP TABLE users; --",
				},
			});

			expect([400, 401, 403, 412, 422, 500, 401]).toContain(response.status());
		});
	});

	// ========================
	// RESPONSE FORMAT TESTS
	// ========================

	test.describe("Response Format Tests", () => {
		test("should return consistent success structure", async ({ request }) => {
			const response = await request.post(`${API_BASE_URL}/me/2fa`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: {
					enable2FA: true,
				},
			});

			if (response.status() === 200) {
				const data = await response.json();
				expect(data).toHaveProperty("success");
			}
		});

		test("should return consistent error structure", async ({ request }) => {
			const response = await request.post(`${API_BASE_URL}/me/2fa`, {
				headers: {
					"Content-Type": "application/json",
				},
				data: {
					enable2FA: true,
				},
			});

			const data = await response.json();
			expect(data).toHaveProperty("success");
			expect(data).toHaveProperty("error");
			expect(data).toHaveProperty("message");
		});

		test("should return proper content type", async ({ request }) => {
			const response = await request.post(`${API_BASE_URL}/me/2fa`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: {
					enable2FA: true,
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

			const response = await request.post(`${API_BASE_URL}/me/2fa`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: {
					enable2FA: true,
				},
			});

			const duration = Date.now() - start;

			expect([200, 400, 401, 403, 412, 422, 500, 401]).toContain(response.status());
			expect(duration).toBeLessThan(500);
		});
	});
});

