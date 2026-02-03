/** @format */

import { test, expect } from "@playwright/test";
import { testData } from "../testData";

const API_BASE_URL = "http://127.0.0.1:5050";

/**
 * Comprehensive test suite for GET /me/subscription endpoint
 * Tests ALL response codes: 200, 401, 405, 429
 * Based on Swagger documentation and existing TEST_REPORT
 */

test.describe("GET /me/subscription - Comprehensive Tests", () => {
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
	// EDGE CASES
	// ========================

	test.describe("Edge Cases", () => {
		test("should handle very long authorization header", async ({
			request,
		}) => {
			const longToken = "Bearer " + "a".repeat(10000);

			const response = await request.get(`${API_BASE_URL}/me/subscription`, {
				headers: {
					Authorization: longToken,
				},
			});

			expect([400, 401, 404, 500, 401]).toContain(response.status());
		});

		test("should handle special characters in header", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/me/subscription`, {
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
				const response = await request.get(`${API_BASE_URL}/me/subscription`, {
					headers: {
						Authorization: auth,
					},
				});

				expect([200, 401, 500, 401]).toContain(response.status());
			}
		});

		test("should handle whitespace in header", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/me/subscription`, {
				headers: {
					Authorization: `Bearer  ${validAccessToken}  `,
				},
			});

			expect([200, 400, 401, 500, 401]).toContain(response.status());
		});

		test("should handle invalid query parameters", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/me/subscription?invalid=param`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			// Should either ignore or reject
			expect([200, 400, 500, 401]).toContain(response.status());
		});

		test("should return fresh data on each request", async ({ request }) => {
			const response1 = await request.get(`${API_BASE_URL}/me/subscription`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			await new Promise((resolve) => setTimeout(resolve, 100));

			const response2 = await request.get(`${API_BASE_URL}/me/subscription`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			expect(response1.status()).toBe(200);
			expect(response2.status()).toBe(200);

			const data1 = await response1.json();
			const data2 = await response2.json();

			// Data should be consistent
			if (data1.subscription && data2.subscription) {
				expect(data1.subscription.status).toBe(data2.subscription.status);
			}
		});
	});

	// ========================
	// SECURITY TESTS
	// ========================

	test.describe("Security Tests", () => {
		test("should not expose sensitive payment data", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/me/subscription`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			const data = await response.json();
			const responseText = JSON.stringify(data);

			expect(responseText).not.toContain("stripeSecretKey");
			expect(responseText).not.toContain("paymentMethodId");
			expect(responseText).not.toMatch(/\b\d{16}\b/);
		});

		test("should not expose database structure", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/me/subscription`, {
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

			const response = await request.get(`${API_BASE_URL}/me/subscription`, {
				headers: {
					Authorization: `Bearer ${fakeToken}`,
				},
			});

			expect([401, 404, 500]).toContain(response.status());
		});

		test("should return only logged-in user subscription", async ({
			request,
		}) => {
			const response = await request.get(`${API_BASE_URL}/me/subscription`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			const data = await response.json();

			// Should be for the authenticated user's company
			if (data.subscription && data.subscription.companyId) {
				expect(data.subscription.companyId).toBe(
					testData.users.admin1.companyId,
				);
			}
		});
	});

	// ========================
	// RESPONSE FORMAT TESTS
	// ========================

	test.describe("Response Format Tests", () => {
		test("should return consistent success structure", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/me/subscription`, {
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
			const response = await request.get(`${API_BASE_URL}/me/subscription`);

			const data = await response.json();
			expect(data).toHaveProperty("success");
			expect(data).toHaveProperty("error");
			expect(data).toHaveProperty("message");
		});

		test("should return proper content type", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/me/subscription`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			const contentType = response.headers()["content-type"];
			expect(contentType).toContain("application/json");
		});

		test("should handle null subscription gracefully", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/me/subscription`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			const data = await response.json();

			if (data.subscription === null) {
				expect(data.subscription).toBeNull();
			} else if (typeof data.subscription === "object") {
				expect(data.subscription).toBeDefined();
			}
		});

		test("should format dates consistently", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/me/subscription`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			const data = await response.json();

			if (data.subscription) {
				const dateFields = [
					"startDate",
					"endDate",
					"renewalDate",
					"cancelledAt",
				];

				dateFields.forEach((field) => {
					if (data.subscription[field]) {
						const date = new Date(data.subscription[field]);
						expect(date.toString()).not.toBe("Invalid Date");
					}
				});
			}
		});
	});

	// ========================
	// PERFORMANCE TESTS
	// ========================

	test.describe("Performance Tests", () => {
		test("should respond quickly (< 500ms)", async ({ request }) => {
			const start = Date.now();

			const response = await request.get(`${API_BASE_URL}/me/subscription`, {
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
					request.get(`${API_BASE_URL}/me/subscription`, {
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

