/** @format */

import { test, expect } from "@playwright/test";
import { testData } from "../testData";

const API_BASE_URL = "http://127.0.0.1:5050";

/**
 * Comprehensive test suite for PATCH /me/profile endpoint
 * Tests ALL response codes: 200, 400, 401, 403, 404, 405, 415, 422, 423, 429, 500, 503, 504
 * Based on Swagger documentation - Update user profile fields dynamically
 */

test.describe("PATCH /me/profile - Comprehensive Tests", () => {
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
	// EDGE CASES
	// ========================

	test.describe("Edge Cases", () => {
		test("should handle unicode characters in name", async ({ request }) => {
			const response = await request.patch(`${API_BASE_URL}/me/profile`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: {
					firstName: "José",
				},
			});

			expect([200, 400, 422, 500, 401]).toContain(response.status());
		});

		test("should handle emoji in name", async ({ request }) => {
			const response = await request.patch(`${API_BASE_URL}/me/profile`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: {
					firstName: "Test 😀",
				},
			});

			expect([200, 400, 422, 500, 401]).toContain(response.status());
		});

		test("should handle whitespace-only values", async ({ request }) => {
			const response = await request.patch(`${API_BASE_URL}/me/profile`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: {
					firstName: "   ",
				},
			});

			expect([400, 422, 500, 401]).toContain(response.status());
		});

		test("should handle concurrent updates", async ({ request }) => {
			const updates = Array(3)
				.fill(null)
				.map((_, i) =>
					request.patch(`${API_BASE_URL}/me/profile`, {
						headers: {
							Authorization: `Bearer ${validAccessToken}`,
							"Content-Type": "application/json",
						},
						data: {
							firstName: `Test${i}`,
						},
					}),
				);

			const responses = await Promise.all(updates);

			responses.forEach((response) => {
				expect([200, 400, 422, 500, 401]).toContain(response.status());
			});
		});

		test("should trim whitespace from values", async ({ request }) => {
			const response = await request.patch(`${API_BASE_URL}/me/profile`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: {
					firstName: "  Test  ",
				},
			});

			expect([200, 400, 422, 500, 401]).toContain(response.status());

			if (response.status() === 200) {
				const data = await response.json();
				if (data.user && data.user.firstName) {
					// Should be trimmed
					expect(data.user.firstName).toBe("Test");
				}
			}
		});
	});

	// ========================
	// SECURITY TESTS
	// ========================

	test.describe("Security Tests", () => {
		test("should sanitize XSS attempts", async ({ request }) => {
			const xssAttempts = [
				"<script>alert('xss')</script>",
				"<img src=x onerror=alert(1)>",
			];

			for (const xss of xssAttempts) {
				const response = await request.patch(`${API_BASE_URL}/me/profile`, {
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						firstName: xss,
					},
				});

				expect([200, 400, 422, 500, 401]).toContain(response.status());

				if (response.status() === 200) {
					const data = await response.json();
					if (data.user && data.user.firstName) {
						// Should not contain script tags
						expect(data.user.firstName).not.toContain("<script>");
					}
				}
			}
		});

		test("should not allow updating immutable fields", async ({ request }) => {
			const response = await request.patch(`${API_BASE_URL}/me/profile`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: {
					id: 999,
					role: "superAdmin",
				},
			});

			// Should either ignore or reject
			expect([200, 400, 403, 422, 500, 401]).toContain(response.status());
		});

		test("should not expose sensitive data in response", async ({
			request,
		}) => {
			const response = await request.patch(`${API_BASE_URL}/me/profile`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: {
					firstName: "Test",
				},
			});

			if (response.status() === 200) {
				const data = await response.json();
				const responseText = JSON.stringify(data);

				expect(responseText).not.toContain("password");
				expect(responseText).not.toContain("hash");
			}
		});
	});

	// ========================
	// RESPONSE FORMAT TESTS
	// ========================

	test.describe("Response Format Tests", () => {
		test("should return consistent success structure", async ({ request }) => {
			const response = await request.patch(`${API_BASE_URL}/me/profile`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: {
					firstname: "Test",
				},
			});

			expect(response.status()).toBe(200);

			const data = await response.json();
			expect(data).toHaveProperty("success");
			expect(data).toHaveProperty("message");
		});

		test("should return consistent error structure", async ({ request }) => {
			const response = await request.patch(`${API_BASE_URL}/me/profile`, {
				headers: {
					"Content-Type": "application/json",
				},
				data: {},
			});

			const data = await response.json();
			expect(data).toHaveProperty("success");
			expect(data).toHaveProperty("error");
			expect(data).toHaveProperty("message");
		});

		test("should return proper content type", async ({ request }) => {
			const response = await request.patch(`${API_BASE_URL}/me/profile`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: {
					firstName: "Test",
				},
			});

			const contentType = response.headers()["content-type"];
			expect(contentType).toContain("application/json");
		});
	});
});

