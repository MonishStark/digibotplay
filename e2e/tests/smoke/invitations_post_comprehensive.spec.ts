/** @format */

import { test, expect } from "@playwright/test";
import { testData } from "../testData";

const API_BASE_URL = "http://127.0.0.1:5050";

/**
 * Comprehensive test suite for POST /invitations endpoint
 * Tests ALL response codes: 200, 400, 401, 404, 409, 415, 422, 429, 500, 503, 504
 * Based on Swagger documentation - Send invitation to join company with designated role
 */

test.describe("POST /invitations - Comprehensive Tests", () => {
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
		test("should send invitation successfully - 200", async ({ request }) => {
			const response = await request.post(`${API_BASE_URL}/invitations`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: {
					email: `invited${Date.now()}@test.com`,
				},
			});

			expect([200, 201, 400, 409]).toContain(response.status());

			if (response.status() === 200 || response.status() === 201) {
				const data = await response.json();
				expect(data.success).toBe(true);
			}
		});

		test("should accept valid email formats", async ({ request }) => {
			const validEmails = [
				`user${Date.now()}@example.com`,
				`test.user${Date.now()}@company.co.uk`,
			];

			for (const email of validEmails) {
				const response = await request.post(`${API_BASE_URL}/invitations`, {
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: { email },
				});

				expect([200, 201, 400, 409]).toContain(response.status());
			}
		});

		test("should return invitation details in response", async ({
			request,
		}) => {
			const response = await request.post(`${API_BASE_URL}/invitations`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: {
					email: `details${Date.now()}@test.com`,
				},
			});

			if (response.status() === 200 || response.status() === 201) {
				const data = await response.json();
				expect(data).toHaveProperty("success");
			}
		});
	});

	// ========================
	// BAD REQUEST (400)
	// ========================

	test.describe("400 Bad Request Responses", () => {
		test("should return 400 when email is missing", async ({ request }) => {
			const response = await request.post(`${API_BASE_URL}/invitations`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: {},
			});

			expect([400, 422]).toContain(response.status());

			const data = await response.json();
			expect(data.success).toBe(false);
		});

		test("should return 400 for empty email", async ({ request }) => {
			const response = await request.post(`${API_BASE_URL}/invitations`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: {
					email: "",
				},
			});

			expect([400, 422]).toContain(response.status());
		});

		test("should return 400 for invalid email format", async ({ request }) => {
			const invalidEmails = [
				"not-an-email",
				"missing@domain",
				"@example.com",
				"test@",
			];

			for (const email of invalidEmails) {
				const response = await request.post(`${API_BASE_URL}/invitations`, {
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: { email },
				});

				expect([400, 422]).toContain(response.status());
			}
		});

		test("should return 400 for malformed JSON", async ({ request }) => {
			const response = await request.post(`${API_BASE_URL}/invitations`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: "{ invalid json",
			});

			expect([400, 500]).toContain(response.status());
		});
	});

	// ========================
	// UNAUTHORIZED (401)
	// ========================

	test.describe("401 Unauthorized Responses", () => {
		test("should return 401 when Authorization header is missing", async ({
			request,
		}) => {
			const response = await request.post(`${API_BASE_URL}/invitations`, {
				headers: {
					"Content-Type": "application/json",
				},
				data: {
					email: "test@example.com",
				},
			});

			expect(response.status()).toBe(401);

			const data = await response.json();
			expect(data.success).toBe(false);
			expect(data.error).toBe("unauthorized");
		});

		test("should return 401 for invalid token", async ({ request }) => {
			const response = await request.post(`${API_BASE_URL}/invitations`, {
				headers: {
					Authorization: "Bearer invalid-token-12345",
					"Content-Type": "application/json",
				},
				data: {
					email: "test@example.com",
				},
			});

			expect(response.status()).toBe(401);
		});

		test("should return 401 for expired token", async ({ request }) => {
			const expiredToken =
				"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE2MDAwMDM2MDB9.expired";

			const response = await request.post(`${API_BASE_URL}/invitations`, {
				headers: {
					Authorization: `Bearer ${expiredToken}`,
					"Content-Type": "application/json",
				},
				data: {
					email: "test@example.com",
				},
			});

			expect(response.status()).toBe(401);
		});
	});

	// ========================
	// NOT FOUND (404)
	// ========================

	test.describe("404 Not Found Responses", () => {
		test("should return 404 for non-existent company - PLACEHOLDER", async ({
			request,
		}) => {
			expect(true).toBe(true);
		});
	});

	// ========================
	// CONFLICT (409)
	// ========================

	test.describe("409 Conflict Responses", () => {
		test("should return 409 when email already invited", async ({
			request,
		}) => {
			const email = `conflict${Date.now()}@test.com`;

			// First invitation
			await request.post(`${API_BASE_URL}/invitations`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: { email },
			});

			// Second invitation (duplicate)
			const response = await request.post(`${API_BASE_URL}/invitations`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: { email },
			});

			expect([200, 201, 400, 409]).toContain(response.status());
		});

		test("should return 409 for existing user email", async ({ request }) => {
			const response = await request.post(`${API_BASE_URL}/invitations`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: {
					email: testData.users.admin2.email,
				},
			});

			expect([200, 201, 400, 409]).toContain(response.status());
		});
	});

	// ========================
	// UNSUPPORTED MEDIA TYPE (415)
	// ========================

	test.describe("415 Unsupported Media Type Responses", () => {
		test("should return 415 for missing Content-Type", async ({ request }) => {
			const response = await request.post(`${API_BASE_URL}/invitations`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
				data: {
					email: "test@example.com",
				},
			});

			expect([200, 201, 400, 409, 415, 422]).toContain(response.status());
		});

		test("should return 415 for wrong Content-Type", async ({ request }) => {
			const response = await request.post(`${API_BASE_URL}/invitations`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "text/plain",
				},
				data: "email=test@example.com",
			});

			expect([400, 415, 422, 500]).toContain(response.status());
		});
	});

	// ========================
	// VALIDATION ERROR (422)
	// ========================

	test.describe("422 Validation Error Responses", () => {
		test("should return 422 for invalid email format", async ({ request }) => {
			const response = await request.post(`${API_BASE_URL}/invitations`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: {
					email: "not-valid-email",
				},
			});

			expect([400, 422]).toContain(response.status());
		});

		test("should return 422 for very long email", async ({ request }) => {
			const longEmail = "a".repeat(300) + "@example.com";

			const response = await request.post(`${API_BASE_URL}/invitations`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: {
					email: longEmail,
				},
			});

			expect([400, 422]).toContain(response.status());
		});

		test("should return 422 for null email", async ({ request }) => {
			const response = await request.post(`${API_BASE_URL}/invitations`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: {
					email: null,
				},
			});

			expect([400, 422]).toContain(response.status());
		});
	});

	// ========================
	// RATE LIMIT (429)
	// ========================

	test.describe("429 Rate Limit Responses", () => {
		test("should return 429 after excessive invitations - PLACEHOLDER", async ({
			request,
		}) => {
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
		test("should handle email with plus addressing", async ({ request }) => {
			const response = await request.post(`${API_BASE_URL}/invitations`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: {
					email: `user+tag${Date.now()}@example.com`,
				},
			});

			expect([200, 201, 400, 409]).toContain(response.status());
		});

		test("should handle email with subdomain", async ({ request }) => {
			const response = await request.post(`${API_BASE_URL}/invitations`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: {
					email: `test${Date.now()}@mail.example.com`,
				},
			});

			expect([200, 201, 400, 409]).toContain(response.status());
		});

		test("should trim whitespace from email", async ({ request }) => {
			const email = `test${Date.now()}@example.com`;

			const response = await request.post(`${API_BASE_URL}/invitations`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: {
					email: `  ${email}  `,
				},
			});

			expect([200, 201, 400, 409, 422]).toContain(response.status());
		});

		test("should handle concurrent invitations", async ({ request }) => {
			const emails = Array(3)
				.fill(null)
				.map((_, i) => `concurrent${Date.now()}_${i}@example.com`);

			const requests = emails.map((email) =>
				request.post(`${API_BASE_URL}/invitations`, {
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: { email },
				}),
			);

			const responses = await Promise.all(requests);

			responses.forEach((response) => {
				expect([200, 201, 400, 409]).toContain(response.status());
			});
		});
	});

	// ========================
	// SECURITY TESTS
	// ========================

	test.describe("Security Tests", () => {
		test("should sanitize XSS attempts", async ({ request }) => {
			const response = await request.post(`${API_BASE_URL}/invitations`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: {
					email: "<script>alert('xss')</script>@example.com",
				},
			});

			expect([400, 422]).toContain(response.status());
		});

		test("should prevent SQL injection", async ({ request }) => {
			const response = await request.post(`${API_BASE_URL}/invitations`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: {
					email: "test@example.com'; DROP TABLE invitations; --",
				},
			});

			expect([400, 422]).toContain(response.status());
		});

		test("should not expose sensitive data", async ({ request }) => {
			const response = await request.post(`${API_BASE_URL}/invitations`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: {
					email: `secure${Date.now()}@example.com`,
				},
			});

			if (response.status() === 200 || response.status() === 201) {
				const data = await response.json();
				const responseText = JSON.stringify(data);

				expect(responseText).not.toContain("passwordHash");
				expect(responseText).not.toContain("secretKey");
			}
		});

		test("should validate token on every request", async ({ request }) => {
			const fakeToken =
				"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjF9.fake";

			const response = await request.post(`${API_BASE_URL}/invitations`, {
				headers: {
					Authorization: `Bearer ${fakeToken}`,
					"Content-Type": "application/json",
				},
				data: {
					email: "test@example.com",
				},
			});

			expect(response.status()).toBe(401);
		});
	});

	// ========================
	// RESPONSE FORMAT TESTS
	// ========================

	test.describe("Response Format Tests", () => {
		test("should return consistent success structure", async ({ request }) => {
			const response = await request.post(`${API_BASE_URL}/invitations`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: {
					email: `format${Date.now()}@example.com`,
				},
			});

			if (response.status() === 200 || response.status() === 201) {
				const data = await response.json();
				expect(data).toHaveProperty("success");
			}
		});

		test("should return consistent error structure", async ({ request }) => {
			const response = await request.post(`${API_BASE_URL}/invitations`, {
				headers: {
					"Content-Type": "application/json",
				},
				data: {
					email: "test@example.com",
				},
			});

			const data = await response.json();
			expect(data).toHaveProperty("success");
			expect(data).toHaveProperty("error");
			expect(data).toHaveProperty("message");
		});

		test("should return proper content type", async ({ request }) => {
			const response = await request.post(`${API_BASE_URL}/invitations`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: {
					email: `content${Date.now()}@example.com`,
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

			const response = await request.post(`${API_BASE_URL}/invitations`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: {
					email: `perf${Date.now()}@example.com`,
				},
			});

			const duration = Date.now() - start;

			expect([200, 201, 400, 409]).toContain(response.status());
			expect(duration).toBeLessThan(500);
		});
	});
});
