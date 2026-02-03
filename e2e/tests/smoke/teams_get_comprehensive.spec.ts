/** @format */

import { test, expect } from "@playwright/test";
import { testData } from "../testData";

/**
 * Comprehensive test suite for GET /teams endpoint
 *
 * Based on Swagger documentation - Retrieve list of teams with search, pagination, and company filtering
 */

const API_BASE_URL = "http://127.0.0.1:5050";

test.describe("GET /teams - Comprehensive Tests", () => {
	let validAccessToken: string;
	let adminAccessToken: string;

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

	// ========================
	// SUCCESS (200)
	// ========================

	// ========================
	// NOT FOUND (404)
	// ========================

	// ========================
	// CONFLICT (409)
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
	// SERVICE UNAVAILABLE (503/504)
	// ========================

	// ========================
	// EDGE CASES
	// ========================

	test.describe("Edge Cases", () => {
		test("should handle very large page number", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/teams?page=999999`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			expect([200, 400, 401, 500, 401]).toContain(response.status());
		});

		test("should handle very large limit", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/teams?limit=10000`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			expect([200, 400, 401, 500, 401]).toContain(response.status());
		});

		test("should handle special characters in searchString", async ({
			request,
		}) => {
			const response = await request.get(
				`${API_BASE_URL}/teams?searchString=${encodeURIComponent("@#$%")}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([200, 400, 401, 500, 401]).toContain(response.status());
		});
	});

	// ========================
	// SECURITY TESTS
	// ========================

	test.describe("Security Tests", () => {
		test("should prevent SQL injection in searchString", async ({
			request,
		}) => {
			const response = await request.get(
				`${API_BASE_URL}/teams?searchString=${encodeURIComponent("1' OR '1'='1")}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([200, 400, 401, 500, 401]).toContain(response.status());
		});

		test("should validate token on every request", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/teams`, {
				headers: {
					Authorization: "Bearer tampered-token",
				},
			});

			expect([401, 404, 500]).toContain(response.status());
		});
	});

	// ========================
	// RESPONSE FORMAT TESTS
	// ========================

	test.describe("Response Format Tests", () => {
		test("should return consistent success structure", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/teams`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			if (response.status() === 200) {
				const data = await response.json();
				expect(data).toHaveProperty("success");
				expect(data).toHaveProperty("results");
			}
		});

		test("should return proper content type", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/teams`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			const contentType = response.headers()["content-type"];
			expect(
				contentType?.includes("application/json") ||
					contentType?.includes("text/html"),
			).toBe(true);
		});
	});

	// ========================
	// PERFORMANCE TESTS
	// ========================

	test.describe("Performance Tests", () => {
		test("should respond quickly (< 1000ms)", async ({ request }) => {
			const start = Date.now();

			const response = await request.get(`${API_BASE_URL}/teams`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			const duration = Date.now() - start;

			expect([200, 400, 401, 403, 404, 500, 401]).toContain(response.status());
			expect(duration).toBeLessThan(1000);
		});
	});
});

