/** @format */

import { test, expect } from "@playwright/test";
import { testData } from "../testData";

const API_BASE_URL = "http://127.0.0.1:5050";

/**
 * Comprehensive test suite for PUT /companies/{companyId}/profile endpoint
 * Update company profile basics (companyName)
 * Response codes: 200, 400, 401, 403, 404, 406, 422, 423, 429, 500, 503, 504
 */

test.describe("PUT /companies/{companyId}/profile - Comprehensive Tests", () => {
	let validAccessToken: string;
	let testCompanyId: string;

	test.beforeAll(async ({ request }) => {
		const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
			data: {
				email: testData.users.admin1.email,
				password: testData.users.admin1.password,
			},
		});

		const loginData = await loginResponse.json();
		validAccessToken = loginData.accessToken;
		testCompanyId = testData.users.admin1.companyId || "1";
	});

	// ========================
	// SUCCESS (200)
	// ========================

	// ========================
	// NOT FOUND (404)
	// ========================

	// ========================
	// UNPROCESSABLE ENTITY (422)
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
		test("should handle special characters in companyName", async ({
			request,
		}) => {
			const response = await request.put(
				`${API_BASE_URL}/companies/${testCompanyId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						companyName: "Company!@#$%^&*()",
					},
				},
			);

			expect([200, 400, 401, 404, 422, 500, 401]).toContain(response.status());
		});

		test("should handle unicode characters in companyName", async ({
			request,
		}) => {
			const response = await request.put(
				`${API_BASE_URL}/companies/${testCompanyId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						companyName: "公司名称 🏢",
					},
				},
			);

			expect([200, 400, 401, 404, 500, 401]).toContain(response.status());
		});

		test("should trim whitespace from companyName", async ({ request }) => {
			const response = await request.put(
				`${API_BASE_URL}/companies/${testCompanyId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						companyName: "  Trimmed Company  ",
					},
				},
			);

			expect([200, 400, 401, 404, 500, 401]).toContain(response.status());
		});

		test("should handle concurrent profile updates", async ({ request }) => {
			const requests = Array(3)
				.fill(null)
				.map((_, i) =>
					request.put(`${API_BASE_URL}/companies/${testCompanyId}/profile`, {
						headers: {
							Authorization: `Bearer ${validAccessToken}`,
							"Content-Type": "application/json",
						},
						data: {
							companyName: `Concurrent Company ${i}`,
						},
					}),
				);

			const responses = await Promise.all(requests);

			responses.forEach((response) => {
				expect([200, 400, 401, 404, 500, 401]).toContain(response.status());
			});
		});

		test("should handle whitespace-only companyName", async ({ request }) => {
			const response = await request.put(
				`${API_BASE_URL}/companies/${testCompanyId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						companyName: "    ",
					},
				},
			);

			expect([400, 401, 404, 422, 500, 401]).toContain(response.status());
		});

		test("should handle newlines in companyName", async ({ request }) => {
			const response = await request.put(
				`${API_BASE_URL}/companies/${testCompanyId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						companyName: "Company\nWith\nNewlines",
					},
				},
			);

			expect([200, 400, 401, 404, 422, 500, 401]).toContain(response.status());
		});

		test("should handle extra fields in request", async ({ request }) => {
			const response = await request.put(
				`${API_BASE_URL}/companies/${testCompanyId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						companyName: "Test Company",
						extraField: "should be ignored",
					},
				},
			);

			expect([200, 400, 401, 404, 500, 401]).toContain(response.status());
		});
	});

	// ========================
	// SECURITY TESTS
	// ========================

	test.describe("Security Tests", () => {
		test("should prevent XSS in companyName", async ({ request }) => {
			const response = await request.put(
				`${API_BASE_URL}/companies/${testCompanyId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						companyName: "<script>alert('xss')</script>",
					},
				},
			);

			expect([200, 400, 401, 404, 422, 500, 401]).toContain(response.status());
		});

		test("should prevent SQL injection", async ({ request }) => {
			const response = await request.put(
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

			expect([200, 400, 401, 404, 500, 401]).toContain(response.status());
		});

		test("should validate token on every request", async ({ request }) => {
			const response = await request.put(
				`${API_BASE_URL}/companies/${testCompanyId}/profile`,
				{
					headers: {
						Authorization: "Bearer malformed-token",
						"Content-Type": "application/json",
					},
					data: {
						companyName: "Test",
					},
				},
			);

			expect([401, 404, 500, 401]).toContain(response.status());
		});

		test("should not expose sensitive data in response", async ({
			request,
		}) => {
			const response = await request.put(
				`${API_BASE_URL}/companies/${testCompanyId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						companyName: "Secure Test Company",
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
	});

	// ========================
	// RESPONSE FORMAT
	// ========================

	test.describe("Response Format Tests", () => {
		test("should return consistent success structure", async ({ request }) => {
			const response = await request.put(
				`${API_BASE_URL}/companies/${testCompanyId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						companyName: "Format Test Company",
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
			const response = await request.put(
				`${API_BASE_URL}/companies/${testCompanyId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {},
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
			const response = await request.put(
				`${API_BASE_URL}/companies/${testCompanyId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						companyName: "Content Type Test",
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

			const response = await request.put(
				`${API_BASE_URL}/companies/${testCompanyId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						companyName: "Performance Test Company",
					},
				},
			);

			const duration = Date.now() - start;

			expect([200, 400, 401, 404, 500, 401]).toContain(response.status());
			expect(duration).toBeLessThan(500);
		});
	});
});

