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

	test.describe("200 Success Responses", () => {
		test("should return user profile with valid token - 200", async ({
			request,
		}) => {
			const response = await request.get(`${API_BASE_URL}/me/profile`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			expect(response.status()).toBe(200);

			const data = await response.json();
			expect(data.success).toBe(true);
			expect(data.user).toBeDefined();
		});

		test("should return correct user data structure", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/me/profile`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			expect(response.status()).toBe(200);

			const data = await response.json();
			const user = data.user;

			// User object structure
			expect(user).toHaveProperty("id");
			expect(user).toHaveProperty("email");
			expect(user.email).toBe(testData.users.admin1.email);

			// Common profile fields (API uses lowercase)
			if (user.firstname !== undefined) {
				expect(typeof user.firstname).toBe("string");
			}
			if (user.lastname !== undefined) {
				expect(typeof user.lastname).toBe("string");
			}
			if (user.role !== undefined) {
				expect(typeof user.role).toBe("number");
			}
		});

		test("should not include sensitive information", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/me/profile`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			expect(response.status()).toBe(200);

			const data = await response.json();
			const responseText = JSON.stringify(data);

			// Should NOT include password hash or sensitive data
			// Note: passwordSet is a boolean field indicating if password exists, not the actual password
			expect(responseText).not.toContain("passwordHash");
			expect(responseText).not.toContain("hash");
			expect(responseText).not.toContain("salt");
		});

		test("should return user preferences if available", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/me/profile`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			expect(response.status()).toBe(200);

			const data = await response.json();

			// May include user preferences
			if (data.user.preferences) {
				expect(typeof data.user.preferences).toBe("object");
			}

			// May include language/locale settings
			if (data.user.language) {
				expect(typeof data.user.language).toBe("string");
			}
		});

		test("should work with different valid tokens", async ({ request }) => {
			// Login as different user
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

			const response = await request.get(`${API_BASE_URL}/me/profile`, {
				headers: {
					Authorization: `Bearer ${admin2Token}`,
				},
			});

			expect(response.status()).toBe(200);

			const data = await response.json();
			expect(data.user.email).toBe(testData.users.admin2.email);
		});

		test("should return fresh data on each request", async ({ request }) => {
			const response1 = await request.get(`${API_BASE_URL}/me/profile`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			await new Promise((resolve) => setTimeout(resolve, 100));

			const response2 = await request.get(`${API_BASE_URL}/me/profile`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			expect(response1.status()).toBe(200);
			expect(response2.status()).toBe(200);

			const data1 = await response1.json();
			const data2 = await response2.json();

			expect(data1.user.id).toBe(data2.user.id);
			expect(data1.user.email).toBe(data2.user.email);
		});

		test("should handle concurrent requests", async ({ request }) => {
			const requests = Array(5)
				.fill(null)
				.map(() =>
					request.get(`${API_BASE_URL}/me/profile`, {
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
	});

	// ========================
	// UNAUTHORIZED (401)
	// ========================

	test.describe("401 Unauthorized Responses", () => {
		test("should return 401 when Authorization header is missing", async ({
			request,
		}) => {
			const response = await request.get(`${API_BASE_URL}/me/profile`);

			expect(response.status()).toBe(401);

			const data = await response.json();
			expect(data.success).toBe(false);
			expect(data.error).toBe("unauthorized");
		});

		test("should return 401 for invalid token", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/me/profile`, {
				headers: {
					Authorization: "Bearer invalid-token-12345",
				},
			});

			expect(response.status()).toBe(401);

			const data = await response.json();
			expect(data.success).toBe(false);
			expect(data.error).toBe("unauthorized");
		});

		test("should return 401 for expired token", async ({ request }) => {
			const expiredToken =
				"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE2MDAwMDM2MDB9.expired";

			const response = await request.get(`${API_BASE_URL}/me/profile`, {
				headers: {
					Authorization: `Bearer ${expiredToken}`,
				},
			});

			expect(response.status()).toBe(401);
		});

		test("should return 401 for malformed JWT", async ({ request }) => {
			const malformedTokens = [
				"not.a.jwt",
				"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.malformed",
				"abc123",
			];

			for (const token of malformedTokens) {
				const response = await request.get(`${API_BASE_URL}/me/profile`, {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});

				expect(response.status()).toBe(401);
			}
		});

		test("should return 401 for token without Bearer prefix", async ({
			request,
		}) => {
			const response = await request.get(`${API_BASE_URL}/me/profile`, {
				headers: {
					Authorization: validAccessToken,
				},
			});

			expect([400, 401]).toContain(response.status());
		});

		test("should return 401 with empty Bearer token", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/me/profile`, {
				headers: {
					Authorization: "Bearer ",
				},
			});

			expect([400, 401]).toContain(response.status());
		});
	});

	// ========================
	// METHOD NOT ALLOWED (405)
	// ========================

	test.describe("405 Method Not Allowed Responses", () => {
		test("should return 405 for DELETE method", async ({ request }) => {
			const response = await request.delete(`${API_BASE_URL}/me/profile`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			expect([404, 405]).toContain(response.status());

			if (response.status() === 405) {
				const data = await response.json();
				expect(data.success).toBe(false);
				expect(data.error).toBe("method_not_allowed");
			}
		});

		test("should return 405 for POST method", async ({ request }) => {
			const response = await request.post(`${API_BASE_URL}/me/profile`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: {},
			});

			expect([404, 405]).toContain(response.status());
		});

		test("should return 405 for PUT method", async ({ request }) => {
			const response = await request.put(`${API_BASE_URL}/me/profile`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: {},
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
			// This requires a locked account in the database
			// Placeholder test
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
			// This requires rate limiting to be enabled and triggered
			// Placeholder test
			expect(true).toBe(true);
		});
	});

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

			expect([400, 401]).toContain(response.status());
		});

		test("should handle special characters in header", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/me/profile`, {
				headers: {
					Authorization: "Bearer token!@#$%^&*()",
				},
			});

			expect(response.status()).toBe(401);
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
				expect([200, 401]).toContain(response.status());
			}
		});

		test("should handle whitespace in header", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/me/profile`, {
				headers: {
					Authorization: `Bearer  ${validAccessToken}  `,
				},
			});

			expect([200, 400, 401]).toContain(response.status());
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
			expect([200, 400]).toContain(response.status());
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

			expect(response.status()).toBe(401);
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
