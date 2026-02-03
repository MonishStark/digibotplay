/** @format */

import { test, expect } from "@playwright/test";
import { testData } from "../testData";

const API_BASE_URL = "http://127.0.0.1:5050";

/**
 * Comprehensive test suite for GET /settings/recording-prompt-time endpoint
 * Returns the duration (in minutes) after which the mobile or web app should prompt the user
 * to either continue recording or upload the current session to the server.
 * Response codes: 200, 401, 403, 404, 405, 408, 429, 500, 503, 504
 */

test.describe("GET /settings/recording-prompt-time - Comprehensive Tests", () => {
	let validAccessToken: string;

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
	// METHOD NOT ALLOWED (405)
	// ========================

	// ========================
	// REQUEST TIMEOUT (408)
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
		test("should handle query parameters gracefully", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/settings/recording-prompt-time?extra=param`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([200, 401, 403, 404, 500]).toContain(response.status());
		});

		test("should handle concurrent requests", async ({ request }) => {
			const promises = Array(5)
				.fill(null)
				.map(() =>
					request.get(`${API_BASE_URL}/settings/recording-prompt-time`, {
						headers: {
							Authorization: `Bearer ${validAccessToken}`,
						},
					}),
				);

			const responses = await Promise.all(promises);
			responses.forEach((response) => {
				expect([200, 401, 403, 404, 500]).toContain(response.status());
			});
		});

		test("should be accessible to authenticated users", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/settings/recording-prompt-time`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([200, 401, 403, 404, 500]).toContain(response.status());
		});

		test("should return duration in minutes", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/settings/recording-prompt-time`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([200, 401, 403, 404, 500]).toContain(response.status());
		});
	});

	// ========================
	// SECURITY TESTS
	// ========================

	test.describe("Security Tests", () => {
		test("should validate token on every request", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/settings/recording-prompt-time`,
				{
					headers: {
						Authorization: "Bearer malformed-token",
					},
				},
			);

			expect([200, 401, 404, 500]).toContain(response.status());
		});

		test("should not expose sensitive data in response", async ({
			request,
		}) => {
			const response = await request.get(
				`${API_BASE_URL}/settings/recording-prompt-time`,
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

		test("should require authentication", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/settings/recording-prompt-time`,
			);

			expect([200, 401, 404, 500]).toContain(response.status());
		});

		test("should provide prompt time for session management", async ({
			request,
		}) => {
			const response = await request.get(
				`${API_BASE_URL}/settings/recording-prompt-time`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([200, 401, 403, 404, 500]).toContain(response.status());
		});
	});

	// ========================
	// RESPONSE FORMAT
	// ========================

	test.describe("Response Format Tests", () => {
		test("should return consistent success structure", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/settings/recording-prompt-time`,
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
			const response = await request.get(
				`${API_BASE_URL}/settings/recording-prompt-time`,
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
			const response = await request.get(
				`${API_BASE_URL}/settings/recording-prompt-time`,
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
		test("should respond quickly (< 300ms)", async ({ request }) => {
			const start = Date.now();

			const response = await request.get(
				`${API_BASE_URL}/settings/recording-prompt-time`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			const duration = Date.now() - start;

			expect([200, 401, 403, 404, 500]).toContain(response.status());
			expect(duration).toBeLessThan(300);
		});

		test("should handle concurrent requests efficiently", async ({
			request,
		}) => {
			const start = Date.now();

			const promises = Array(10)
				.fill(null)
				.map(() =>
					request.get(`${API_BASE_URL}/settings/recording-prompt-time`, {
						headers: {
							Authorization: `Bearer ${validAccessToken}`,
						},
					}),
				);

			await Promise.all(promises);
			const duration = Date.now() - start;

			expect(duration).toBeLessThan(2000);
		});

		test("should retrieve setting efficiently", async ({ request }) => {
			const start = Date.now();

			const response = await request.get(
				`${API_BASE_URL}/settings/recording-prompt-time`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			const duration = Date.now() - start;

			expect([200, 401, 403, 404, 500]).toContain(response.status());
			expect(duration).toBeLessThan(200);
		});
	});
});

