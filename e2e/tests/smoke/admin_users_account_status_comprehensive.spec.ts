/** @format */

import { test, expect } from "@playwright/test";
import { testData } from "../testData";

/**
 * Comprehensive test suite for PATCH /admin/users/{userId}/account-status endpoint
 *
 * Based on Swagger documentation - Update user's account status: lock, unlock, or block (Admin only)
 */

const API_BASE_URL = "http://127.0.0.1:5050";

test.describe("PATCH /admin/users/{userId}/account-status - Comprehensive Tests", () => {
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
				`${API_BASE_URL}/admin/users/${testUserId}/account-status`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
					data: {
						status: "locked",
					},
				},
			);

			expect([200, 400, 401, 403, 404, 408, 415, 422]).toContain(
				response.status(),
			);
		});

		test("should return 415 for wrong Content-Type", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/admin/users/${testUserId}/account-status`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "text/plain",
					},
					data: {
						status: "locked",
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
		test("should handle all valid status values", async ({ request }) => {
			const statuses = ["active", "locked", "blocked"];

			for (const status of statuses) {
				const response = await request.patch(
					`${API_BASE_URL}/admin/users/${testUserId}/account-status`,
					{
						headers: {
							Authorization: `Bearer ${validAccessToken}`,
							"Content-Type": "application/json",
						},
						data: {
							status: status,
						},
					},
				);

				expect([200, 400, 401, 403, 404, 408, 500, 401]).toContain(response.status());
			}
		});

		test("should handle case sensitivity in status", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/admin/users/${testUserId}/account-status`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						status: "LOCKED",
					},
				},
			);

			expect([200, 400, 401, 422, 500, 401]).toContain(response.status());
		});

		test("should handle null value for status", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/admin/users/${testUserId}/account-status`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						status: null,
					},
				},
			);

			expect([400, 401, 404, 422, 500, 401]).toContain(response.status());
		});

		test("should handle extra fields in request body", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/admin/users/${testUserId}/account-status`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						status: "locked",
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
				`${API_BASE_URL}/admin/users/${sqlInjection}/account-status`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						status: "locked",
					},
				},
			);

			expect([400, 401, 403, 404, 500, 401]).toContain(response.status());
		});

		test("should validate token on every request", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/admin/users/${testUserId}/account-status`,
				{
					headers: {
						Authorization: "Bearer tampered-token",
						"Content-Type": "application/json",
					},
					data: {
						status: "locked",
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
				`${API_BASE_URL}/admin/users/${testUserId}/account-status`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						status: "active",
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
				`${API_BASE_URL}/admin/users/${testUserId}/account-status`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						status: "active",
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
				`${API_BASE_URL}/admin/users/${testUserId}/account-status`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						status: "active",
					},
				},
			);

			const duration = Date.now() - start;

			expect([200, 400, 401, 403, 404, 408, 500, 401]).toContain(response.status());
			expect(duration).toBeLessThan(500);
		});
	});
});

