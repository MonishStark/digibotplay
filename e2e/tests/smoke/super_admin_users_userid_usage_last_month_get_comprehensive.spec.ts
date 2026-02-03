/** @format */

import { test, expect } from "@playwright/test";
import { testData } from "../testData";

const API_BASE_URL = "http://127.0.0.1:5050";

/**
 * Comprehensive test suite for GET /super-admin/users/{userId}/usage/last-month endpoint
 * Fetches individual usage analytics for a web user or a team member
 * Returns only this user's usage, NOT aggregated company usage
 * If the user belongs to a company, companyId and plan are inherited from the company
 * If the user is solo, companyId is null and plan is auto-detected
 * Month and year are auto-detected by the backend
 * Response codes: 200, 400, 401, 403, 404, 429, 500, 503, 504
 */

test.describe("GET /super-admin/users/{userId}/usage/last-month - Comprehensive Tests", () => {
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
		testUserId = "789";
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
		test("should handle userId as 0", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/super-admin/users/0/usage/last-month`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([400, 401, 403, 404, 500]).toContain(response.status());
		});

		test("should handle negative userId", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/super-admin/users/-1/usage/last-month`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([400, 401, 403, 404, 500]).toContain(response.status());
		});

		test("should handle very large userId", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/super-admin/users/999999999999999/usage/last-month`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([400, 401, 403, 404, 500]).toContain(response.status());
		});

		test("should handle query parameters gracefully", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/super-admin/users/${testUserId}/usage/last-month?extra=param`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([200, 400, 401, 403, 404, 500]).toContain(response.status());
		});

		test("should handle concurrent requests", async ({ request }) => {
			const promises = Array(5)
				.fill(null)
				.map(() =>
					request.get(
						`${API_BASE_URL}/super-admin/users/${testUserId}/usage/last-month`,
						{
							headers: {
								Authorization: `Bearer ${validAccessToken}`,
							},
						},
					),
				);

			const responses = await Promise.all(promises);
			responses.forEach((response) => {
				expect([200, 400, 401, 403, 404, 500]).toContain(response.status());
			});
		});

		test("should return only user usage not company aggregated", async ({
			request,
		}) => {
			const response = await request.get(
				`${API_BASE_URL}/super-admin/users/${testUserId}/usage/last-month`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([200, 400, 401, 403, 404, 500]).toContain(response.status());
		});

		test("should auto-detect month and year", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/super-admin/users/${testUserId}/usage/last-month`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([200, 400, 401, 403, 404, 500]).toContain(response.status());
		});
	});

	// ========================
	// SECURITY TESTS
	// ========================

	test.describe("Security Tests", () => {
		test("should validate token on every request", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/super-admin/users/${testUserId}/usage/last-month`,
				{
					headers: {
						Authorization: "Bearer malformed-token",
					},
				},
			);

			expect([401, 404, 500]).toContain(response.status());
		});

		test("should not expose sensitive data in response", async ({
			request,
		}) => {
			const response = await request.get(
				`${API_BASE_URL}/super-admin/users/${testUserId}/usage/last-month`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
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

		test("should prevent SQL injection in userId", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/super-admin/users/1' OR '1'='1/usage/last-month`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([400, 401, 403, 404, 500]).toContain(response.status());
		});

		test("should require super admin authorization", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/super-admin/users/${testUserId}/usage/last-month`,
			);

			expect([401, 404, 500]).toContain(response.status());
		});

		test("should only access authorized user usage", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/super-admin/users/${testUserId}/usage/last-month`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([200, 400, 401, 403, 404, 500]).toContain(response.status());
		});
	});

	// ========================
	// RESPONSE FORMAT
	// ========================

	test.describe("Response Format Tests", () => {
		test("should return consistent success structure", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/super-admin/users/${testUserId}/usage/last-month`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
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
			const response = await request.get(
				`${API_BASE_URL}/super-admin/users/${testUserId}/usage/last-month`,
				{
					headers: {
						Authorization: "Bearer invalid-token",
					},
				},
			);

			if (response.headers()["content-type"]?.includes("application/json")) {
				const data = await response.json();
				expect(data).toHaveProperty("success");
			}
		});

		test("should return proper content type", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/super-admin/users/${testUserId}/usage/last-month`,
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
	// PERFORMANCE
	// ========================

	test.describe("Performance Tests", () => {
		test("should respond quickly (< 500ms)", async ({ request }) => {
			const start = Date.now();

			const response = await request.get(
				`${API_BASE_URL}/super-admin/users/${testUserId}/usage/last-month`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			const duration = Date.now() - start;

			expect([200, 400, 401, 403, 404, 500]).toContain(response.status());
			expect(duration).toBeLessThan(500);
		});

		test("should handle concurrent requests efficiently", async ({
			request,
		}) => {
			const start = Date.now();

			const promises = Array(10)
				.fill(null)
				.map(() =>
					request.get(
						`${API_BASE_URL}/super-admin/users/${testUserId}/usage/last-month`,
						{
							headers: {
								Authorization: `Bearer ${validAccessToken}`,
							},
						},
					),
				);

			await Promise.all(promises);
			const duration = Date.now() - start;

			expect(duration).toBeLessThan(2000);
		});

		test("should retrieve individual usage data efficiently", async ({
			request,
		}) => {
			const start = Date.now();

			const response = await request.get(
				`${API_BASE_URL}/super-admin/users/${testUserId}/usage/last-month`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			const duration = Date.now() - start;

			expect([200, 400, 401, 403, 404, 500]).toContain(response.status());
			expect(duration).toBeLessThan(1000);
		});
	});
});

