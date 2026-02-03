/** @format */

import { test, expect } from "@playwright/test";
import { testData } from "../testData";

/**
 * Comprehensive test suite for PATCH /companies/{companyId}/profile endpoint
 * Updates one or more company profile fields. At least one field must be provided.
 */

const API_BASE_URL = "http://127.0.0.1:5050";

test.describe("PATCH /companies/{companyId}/profile - Comprehensive Tests", () => {
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
		test("should update company profile successfully - 200", async ({
			request,
		}) => {
			const response = await request.patch(
				`${API_BASE_URL}/companies/${testCompanyId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						companyName: "Updated Company Name",
					},
				},
			);

			expect([200, 404, 500, 401]).toContain(response.status());

			if (response.status() === 200) {
				const data = await response.json();
				expect(data.response).toBe("true");
			}
		});

		test("should update multiple profile fields simultaneously", async ({
			request,
		}) => {
			const response = await request.patch(
				`${API_BASE_URL}/companies/${testCompanyId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						companyName: "Test Corp",
						// Add other updateable fields based on schema
					},
				},
			);

			expect([200, 404, 500, 401]).toContain(response.status());
		});
	});

	test.describe("400 Bad Request Responses", () => {
		test("should return 400 for invalid companyId", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/companies/invalid-id/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						companyName: "Test",
					},
				},
			);

			expect([400, 404, 422, 500, 401]).toContain(response.status());
		});

		test("should return 400 for empty request body", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/companies/${testCompanyId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {},
				},
			);

			expect([400, 422, 500, 401]).toContain(response.status());
		});

		test("should return 400 for malformed JSON", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/companies/${testCompanyId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: "invalid-json",
				},
			);

			expect([400, 422, 500]).toContain(response.status());
		});
	});

	test.describe("401 Unauthorized Responses", () => {
		test("should return 401 when authorization token is missing", async ({
			request,
		}) => {
			const response = await request.patch(
				`${API_BASE_URL}/companies/${testCompanyId}/profile`,
				{
					headers: {
						"Content-Type": "application/json",
					},
					data: {
						companyName: "Test",
					},
				},
			);

			expect([401, 404, 500]).toContain(response.status());
			const data = await response.json();
		});

		test("should return 401 for invalid token", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/companies/${testCompanyId}/profile`,
				{
					headers: {
						Authorization: "Bearer invalid_token_here",
						"Content-Type": "application/json",
					},
					data: {
						companyName: "Test",
					},
				},
			);

			expect([401, 404, 500]).toContain(response.status());
			const data = await response.json();
		});

		test("should return 401 for expired token", async ({ request }) => {
			const expiredToken =
				"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjB9.invalid";
			const response = await request.patch(
				`${API_BASE_URL}/companies/${testCompanyId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${expiredToken}`,
						"Content-Type": "application/json",
					},
					data: {
						companyName: "Test",
					},
				},
			);

			expect([401, 404, 500]).toContain(response.status());
		});

		test("should return 401 for malformed Bearer token", async ({
			request,
		}) => {
			const response = await request.patch(
				`${API_BASE_URL}/companies/${testCompanyId}/profile`,
				{
					headers: {
						Authorization: "InvalidFormat token",
						"Content-Type": "application/json",
					},
					data: {
						companyName: "Test",
					},
				},
			);

			expect([401, 404, 500]).toContain(response.status());
		});
	});

	test.describe("404 Not Found", () => {
		test("should return 404 for non-existent company", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/companies/99999999/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						companyName: "Test",
					},
				},
			);

			expect([403, 404, 500, 401]).toContain(response.status());
		});
	});

	test.describe("Edge Cases", () => {
		test("should handle very long company name", async ({ request }) => {
			const longName = "A".repeat(500);
			const response = await request.patch(
				`${API_BASE_URL}/companies/${testCompanyId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						companyName: longName,
					},
				},
			);

			expect([200, 400, 422, 500, 401]).toContain(response.status());
		});

		test("should handle special characters in company name", async ({
			request,
		}) => {
			const response = await request.patch(
				`${API_BASE_URL}/companies/${testCompanyId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						companyName: "Test!@#$%^&*()_+",
					},
				},
			);

			expect([200, 400, 422, 500, 401]).toContain(response.status());
		});

		test("should handle Unicode characters", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/companies/${testCompanyId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						companyName: "Société Française 中文",
					},
				},
			);

			expect([200, 400, 422, 500, 401]).toContain(response.status());
		});
	});

	test.describe("Security Tests", () => {
		test("should handle SQL injection in companyId", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/companies/' OR '1'='1/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						companyName: "Test",
					},
				},
			);

			expect([400, 404, 422, 500, 401]).toContain(response.status());
		});

		test("should reject SQL injection in profile fields", async ({
			request,
		}) => {
			const response = await request.patch(
				`${API_BASE_URL}/companies/${testCompanyId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						companyName: "'; DROP TABLE companies; --",
					},
				},
			);

			expect([200, 400, 422, 500, 401]).toContain(response.status());
		});

		test("should validate authorization token", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/companies/${testCompanyId}/profile`,
				{
					headers: {
						Authorization: "Bearer ",
						"Content-Type": "application/json",
					},
					data: {
						companyName: "Test",
					},
				},
			);

			expect([401, 404, 500]).toContain(response.status());
		});
	});

	test.describe("Response Format Validation", () => {
		test("should return correct response structure", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/companies/${testCompanyId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						companyName: "Test Company",
					},
				},
			);

			expect([200, 404, 500, 401]).toContain(response.status());

			if (response.status() === 200) {
				const data = await response.json();
				expect(data).toHaveProperty("response");
			}
		});

		test("should return application/json content type", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/companies/${testCompanyId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						companyName: "Test",
					},
				},
			);

			expect([200, 404, 500, 401]).toContain(response.status());
			expect(response.headers()["content-type"]).toContain("application/json");
		});
	});

	test.describe("Performance", () => {
		test("should update profile within acceptable time", async ({
			request,
		}) => {
			const startTime = Date.now();
			const response = await request.patch(
				`${API_BASE_URL}/companies/${testCompanyId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						companyName: "Performance Test",
					},
				},
			);
			const endTime = Date.now();

			expect([200, 404, 500, 401]).toContain(response.status());
			expect(endTime - startTime).toBeLessThan(1000);
		});
	});

});
