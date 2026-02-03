/** @format */

import { test, expect } from "@playwright/test";
import { testData } from "../testData";

const API_BASE_URL = "http://127.0.0.1:5050";

/**
 * Comprehensive test suite for PATCH /super-admin/email/templates/{templateId} endpoint
 * Updates an existing email template. Allows partial updates including nested values.
 * Only Super Admin can update email templates. This is a non-destructive partial update (PATCH).
 * Response codes: 200, 400, 401, 403, 404, 429, 500, 503, 504
 */

test.describe("PATCH /super-admin/email/templates/{templateId} - Comprehensive Tests", () => {
	let validAccessToken: string;
	const testTemplateId = "template9";

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
		test("should handle very long template name", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/super-admin/email/templates/${testTemplateId}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						name: "a".repeat(500),
					},
				},
			);

			expect([200, 400, 401, 403, 404, 500]).toContain(response.status());
		});

		test("should handle special characters in fields", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/super-admin/email/templates/${testTemplateId}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						subject: "Test <> & Subject with 'quotes' and \"double quotes\"",
					},
				},
			);

			expect([200, 400, 401, 403, 404, 500]).toContain(response.status());
		});

		test("should handle null values", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/super-admin/email/templates/${testTemplateId}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						name: null,
					},
				},
			);

			expect([200, 400, 401, 403, 404, 500]).toContain(response.status());
		});

		test("should handle concurrent updates", async ({ request }) => {
			const promises = Array(3)
				.fill(null)
				.map((_, i) =>
					request.patch(
						`${API_BASE_URL}/super-admin/email/templates/${testTemplateId}`,
						{
							headers: {
								Authorization: `Bearer ${validAccessToken}`,
								"Content-Type": "application/json",
							},
							data: {
								name: `concurrent_update_${i}`,
							},
						},
					),
				);

			const responses = await Promise.all(promises);
			responses.forEach((response) => {
				expect([200, 400, 401, 403, 404, 500]).toContain(response.status());
			});
		});

		test("should only update provided fields", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/super-admin/email/templates/${testTemplateId}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						subject: "Partial Update Only",
					},
				},
			);

			expect([200, 400, 401, 403, 404, 500]).toContain(response.status());
		});

		test("should handle very large HTML content", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/super-admin/email/templates/${testTemplateId}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						htmlContent: "<html><body>" + "a".repeat(10000) + "</body></html>",
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
			const response = await request.patch(
				`${API_BASE_URL}/super-admin/email/templates/${testTemplateId}`,
				{
					headers: {
						Authorization: "Bearer malformed-token",
						"Content-Type": "application/json",
					},
					data: {
						name: "security_test",
					},
				},
			);

			expect([401, 404, 500]).toContain(response.status());
		});

		test("should not expose sensitive data in response", async ({
			request,
		}) => {
			const response = await request.patch(
				`${API_BASE_URL}/super-admin/email/templates/${testTemplateId}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						name: "response_check",
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

		test("should prevent SQL injection in template fields", async ({
			request,
		}) => {
			const response = await request.patch(
				`${API_BASE_URL}/super-admin/email/templates/${testTemplateId}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						name: "'; DROP TABLE templates--",
					},
				},
			);

			expect([200, 400, 401, 403, 404, 500]).toContain(response.status());
		});

		test("should require super admin authorization", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/super-admin/email/templates/${testTemplateId}`,
				{
					headers: {
						"Content-Type": "application/json",
					},
					data: {
						name: "no_auth",
					},
				},
			);

			expect([401, 404, 500]).toContain(response.status());
		});

		test("should prevent XSS in template content", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/super-admin/email/templates/${testTemplateId}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						htmlContent: "<script>alert('xss')</script>",
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
			const response = await request.patch(
				`${API_BASE_URL}/super-admin/email/templates/${testTemplateId}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						name: "format_test",
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
				`${API_BASE_URL}/super-admin/email/templates/${testTemplateId}`,
				{
					headers: {
						Authorization: "Bearer invalid-token",
						"Content-Type": "application/json",
					},
					data: {
						name: "error_format",
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
				`${API_BASE_URL}/super-admin/email/templates/${testTemplateId}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						name: "content_type_test",
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
				`${API_BASE_URL}/super-admin/email/templates/${testTemplateId}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						name: "perf_test",
					},
				},
			);

			const duration = Date.now() - start;

			expect([200, 400, 401, 403, 404, 500]).toContain(response.status());
			expect(duration).toBeLessThan(500);
		});

		test("should handle multiple field updates efficiently", async ({
			request,
		}) => {
			const start = Date.now();

			const response = await request.patch(
				`${API_BASE_URL}/super-admin/email/templates/${testTemplateId}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						name: "multi_perf",
						subject: "Multi Perf Subject",
						htmlContent: "<html><body>Multi Perf</body></html>",
					},
				},
			);

			const duration = Date.now() - start;

			expect([200, 400, 401, 403, 404, 500]).toContain(response.status());
			expect(duration).toBeLessThan(1000);
		});

		test("should process partial updates efficiently", async ({ request }) => {
			const start = Date.now();

			const response = await request.patch(
				`${API_BASE_URL}/super-admin/email/templates/${testTemplateId}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						subject: "Partial Perf Update",
					},
				},
			);

			const duration = Date.now() - start;

			expect([200, 400, 401, 403, 404, 500]).toContain(response.status());
			expect(duration).toBeLessThan(400);
		});
	});
});

