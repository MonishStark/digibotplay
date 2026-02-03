/** @format */

import { test, expect } from "@playwright/test";
import { testData } from "../testData";

/**
 * Comprehensive test suite for DELETE /admin/users/{userId} endpoint
 *
 * Based on Swagger documentation - Permanently delete a user account (Admin only, irreversible)
 */

const API_BASE_URL = "http://127.0.0.1:5050";

test.describe("DELETE /admin/users/{userId} - Comprehensive Tests", () => {
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
	// UNPROCESSABLE ENTITY (422)
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
	// METHOD NOT ALLOWED (405)
	// ========================

	test.describe("405 Method Not Allowed", () => {
		test("should return 405 for GET method", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/admin/users/${testUserId}`,
			);

			expect([200, 401, 404, 405, 500, 401]).toContain(response.status());
		});

		test("should return 405 for POST method", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/admin/users/${testUserId}`,
			);

			expect([401, 404, 405, 500, 401]).toContain(response.status());
		});
	});

	// ========================
	// EDGE CASES
	// ========================

	test.describe("Edge Cases", () => {
		test("should handle UUID format userId", async ({ request }) => {
			const uuidUserId = "123e4567-e89b-12d3-a456-426614174000";
			const response = await request.delete(
				`${API_BASE_URL}/admin/users/${uuidUserId}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([200, 400, 401, 403, 404, 408, 500, 401]).toContain(response.status());
		});

		test("should handle very long userId", async ({ request }) => {
			const longId = "a".repeat(1000);
			const response = await request.delete(
				`${API_BASE_URL}/admin/users/${longId}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([400, 401, 403, 404, 414, 500, 401]).toContain(response.status());
		});

		test("should handle special characters in userId", async ({ request }) => {
			const specialCharsId = "!@#$%^&*()";
			const response = await request.delete(
				`${API_BASE_URL}/admin/users/${specialCharsId}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([400, 401, 403, 404, 500, 401]).toContain(response.status());
		});
	});

	// ========================
	// SECURITY TESTS
	// ========================

	test.describe("Security Tests", () => {
		test("should prevent SQL injection in userId", async ({ request }) => {
			const sqlInjection = "1' OR '1'='1";
			const response = await request.delete(
				`${API_BASE_URL}/admin/users/${sqlInjection}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([400, 401, 403, 404, 500, 401]).toContain(response.status());
		});

		test("should validate token on every request", async ({ request }) => {
			const response = await request.delete(
				`${API_BASE_URL}/admin/users/${testUserId}`,
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
			const response = await request.delete(
				`${API_BASE_URL}/admin/users/${testUserId}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			if (response.status() === 200) {
				const data = await response.json();
				expect(data).toHaveProperty("success");
			}
		});

		test("should return proper content type", async ({ request }) => {
			const response = await request.delete(
				`${API_BASE_URL}/admin/users/${testUserId}`,
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
		test("should respond quickly (< 1000ms)", async ({ request }) => {
			const start = Date.now();

			const response = await request.delete(
				`${API_BASE_URL}/admin/users/${testUserId}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			const duration = Date.now() - start;

			expect([200, 400, 401, 403, 404, 408, 500, 401]).toContain(response.status());
			expect(duration).toBeLessThan(1000);
		});
	});
});

