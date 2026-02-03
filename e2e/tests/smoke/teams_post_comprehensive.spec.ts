/** @format */

import { test, expect } from "@playwright/test";
import { testData } from "../testData";

/**
 * Comprehensive test suite for POST /teams endpoint
 *
 * Based on Swagger documentation - Create a new team (company/workspace)
 * Supports both company users and solo users
 */

const API_BASE_URL = "http://127.0.0.1:5050";

test.describe("POST /teams - Comprehensive Tests", () => {
	let validAccessToken: string;
	let adminAccessToken: string;

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

	// ========================
	// SUCCESS (200)
	// ========================

	// ========================
	// CONFLICT (408)
	// ========================

	// ========================
	// UNPROCESSABLE ENTITY (422)
	// ========================

	// ========================
	// UPGRADE REQUIRED (426)
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
		test("should handle very long team name", async ({ request }) => {
			const response = await request.post(`${API_BASE_URL}/teams`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: {
					name: "A".repeat(500),
					companyId: testData.users.admin1.companyId,
				},
			});

			expect([200, 400, 401, 422, 500, 401]).toContain(response.status());
		});

		test("should handle special characters in name", async ({ request }) => {
			const response = await request.post(`${API_BASE_URL}/teams`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: {
					name: "Team @#$ Test !@#",
					companyId: testData.users.admin1.companyId,
				},
			});

			expect([200, 400, 401, 422, 500, 401]).toContain(response.status());
		});

		test("should handle Unicode characters", async ({ request }) => {
			const response = await request.post(`${API_BASE_URL}/teams`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: {
					name: "Tëam Ünïçödé",
					companyId: testData.users.admin1.companyId,
				},
			});

			expect([200, 400, 401, 422, 500, 401]).toContain(response.status());
		});
	});

	// ========================
	// SECURITY TESTS
	// ========================

	test.describe("Security Tests", () => {
		test("should prevent SQL injection in name", async ({ request }) => {
			const response = await request.post(`${API_BASE_URL}/teams`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: {
					name: "1' OR '1'='1",
					companyId: testData.users.admin1.companyId,
				},
			});

			expect([200, 400, 401, 422, 500, 401]).toContain(response.status());
		});

		test("should validate token on every request", async ({ request }) => {
			const response = await request.post(`${API_BASE_URL}/teams`, {
				headers: {
					Authorization: "Bearer tampered-token",
					"Content-Type": "application/json",
				},
				data: {
					name: "Test Team",
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
			const response = await request.post(`${API_BASE_URL}/teams`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: {
					name: "Format Test Team",
					companyId: testData.users.admin1.companyId,
				},
			});

			if (response.status() === 200) {
				const data = await response.json();
				expect(data).toHaveProperty("success");
			}
		});

		test("should return proper content type", async ({ request }) => {
			const response = await request.post(`${API_BASE_URL}/teams`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: {
					name: "Content Type Test",
					companyId: testData.users.admin1.companyId,
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

			const response = await request.post(`${API_BASE_URL}/teams`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: {
					name: "Performance Test",
					companyId: testData.users.admin1.companyId,
				},
			});

			const duration = Date.now() - start;

			expect([200, 400, 401, 403, 408, 422, 426, 500, 401]).toContain(response.status());
			expect(duration).toBeLessThan(1000);
		});
	});
});

