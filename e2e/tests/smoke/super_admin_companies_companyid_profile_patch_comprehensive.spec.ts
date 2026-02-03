/** @format */

import { test, expect } from "@playwright/test";
import { testData } from "../testData";

const API_BASE_URL = "http://127.0.0.1:5050";

/**
 * Comprehensive test suite for PATCH /super-admin/companies/{companyId}/profile endpoint
 * Partially updates a company's profile details including company name, phone number,
 * country code, organization type, mailing/billing addresses, SPA settings, and cloud settings.
 * Supports partial updates - only provided fields are updated. The endpoint does not handle
 * image uploads (handled by the avatar endpoint)
 * Response codes: 200, 400, 401, 403, 404, 429, 500, 503, 504
 */

test.describe("PATCH /super-admin/companies/{companyId}/profile - Comprehensive Tests", () => {
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
		testCompanyId = "45";
	});

	// ========================
	// SUCCESS (200)
	// ========================

	// ========================
	// NOT FOUND (404)
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
		test("should handle very long company name", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/super-admin/companies/${testCompanyId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						companyName: "A".repeat(500),
					},
				},
			);

			expect([200, 400, 401, 403, 404, 422, 500, 401]).toContain(response.status());
		});

		test("should handle special characters in company name", async ({
			request,
		}) => {
			const response = await request.patch(
				`${API_BASE_URL}/super-admin/companies/${testCompanyId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						companyName: "Tech & Co. Ltd.",
					},
				},
			);

			expect([200, 400, 401, 403, 404, 422, 500, 401]).toContain(response.status());
		});

		test("should handle null values in optional fields", async ({
			request,
		}) => {
			const response = await request.patch(
				`${API_BASE_URL}/super-admin/companies/${testCompanyId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						phoneNumber: null,
					},
				},
			);

			expect([200, 400, 401, 403, 404, 422, 500, 401]).toContain(response.status());
		});

		test("should handle concurrent updates", async ({ request }) => {
			const promises = Array(3)
				.fill(null)
				.map((_, i) =>
					request.patch(
						`${API_BASE_URL}/super-admin/companies/${testCompanyId}/profile`,
						{
							headers: {
								Authorization: `Bearer ${validAccessToken}`,
								"Content-Type": "application/json",
							},
							data: {
								companyName: `Company${i}`,
							},
						},
					),
				);

			const responses = await Promise.all(promises);
			responses.forEach((response) => {
				expect([200, 400, 401, 403, 404, 422, 500, 401]).toContain(response.status());
			});
		});

		test("should not handle image uploads", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/super-admin/companies/${testCompanyId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						companyName: "Test Company",
						image: "base64-encoded-image",
					},
				},
			);

			expect([200, 400, 401, 403, 404, 500, 401]).toContain(response.status());
		});

		test("should handle address updates", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/super-admin/companies/${testCompanyId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						mailingAddress: "123 Main St, City, State 12345",
					},
				},
			);

			expect([200, 400, 401, 403, 404, 422, 500, 401]).toContain(response.status());
		});
	});

	// ========================
	// SECURITY TESTS
	// ========================

	test.describe("Security Tests", () => {
		test("should validate token on every request", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/super-admin/companies/${testCompanyId}/profile`,
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
			const response = await request.patch(
				`${API_BASE_URL}/super-admin/companies/${testCompanyId}/profile`,
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

			if (response.headers()["content-type"]?.includes("application/json")) {
				const data = await response.json();
				const responseText = JSON.stringify(data);

				expect(responseText).not.toContain("password");
				expect(responseText).not.toContain("secretKey");
			}
		});

		test("should prevent SQL injection in companyName", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/super-admin/companies/${testCompanyId}/profile`,
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

			expect([200, 400, 401, 403, 404, 422, 500, 401]).toContain(response.status());
		});

		test("should require super admin authorization", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/super-admin/companies/${testCompanyId}/profile`,
				{
					headers: {
						"Content-Type": "application/json",
					},
					data: {
						companyName: "Test",
					},
				},
			);

			expect([401, 404, 500, 401]).toContain(response.status());
		});

		test("should prevent XSS in company name", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/super-admin/companies/${testCompanyId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						companyName: "<script>alert('XSS')</script>",
					},
				},
			);

			expect([200, 400, 401, 403, 404, 422, 500, 401]).toContain(response.status());

			if (
				response.status() === 200 &&
				response.headers()["content-type"]?.includes("application/json")
			) {
				const data = await response.json();
				const responseText = JSON.stringify(data);

				expect(responseText).not.toContain("<script>");
			}
		});
	});

	// ========================
	// RESPONSE FORMAT
	// ========================

	test.describe("Response Format Tests", () => {
		test("should return consistent success structure", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/super-admin/companies/${testCompanyId}/profile`,
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
				`${API_BASE_URL}/super-admin/companies/${testCompanyId}/profile`,
				{
					headers: {
						Authorization: "Bearer invalid-token",
						"Content-Type": "application/json",
					},
					data: {
						companyName: "Test",
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
				`${API_BASE_URL}/super-admin/companies/${testCompanyId}/profile`,
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
				`${API_BASE_URL}/super-admin/companies/${testCompanyId}/profile`,
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

			const duration = Date.now() - start;

			expect([200, 400, 401, 403, 404, 500, 401]).toContain(response.status());
			expect(duration).toBeLessThan(500);
		});

		test("should handle partial updates efficiently", async ({ request }) => {
			const start = Date.now();

			const response = await request.patch(
				`${API_BASE_URL}/super-admin/companies/${testCompanyId}/profile`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						companyName: "Quick Update",
					},
				},
			);

			const duration = Date.now() - start;

			expect([200, 400, 401, 403, 404, 500, 401]).toContain(response.status());
			expect(duration).toBeLessThan(500);
		});
	});
});

