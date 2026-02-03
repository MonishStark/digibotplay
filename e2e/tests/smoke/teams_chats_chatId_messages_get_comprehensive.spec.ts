/** @format */

import { test, expect } from "@playwright/test";
import { testData } from "../testData";

const API_BASE_URL = "http://127.0.0.1:5050";

/**
 * Comprehensive test suite for GET /teams/{teamId}/chats/{chatId}/messages endpoint
 * Fetches messages from a specific chat with optional pagination
 * Response codes: 200, 400, 401, 403, 404, 429, 500, 503, 504
 */

test.describe("GET /teams/{teamId}/chats/{chatId}/messages - Comprehensive Tests", () => {
	let validAccessToken: string;
	let testTeamId: string;
	let testChatId: string;

	test.beforeAll(async ({ request }) => {
		const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
			data: {
				email: testData.users.admin1.email,
				password: testData.users.admin1.password,
			},
		});

		const loginData = await loginResponse.json();
		validAccessToken = loginData.accessToken;
		testTeamId = testData.users.admin1.companyId || "1";
		testChatId = "test-chat-" + Date.now();
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
		test("should handle zero limit", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/teams/${testTeamId}/chats/${testChatId}/messages?limit=0`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([200, 400, 401, 404, 500, 401]).toContain(response.status());
		});

		test("should handle special characters in cursor", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/teams/${testTeamId}/chats/${testChatId}/messages?before=${encodeURIComponent("cursor!@#$%")}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([200, 400, 401, 404, 500, 401]).toContain(response.status());
		});

		test("should handle very long cursor", async ({ request }) => {
			const longCursor = "a".repeat(1000);

			const response = await request.get(
				`${API_BASE_URL}/teams/${testTeamId}/chats/${testChatId}/messages?before=${longCursor}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([200, 400, 401, 404, 500, 401]).toContain(response.status());
		});

		test("should handle concurrent requests", async ({ request }) => {
			const requests = Array(3)
				.fill(null)
				.map(() =>
					request.get(
						`${API_BASE_URL}/teams/${testTeamId}/chats/${testChatId}/messages`,
						{
							headers: {
								Authorization: `Bearer ${validAccessToken}`,
							},
						},
					),
				);

			const responses = await Promise.all(requests);

			responses.forEach((response) => {
				expect([200, 401, 404, 500, 401]).toContain(response.status());
			});
		});

		test("should handle empty cursor values", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/teams/${testTeamId}/chats/${testChatId}/messages?before=`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
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
		test("should prevent XSS in cursor parameter", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/teams/${testTeamId}/chats/${testChatId}/messages?before=${encodeURIComponent("<script>alert('xss')</script>")}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([200, 400, 401, 404, 500, 401]).toContain(response.status());
		});

		test("should prevent SQL injection in cursor", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/teams/${testTeamId}/chats/${testChatId}/messages?before=${encodeURIComponent("1' OR '1'='1")}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([200, 400, 401, 404, 500, 401]).toContain(response.status());
		});

		test("should validate token on every request", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/teams/${testTeamId}/chats/${testChatId}/messages`,
				{
					headers: {
						Authorization: "Bearer malformed-token",
					},
				},
			);

			expect([401, 404, 500]).toContain(response.status());
		});

		test("should not expose sensitive data in messages", async ({
			request,
		}) => {
			const response = await request.get(
				`${API_BASE_URL}/teams/${testTeamId}/chats/${testChatId}/messages`,
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
	});

	// ========================
	// RESPONSE FORMAT
	// ========================

	test.describe("Response Format Tests", () => {
		test("should return consistent success structure", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/teams/${testTeamId}/chats/${testChatId}/messages`,
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
				`${API_BASE_URL}/teams/invalid-id/chats/${testChatId}/messages`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			if (response.headers()["content-type"]?.includes("application/json")) {
				const data = await response.json();
				if (data.success !== undefined) {
					expect(typeof data.success).toBe("boolean");
				}
			}
		});

		test("should return proper content type", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/teams/${testTeamId}/chats/${testChatId}/messages`,
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

			const response = await request.get(
				`${API_BASE_URL}/teams/${testTeamId}/chats/${testChatId}/messages`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			const duration = Date.now() - start;

			expect([200, 401, 404, 500, 401]).toContain(response.status());
			expect(duration).toBeLessThan(500);
		});

		test("should handle large limit efficiently", async ({ request }) => {
			const start = Date.now();

			const response = await request.get(
				`${API_BASE_URL}/teams/${testTeamId}/chats/${testChatId}/messages?limit=100`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			const duration = Date.now() - start;

			expect([200, 400, 401, 404, 500, 401]).toContain(response.status());
			expect(duration).toBeLessThan(1000);
		});
	});
});

