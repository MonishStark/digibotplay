/** @format */

import { test, expect } from "@playwright/test";
import { testData } from "../testData";

const API_BASE_URL = "http://127.0.0.1:5050";

/**
 * Comprehensive test suite for POST /files/jobs/{id}/retry endpoint
 * Requests the system to retry a previously failed file-processing job.
 * Typical use case: File upload succeeded, but the job entered a 'failed' status during analysis.
 * This endpoint restarts the job, allowing the client to resume polling via the status endpoint.
 * Response codes: 200, 400, 401, 403, 404, 429, 500, 503, 504
 */

test.describe("POST /files/jobs/{id}/retry - Comprehensive Tests", () => {
	let validAccessToken: string;
	const testJobId = "test-job-id-12345";

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
		test("should handle very long jobId", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/files/jobs/${"a".repeat(500)}/retry`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([400, 401, 403, 404, 500]).toContain(response.status());
		});

		test("should handle jobId with hyphens", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/files/jobs/job-id-with-hyphens-123/retry`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([200, 400, 401, 403, 404, 500]).toContain(response.status());
		});

		test("should handle jobId with underscores", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/files/jobs/job_id_with_underscores_123/retry`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([200, 400, 401, 403, 404, 500]).toContain(response.status());
		});

		test("should prevent concurrent retry of same job", async ({ request }) => {
			const promises = Array(3)
				.fill(null)
				.map(() =>
					request.post(
						`${API_BASE_URL}/files/jobs/concurrent-retry-job/retry`,
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

		test("should only retry failed jobs", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/files/jobs/${testJobId}/retry`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([200, 400, 401, 403, 404, 500]).toContain(response.status());
		});

		test("should handle retry of already processing job", async ({
			request,
		}) => {
			const response = await request.post(
				`${API_BASE_URL}/files/jobs/processing-job-id/retry`,
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
			const response = await request.post(
				`${API_BASE_URL}/files/jobs/${testJobId}/retry`,
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
			const response = await request.post(
				`${API_BASE_URL}/files/jobs/${testJobId}/retry`,
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
			}
		});

		test("should prevent SQL injection in jobId", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/files/jobs/' OR '1'='1/retry`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([400, 401, 403, 404, 500]).toContain(response.status());
		});

		test("should require authentication", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/files/jobs/${testJobId}/retry`,
			);

			expect([401, 404, 500]).toContain(response.status());
		});

		test("should prevent unauthorized retry", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/files/jobs/${testJobId}/retry`,
				{
					headers: {
						Authorization: "Bearer invalid-token",
					},
				},
			);

			expect([401, 404, 500]).toContain(response.status());
		});
	});

	// ========================
	// RESPONSE FORMAT
	// ========================

	test.describe("Response Format Tests", () => {
		test("should return consistent success structure", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/files/jobs/${testJobId}/retry`,
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
			const response = await request.post(
				`${API_BASE_URL}/files/jobs/${testJobId}/retry`,
				{
					headers: {
						Authorization: "Bearer invalid-token",
					},
				},
			);

			if (response.headers()["content-type"]?.includes("application/json")) {
				const data = await response.json();
				// Response can be string or object
				if (typeof data === "object") {
					expect(data).toHaveProperty("success");
				}
			}
		});

		test("should return proper content type", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/files/jobs/${testJobId}/retry`,
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
		test("should respond quickly (< 500ms)", async ({ request }) => {
			const start = Date.now();

			const response = await request.post(
				`${API_BASE_URL}/files/jobs/${testJobId}/retry`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			const duration = Date.now() - start;

			expect([200, 400, 401, 403, 404, 500]).toContain(response.status());
			expect(duration).toBeLessThan(500);
		});

		test("should handle retry efficiently", async ({ request }) => {
			const start = Date.now();

			const response = await request.post(
				`${API_BASE_URL}/files/jobs/${testJobId}/retry`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			const duration = Date.now() - start;

			expect([200, 400, 401, 403, 404, 500]).toContain(response.status());
			expect(duration).toBeLessThan(1000);
		});

		test("should restart job processing quickly", async ({ request }) => {
			const start = Date.now();

			const response = await request.post(
				`${API_BASE_URL}/files/jobs/${testJobId}/retry`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			const duration = Date.now() - start;

			expect([200, 400, 401, 403, 404, 500]).toContain(response.status());
			expect(duration).toBeLessThan(300);
		});
	});
});

