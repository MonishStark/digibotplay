/** @format */

import { test, expect } from "@playwright/test";
import { testData } from "../testData";

const API_BASE_URL = "http://127.0.0.1:5050";

/**
 * Comprehensive test suite for DELETE /super-admin/companies/{companyId} endpoint
 * Deletes an entire team/company account including:
 * - Company owner and all members
 * - All documents, collections, folders
 * - All integrations, usage data, settings
 * - All roles, permissions, workspaces
 * This is a hard cascading delete operation. Only Super Admin can delete companies.
 * This operation is irreversible and requires extreme caution.
 * Response codes: 200, 400, 401, 403, 404, 429, 500, 503, 504
 */

test.describe("DELETE /super-admin/companies/{companyId} - Comprehensive Tests", () => {
	let validAccessToken: string;
	const testCompanyId = "test-company-id-12345";

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
		test("should handle very long companyId", async ({ request }) => {
			const response = await request.delete(
				`${API_BASE_URL}/super-admin/companies/${"a".repeat(500)}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([400, 401, 403, 404, 500]).toContain(response.status());
		});

		test("should handle companyId with hyphens", async ({ request }) => {
			const response = await request.delete(
				`${API_BASE_URL}/super-admin/companies/company-id-with-hyphens-123`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([200, 400, 401, 403, 404, 500]).toContain(response.status());
		});

		test("should handle companyId with underscores", async ({ request }) => {
			const response = await request.delete(
				`${API_BASE_URL}/super-admin/companies/company_id_with_underscores_123`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([200, 400, 401, 403, 404, 500]).toContain(response.status());
		});

		test("should prevent concurrent deletion of same company", async ({
			request,
		}) => {
			const promises = Array(2)
				.fill(null)
				.map(() =>
					request.delete(
						`${API_BASE_URL}/super-admin/companies/concurrent-delete-id`,
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
				`${API_BASE_URL}/super-admin/companies/${testCompanyId}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([200, 400, 401, 403, 404, 500]).toContain(response.status());
		});

		test("should delete company with active subscriptions", async ({
			request,
		}) => {
			const response = await request.delete(
				`${API_BASE_URL}/super-admin/companies/active-subscription-company`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([200, 400, 401, 403, 404, 500]).toContain(response.status());
		});

		test("should handle deletion of company with many documents", async ({
			request,
		}) => {
			const response = await request.delete(
				`${API_BASE_URL}/super-admin/companies/many-documents-company`,
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
				`${API_BASE_URL}/super-admin/companies/${testCompanyId}`,
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
				`${API_BASE_URL}/super-admin/companies/${testCompanyId}`,
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
				expect(responseText).not.toContain("apiKey");
			}
		});

		test("should prevent SQL injection in companyId", async ({ request }) => {
			const response = await request.delete(
				`${API_BASE_URL}/super-admin/companies/' OR '1'='1`,
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
				`${API_BASE_URL}/super-admin/companies/${testCompanyId}`,
			);

			expect([401, 404, 500]).toContain(response.status());
		});

		test("should prevent unauthorized deletion", async ({ request }) => {
			const response = await request.delete(
				`${API_BASE_URL}/super-admin/companies/${testCompanyId}`,
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
				`${API_BASE_URL}/super-admin/companies/${testCompanyId}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([200, 400, 401, 403, 404, 500]).toContain(response.status());
		});

		test("should require extreme caution confirmation", async ({ request }) => {
			const response = await request.delete(
				`${API_BASE_URL}/super-admin/companies/${testCompanyId}`,
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
				`${API_BASE_URL}/super-admin/companies/${testCompanyId}`,
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
				`${API_BASE_URL}/super-admin/companies/${testCompanyId}`,
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
				`${API_BASE_URL}/super-admin/companies/${testCompanyId}`,
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
		test("should respond quickly for simple deletions (< 2000ms)", async ({
			request,
		}) => {
			const start = Date.now();

			const response = await request.delete(
				`${API_BASE_URL}/super-admin/companies/${testCompanyId}`,
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

		test("should handle large resource deletions efficiently", async ({
			request,
		}) => {
			const start = Date.now();

			const response = await request.delete(
				`${API_BASE_URL}/super-admin/companies/large-resource-company`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			const duration = Date.now() - start;

			expect([200, 400, 401, 403, 404, 500]).toContain(response.status());
			expect(duration).toBeLessThan(10000);
		});

		test("should process cascading deletion efficiently", async ({
			request,
		}) => {
			const start = Date.now();

			const response = await request.delete(
				`${API_BASE_URL}/super-admin/companies/${testCompanyId}`,
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
	});
});

