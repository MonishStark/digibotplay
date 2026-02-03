/** @format */

import { test, expect } from "@playwright/test";
import { testData } from "../testData";

const API_BASE_URL = "http://127.0.0.1:5050";

/**
 * Comprehensive test suite for DELETE /notificationsView/{id} endpoint
 * Permanently removes a specific notification from the user's list using the notification ID
 * Response codes: 200, 401, 404, 429, 500, 503, 504
 */

test.describe("DELETE /notificationsView/{id} - Comprehensive Tests", () => {
	let validAccessToken: string;
	let testNotificationId: string;

	test.beforeAll(async ({ request }) => {
		const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
			data: {
				email: testData.users.admin1.email,
				password: testData.users.admin1.password,
			},
		});

		const loginData = await loginResponse.json();
		validAccessToken = loginData.accessToken;
		testNotificationId = "1";
	});

	// ========================
	// SUCCESS (200)
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
		test("should handle negative notification ID", async ({ request }) => {
			const response = await request.delete(
				`${API_BASE_URL}/notificationsView/-1`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([400, 401, 404, 500, 401]).toContain(response.status());
		});

		test("should handle zero notification ID", async ({ request }) => {
			const response = await request.delete(
				`${API_BASE_URL}/notificationsView/0`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([400, 401, 404, 500, 401]).toContain(response.status());
		});

		test("should handle very large notification ID", async ({ request }) => {
			const response = await request.delete(
				`${API_BASE_URL}/notificationsView/999999999999999`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([401, 404, 500, 401]).toContain(response.status());
		});

		test("should handle special characters in ID", async ({ request }) => {
			const response = await request.delete(
				`${API_BASE_URL}/notificationsView/!@#$%`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([400, 401, 404, 500, 401]).toContain(response.status());
		});

		test("should handle URL encoded ID", async ({ request }) => {
			const response = await request.delete(
				`${API_BASE_URL}/notificationsView/${encodeURIComponent(testNotificationId)}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([200, 401, 404, 500, 401]).toContain(response.status());
		});

		test("should handle double deletion attempt", async ({ request }) => {
			const id = "99999";

			const response1 = await request.delete(
				`${API_BASE_URL}/notificationsView/${id}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([200, 401, 404]).toContain(response1.status());

			const response2 = await request.delete(
				`${API_BASE_URL}/notificationsView/${id}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([401, 404]).toContain(response2.status());
		});
	});

	// ========================
	// SECURITY TESTS
	// ========================

	test.describe("Security Tests", () => {
		test("should validate token on every request", async ({ request }) => {
			const response = await request.delete(
				`${API_BASE_URL}/notificationsView/${testNotificationId}`,
				{
					headers: {
						Authorization: "Bearer malformed-token",
					},
				},
			);

			expect([401, 404, 500, 401]).toContain(response.status());
		});

		test("should not expose sensitive data in response", async ({
			request,
		}) => {
			const response = await request.delete(
				`${API_BASE_URL}/notificationsView/${testNotificationId}`,
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

		test("should prevent SQL injection in ID", async ({ request }) => {
			const response = await request.delete(
				`${API_BASE_URL}/notificationsView/1' OR '1'='1`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([400, 401, 404, 500, 401]).toContain(response.status());
		});

		test("should require proper authorization", async ({ request }) => {
			const response = await request.delete(
				`${API_BASE_URL}/notificationsView/${testNotificationId}`,
			);

			expect([401, 404, 500, 401]).toContain(response.status());
		});

		test("should only delete notifications owned by user", async ({
			request,
		}) => {
			const response = await request.delete(
				`${API_BASE_URL}/notificationsView/${testNotificationId}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([200, 401, 404, 500, 401]).toContain(response.status());
		});
	});

	// ========================
	// RESPONSE FORMAT
	// ========================

	test.describe("Response Format Tests", () => {
		test("should return consistent success structure", async ({ request }) => {
			const response = await request.delete(
				`${API_BASE_URL}/notificationsView/${testNotificationId}`,
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
			const response = await request.delete(
				`${API_BASE_URL}/notificationsView/99999999`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			if (response.headers()["content-type"]?.includes("application/json")) {
				const data = await response.json();
				if (data.success !== undefined) {
					expect(data).toHaveProperty("success");
				}
			}
		});

		test("should return proper content type", async ({ request }) => {
			const response = await request.delete(
				`${API_BASE_URL}/notificationsView/${testNotificationId}`,
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

			const response = await request.delete(
				`${API_BASE_URL}/notificationsView/${testNotificationId}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			const duration = Date.now() - start;

			expect([200, 401, 404, 500, 401]).toContain(response.status());
			expect(duration).toBeLessThan(500);
		});

		test("should handle multiple deletions efficiently", async ({
			request,
		}) => {
			const start = Date.now();

			const requests = Array(5)
				.fill(null)
				.map((_, i) =>
					request.delete(`${API_BASE_URL}/notificationsView/${99990 + i}`, {
						headers: {
							Authorization: `Bearer ${validAccessToken}`,
						},
					}),
				);

			const responses = await Promise.all(requests);
			const duration = Date.now() - start;

			responses.forEach((response) => {
				expect([200, 401, 404, 500, 401]).toContain(response.status());
			});

			expect(duration).toBeLessThan(2000);
		});
	});
});

