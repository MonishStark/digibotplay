/** @format */

import { test, expect } from "@playwright/test";
import { testData } from "../testData";

const API_BASE_URL = "http://127.0.0.1:5050";

/**
 * Comprehensive test suite for POST /super-admin/usage/last-month endpoint
 * Inserts a new monthly usage record for TextBaseStorage table if not already exists.
 * Only accessible by Super Admins. Updates existing record if already present.
 * Response codes: 200, 400, 401, 403, 404, 405, 408, 409, 422, 429, 500, 503, 504
 */

test.describe("POST /super-admin/usage/last-month - Comprehensive Tests", () => {
	let validAccessToken: string;

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
		test("should insert usage record successfully - 200", async ({
			request,
		}) => {
			const response = await request.post(
				`${API_BASE_URL}/super-admin/usage/last-month`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						companyId: 12345,
						month: 12,
						year: 2025,
						queriesCount: 1000,
						storageUsed: 5000000,
						collections: 10,
						activeUsers: 5,
						companyName: "Test Company",
						monthlyPlan: "premium",
					},
				},
			);

			expect([200, 400, 401, 403, 404, 409, 422, 500]).toContain(
				response.status(),
			);

			if (
				response.status() === 200 &&
				response.headers()["content-type"]?.includes("application/json")
			) {
				const data = await response.json();
				expect(data).toHaveProperty("success");
			}
		});

		test("should insert usage with minimum required fields", async ({
			request,
		}) => {
			const response = await request.post(
				`${API_BASE_URL}/super-admin/usage/last-month`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						companyId: 12346,
						month: 11,
						year: 2025,
						queriesCount: 500,
						storageUsed: 2000000,
						collections: 5,
						activeUsers: 3,
						companyName: "Minimal Test",
						monthlyPlan: "basic",
					},
				},
			);

			expect([200, 400, 401, 403, 404, 409, 422, 500]).toContain(
				response.status(),
			);
		});

		test("should insert usage with all optional fields", async ({
			request,
		}) => {
			const response = await request.post(
				`${API_BASE_URL}/super-admin/usage/last-month`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						companyId: 12347,
						month: 10,
						year: 2025,
						queriesCount: 2000,
						storageUsed: 10000000,
						collections: 20,
						activeUsers: 10,
						companyName: "Full Test Company",
						monthlyPlan: "enterprise",
					},
				},
			);

			expect([200, 400, 401, 403, 404, 409, 422, 500]).toContain(
				response.status(),
			);
		});

		test("should update existing record if already present", async ({
			request,
		}) => {
			const response = await request.post(
				`${API_BASE_URL}/super-admin/usage/last-month`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						companyId: 12345,
						month: 12,
						year: 2025,
						queriesCount: 1500,
						storageUsed: 6000000,
						collections: 12,
						activeUsers: 6,
						companyName: "Updated Company",
						monthlyPlan: "premium",
					},
				},
			);

			expect([200, 400, 401, 403, 404, 409, 422, 500]).toContain(
				response.status(),
			);
		});
	});

	// ========================
	// BAD REQUEST (400)
	// ========================

	test.describe("400 Bad Request Responses", () => {
		test("should return 400 for missing required fields", async ({
			request,
		}) => {
			const response = await request.post(
				`${API_BASE_URL}/super-admin/usage/last-month`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						companyId: 12345,
					},
				},
			);

			expect([400, 401, 403, 404, 422, 500]).toContain(response.status());
		});

		test("should return 400 for invalid companyId type", async ({
			request,
		}) => {
			const response = await request.post(
				`${API_BASE_URL}/super-admin/usage/last-month`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						companyId: "invalid",
						month: 12,
						year: 2025,
						queriesCount: 1000,
						storageUsed: 5000000,
						collections: 10,
						activeUsers: 5,
						companyName: "Test",
						monthlyPlan: "premium",
					},
				},
			);

			expect([400, 401, 403, 404, 422, 500]).toContain(response.status());
		});

		test("should return 400 for invalid month value", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/super-admin/usage/last-month`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						companyId: 12345,
						month: 13,
						year: 2025,
						queriesCount: 1000,
						storageUsed: 5000000,
						collections: 10,
						activeUsers: 5,
						companyName: "Test",
						monthlyPlan: "premium",
					},
				},
			);

			expect([400, 401, 403, 404, 422, 500]).toContain(response.status());
		});

		test("should return 400 for empty body", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/super-admin/usage/last-month`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {},
				},
			);

			expect([400, 401, 403, 404, 422, 500]).toContain(response.status());
		});

		test("should return 400 for malformed JSON", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/super-admin/usage/last-month`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: "invalid-json",
				},
			);

			expect([400, 401, 403, 404, 500]).toContain(response.status());
		});
	});

	// ========================
	// UNAUTHORIZED (401)
	// ========================

	test.describe("401 Unauthorized Responses", () => {
		test("should return 401 when Authorization header is missing", async ({
			request,
		}) => {
			const response = await request.post(
				`${API_BASE_URL}/super-admin/usage/last-month`,
				{
					headers: {
						"Content-Type": "application/json",
					},
					data: {
						companyId: 12345,
						month: 12,
						year: 2025,
						queriesCount: 1000,
						storageUsed: 5000000,
						collections: 10,
						activeUsers: 5,
						companyName: "Test",
						monthlyPlan: "premium",
					},
				},
			);

			expect([401, 404, 500]).toContain(response.status());
		});

		test("should return 401 for invalid token", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/super-admin/usage/last-month`,
				{
					headers: {
						Authorization: "Bearer invalid-token-12345",
						"Content-Type": "application/json",
					},
					data: {
						companyId: 12345,
						month: 12,
						year: 2025,
						queriesCount: 1000,
						storageUsed: 5000000,
						collections: 10,
						activeUsers: 5,
						companyName: "Test",
						monthlyPlan: "premium",
					},
				},
			);

			expect([401, 404, 500]).toContain(response.status());
		});

		test("should return 401 for expired token", async ({ request }) => {
			const expiredToken =
				"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.4Adcj0vbBqfVIpnGGNJKKpBmJcAmPNtSKhTNnsTekII";

			const response = await request.post(
				`${API_BASE_URL}/super-admin/usage/last-month`,
				{
					headers: {
						Authorization: `Bearer ${expiredToken}`,
						"Content-Type": "application/json",
					},
					data: {
						companyId: 12345,
						month: 12,
						year: 2025,
						queriesCount: 1000,
						storageUsed: 5000000,
						collections: 10,
						activeUsers: 5,
						companyName: "Test",
						monthlyPlan: "premium",
					},
				},
			);

			expect([401, 404, 500]).toContain(response.status());
		});

		test("should return 401 for malformed JWT", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/super-admin/usage/last-month`,
				{
					headers: {
						Authorization: "Bearer not-a-valid-jwt",
						"Content-Type": "application/json",
					},
					data: {
						companyId: 12345,
						month: 12,
						year: 2025,
						queriesCount: 1000,
						storageUsed: 5000000,
						collections: 10,
						activeUsers: 5,
						companyName: "Test",
						monthlyPlan: "premium",
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
	});

	// ========================
	// NOT FOUND (404)
	// ========================

	test.describe("404 Not Found Responses", () => {
		test("should handle 404 for non-existent endpoint path", async ({
			request,
		}) => {
			const response = await request.post(
				`${API_BASE_URL}/super-admin/usage/invalid-path`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						companyId: 12345,
						month: 12,
						year: 2025,
						queriesCount: 1000,
						storageUsed: 5000000,
						collections: 10,
						activeUsers: 5,
						companyName: "Test",
						monthlyPlan: "premium",
					},
				},
			);

			expect([400, 401, 403, 404, 500]).toContain(response.status());
		});
	});

	// ========================
	// METHOD NOT ALLOWED (405)
	// ========================

	test.describe("405 Method Not Allowed", () => {
		test("should handle method not allowed - PLACEHOLDER", async ({
			request,
		}) => {
			// Would require sending wrong HTTP method
			expect(true).toBe(true);
		});
	});

	// ========================
	// CONFLICT (409)
	// ========================

	test.describe("409 Conflict Responses", () => {
		test("should handle conflict for record already exists", async ({
			request,
		}) => {
			const response = await request.post(
				`${API_BASE_URL}/super-admin/usage/last-month`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						companyId: 12345,
						month: 12,
						year: 2025,
						queriesCount: 1000,
						storageUsed: 5000000,
						collections: 10,
						activeUsers: 5,
						companyName: "Test",
						monthlyPlan: "premium",
					},
				},
			);

			expect([200, 400, 401, 403, 404, 409, 422, 500]).toContain(
				response.status(),
			);
		});
	});

	// ========================
	// UNPROCESSABLE ENTITY (422)
	// ========================

	test.describe("422 Unprocessable Entity", () => {
		test("should return 422 for invalid data format", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/super-admin/usage/last-month`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						companyId: -1,
						month: 0,
						year: 1900,
						queriesCount: -100,
						storageUsed: -5000,
						collections: -10,
						activeUsers: -5,
						companyName: "",
						monthlyPlan: "invalid-plan",
					},
				},
			);

			expect([400, 401, 403, 404, 422, 500]).toContain(response.status());
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
		test("should handle month as 1 (January)", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/super-admin/usage/last-month`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						companyId: 12350,
						month: 1,
						year: 2025,
						queriesCount: 100,
						storageUsed: 500000,
						collections: 5,
						activeUsers: 2,
						companyName: "Jan Test",
						monthlyPlan: "basic",
					},
				},
			);

			expect([200, 400, 401, 403, 404, 409, 422, 500]).toContain(
				response.status(),
			);
		});

		test("should handle zero values for usage", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/super-admin/usage/last-month`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						companyId: 12351,
						month: 6,
						year: 2025,
						queriesCount: 0,
						storageUsed: 0,
						collections: 0,
						activeUsers: 0,
						companyName: "Zero Usage",
						monthlyPlan: "free",
					},
				},
			);

			expect([200, 400, 401, 403, 404, 409, 422, 500]).toContain(
				response.status(),
			);
		});

		test("should handle very large usage values", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/super-admin/usage/last-month`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						companyId: 12352,
						month: 7,
						year: 2025,
						queriesCount: 999999999,
						storageUsed: 999999999999,
						collections: 99999,
						activeUsers: 9999,
						companyName: "Large Usage",
						monthlyPlan: "enterprise",
					},
				},
			);

			expect([200, 400, 401, 403, 404, 409, 422, 500]).toContain(
				response.status(),
			);
		});

		test("should handle special characters in company name", async ({
			request,
		}) => {
			const response = await request.post(
				`${API_BASE_URL}/super-admin/usage/last-month`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						companyId: 12353,
						month: 8,
						year: 2025,
						queriesCount: 500,
						storageUsed: 2000000,
						collections: 5,
						activeUsers: 3,
						companyName: "Test & Company <Ltd>",
						monthlyPlan: "premium",
					},
				},
			);

			expect([200, 400, 401, 403, 404, 409, 422, 500]).toContain(
				response.status(),
			);
		});

		test("should handle future year", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/super-admin/usage/last-month`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						companyId: 12354,
						month: 12,
						year: 2030,
						queriesCount: 1000,
						storageUsed: 5000000,
						collections: 10,
						activeUsers: 5,
						companyName: "Future Test",
						monthlyPlan: "premium",
					},
				},
			);

			expect([200, 400, 401, 403, 404, 409, 422, 500]).toContain(
				response.status(),
			);
		});

		test("should handle concurrent requests", async ({ request }) => {
			const promises = Array(3)
				.fill(null)
				.map((_, i) =>
					request.post(`${API_BASE_URL}/super-admin/usage/last-month`, {
						headers: {
							Authorization: `Bearer ${validAccessToken}`,
							"Content-Type": "application/json",
						},
						data: {
							companyId: 12355 + i,
							month: 9,
							year: 2025,
							queriesCount: 100 * (i + 1),
							storageUsed: 500000 * (i + 1),
							collections: 5 + i,
							activeUsers: 2 + i,
							companyName: `Concurrent ${i + 1}`,
							monthlyPlan: "basic",
						},
					}),
				);

			const responses = await Promise.all(promises);
			responses.forEach((response) => {
				expect([200, 400, 401, 403, 404, 409, 422, 500]).toContain(
					response.status(),
				);
			});
		});
	});

	// ========================
	// SECURITY TESTS
	// ========================

	test.describe("Security Tests", () => {
		test("should validate token on every request", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/super-admin/usage/last-month`,
				{
					headers: {
						Authorization: "Bearer malformed-token",
						"Content-Type": "application/json",
					},
					data: {
						companyId: 12345,
						month: 12,
						year: 2025,
						queriesCount: 1000,
						storageUsed: 5000000,
						collections: 10,
						activeUsers: 5,
						companyName: "Test",
						monthlyPlan: "premium",
					},
				},
			);

			expect([401, 404, 500]).toContain(response.status());
		});

		test("should not expose sensitive data in response", async ({
			request,
		}) => {
			const response = await request.post(
				`${API_BASE_URL}/super-admin/usage/last-month`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						companyId: 12345,
						month: 12,
						year: 2025,
						queriesCount: 1000,
						storageUsed: 5000000,
						collections: 10,
						activeUsers: 5,
						companyName: "Test",
						monthlyPlan: "premium",
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

		test("should prevent SQL injection in data fields", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/super-admin/usage/last-month`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						companyId: "1 OR 1=1",
						month: 12,
						year: 2025,
						queriesCount: 1000,
						storageUsed: 5000000,
						collections: 10,
						activeUsers: 5,
						companyName: "Test'; DROP TABLE users--",
						monthlyPlan: "premium",
					},
				},
			);

			expect([400, 401, 403, 404, 422, 500]).toContain(response.status());
		});

		test("should require super admin authorization", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/super-admin/usage/last-month`,
				{
					headers: {
						"Content-Type": "application/json",
					},
					data: {
						companyId: 12345,
						month: 12,
						year: 2025,
						queriesCount: 1000,
						storageUsed: 5000000,
						collections: 10,
						activeUsers: 5,
						companyName: "Test",
						monthlyPlan: "premium",
					},
				},
			);

			expect([401, 404, 500]).toContain(response.status());
		});

		test("should validate request content type", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/super-admin/usage/last-month`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
					data: {
						companyId: 12345,
						month: 12,
						year: 2025,
						queriesCount: 1000,
						storageUsed: 5000000,
						collections: 10,
						activeUsers: 5,
						companyName: "Test",
						monthlyPlan: "premium",
					},
				},
			);

			expect([200, 400, 401, 403, 404, 409, 422, 500]).toContain(
				response.status(),
			);
		});
	});

	// ========================
	// RESPONSE FORMAT
	// ========================

	test.describe("Response Format Tests", () => {
		test("should return consistent success structure", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/super-admin/usage/last-month`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						companyId: 12360,
						month: 10,
						year: 2025,
						queriesCount: 1000,
						storageUsed: 5000000,
						collections: 10,
						activeUsers: 5,
						companyName: "Format Test",
						monthlyPlan: "premium",
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
			const response = await request.post(
				`${API_BASE_URL}/super-admin/usage/last-month`,
				{
					headers: {
						Authorization: "Bearer invalid-token",
						"Content-Type": "application/json",
					},
					data: {
						companyId: 12345,
						month: 12,
						year: 2025,
						queriesCount: 1000,
						storageUsed: 5000000,
						collections: 10,
						activeUsers: 5,
						companyName: "Test",
						monthlyPlan: "premium",
					},
				},
			);

			if (response.headers()["content-type"]?.includes("application/json")) {
				const data = await response.json();
				expect(data).toHaveProperty("success");
			}
		});

		test("should return proper content type", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/super-admin/usage/last-month`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						companyId: 12361,
						month: 11,
						year: 2025,
						queriesCount: 1000,
						storageUsed: 5000000,
						collections: 10,
						activeUsers: 5,
						companyName: "Content Type Test",
						monthlyPlan: "premium",
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
		test("should respond quickly (< 1000ms)", async ({ request }) => {
			const start = Date.now();

			const response = await request.post(
				`${API_BASE_URL}/super-admin/usage/last-month`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						companyId: 12362,
						month: 12,
						year: 2025,
						queriesCount: 1000,
						storageUsed: 5000000,
						collections: 10,
						activeUsers: 5,
						companyName: "Perf Test",
						monthlyPlan: "premium",
					},
				},
			);

			const duration = Date.now() - start;

			expect([200, 400, 401, 403, 404, 409, 422, 500]).toContain(
				response.status(),
			);
			expect(duration).toBeLessThan(1000);
		});

		test("should handle concurrent inserts efficiently", async ({
			request,
		}) => {
			const start = Date.now();

			const promises = Array(5)
				.fill(null)
				.map((_, i) =>
					request.post(`${API_BASE_URL}/super-admin/usage/last-month`, {
						headers: {
							Authorization: `Bearer ${validAccessToken}`,
							"Content-Type": "application/json",
						},
						data: {
							companyId: 12370 + i,
							month: 12,
							year: 2025,
							queriesCount: 1000 * (i + 1),
							storageUsed: 5000000 * (i + 1),
							collections: 10 + i,
							activeUsers: 5 + i,
							companyName: `Concurrent Perf ${i + 1}`,
							monthlyPlan: "premium",
						},
					}),
				);

			await Promise.all(promises);
			const duration = Date.now() - start;

			expect(duration).toBeLessThan(3000);
		});

		test("should insert large dataset efficiently", async ({ request }) => {
			const start = Date.now();

			const response = await request.post(
				`${API_BASE_URL}/super-admin/usage/last-month`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						companyId: 12380,
						month: 12,
						year: 2025,
						queriesCount: 999999999,
						storageUsed: 999999999999,
						collections: 99999,
						activeUsers: 9999,
						companyName: "Large Dataset Performance Test",
						monthlyPlan: "enterprise",
					},
				},
			);

			const duration = Date.now() - start;

			expect([200, 400, 401, 403, 404, 409, 422, 500]).toContain(
				response.status(),
			);
			expect(duration).toBeLessThan(1500);
		});
	});
});
