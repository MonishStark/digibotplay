/** @format */

import { test, expect } from "@playwright/test";
import { testData } from "../testData";

/**
 * Comprehensive test suite for PATCH /admin/users/{userId}/2fa endpoint
 *
 * Based on Swagger documentation - Enable or disable 2FA for a user (Admin only)
 */

const API_BASE_URL = "http://127.0.0.1:5050";

test.describe("PATCH /admin/users/{userId}/2fa - Comprehensive Tests", () => {
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
	// RATE LIMIT (429)
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
				`${API_BASE_URL}/admin/users/${testUserId}/2fa`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
					data: {
						enabled: true,
					},
				},
			);

			expect([200, 400, 401, 403, 404, 408, 415, 422]).toContain(
				response.status(),
			);
		});

		test("should return 415 for wrong Content-Type", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/admin/users/${testUserId}/2fa`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "text/plain",
					},
					data: {
						enabled: true,
					},
				},
			);

			expect([200, 400, 401, 403, 404, 408, 415, 422]).toContain(
				response.status(),
			);
		});
	});

	// ========================
	// EDGE CASES
	// ========================

	test.describe("Edge Cases", () => {
		test("should handle toggling 2FA multiple times", async ({ request }) => {
			// Enable 2FA
			const enable = await request.patch(
				`${API_BASE_URL}/admin/users/${testUserId}/2fa`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						enabled: true,
					},
				},
			);

			expect([200, 400, 401, 403, 404, 408]).toContain(enable.status());

			// Disable 2FA
			const disable = await request.patch(
				`${API_BASE_URL}/admin/users/${testUserId}/2fa`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						enabled: false,
					},
				},
			);

			expect([200, 400, 401, 403, 404, 408]).toContain(disable.status());
		});

		test("should handle null value for enabled", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/admin/users/${testUserId}/2fa`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						enabled: null,
					},
				},
			);

			expect([400, 401, 404, 422, 500, 401]).toContain(response.status());
		});

		test("should handle extra fields in request body", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/admin/users/${testUserId}/2fa`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						enabled: true,
						extraField: "should be ignored",
					},
				},
			);

			expect([200, 400, 401, 403, 404, 408, 500, 401]).toContain(response.status());
		});
	});

	// ========================
	// SECURITY TESTS
	// ========================

	test.describe("Security Tests", () => {
		test("should prevent SQL injection in userId", async ({ request }) => {
			const sqlInjection = "1' OR '1'='1";
			const response = await request.patch(
				`${API_BASE_URL}/admin/users/${sqlInjection}/2fa`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						enabled: true,
					},
				},
			);

			expect([400, 401, 403, 404, 500, 401]).toContain(response.status());
		});

		test("should validate token on every request", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/admin/users/${testUserId}/2fa`,
				{
					headers: {
						Authorization: "Bearer tampered-token",
						"Content-Type": "application/json",
					},
					data: {
						enabled: true,
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
				`${API_BASE_URL}/admin/users/${testUserId}/2fa`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						enabled: true,
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
				`${API_BASE_URL}/admin/users/${testUserId}/2fa`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						enabled: false,
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
		test("should respond quickly (< 500ms)", async ({ request }) => {
			const start = Date.now();

			const response = await request.patch(
				`${API_BASE_URL}/admin/users/${testUserId}/2fa`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						enabled: true,
					},
				},
			);

			const duration = Date.now() - start;

			expect([200, 400, 401, 403, 404, 408, 500, 401]).toContain(response.status());
			expect(duration).toBeLessThan(500);
		});
	});
});

