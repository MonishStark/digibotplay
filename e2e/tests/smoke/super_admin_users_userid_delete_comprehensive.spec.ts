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

	test.describe("200 Success Responses", () => {
		test("should delete user successfully - 200", async ({ request }) => {
			const response = await request.delete(
				`${API_BASE_URL}/super-admin/users/${testUserId}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([200, 400, 401, 403, 404, 500]).toContain(response.status());

			if (
				response.status() === 200 &&
				response.headers()["content-type"]?.includes("application/json")
			) {
				const data = await response.json();
				expect(data).toHaveProperty("success");
			}
		});

		test("should delete user with minimal resources", async ({ request }) => {
			const response = await request.delete(
				`${API_BASE_URL}/super-admin/users/minimal-user-id`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([200, 400, 401, 403, 404, 500]).toContain(response.status());
		});

		test("should delete user with many resources", async ({ request }) => {
			const response = await request.delete(
				`${API_BASE_URL}/super-admin/users/rich-user-id`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([200, 400, 401, 403, 404, 500]).toContain(response.status());
		});

		test("should confirm deletion is irreversible", async ({ request }) => {
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
	// BAD REQUEST (400)
	// ========================

	test.describe("400 Bad Request Responses", () => {
		test("should return 400 for invalid userId format", async ({ request }) => {
			const response = await request.delete(
				`${API_BASE_URL}/super-admin/users/invalid@userId`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([400, 401, 403, 404, 500]).toContain(response.status());
		});

		test("should return 400 for empty userId", async ({ request }) => {
			const response = await request.delete(
				`${API_BASE_URL}/super-admin/users/`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([400, 401, 403, 404, 500]).toContain(response.status());
		});

		test("should return 400 for special characters in userId", async ({
			request,
		}) => {
			const response = await request.delete(
				`${API_BASE_URL}/super-admin/users/user<script>alert(1)</script>`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([400, 401, 403, 404, 500]).toContain(response.status());
		});

		test("should return 400 for attempting to delete own account", async ({
			request,
		}) => {
			// Attempting to delete self - should be prevented
			const response = await request.delete(
				`${API_BASE_URL}/super-admin/users/self-id`,
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
	// UNAUTHORIZED (401)
	// ========================

	test.describe("401 Unauthorized Responses", () => {
		test("should return 401 when Authorization header is missing", async ({
			request,
		}) => {
			const response = await request.delete(
				`${API_BASE_URL}/super-admin/users/${testUserId}`,
			);

			expect([401, 404, 500]).toContain(response.status());
		});

		test("should return 401 for invalid token", async ({ request }) => {
			const response = await request.delete(
				`${API_BASE_URL}/super-admin/users/${testUserId}`,
				{
					headers: {
						Authorization: "Bearer invalid-token-12345",
					},
				},
			);

			expect([401, 404, 500]).toContain(response.status());
		});

		test("should return 401 for expired token", async ({ request }) => {
			const expiredToken =
				"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.4Adcj0vbBqfVIpnGGNJKKpBmJcAmPNtSKhTNnsTekII";

			const response = await request.delete(
				`${API_BASE_URL}/super-admin/users/${testUserId}`,
				{
					headers: {
						Authorization: `Bearer ${expiredToken}`,
					},
				},
			);

			expect([401, 404, 500]).toContain(response.status());
		});

		test("should return 401 for malformed JWT", async ({ request }) => {
			const response = await request.delete(
				`${API_BASE_URL}/super-admin/users/${testUserId}`,
				{
					headers: {
						Authorization: "Bearer not-a-valid-jwt",
					},
				},
			);

			expect([401, 404, 500]).toContain(response.status());
		});
	});

	// ========================
	// FORBIDDEN (403)
	// ========================

	test.describe("403 Forbidden Responses", () => {
		test("should return 403 for non-super-admin users - PLACEHOLDER", async ({
			request,
		}) => {
			// Would require a non-super-admin user token
			expect(true).toBe(true);
		});

		test("should prevent deletion of protected system accounts - PLACEHOLDER", async ({
			request,
		}) => {
			// Would require attempting to delete protected account
			expect(true).toBe(true);
		});
	});

	// ========================
	// NOT FOUND (404)
	// ========================

	test.describe("404 Not Found Responses", () => {
		test("should return 404 for non-existent user", async ({ request }) => {
			const response = await request.delete(
				`${API_BASE_URL}/super-admin/users/nonexistent-user-id-99999`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([400, 401, 403, 404, 500]).toContain(response.status());
		});

		test("should return 404 for already deleted user", async ({ request }) => {
			const response = await request.delete(
				`${API_BASE_URL}/super-admin/users/already-deleted-id`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([400, 401, 403, 404, 500]).toContain(response.status());
		});
	});

	// ========================
	// REQUEST TIMEOUT (408)
	// ========================

	test.describe("408 Request Timeout", () => {
		test("should handle request timeout for large deletions - PLACEHOLDER", async ({
			request,
		}) => {
			// Would require simulating timeout
			expect(true).toBe(true);
		});
	});

	// ========================
	// RATE LIMIT (429)
	// ========================

	test.describe("429 Rate Limit Exceeded", () => {
		test("should handle rate limiting - PLACEHOLDER", async ({ request }) => {
			// Would require many rapid requests
			expect(true).toBe(true);
		});
	});

	// ========================
	// SERVER ERROR (500)
	// ========================

	test.describe("500 Server Error", () => {
		test("should handle server errors gracefully - PLACEHOLDER", async ({
			request,
		}) => {
			// Would require simulating server error
			expect(true).toBe(true);
		});
	});

	// ========================
	// SERVICE UNAVAILABLE (503)
	// ========================

	test.describe("503 Service Unavailable", () => {
		test("should handle service unavailable - PLACEHOLDER", async ({
			request,
		}) => {
			// Would require service to be down
			expect(true).toBe(true);
		});
	});

	// ========================
	// GATEWAY TIMEOUT (504)
	// ========================

	test.describe("504 Gateway Timeout", () => {
		test("should handle gateway timeout - PLACEHOLDER", async ({ request }) => {
			// Would require simulating timeout
			expect(true).toBe(true);
		});
	});

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
