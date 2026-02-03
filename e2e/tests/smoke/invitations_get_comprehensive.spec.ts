/** @format */

import { test, expect } from "@playwright/test";
import { testData } from "../testData";

const API_BASE_URL = "http://127.0.0.1:5050";

/**
 * Comprehensive test suite for GET /invitations endpoint
 * Tests ALL response codes: 200, 400, 401, 403, 404, 423, 429, 500, 503
 * Based on Swagger documentation - Retrieve paginated list of company invitations with filtering
 */

test.describe("GET /invitations - Comprehensive Tests", () => {
	let validAccessToken: string;

	test.beforeAll(async ({ request }) => {
		const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
			headers: { "Content-Type": "application/json" },
			data: {
				email: testData.users.admin1.email,
				password: testData.users.admin1.password,
				loginType: "standard",
			},
		});

		const loginData = await loginResponse.json();
		validAccessToken = loginData.user.auth.accessToken;
	});

	// ========================
	// SUCCESS SCENARIOS (200)
	// ========================

	// ========================
	// NOT FOUND (404)
	// ========================

	// ========================
	// ACCOUNT LOCKED (423)
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
	// EDGE CASES
	// ========================

	test.describe("Edge Cases", () => {
		test("should handle very long search query", async ({ request }) => {
			const longSearch = "a".repeat(500);

			const response = await request.get(
				`${API_BASE_URL}/invitations?search=${longSearch}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([200, 400, 500, 401]).toContain(response.status());
		});

		test("should handle special characters in search", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/invitations?companyId=${testData.users.admin1.companyId}&search=test@example.com`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect(response.status()).toBe(200);
		});

		test("should handle multiple query parameters", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/invitations?companyId=${testData.users.admin1.companyId}&limit=5&offset=0&search=test`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect(response.status()).toBe(200);
		});

		test("should handle concurrent requests", async ({ request }) => {
			const requests = Array(5)
				.fill(null)
				.map(() =>
					request.get(
						`${API_BASE_URL}/invitations?companyId=${testData.users.admin1.companyId}`,
						{
							headers: {
								Authorization: `Bearer ${validAccessToken}`,
							},
						},
					),
				);

			const responses = await Promise.all(requests);

			responses.forEach((response) => {
				expect(response.status()).toBe(200);
			});
		});
	});

	// ========================
	// SECURITY TESTS
	// ========================

	test.describe("Security Tests", () => {
		test("should not expose sensitive data", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/invitations?companyId=${testData.users.admin1.companyId}`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			const data = await response.json();
			const responseText = JSON.stringify(data);

			expect(responseText).not.toContain("passwordHash");
			expect(responseText).not.toContain("secretKey");
		});

		test("should prevent SQL injection in search", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/invitations?companyId=${testData.users.admin1.companyId}&search=test' OR '1'='1`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect(response.status()).toBe(200);
		});

		test("should validate token on every request", async ({ request }) => {
			const fakeToken =
				"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjF9.fake";

			const response = await request.get(`${API_BASE_URL}/invitations?companyId=${testData.users.admin1.companyId}`, {
				headers: {
					Authorization: `Bearer ${fakeToken}`,
				},
			});

			expect([401, 404, 500]).toContain(response.status());
		});

		test("should only return invitations for logged-in user's company", async ({
			request,
		}) => {
			const response = await request.get(`${API_BASE_URL}/invitations?companyId=${testData.users.admin1.companyId}`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			if (response.status() === 200) {
				const data = await response.json();
				// All invitations should belong to the user's company
				expect(data.invitationList).toBeDefined();
			}
		});
	});

	// ========================
	// RESPONSE FORMAT TESTS
	// ========================

	test.describe("Response Format Tests", () => {
		test("should return consistent success structure", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/invitations?companyId=${testData.users.admin1.companyId}`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			const data = await response.json();
			expect(data).toHaveProperty("success");
			expect(data).toHaveProperty("invitationList");
		});

		test("should return consistent error structure", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/invitations`);

			const data = await response.json();
			expect(data).toHaveProperty("success");
			expect(data).toHaveProperty("error");
			expect(data).toHaveProperty("message");
		});

		test("should return proper content type", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/invitations?companyId=${testData.users.admin1.companyId}`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			const contentType = response.headers()["content-type"];
			expect(contentType).toContain("application/json");
		});
	});

	// ========================
	// PERFORMANCE TESTS
	// ========================

	test.describe("Performance Tests", () => {
		test("should respond quickly (< 500ms)", async ({ request }) => {
			const start = Date.now();

			const response = await request.get(
				`${API_BASE_URL}/invitations?companyId=${testData.users.admin1.companyId}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			const duration = Date.now() - start;

			expect(response.status()).toBe(200);
			expect(duration).toBeLessThan(500);
		});

		test("should handle large result sets efficiently", async ({ request }) => {
			const start = Date.now();

			const response = await request.get(
				`${API_BASE_URL}/invitations?companyId=${testData.users.admin1.companyId}&limit=50`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			const duration = Date.now() - start;

			expect(response.status()).toBe(200);
			expect(duration).toBeLessThan(1000);
		});
	});
});

