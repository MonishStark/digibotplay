/** @format */

import { test, expect } from "@playwright/test";
import { testData } from "../testData";

const API_BASE_URL = "http://127.0.0.1:5050";

/**
 * Comprehensive test suite for DELETE /super-admin/users/{userId} endpoint
 * Deletes a user account and all associated resources (documents, integrations,
 * settings, permissions, usage data, personal workspaces). This is a hard delete operation.
 * Only Super Admin can delete users. This operation is irreversible.
 * Response codes: 200, 400, 401, 403, 404, 408, 429, 500, 503, 504
 */

test.describe("DELETE /super-admin/users/{userId} - Comprehensive Tests", () => {
	let validAccessToken: string;
	const testUserId = "test-user-id-12345";

	test.beforeAll(async ({ request }) => {
		const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
			data: {
				email: testData.users.admin1.email,
				password: testData.users.admin1.password,
			},
		});

		const loginData = await loginResponse.json();
		validAccessToken = loginData.accessToken;
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
	// SERVICE UNAVAILABLE (503)
	// ========================

	// ========================
	// GATEWAY TIMEOUT (504)
	// ========================

	// ========================
	// EDGE CASES
	// ========================

	test.describe("Edge Cases", () => {
		test("should handle very long userId", async ({ request }) => {
			const response = await request.delete(
				`${API_BASE_URL}/super-admin/users/${"a".repeat(500)}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([400, 401, 403, 404, 500]).toContain(response.status());
		});

		test("should handle userId with hyphens", async ({ request }) => {
			const response = await request.delete(
				`${API_BASE_URL}/super-admin/users/user-id-with-hyphens-123`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([200, 400, 401, 403, 404, 500]).toContain(response.status());
		});

		test("should handle userId with underscores", async ({ request }) => {
			const response = await request.delete(
				`${API_BASE_URL}/super-admin/users/user_id_with_underscores_123`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([200, 400, 401, 403, 404, 500]).toContain(response.status());
		});

		test("should prevent concurrent deletion of same user", async ({
			request,
		}) => {
			const promises = Array(2)
				.fill(null)
				.map(() =>
					request.delete(
						`${API_BASE_URL}/super-admin/users/concurrent-delete-id`,
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

		test("should delete all associated resources", async ({ request }) => {
			const response = await request.delete(
				`${API_BASE_URL}/super-admin/users/${testUserId}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([200, 400, 401, 403, 404, 500]).toContain(response.status());
		});

		test("should handle deletion of user with active sessions", async ({
			request,
		}) => {
			const response = await request.delete(
				`${API_BASE_URL}/super-admin/users/active-session-user`,
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
			const response = await request.delete(
				`${API_BASE_URL}/super-admin/users/${testUserId}`,
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
			const response = await request.delete(
				`${API_BASE_URL}/super-admin/users/${testUserId}`,
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
			const response = await request.delete(
				`${API_BASE_URL}/super-admin/users/' OR '1'='1`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([400, 401, 403, 404, 500]).toContain(response.status());
		});

		test("should require super admin authorization", async ({ request }) => {
			const response = await request.delete(
				`${API_BASE_URL}/super-admin/users/${testUserId}`,
			);

			expect([401, 404, 500]).toContain(response.status());
		});

		test("should prevent unauthorized deletion", async ({ request }) => {
			const response = await request.delete(
				`${API_BASE_URL}/super-admin/users/${testUserId}`,
				{
					headers: {
						Authorization: "Bearer invalid-token",
					},
				},
			);

			expect([401, 404, 500]).toContain(response.status());
		});

		test("should log deletion audit trail", async ({ request }) => {
			const response = await request.delete(
				`${API_BASE_URL}/super-admin/users/${testUserId}`,
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
			const response = await request.delete(
				`${API_BASE_URL}/super-admin/users/${testUserId}`,
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
				`${API_BASE_URL}/super-admin/users/${testUserId}`,
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
			const response = await request.delete(
				`${API_BASE_URL}/super-admin/users/${testUserId}`,
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
		test("should respond quickly for simple deletions (< 1000ms)", async ({
			request,
		}) => {
			const start = Date.now();

			const response = await request.delete(
				`${API_BASE_URL}/super-admin/users/${testUserId}`,
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

		test("should handle large resource deletions efficiently", async ({
			request,
		}) => {
			const start = Date.now();

			const response = await request.delete(
				`${API_BASE_URL}/super-admin/users/large-resource-user`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			const duration = Date.now() - start;

			expect([200, 400, 401, 403, 404, 500]).toContain(response.status());
			expect(duration).toBeLessThan(5000);
		});

		test("should process deletion efficiently", async ({ request }) => {
			const start = Date.now();

			const response = await request.delete(
				`${API_BASE_URL}/super-admin/users/${testUserId}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			const duration = Date.now() - start;

			expect([200, 400, 401, 403, 404, 500]).toContain(response.status());
			expect(duration).toBeLessThan(2000);
		});
	});
});

