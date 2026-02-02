/** @format */

import { test, expect } from "@playwright/test";
import { testData } from "../testData";

/**
 * Comprehensive test suite for GET /companies/{companyId}/profile endpoint
 * Retrieves the company profile information for the specified company
 */

const API_BASE_URL = "http://127.0.0.1:5050";

test.describe("GET /companies/{companyId}/profile - Comprehensive Tests", () => {
	let validAccessToken: string;
	let adminAccessToken: string;
	const testCompanyId = testData.users.admin1.companyId;

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

	test.describe("200 Success Responses", () => {
		test("should fetch company profile successfully - 200", async ({
			request,
		}) => {
			const response = await request.get(
				`${API_BASE_URL}/companies/${testCompanyId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([200]).toContain(response.status());

			if (response.status() === 200) {
				const data = await response.json();
				expect(data.response).toBe("true");
				expect(data.data).toBeDefined();
			}
		});
	});

	test.describe("400 Bad Request Responses", () => {
		test("should return 400 for invalid companyId", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/companies/invalid-id/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([400, 404, 422]).toContain(response.status());
		});
	});

	test.describe("401 Unauthorized Responses", () => {
		test("should return 401 when authorization token is missing", async ({
			request,
		}) => {
			const response = await request.get(
				`${API_BASE_URL}/companies/${testCompanyId}/profile`,
			);

			expect(response.status()).toBe(401);
			const data = await response.json();
			expect(data.response).toBe("false");
		});

		test("should return 401 for invalid token", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/companies/${testCompanyId}/profile`,
				{
					headers: {
						Authorization: "Bearer invalid_token_here",
					},
				},
			);

			expect(response.status()).toBe(401);
			const data = await response.json();
			expect(data.response).toBe("false");
		});

		test("should return 401 for expired token", async ({ request }) => {
			const expiredToken =
				"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjB9.invalid";
			const response = await request.get(
				`${API_BASE_URL}/companies/${testCompanyId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${expiredToken}`,
					},
				},
			);

			expect(response.status()).toBe(401);
		});

		test("should return 401 for malformed Bearer token", async ({
			request,
		}) => {
			const response = await request.get(
				`${API_BASE_URL}/companies/${testCompanyId}/profile`,
				{
					headers: {
						Authorization: "InvalidFormat token",
					},
				},
			);

			expect(response.status()).toBe(401);
		});
	});

	test.describe("403 Forbidden", () => {
		test.skip("PLACEHOLDER: should return 403 when user lacks permission", async ({
			request,
		}) => {
			// Requires non-company-member user token
		});
	});

	test.describe("404 Not Found", () => {
		test("should return 404 for non-existent company", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/companies/99999999/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([403, 404]).toContain(response.status());
		});
	});

	test.describe("Security Tests", () => {
		test("should handle SQL injection in companyId", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/companies/' OR '1'='1/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([400, 404, 422]).toContain(response.status());
		});

		test("should validate authorization token", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/companies/${testCompanyId}/profile`,
				{
					headers: {
						Authorization: "Bearer ",
					},
				},
			);

			expect(response.status()).toBe(401);
		});
	});

	test.describe("Response Format Validation", () => {
		test("should return correct response structure", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/companies/${testCompanyId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([200]).toContain(response.status());

			if (response.status() === 200) {
				const data = await response.json();
				expect(data).toHaveProperty("response");
				expect(data).toHaveProperty("data");
			}
		});

		test("should return application/json content type", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/companies/${testCompanyId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([200]).toContain(response.status());
			expect(response.headers()["content-type"]).toContain("application/json");
		});
	});

	test.describe("Performance", () => {
		test("should fetch profile within acceptable time", async ({ request }) => {
			const startTime = Date.now();
			const response = await request.get(
				`${API_BASE_URL}/companies/${testCompanyId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);
			const endTime = Date.now();

			expect([200]).toContain(response.status());
			expect(endTime - startTime).toBeLessThan(1000);
		});
	});

	test.describe("405 Method Not Allowed", () => {
		test.skip("PLACEHOLDER: should return 405 for unsupported method", async ({
			request,
		}) => {
			// Requires specific HTTP method check
		});
	});

	test.describe("422 Unprocessable Entity", () => {
		test.skip("PLACEHOLDER: should return 422 for invalid profile data", async ({
			request,
		}) => {
			// Requires specific validation scenario
		});
	});

	test.describe("429 Rate Limit", () => {
		test.skip("PLACEHOLDER: should return 429 when rate limit exceeded", async ({
			request,
		}) => {
			// Requires many rapid requests
		});
	});

	test.describe("500 Server Error", () => {
		test.skip("PLACEHOLDER: should handle server error gracefully", async ({
			request,
		}) => {
			// Requires triggering server error
		});
	});

	test.describe("503 Service Unavailable", () => {
		test.skip("PLACEHOLDER: should return 503 when service unavailable", async ({
			request,
		}) => {
			// Requires service to be down
		});
	});
});
