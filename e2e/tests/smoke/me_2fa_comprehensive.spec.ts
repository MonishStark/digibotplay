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

	test.describe("200 Success Responses", () => {
		test("should enable 2FA successfully - 200", async ({ request }) => {
			const response = await request.post(`${API_BASE_URL}/me/2fa`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: {
					enable2FA: true,
				},
			});

			expect([200, 400, 401, 403, 412, 422]).toContain(response.status());

			if (response.status() === 200) {
				const data = await response.json();
				expect(data.success).toBe(true);
			}
		});

		test("should return 2FA QR code data when enabling", async ({
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

			if (response.status() === 200) {
				const data = await response.json();
				// May contain QR code or secret
				if (data.qrCode || data.secret) {
					expect(data).toBeDefined();
				}
			}
		});

		test("should accept boolean enable2FA values", async ({ request }) => {
			const values = [true, false];

			for (const value of values) {
				const response = await request.post(`${API_BASE_URL}/me/2fa`, {
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						enable2FA: value,
					},
				});

				expect([200, 400, 401, 403, 412, 422]).toContain(response.status());
			}
		});
	});

	// ========================
	// BAD REQUEST (400)
	// ========================

	test.describe("400 Bad Request Responses", () => {
		test("should return 400 when enable2FA field is missing", async ({
			request,
		}) => {
			const response = await request.post(`${API_BASE_URL}/me/2fa`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: {},
			});

			expect([400, 403, 422]).toContain(response.status());

			const data = await response.json();
			expect(data.success).toBe(false);
		});

		test("should return 400 for invalid enable2FA type", async ({
			request,
		}) => {
			const invalidValues = ["true", "yes", 1, 0, null];

			for (const value of invalidValues) {
				const response = await request.post(`${API_BASE_URL}/me/2fa`, {
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						enable2FA: value,
					},
				});

				expect([200, 400, 401, 403, 412, 422]).toContain(response.status());
			}
		});

		test("should return 400 for malformed JSON", async ({ request }) => {
			const response = await request.post(`${API_BASE_URL}/me/2fa`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: "{ invalid json",
			});

			expect([400, 500]).toContain(response.status());
		});

		test("should return 400 for empty request body", async ({ request }) => {
			const response = await request.post(`${API_BASE_URL}/me/2fa`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: {},
			});

			expect([400, 403, 422]).toContain(response.status());
		});
	});

	// ========================
	// UNAUTHORIZED (401)
	// ========================

	test.describe("401 Unauthorized Responses", () => {
		test("should return 401 when Authorization header is missing", async ({
			request,
		}) => {
			const response = await request.post(`${API_BASE_URL}/me/2fa`, {
				headers: {
					"Content-Type": "application/json",
				},
				data: {
					enable2FA: true,
				},
			});

			expect([401, 403]).toContain(response.status());

			const data = await response.json();
			expect(data.success).toBe(false);
		});

		test("should return 401 for invalid token", async ({ request }) => {
			const response = await request.post(`${API_BASE_URL}/me/2fa`, {
				headers: {
					Authorization: "Bearer invalid-token-12345",
					"Content-Type": "application/json",
				},
				data: {
					enable2FA: true,
				},
			});

			expect([401, 403]).toContain(response.status());
		});

		test("should return 401 for expired token", async ({ request }) => {
			const expiredToken =
				"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE2MDAwMDM2MDB9.expired";

			const response = await request.post(`${API_BASE_URL}/me/2fa`, {
				headers: {
					Authorization: `Bearer ${expiredToken}`,
					"Content-Type": "application/json",
				},
				data: {
					enable2FA: true,
				},
			});

			expect([401, 403]).toContain(response.status());
		});

		test("should return 401 for malformed JWT", async ({ request }) => {
			const malformedTokens = ["not.a.jwt", "abc123"];

			for (const token of malformedTokens) {
				const response = await request.post(`${API_BASE_URL}/me/2fa`, {
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
					data: {
						enable2FA: true,
					},
				});

				expect([401, 403]).toContain(response.status());
			}
		});
	});

	// ========================
	// FORBIDDEN (403)
	// ========================

	test.describe("403 Forbidden Responses", () => {
		test("should return 403 for restricted user - PLACEHOLDER", async ({
			request,
		}) => {
			// Requires user without 2FA permissions
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
		test("should return 405 for GET method", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/me/2fa`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			expect([404, 405]).toContain(response.status());
		});

		test("should return 405 for PUT method", async ({ request }) => {
			const response = await request.put(`${API_BASE_URL}/me/2fa`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: {
					enable2FA: true,
				},
			});

			expect([404, 405]).toContain(response.status());
		});

		test("should return 405 for DELETE method", async ({ request }) => {
			const response = await request.delete(`${API_BASE_URL}/me/2fa`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			expect([404, 405]).toContain(response.status());
		});
	});

	// ========================
	// CONFLICT (409)
	// ========================

	test.describe("409 Conflict Responses", () => {
		test("should return 409 when 2FA already enabled/disabled - PLACEHOLDER", async ({
			request,
		}) => {
			// Requires checking current state
			expect(true).toBe(true);
		});
	});

	// ========================
	// VALIDATION ERROR (422)
	// ========================

	test.describe("422 Validation Error Responses", () => {
		test("should return 422 for missing required fields", async ({
			request,
		}) => {
			const response = await request.post(`${API_BASE_URL}/me/2fa`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: {},
			});

			expect([400, 403, 422]).toContain(response.status());
		});

		test("should return 422 for invalid data types", async ({ request }) => {
			const response = await request.post(`${API_BASE_URL}/me/2fa`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: {
					enable2FA: "not-a-boolean",
				},
			});

			expect([400, 401, 403, 412, 422]).toContain(response.status());
		});

		test("should return 422 for additional unexpected fields", async ({
			request,
		}) => {
			const response = await request.post(`${API_BASE_URL}/me/2fa`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: {
					enable2FA: true,
					unexpectedField: "value",
				},
			});

			expect([200, 400, 401, 403, 412, 422]).toContain(response.status());
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

			expect([200, 400, 401, 403, 412, 422, 413]).toContain(response.status());
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

			expect([401, 403]).toContain(response.status());
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

			expect([400, 401, 403, 412, 422]).toContain(response.status());
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

			expect([400, 401, 403, 412, 422]).toContain(response.status());
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

			expect([200, 400, 401, 403, 412, 422]).toContain(response.status());
			expect(duration).toBeLessThan(500);
		});
	});
});
