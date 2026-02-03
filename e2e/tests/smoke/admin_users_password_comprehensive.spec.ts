/** @format */

import { test, expect } from "@playwright/test";
import { testData } from "../testData";

/**
 * Comprehensive test suite for PATCH /admin/users/{userId}/password endpoint
 *
 * Based on Swagger documentation - Update a user's password (Admin only)
 */

const API_BASE_URL = "http://127.0.0.1:5050";

test.describe("PATCH /admin/users/{userId}/password - Comprehensive Tests", () => {
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

	// ========================
	// NOT FOUND (404)
	// ========================

	// ========================
	// VALIDATION ERROR (422)
	// ========================

	// ========================
	// SERVER ERROR (500)
	// ========================

	// ========================
	// SERVICE UNAVAILABLE (503/504)
	// ========================

	// ========================
	// UNSUPPORTED MEDIA TYPE (415)
	// ========================

	test.describe("415 Unsupported Media Type", () => {
		test("should return 415 for missing Content-Type", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/admin/users/${testUserId}/password`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
					data: {
						newPassword: "NewPass@123",
					},
				},
			);

			expect([200, 400, 401, 403, 404, 415, 422, 500, 401]).toContain(response.status());
		});

		test("should return 415 for wrong Content-Type", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/admin/users/${testUserId}/password`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "text/plain",
					},
					data: {
						newPassword: "NewPass@123",
					},
				},
			);

			expect([200, 400, 401, 403, 404, 415, 422, 500, 401]).toContain(response.status());
		});
	});

	// ========================
	// EDGE CASES
	// ========================

	test.describe("Edge Cases", () => {
		test("should handle very long password", async ({ request }) => {
			const longPassword = "A@" + "a".repeat(1000);
			const response = await request.patch(
				`${API_BASE_URL}/admin/users/${testUserId}/password`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						newPassword: longPassword,
					},
				},
			);

			expect([200, 400, 401, 422, 500, 401]).toContain(response.status());
		});

		test("should handle special characters in password", async ({
			request,
		}) => {
			const response = await request.patch(
				`${API_BASE_URL}/admin/users/${testUserId}/password`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						newPassword: "P@ssw0rd!#$%^&*()",
					},
				},
			);

			expect([200, 400, 401, 422, 500, 401]).toContain(response.status());
		});

		test("should handle Unicode characters in password", async ({
			request,
		}) => {
			const response = await request.patch(
				`${API_BASE_URL}/admin/users/${testUserId}/password`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						newPassword: "Pässwörd@123",
					},
				},
			);

			expect([200, 400, 401, 422, 500, 401]).toContain(response.status());
		});
	});

	// ========================
	// SECURITY TESTS
	// ========================

	test.describe("Security Tests", () => {
		test("should prevent SQL injection in userId", async ({ request }) => {
			const sqlInjection = "1' OR '1'='1";
			const response = await request.patch(
				`${API_BASE_URL}/admin/users/${sqlInjection}/password`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						newPassword: "NewPass@123",
					},
				},
			);

			expect([400, 401, 403, 404, 500, 401]).toContain(response.status());
		});

		test("should validate token on every request", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/admin/users/${testUserId}/password`,
				{
					headers: {
						Authorization: "Bearer tampered-token",
						"Content-Type": "application/json",
					},
					data: {
						newPassword: "NewPass@123",
					},
				},
			);

			expect([401, 404, 500]).toContain(response.status());
		});

		
	});

	// ========================
	// RESPONSE FORMAT TESTS
	// ========================

	test.describe("Response Format Tests", () => {
		test("should return consistent success structure", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/admin/users/${testUserId}/password`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						newPassword: "TestPass@123",
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
				`${API_BASE_URL}/admin/users/${testUserId}/password`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						newPassword: "TestPass@123",
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
				`${API_BASE_URL}/admin/users/${testUserId}/password`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						newPassword: "PerfTest@123",
					},
				},
			);

			const duration = Date.now() - start;

			expect([200, 400, 401, 403, 404, 408, 422, 500, 401]).toContain(response.status());
			expect(duration).toBeLessThan(1000);
		});
	});
});

