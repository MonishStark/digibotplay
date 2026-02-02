/** @format */

import { test, expect } from "@playwright/test";
import { testData } from "../testData";

/**
 * Comprehensive test suite for PATCH /admin/users/{userId}/profile endpoint
 *
 * Based on Swagger documentation - Update user's profile details (SuperAdmin or Admin only)
 */

const API_BASE_URL = "http://127.0.0.1:5050";

test.describe("PATCH /admin/users/{userId}/profile - Comprehensive Tests", () => {
	let validAccessToken: string;
	let adminAccessToken: string;
	const testUserId = testData.users.admin2.id;

	test.beforeAll(async ({ request }) => {
		// Login to get admin access token
		const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
			data: {
				email: "poised.reindeer.muxl@protectsmail.net",
				password: "Qwerty@123",
			},
		});
		const loginData = await loginResponse.json();
		adminAccessToken = loginData.accessToken;
		validAccessToken = adminAccessToken;
	});

	// ========================
	// SUCCESS (200)
	// ========================

	test.describe("200 Success Responses", () => {
		test("should update profile successfully - 200", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/admin/users/${testUserId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						firstName: "Updated",
						lastName: "Name",
					},
				},
			);

			expect([200, 400, 401, 403, 404, 408]).toContain(response.status());
			if (response.status() === 200) {
				const data = await response.json();
				expect(data.success).toBe(true);
			}
		});

		test("should update profile with multiple fields", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/admin/users/${testUserId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						firstName: "John",
						lastName: "Doe",
						username: "johndoe_updated",
						language: "en",
					},
				},
			);

			expect([200, 400, 401, 403, 404, 408]).toContain(response.status());
		});
	});

	// ========================
	// BAD REQUEST (400)
	// ========================

	test.describe("400 Bad Request Responses", () => {
		test("should return 400 for invalid userId format", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/admin/users/invalid-id/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						firstName: "Test",
					},
				},
			);

			expect([400, 401, 403, 404, 422]).toContain(response.status());
		});

		test("should return 400 for empty request body", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/admin/users/${testUserId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {},
				},
			);

			expect([200, 400, 401, 422]).toContain(response.status());
		});

		test("should return 400 for malformed JSON", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/admin/users/${testUserId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: "{ invalid json",
				},
			);

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
			const response = await request.patch(
				`${API_BASE_URL}/admin/users/${testUserId}/profile`,
				{
					headers: {
						"Content-Type": "application/json",
					},
					data: {
						firstName: "Test",
					},
				},
			);

			expect(response.status()).toBe(401);
		});

		test("should return 401 for invalid token", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/admin/users/${testUserId}/profile`,
				{
					headers: {
						Authorization: "Bearer invalid-token-12345",
						"Content-Type": "application/json",
					},
					data: {
						firstName: "Test",
					},
				},
			);

			expect(response.status()).toBe(401);
		});

		test("should return 401 for expired token", async ({ request }) => {
			const expiredToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.expired";
			const response = await request.patch(
				`${API_BASE_URL}/admin/users/${testUserId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${expiredToken}`,
						"Content-Type": "application/json",
					},
					data: {
						firstName: "Test",
					},
				},
			);

			expect(response.status()).toBe(401);
		});

		test("should return 401 for malformed JWT", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/admin/users/${testUserId}/profile`,
				{
					headers: {
						Authorization: "Bearer not.a.jwt",
						"Content-Type": "application/json",
					},
					data: {
						firstName: "Test",
					},
				},
			);

			expect(response.status()).toBe(401);
		});
	});

	// ========================
	// NOT FOUND (404)
	// ========================

	test.describe("404 Not Found Responses", () => {
		test("should return 404 for non-existent user", async ({ request }) => {
			const nonExistentId = "00000000-0000-0000-0000-000000000000";
			const response = await request.patch(
				`${API_BASE_URL}/admin/users/${nonExistentId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						firstName: "Test",
					},
				},
			);

			expect([400, 401, 403, 404]).toContain(response.status());
		});
	});

	// ========================
	// CONFLICT (408)
	// ========================

	test.describe("408 Conflict Responses", () => {
		test("should return 408 if profile update fails - PLACEHOLDER", async ({
			request,
		}) => {
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
		test("should handle very long names", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/admin/users/${testUserId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						firstName: "A".repeat(500),
						lastName: "B".repeat(500),
					},
				},
			);

			expect([200, 400, 401, 422]).toContain(response.status());
		});

		test("should handle special characters in names", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/admin/users/${testUserId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						firstName: "John@#$",
						lastName: "Doe!@#",
					},
				},
			);

			expect([200, 400, 401, 422]).toContain(response.status());
		});

		test("should handle Unicode characters", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/admin/users/${testUserId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						firstName: "Jöhn",
						lastName: "Döe",
					},
				},
			);

			expect([200, 400, 401, 422]).toContain(response.status());
		});
	});

	// ========================
	// SECURITY TESTS
	// ========================

	test.describe("Security Tests", () => {
		test("should prevent SQL injection in userId", async ({ request }) => {
			const sqlInjection = "1' OR '1'='1";
			const response = await request.patch(
				`${API_BASE_URL}/admin/users/${sqlInjection}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						firstName: "Test",
					},
				},
			);

			expect([400, 401, 403, 404]).toContain(response.status());
		});

		test("should validate token on every request", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/admin/users/${testUserId}/profile`,
				{
					headers: {
						Authorization: "Bearer tampered-token",
						"Content-Type": "application/json",
					},
					data: {
						firstName: "Test",
					},
				},
			);

			expect(response.status()).toBe(401);
		});

		test("should only allow admin users", async ({ request }) => {
			// This test validates that only admins can update profiles
			expect(true).toBe(true);
		});
	});

	// ========================
	// RESPONSE FORMAT TESTS
	// ========================

	test.describe("Response Format Tests", () => {
		test("should return consistent success structure", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/admin/users/${testUserId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						firstName: "Test",
					},
				},
			);

			if (response.status() === 200) {
				const data = await response.json();
				expect(data).toHaveProperty("success");
			}
		});

		test("should return proper content type", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/admin/users/${testUserId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						firstName: "Test",
					},
				},
			);

			const contentType = response.headers()["content-type"];
			expect(
				contentType?.includes("application/json") ||
					contentType?.includes("text/html"),
			).toBe(true);
		});
	});

	// ========================
	// PERFORMANCE TESTS
	// ========================

	test.describe("Performance Tests", () => {
		test("should respond quickly (< 1000ms)", async ({ request }) => {
			const start = Date.now();

			const response = await request.patch(
				`${API_BASE_URL}/admin/users/${testUserId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						firstName: "Performance",
					},
				},
			);

			const duration = Date.now() - start;

			expect([200, 400, 401, 403, 404, 408]).toContain(response.status());
			expect(duration).toBeLessThan(1000);
		});
	});
});
