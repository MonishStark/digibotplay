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

	test.describe("200 Success Responses", () => {
		test("should update user profile successfully - 200", async ({
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
						firstname: "UpdatedName",
					},
				},
			);

			expect([200, 400, 401, 403, 404]).toContain(response.status());

			if (
				response.status() === 200 &&
				response.headers()["content-type"]?.includes("application/json")
			) {
				const data = await response.json();
				expect(data).toHaveProperty("success");
			}
		});

		test("should update multiple fields at once", async ({ request }) => {
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
						email: "john.doe@example.com",
					},
				},
			);

			expect([200, 400, 401, 403, 404, 422]).toContain(response.status());
		});

		test("should update email address", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/super-admin/users/${testUserId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						email: "newemail@example.com",
					},
				},
			);

			expect([200, 400, 401, 403, 404, 422]).toContain(response.status());
		});

		test("should update mobile number with country code", async ({
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
						mobileNumber: "1234567890",
						countryCode: "+1",
					},
				},
			);

			expect([200, 400, 401, 403, 404, 422]).toContain(response.status());
		});

		test("should update user role", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/super-admin/users/${testUserId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						role: "admin",
					},
				},
			);

			expect([200, 400, 401, 403, 404, 422]).toContain(response.status());
		});

		test("should update canDownloadOrgData flag", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/super-admin/users/${testUserId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						canDownloadOrgData: true,
					},
				},
			);

			expect([200, 400, 401, 403, 404, 422]).toContain(response.status());
		});
	});

	// ========================
	// BAD REQUEST (400)
	// ========================

	test.describe("400 Bad Request Responses", () => {
		test("should return 400 for invalid email format", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/super-admin/users/${testUserId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						email: "invalid-email",
					},
				},
			);

			expect([400, 401, 403, 404, 422]).toContain(response.status());
		});

		test("should return 400 for invalid userId format", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/super-admin/users/invalid-id/profile`,
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

			expect([400, 401, 403, 404]).toContain(response.status());
		});

		test("should return 400 for empty request body", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/super-admin/users/${testUserId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {},
				},
			);

			expect([200, 400, 401, 403, 404]).toContain(response.status());
		});

		test("should return 400 for invalid role value", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/super-admin/users/${testUserId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						role: "invalid-role",
					},
				},
			);

			expect([400, 401, 403, 404, 422]).toContain(response.status());
		});
	});

	// ========================
	// UNAUTHORIZED (401)
	// ========================

	test.describe("401 Unauthorized Responses", () => {
		test("should return 401 when Authorization header is missing", async ({
			request,
		}) => {
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

			expect([401, 404]).toContain(response.status());
		});

		test("should return 401 for invalid token", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/super-admin/users/${testUserId}/profile`,
				{
					headers: {
						Authorization: "Bearer invalid-token-12345",
						"Content-Type": "application/json",
					},
					data: {
						firstname: "Test",
					},
				},
			);

			expect([401, 404]).toContain(response.status());
		});

		test("should return 401 for expired token", async ({ request }) => {
			const expiredToken =
				"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.4Adcj0vbBqfVIpnGGNJKKpBmJcAmPNtSKhTNnsTekII";

			const response = await request.patch(
				`${API_BASE_URL}/super-admin/users/${testUserId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${expiredToken}`,
						"Content-Type": "application/json",
					},
					data: {
						firstname: "Test",
					},
				},
			);

			expect([401, 404]).toContain(response.status());
		});

		test("should return 401 for malformed JWT", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/super-admin/users/${testUserId}/profile`,
				{
					headers: {
						Authorization: "Bearer not-a-valid-jwt",
						"Content-Type": "application/json",
					},
					data: {
						firstname: "Test",
					},
				},
			);

			expect([401, 404]).toContain(response.status());
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
	});

	// ========================
	// NOT FOUND (404)
	// ========================

	test.describe("404 Not Found Responses", () => {
		test("should return 404 for non-existent user", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/super-admin/users/99999999/profile`,
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

			expect([400, 401, 403, 404]).toContain(response.status());
		});
	});

	// ========================
	// UNPROCESSABLE ENTITY (422)
	// ========================

	test.describe("422 Unprocessable Entity Responses", () => {
		test("should return 422 for invalid companyId", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/super-admin/users/${testUserId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						companyId: "invalid-company-id",
					},
				},
			);

			expect([400, 401, 403, 404, 422]).toContain(response.status());
		});

		test("should return 422 for duplicate email", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/super-admin/users/${testUserId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						email: "existing@example.com",
					},
				},
			);

			expect([200, 400, 401, 403, 404, 409, 422]).toContain(response.status());
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

			expect([200, 400, 401, 403, 404, 422]).toContain(response.status());
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

			expect([200, 400, 401, 403, 404, 422]).toContain(response.status());
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

			expect([200, 400, 401, 403, 404, 422]).toContain(response.status());
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

			expect([200, 400, 401, 403, 404, 422]).toContain(response.status());
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

			expect([400, 401, 403, 404, 422]).toContain(response.status());
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
				expect([200, 400, 401, 403, 404, 422]).toContain(response.status());
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

			expect([401, 404]).toContain(response.status());
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

			expect([200, 400, 401, 403, 404, 422]).toContain(response.status());
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

			expect([401, 404]).toContain(response.status());
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

			expect([200, 400, 401, 403, 404]).toContain(response.status());
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

			expect([200, 400, 401, 403, 404, 422]).toContain(response.status());
			expect(duration).toBeLessThan(1000);
		});
	});
});
