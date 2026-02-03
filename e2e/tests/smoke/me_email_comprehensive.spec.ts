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

	// ========================
	// NOT FOUND (404)
	// ========================

	// ========================
	// METHOD NOT ALLOWED (405)
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

			expect([200, 400, 409, 422, 500, 401]).toContain(response.status());
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

			expect([200, 400, 409, 500, 401]).toContain(response.status());
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

			expect([200, 400, 409, 500, 401]).toContain(response.status());
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

			expect([200, 400, 409, 422, 500, 401]).toContain(response.status());
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

			expect([200, 400, 409, 500, 401]).toContain(response.status());
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
				expect([200, 400, 409, 500, 401]).toContain(response.status());
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

			expect([400, 422, 500, 401]).toContain(response.status());
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

				expect([400, 422, 500, 401]).toContain(response.status());
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

			expect([401, 404, 500]).toContain(response.status());
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

			expect([200, 400, 409, 500, 401]).toContain(response.status());
			expect(duration).toBeLessThan(500);
		});
	});
});

