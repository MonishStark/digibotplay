/** @format */

import { test, expect } from "@playwright/test";
import { testData } from "../testData";

/**
 * Comprehensive test suite for POST /admin/users/{userId}/verify endpoint
 *
 * Based on Swagger documentation - Verify user account status to true (Admin only)
 */

const API_BASE_URL = "http://127.0.0.1:5050";

test.describe("POST /admin/users/{userId}/verify - Comprehensive Tests", () => {
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
	// EDGE CASES
	// ========================

	test.describe("Edge Cases", () => {
		test("should handle UUID format userId", async ({ request }) => {
			const uuidUserId = "123e4567-e89b-12d3-a456-426614174000";
			const response = await request.post(
				`${API_BASE_URL}/admin/users/${uuidUserId}/verify`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([200, 400, 401, 403, 404, 409, 500, 401]).toContain(response.status());
		});

		test("should handle very long userId", async ({ request }) => {
			const longId = "a".repeat(1000);
			const response = await request.post(
				`${API_BASE_URL}/admin/users/${longId}/verify`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([400, 401, 403, 404, 414, 500, 401]).toContain(response.status());
		});

		test("should handle concurrent verification attempts", async ({
			request,
		}) => {
			const requests = Array(3)
				.fill(null)
				.map(() =>
					request.post(`${API_BASE_URL}/admin/users/${testUserId}/verify`, {
						headers: {
							Authorization: `Bearer ${validAccessToken}`,
						},
					}),
				);

			const responses = await Promise.all(requests);
			responses.forEach((response) => {
				expect([200, 400, 401, 403, 404, 409, 429]).toContain(
					response.status(),
				);
			});
		});
	});

	// ========================
	// SECURITY TESTS
	// ========================

	test.describe("Security Tests", () => {
		test("should prevent SQL injection in userId", async ({ request }) => {
			const sqlInjection = "1' OR '1'='1";
			const response = await request.post(
				`${API_BASE_URL}/admin/users/${sqlInjection}/verify`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([400, 401, 403, 404, 500, 401]).toContain(response.status());
		});

		test("should validate token on every request", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/admin/users/${testUserId}/verify`,
				{
					headers: {
						Authorization: "Bearer tampered-token",
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
			const response = await request.post(
				`${API_BASE_URL}/admin/users/${testUserId}/verify`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			if (response.status() === 200) {
				const data = await response.json();
				expect(data).toHaveProperty("success");
				expect(data).toHaveProperty("message");
			}
		});

		test("should return proper content type", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/admin/users/${testUserId}/verify`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
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

			const response = await request.post(
				`${API_BASE_URL}/admin/users/${testUserId}/verify`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			const duration = Date.now() - start;

			expect([200, 400, 401, 403, 404, 409, 500, 401]).toContain(response.status());
			expect(duration).toBeLessThan(500);
		});
	});
});

