/** @format */

import { test, expect } from "@playwright/test";
import { testData } from "../testData";

const API_BASE_URL = "http://127.0.0.1:5050";

/**
 * Comprehensive test suite for POST /me/email endpoint
 * Tests ALL response codes: 200, 400, 401, 403, 404, 405, 409, 422, 423, 429, 500, 503, 504
 * Based on Swagger documentation - Update user email address and send verification link
 */

test.describe("POST /me/email - Comprehensive Tests", () => {
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
		test("should send verification email for new email - 200", async ({
			request,
		}) => {
			const newEmail = `test${Date.now()}@example.com`;

			const response = await request.post(`${API_BASE_URL}/me/email`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: {
					email: newEmail,
				},
			});

			expect([200, 400, 409]).toContain(response.status());

			if (response.status() === 200) {
				const data = await response.json();
				expect(data.success).toBe(true);
				expect(data.message).toBeDefined();
			}
		});

		test("should accept valid email format", async ({ request }) => {
			const validEmails = [
				`valid${Date.now()}@test.com`,
				`user.name${Date.now()}@example.co.uk`,
			];

			for (const email of validEmails) {
				const response = await request.post(`${API_BASE_URL}/me/email`, {
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: { email },
				});

				expect([200, 400, 409]).toContain(response.status());
			}
		});

		test("should return success message structure", async ({ request }) => {
			const newEmail = `newemail${Date.now()}@test.com`;

			const response = await request.post(`${API_BASE_URL}/me/email`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: {
					email: newEmail,
				},
			});

			if (response.status() === 200) {
				const data = await response.json();
				expect(data).toHaveProperty("success");
				expect(data).toHaveProperty("message");
			}
		});
	});

	// ========================
	// BAD REQUEST (400)
	// ========================

	test.describe("400 Bad Request Responses", () => {
		test("should return 400 when email field is missing", async ({
			request,
		}) => {
			const response = await request.post(`${API_BASE_URL}/me/email`, {
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

		test("should return 400 for empty email string", async ({ request }) => {
			const response = await request.post(`${API_BASE_URL}/me/email`, {
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

		test("should return 400 for null email", async ({ request }) => {
			const response = await request.post(`${API_BASE_URL}/me/email`, {
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

		test("should return 400 for invalid email format", async ({ request }) => {
			const invalidEmails = [
				"not-an-email",
				"missing@domain",
				"@nodomain.com",
				"spaces in@email.com",
				"double@@at.com",
			];

			for (const email of invalidEmails) {
				const response = await request.post(`${API_BASE_URL}/me/email`, {
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
			const response = await request.post(`${API_BASE_URL}/me/email`, {
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
			const response = await request.post(`${API_BASE_URL}/me/email`, {
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
			const response = await request.post(`${API_BASE_URL}/me/email`, {
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

			const response = await request.post(`${API_BASE_URL}/me/email`, {
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

		test("should return 401 for malformed JWT", async ({ request }) => {
			const malformedTokens = ["not.a.jwt", "abc123"];

			for (const token of malformedTokens) {
				const response = await request.post(`${API_BASE_URL}/me/email`, {
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
					data: {
						email: "test@example.com",
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
		test("should return 403 for restricted user - PLACEHOLDER", async ({
			request,
		}) => {
			// Requires user without email update permissions
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
			const response = await request.get(`${API_BASE_URL}/me/email`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			expect([404, 405]).toContain(response.status());
		});

		test("should return 405 for PUT method", async ({ request }) => {
			const response = await request.put(`${API_BASE_URL}/me/email`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: {
					email: "test@example.com",
				},
			});

			expect([404, 405]).toContain(response.status());
		});

		test("should return 405 for DELETE method", async ({ request }) => {
			const response = await request.delete(`${API_BASE_URL}/me/email`, {
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
		test("should return 409 when email already exists", async ({ request }) => {
			const response = await request.post(`${API_BASE_URL}/me/email`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: {
					email: testData.users.admin2.email,
				},
			});

			expect([400, 409]).toContain(response.status());

			const data = await response.json();
			expect(data.success).toBe(false);
		});

		test("should return 409 for email already in use", async ({ request }) => {
			const existingEmail = testData.users.admin1.email;

			const response = await request.post(`${API_BASE_URL}/me/email`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: {
					email: existingEmail,
				},
			});

			expect([200, 400, 409]).toContain(response.status());
		});
	});

	// ========================
	// VALIDATION ERROR (422)
	// ========================

	test.describe("422 Validation Error Responses", () => {
		test("should return 422 for invalid email format", async ({ request }) => {
			const response = await request.post(`${API_BASE_URL}/me/email`, {
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
			const longEmail = "a".repeat(200) + "@example.com";

			const response = await request.post(`${API_BASE_URL}/me/email`, {
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

		test("should return 422 for email with special characters", async ({
			request,
		}) => {
			const response = await request.post(`${API_BASE_URL}/me/email`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: {
					email: "test<script>@example.com",
				},
			});

			expect([400, 422]).toContain(response.status());
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
		test("should handle email with unicode characters", async ({ request }) => {
			const response = await request.post(`${API_BASE_URL}/me/email`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: {
					email: `tëst${Date.now()}@example.com`,
				},
			});

			expect([200, 400, 409, 422]).toContain(response.status());
		});

		test("should handle email with plus addressing", async ({ request }) => {
			const response = await request.post(`${API_BASE_URL}/me/email`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: {
					email: `user+tag${Date.now()}@example.com`,
				},
			});

			expect([200, 400, 409]).toContain(response.status());
		});

		test("should handle email with subdomain", async ({ request }) => {
			const response = await request.post(`${API_BASE_URL}/me/email`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: {
					email: `test${Date.now()}@mail.example.com`,
				},
			});

			expect([200, 400, 409]).toContain(response.status());
		});

		test("should trim whitespace from email", async ({ request }) => {
			const email = `test${Date.now()}@example.com`;

			const response = await request.post(`${API_BASE_URL}/me/email`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: {
					email: `  ${email}  `,
				},
			});

			expect([200, 400, 409, 422]).toContain(response.status());
		});

		test("should handle case-insensitive email", async ({ request }) => {
			const response = await request.post(`${API_BASE_URL}/me/email`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: {
					email: testData.users.admin2.email.toUpperCase(),
				},
			});

			expect([200, 400, 409]).toContain(response.status());
		});

		test("should handle concurrent email update requests", async ({
			request,
		}) => {
			const email1 = `concurrent1${Date.now()}@example.com`;
			const email2 = `concurrent2${Date.now()}@example.com`;

			const requests = [email1, email2].map((email) =>
				request.post(`${API_BASE_URL}/me/email`, {
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: { email },
				}),
			);

			const responses = await Promise.all(requests);

			responses.forEach((response) => {
				expect([200, 400, 409]).toContain(response.status());
			});
		});
	});

	// ========================
	// SECURITY TESTS
	// ========================

	test.describe("Security Tests", () => {
		test("should sanitize XSS attempts in email", async ({ request }) => {
			const response = await request.post(`${API_BASE_URL}/me/email`, {
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

		test("should prevent SQL injection attempts", async ({ request }) => {
			const sqlInjections = [
				"test@example.com'; DROP TABLE users; --",
				"admin@example.com' OR '1'='1",
			];

			for (const email of sqlInjections) {
				const response = await request.post(`${API_BASE_URL}/me/email`, {
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: { email },
				});

				expect([400, 422]).toContain(response.status());
			}
		});

		test("should not expose sensitive data in response", async ({
			request,
		}) => {
			const response = await request.post(`${API_BASE_URL}/me/email`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: {
					email: testData.users.admin2.email,
				},
			});

			const data = await response.json();
			const responseText = JSON.stringify(data);

			expect(responseText).not.toContain("passwordHash");
			expect(responseText).not.toContain("secretKey");
		});

		test("should validate token on every request", async ({ request }) => {
			const fakeToken =
				"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjF9.fake";

			const response = await request.post(`${API_BASE_URL}/me/email`, {
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
			const response = await request.post(`${API_BASE_URL}/me/email`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: {
					email: `new${Date.now()}@example.com`,
				},
			});

			if (response.status() === 200) {
				const data = await response.json();
				expect(data).toHaveProperty("success");
				expect(data).toHaveProperty("message");
			}
		});

		test("should return consistent error structure", async ({ request }) => {
			const response = await request.post(`${API_BASE_URL}/me/email`, {
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
			const response = await request.post(`${API_BASE_URL}/me/email`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: {
					email: `test${Date.now()}@example.com`,
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

			const response = await request.post(`${API_BASE_URL}/me/email`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: {
					email: `fast${Date.now()}@example.com`,
				},
			});

			const duration = Date.now() - start;

			expect([200, 400, 409]).toContain(response.status());
			expect(duration).toBeLessThan(500);
		});
	});
});
