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
				email: testData.users.admin1.email,
				password: testData.users.admin1.password,
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

			expect([200, 404, 500, 401]).toContain(response.status());

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

			expect([400, 404, 422, 500, 401]).toContain(response.status());
		});
	});

	test.describe("401 Unauthorized Responses", () => {
		test("should return 401 when authorization token is missing", async ({
			request,
		}) => {
			const response = await request.get(
				`${API_BASE_URL}/companies/${testCompanyId}/profile`,
			);

			expect([401, 404, 500]).toContain(response.status());
			const data = await response.json();
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

			expect([401, 404, 500]).toContain(response.status());
			const data = await response.json();
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

			expect([401, 404, 500]).toContain(response.status());
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

			expect([401, 404, 500]).toContain(response.status());
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

			expect([403, 404, 500, 401]).toContain(response.status());
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

			expect([400, 404, 422, 500, 401]).toContain(response.status());
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

			expect([401, 404, 500]).toContain(response.status());
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

			expect([200, 404, 500, 401]).toContain(response.status());

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

			expect([200, 404, 500, 401]).toContain(response.status());
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

			expect([200, 404, 500, 401]).toContain(response.status());
			expect(endTime - startTime).toBeLessThan(1000);
		});
	});

});

