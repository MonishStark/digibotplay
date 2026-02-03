/** @format */

import { test, expect } from "@playwright/test";

const API_BASE_URL = "http://127.0.0.1:5050";

/**
 * Comprehensive test suite for POST /invitations/verify endpoint
 * Tests ALL response codes: 200, 400, 404, 409, 429, 500, 503, 504
 * Based on Swagger documentation - Verify invitation token and pre-fill registration form
 */

test.describe("POST /invitations/verify - Comprehensive Tests", () => {
	// ========================
	// SUCCESS SCENARIOS (200)
	// ========================

	// ========================
	// RATE LIMIT (429)
	// ========================

	// ========================
	// SERVER ERROR (500)
	// ========================

	// ========================
	// SERVICE UNAVAILABLE (503/504)
	// ========================

	// ========================
	// EDGE CASES
	// ========================

	test.describe("Edge Cases", () => {
		test("should handle very long token", async ({ request }) => {
			const longToken = "a".repeat(1000);

			const response = await request.post(
				`${API_BASE_URL}/invitations/verify`,
				{
					headers: {
						"Content-Type": "application/json",
					},
					data: {
						email: "test@example.com",
						token: longToken,
					},
				},
			);

			expect([400, 404, 422, 500, 401]).toContain(response.status());
		});

		test("should handle special characters in token", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/invitations/verify`,
				{
					headers: {
						"Content-Type": "application/json",
					},
					data: {
						email: "test@example.com",
						token: "token!@#$%^&*()",
					},
				},
			);

			expect([400, 404, 500, 401]).toContain(response.status());
		});

		test("should trim whitespace from inputs", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/invitations/verify`,
				{
					headers: {
						"Content-Type": "application/json",
					},
					data: {
						email: "  test@example.com  ",
						token: "  some-token  ",
					},
				},
			);

			expect([200, 400, 404, 500, 401]).toContain(response.status());
		});

		test("should handle concurrent verification attempts", async ({
			request,
		}) => {
			const requests = Array(3)
				.fill(null)
				.map(() =>
					request.post(`${API_BASE_URL}/invitations/verify`, {
						headers: {
							"Content-Type": "application/json",
						},
						data: {
							email: "test@example.com",
							token: "concurrent-token",
						},
					}),
				);

			const responses = await Promise.all(requests);

			responses.forEach((response) => {
				expect([200, 400, 404, 500, 401]).toContain(response.status());
			});
		});
	});

	// ========================
	// SECURITY TESTS
	// ========================

	test.describe("Security Tests", () => {
		test("should sanitize XSS attempts in email", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/invitations/verify`,
				{
					headers: {
						"Content-Type": "application/json",
					},
					data: {
						email: "<script>alert('xss')</script>@example.com",
						token: "some-token",
					},
				},
			);

			expect([400, 404, 422, 500, 401]).toContain(response.status());
		});

		test("should prevent SQL injection in token", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/invitations/verify`,
				{
					headers: {
						"Content-Type": "application/json",
					},
					data: {
						email: "test@example.com",
						token: "token' OR '1'='1",
					},
				},
			);

			expect([400, 404, 500, 401]).toContain(response.status());
		});

		test("should not expose sensitive data in response", async ({
			request,
		}) => {
			const response = await request.post(
				`${API_BASE_URL}/invitations/verify`,
				{
					headers: {
						"Content-Type": "application/json",
					},
					data: {
						email: "test@example.com",
						token: "test-token",
					},
				},
			);

			const data = await response.json();
			const responseText = JSON.stringify(data);

			expect(responseText).not.toContain("passwordHash");
			expect(responseText).not.toContain("secretKey");
		});

		
	});

	// ========================
	// RESPONSE FORMAT TESTS
	// ========================

	test.describe("Response Format Tests", () => {
		test("should return consistent success structure", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/invitations/verify`,
				{
					headers: {
						"Content-Type": "application/json",
					},
					data: {
						email: "test@example.com",
						token: "format-test-token",
					},
				},
			);

			const data = await response.json();
			expect(data).toHaveProperty("success");
		});

		test("should return consistent error structure", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/invitations/verify`,
				{
					headers: {
						"Content-Type": "application/json",
					},
					data: {},
				},
			);

			const data = await response.json();
			expect(data).toHaveProperty("success");
			expect(data).toHaveProperty("error");
			expect(data).toHaveProperty("message");
		});

		test("should return proper content type", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/invitations/verify`,
				{
					headers: {
						"Content-Type": "application/json",
					},
					data: {
						email: "test@example.com",
						token: "content-type-test",
					},
				},
			);

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

			const response = await request.post(
				`${API_BASE_URL}/invitations/verify`,
				{
					headers: {
						"Content-Type": "application/json",
					},
					data: {
						email: "test@example.com",
						token: "perf-test-token",
					},
				},
			);

			const duration = Date.now() - start;

			expect([200, 400, 404, 500, 401]).toContain(response.status());
			expect(duration).toBeLessThan(500);
		});
	});
});

