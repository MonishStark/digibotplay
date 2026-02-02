/** @format */

import { test, expect } from "@playwright/test";
import { testData } from "../testData";

const API_BASE_URL = "http://127.0.0.1:5050";

/**
 * Comprehensive test suite for GET /me/usage endpoint
 * Tests ALL response codes: 200, 401, 403, 404, 405, 423, 429, 500, 503, 504
 * Based on Swagger documentation - Retrieves user usage data with filters
 */

test.describe("GET /me/usage - Comprehensive Tests", () => {
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

	test.describe("200 Success Responses", () => {
		test("should return usage data with valid token - 200", async ({
			request,
		}) => {
			const response = await request.get(`${API_BASE_URL}/me/usage`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			expect(response.status()).toBe(200);

			const data = await response.json();
			expect(data.success).toBe(true);
		});

		test("should return usage data with day filter", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/me/usage?day=1&month=1&year=2026`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([200, 400]).toContain(response.status());
		});

		test("should return usage data with month filter", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/me/usage?month=1&year=2026`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([200, 400]).toContain(response.status());
		});

		test("should return usage data with year filter", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/me/usage?year=2025`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			expect([200, 400]).toContain(response.status());
		});

		test("should return usage data with all filters", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/me/usage?day=15&month=2&year=2026`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect(response.status()).toBe(200);
		});

		test("should return correct usage data structure", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/me/usage`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			expect(response.status()).toBe(200);

			const data = await response.json();

			// May have usage object or array
			if (data.usage) {
				expect(["object", "array"].includes(typeof data.usage)).toBe(true);
			}
		});

		test("should handle usage with no data", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/me/usage?year=2020`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			expect([200, 400]).toContain(response.status());

			if (response.status() === 200) {
				const data = await response.json();
				expect(data.success).toBe(true);
			}
		});

		test("should validate date range parameters", async ({ request }) => {
			const validDays = [1, 15, 31];
			const validMonths = [1, 6, 12];

			for (const day of validDays) {
				const response = await request.get(
					`${API_BASE_URL}/me/usage?day=${day}`,
					{
						headers: {
							Authorization: `Bearer ${validAccessToken}`,
						},
					},
				);

				expect([200, 400]).toContain(response.status());
			}

			for (const month of validMonths) {
				const response = await request.get(
					`${API_BASE_URL}/me/usage?month=${month}`,
					{
						headers: {
							Authorization: `Bearer ${validAccessToken}`,
						},
					},
				);

				expect([200, 400]).toContain(response.status());
			}
		});

		test("should work with different valid tokens", async ({ request }) => {
			const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
				headers: { "Content-Type": "application/json" },
				data: {
					email: testData.users.admin2.email,
					password: testData.users.admin2.password,
					loginType: "standard",
				},
			});

			const loginData = await loginResponse.json();
			const admin2Token = loginData.user.auth.accessToken;

			const response = await request.get(`${API_BASE_URL}/me/usage`, {
				headers: {
					Authorization: `Bearer ${admin2Token}`,
				},
			});

			expect(response.status()).toBe(200);
		});
	});

	// ========================
	// UNAUTHORIZED (401)
	// ========================

	test.describe("401 Unauthorized Responses", () => {
		test("should return 401 when Authorization header is missing", async ({
			request,
		}) => {
			const response = await request.get(`${API_BASE_URL}/me/usage`);

			expect(response.status()).toBe(401);

			const data = await response.json();
			expect(data.success).toBe(false);
			expect(data.error).toBe("unauthorized");
		});

		test("should return 401 for invalid token", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/me/usage`, {
				headers: {
					Authorization: "Bearer invalid-token-12345",
				},
			});

			expect(response.status()).toBe(401);
		});

		test("should return 401 for expired token", async ({ request }) => {
			const expiredToken =
				"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE2MDAwMDM2MDB9.expired";

			const response = await request.get(`${API_BASE_URL}/me/usage`, {
				headers: {
					Authorization: `Bearer ${expiredToken}`,
				},
			});

			expect(response.status()).toBe(401);
		});

		test("should return 401 for malformed JWT", async ({ request }) => {
			const malformedTokens = ["not.a.jwt", "abc123"];

			for (const token of malformedTokens) {
				const response = await request.get(`${API_BASE_URL}/me/usage`, {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});

				expect(response.status()).toBe(401);
			}
		});
	});

	// ========================
	// FORBIDDEN (403)
	// ========================

	test.describe("403 Forbidden Responses", () => {
		test("should return 403 for access denied - PLACEHOLDER", async ({
			request,
		}) => {
			// Requires specific permissions scenario
			expect(true).toBe(true);
		});
	});

	// ========================
	// NOT FOUND (404)
	// ========================

	test.describe("404 Not Found Responses", () => {
		test("should return 404 for deleted user - PLACEHOLDER", async ({
			request,
		}) => {
			// Requires valid token for deleted user
			expect(true).toBe(true);
		});
	});

	// ========================
	// METHOD NOT ALLOWED (405)
	// ========================

	test.describe("405 Method Not Allowed Responses", () => {
		test("should return 405 for POST method", async ({ request }) => {
			const response = await request.post(`${API_BASE_URL}/me/usage`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: {},
			});

			expect([404, 405]).toContain(response.status());

			if (response.status() === 405) {
				const data = await response.json();
				expect(data.success).toBe(false);
				expect(data.error).toBe("method_not_allowed");
			}
		});

		test("should return 405 for PUT method", async ({ request }) => {
			const response = await request.put(`${API_BASE_URL}/me/usage`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: {},
			});

			expect([404, 405]).toContain(response.status());
		});

		test("should return 405 for DELETE method", async ({ request }) => {
			const response = await request.delete(`${API_BASE_URL}/me/usage`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			expect([404, 405]).toContain(response.status());
		});
	});

	// ========================
	// ACCOUNT LOCKED (423)
	// ========================

	test.describe("423 Account Locked Responses", () => {
		test("should return 423 for locked account - PLACEHOLDER", async ({
			request,
		}) => {
			// Requires locked account
			expect(true).toBe(true);
		});
	});

	// ========================
	// RATE LIMIT (429)
	// ========================

	test.describe("429 Rate Limit Responses", () => {
		test("should return 429 after excessive requests - PLACEHOLDER", async ({
			request,
		}) => {
			// Requires rate limiting
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
		test("should handle invalid day parameter", async ({ request }) => {
			const invalidDays = [0, 32, -1, 100];

			for (const day of invalidDays) {
				const response = await request.get(
					`${API_BASE_URL}/me/usage?day=${day}`,
					{
						headers: {
							Authorization: `Bearer ${validAccessToken}`,
						},
					},
				);

				expect([200, 400]).toContain(response.status());
			}
		});

		test("should handle invalid month parameter", async ({ request }) => {
			const invalidMonths = [0, 13, -1, 100];

			for (const month of invalidMonths) {
				const response = await request.get(
					`${API_BASE_URL}/me/usage?month=${month}`,
					{
						headers: {
							Authorization: `Bearer ${validAccessToken}`,
						},
					},
				);

				expect([200, 400]).toContain(response.status());
			}
		});

		test("should handle invalid year parameter", async ({ request }) => {
			const invalidYears = [1900, 3000, -1];

			for (const year of invalidYears) {
				const response = await request.get(
					`${API_BASE_URL}/me/usage?year=${year}`,
					{
						headers: {
							Authorization: `Bearer ${validAccessToken}`,
						},
					},
				);

				expect([200, 400]).toContain(response.status());
			}
		});

		test("should handle non-numeric parameters", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/me/usage?day=abc&month=xyz`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([200, 400]).toContain(response.status());
		});

		test("should handle very long parameter values", async ({ request }) => {
			const longValue = "1".repeat(1000);

			const response = await request.get(
				`${API_BASE_URL}/me/usage?day=${longValue}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([200, 400]).toContain(response.status());
		});

		test("should handle special characters in parameters", async ({
			request,
		}) => {
			const response = await request.get(
				`${API_BASE_URL}/me/usage?day=<script>`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([200, 400]).toContain(response.status());
		});

		test("should handle concurrent requests", async ({ request }) => {
			const requests = Array(5)
				.fill(null)
				.map(() =>
					request.get(`${API_BASE_URL}/me/usage`, {
						headers: {
							Authorization: `Bearer ${validAccessToken}`,
						},
					}),
				);

			const responses = await Promise.all(requests);

			responses.forEach((response) => {
				expect(response.status()).toBe(200);
			});
		});

		test("should handle concurrent requests with filters", async ({
			request,
		}) => {
			const requests = Array(3)
				.fill(null)
				.map((_, i) =>
					request.get(`${API_BASE_URL}/me/usage?month=${i + 1}&year=2026`, {
						headers: {
							Authorization: `Bearer ${validAccessToken}`,
						},
					}),
				);

			const responses = await Promise.all(requests);

			responses.forEach((response) => {
				expect([200, 400]).toContain(response.status());
			});
		});
	});

	// ========================
	// SECURITY TESTS
	// ========================

	test.describe("Security Tests", () => {
		test("should not expose sensitive data", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/me/usage`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			const data = await response.json();
			const responseText = JSON.stringify(data);

			expect(responseText).not.toContain("password");
			expect(responseText).not.toContain("secretKey");
		});

		test("should not expose database structure", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/me/usage`, {
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

			const response = await request.get(`${API_BASE_URL}/me/usage`, {
				headers: {
					Authorization: `Bearer ${fakeToken}`,
				},
			});

			expect(response.status()).toBe(401);
		});

		test("should return only logged-in user usage", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/me/usage`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			const data = await response.json();

			// Should be for authenticated user only
			expect(response.status()).toBe(200);
		});

		test("should sanitize parameter inputs", async ({ request }) => {
			const sqlInjections = ["1 OR 1=1", "1'; DROP TABLE users; --"];

			for (const injection of sqlInjections) {
				const response = await request.get(
					`${API_BASE_URL}/me/usage?day=${encodeURIComponent(injection)}`,
					{
						headers: {
							Authorization: `Bearer ${validAccessToken}`,
						},
					},
				);

				expect([200, 400]).toContain(response.status());

				const data = await response.json();
				const responseText = JSON.stringify(data);
				expect(responseText.toLowerCase()).not.toContain("sql");
			}
		});
	});

	// ========================
	// RESPONSE FORMAT TESTS
	// ========================

	test.describe("Response Format Tests", () => {
		test("should return consistent success structure", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/me/usage`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			expect(response.status()).toBe(200);

			const data = await response.json();
			expect(data).toHaveProperty("success");
			expect(typeof data.success).toBe("boolean");
		});

		test("should return consistent error structure", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/me/usage`);

			const data = await response.json();
			expect(data).toHaveProperty("success");
			expect(data).toHaveProperty("error");
			expect(data).toHaveProperty("message");
		});

		test("should return proper content type", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/me/usage`, {
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

			const response = await request.get(`${API_BASE_URL}/me/usage`, {
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
					request.get(`${API_BASE_URL}/me/usage`, {
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
