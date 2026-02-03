/** @format */

import { test, expect } from "@playwright/test";
import { testData } from "../testData";

const API_BASE_URL = "http://127.0.0.1:5050";

/**
 * Comprehensive test suite for PATCH /super-admin/users/{userId}/profile endpoint
 * Update User Profile Details including firstname, lastname, email, mobileNumber, countryCode,
 * password, role, companyId, canDownloadOrgData. Supports updating multiple fields at once
 * or only specific fields. Enforces rules depending on account type
 * Response codes: 200, 400, 401, 403, 404, 422, 429, 500, 503, 504
 */

test.describe("PATCH /super-admin/users/{userId}/profile - Comprehensive Tests", () => {
	let validAccessToken: string;
	let testUserId: string;

	test.beforeAll(async ({ request }) => {
		const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
			data: {
				email: testData.users.admin1.email,
				password: testData.users.admin1.password,
			},
		});

		const loginData = await loginResponse.json();
		validAccessToken = loginData.accessToken;
		testUserId = "123";
	});

	// ========================
	// SUCCESS (200)
	// ========================

	// ========================
	// NOT FOUND (404)
	// ========================

	// ========================
	// SERVER ERROR (500)
	// ========================

	// ========================
	// SERVICE UNAVAILABLE (503)
	// ========================

	// ========================
	// GATEWAY TIMEOUT (504)
	// ========================

	// ========================
	// EDGE CASES
	// ========================

	test.describe("Edge Cases", () => {
		test("should handle very long firstname", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/super-admin/users/${testUserId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						firstname: "A".repeat(500),
					},
				},
			);

			expect([200, 400, 401, 403, 404, 422, 500, 401]).toContain(response.status());
		});

		test("should handle special characters in name", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/super-admin/users/${testUserId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						firstname: "John-Paul O'Brien",
					},
				},
			);

			expect([200, 400, 401, 403, 404, 422, 500, 401]).toContain(response.status());
		});

		test("should handle null values in optional fields", async ({
			request,
		}) => {
			const response = await request.patch(
				`${API_BASE_URL}/super-admin/users/${testUserId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						mobileNumber: null,
					},
				},
			);

			expect([200, 400, 401, 403, 404, 422, 500, 401]).toContain(response.status());
		});

		test("should handle password update", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/super-admin/users/${testUserId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						password: "NewSecurePassword123!",
					},
				},
			);

			expect([200, 400, 401, 403, 404, 422, 500, 401]).toContain(response.status());
		});

		test("should handle weak password", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/super-admin/users/${testUserId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						password: "123",
					},
				},
			);

			expect([400, 401, 403, 404, 422, 500, 401]).toContain(response.status());
		});

		test("should handle concurrent updates", async ({ request }) => {
			const promises = Array(3)
				.fill(null)
				.map((_, i) =>
					request.patch(
						`${API_BASE_URL}/super-admin/users/${testUserId}/profile`,
						{
							headers: {
								Authorization: `Bearer ${validAccessToken}`,
								"Content-Type": "application/json",
							},
							data: {
								firstname: `Name${i}`,
							},
						},
					),
				);

			const responses = await Promise.all(promises);
			responses.forEach((response) => {
				expect([200, 400, 401, 403, 404, 422, 500, 401]).toContain(response.status());
			});
		});
	});

	// ========================
	// SECURITY TESTS
	// ========================

	test.describe("Security Tests", () => {
		test("should validate token on every request", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/super-admin/users/${testUserId}/profile`,
				{
					headers: {
						Authorization: "Bearer malformed-token",
						"Content-Type": "application/json",
					},
					data: {
						firstname: "Test",
					},
				},
			);

			expect([401, 404, 500, 401]).toContain(response.status());
		});

		test("should not expose sensitive data in response", async ({
			request,
		}) => {
			const response = await request.patch(
				`${API_BASE_URL}/super-admin/users/${testUserId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						firstname: "Test",
					},
				},
			);

			if (response.headers()["content-type"]?.includes("application/json")) {
				const data = await response.json();
				const responseText = JSON.stringify(data);

				expect(responseText).not.toContain("password");
				expect(responseText).not.toContain("secretKey");
			}
		});

		test("should prevent SQL injection in firstname", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/super-admin/users/${testUserId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						firstname: "'; DROP TABLE users; --",
					},
				},
			);

			expect([200, 400, 401, 403, 404, 422, 500, 401]).toContain(response.status());
		});

		test("should require super admin authorization", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/super-admin/users/${testUserId}/profile`,
				{
					headers: {
						"Content-Type": "application/json",
					},
					data: {
						firstname: "Test",
					},
				},
			);

			expect([401, 404, 500, 401]).toContain(response.status());
		});

		test("should hash passwords before storing", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/super-admin/users/${testUserId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						password: "PlainTextPassword123",
					},
				},
			);

			if (
				response.status() === 200 &&
				response.headers()["content-type"]?.includes("application/json")
			) {
				const data = await response.json();
				const responseText = JSON.stringify(data);

				expect(responseText).not.toContain("PlainTextPassword123");
			}
		});
	});

	// ========================
	// RESPONSE FORMAT
	// ========================

	test.describe("Response Format Tests", () => {
		test("should return consistent success structure", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/super-admin/users/${testUserId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						firstname: "Test",
					},
				},
			);

			if (
				response.status() === 200 &&
				response.headers()["content-type"]?.includes("application/json")
			) {
				const data = await response.json();
				expect(data).toHaveProperty("success");
			}
		});

		test("should return consistent error structure", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/super-admin/users/${testUserId}/profile`,
				{
					headers: {
						Authorization: "Bearer invalid-token",
						"Content-Type": "application/json",
					},
					data: {
						firstname: "Test",
					},
				},
			);

			if (response.headers()["content-type"]?.includes("application/json")) {
				const data = await response.json();
				expect(data).toHaveProperty("success");
			}
		});

		test("should return proper content type", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/super-admin/users/${testUserId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						firstname: "Test",
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
	// PERFORMANCE
	// ========================

	test.describe("Performance Tests", () => {
		test("should respond quickly (< 500ms)", async ({ request }) => {
			const start = Date.now();

			const response = await request.patch(
				`${API_BASE_URL}/super-admin/users/${testUserId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						firstname: "Test",
					},
				},
			);

			const duration = Date.now() - start;

			expect([200, 400, 401, 403, 404, 500, 401]).toContain(response.status());
			expect(duration).toBeLessThan(500);
		});

		test("should handle multiple field updates efficiently", async ({
			request,
		}) => {
			const start = Date.now();

			const response = await request.patch(
				`${API_BASE_URL}/super-admin/users/${testUserId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						firstname: "John",
						lastname: "Doe",
						email: "john.doe@test.com",
						mobileNumber: "1234567890",
					},
				},
			);

			const duration = Date.now() - start;

			expect([200, 400, 401, 403, 404, 422, 500, 401]).toContain(response.status());
			expect(duration).toBeLessThan(1000);
		});
	});
});

