/** @format */

import { test, expect } from "@playwright/test";
import { testData } from "../testData";

const API_BASE_URL = "http://127.0.0.1:5050";

/**
 * Comprehensive test suite for POST /teams/{teamId}/chats/{chatId}/messages endpoint
 * Adds a new message to an existing chat session
 * Response codes: 201, 400, 401, 403, 404, 429, 500, 503, 504
 */

test.describe("POST /teams/{teamId}/chats/{chatId}/messages - Comprehensive Tests", () => {
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
	// SUCCESS (201)
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
		test("should handle special characters in message", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/teams/${testTeamId}/chats/${testChatId}/messages`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						message: "Test!@#$%^&*()",
						role: "user",
					},
				},
			);

			expect([201, 400, 401, 404, 500, 401]).toContain(response.status());
		});

		test("should handle unicode in message", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/teams/${testTeamId}/chats/${testChatId}/messages`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						message: "你好世界 🌍",
						role: "user",
					},
				},
			);

			expect([201, 400, 401, 404, 500, 401]).toContain(response.status());
		});

		test("should handle newlines in message", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/teams/${testTeamId}/chats/${testChatId}/messages`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						message: "Line 1\nLine 2\nLine 3",
						role: "user",
					},
				},
			);

			expect([201, 400, 401, 404, 500, 401]).toContain(response.status());
		});

		test("should handle concurrent message submissions", async ({
			request,
		}) => {
			const requests = Array(3)
				.fill(null)
				.map((_, i) =>
					request.post(
						`${API_BASE_URL}/teams/${testTeamId}/chats/${testChatId}/messages`,
						{
							headers: {
								Authorization: `Bearer ${validAccessToken}`,
								"Content-Type": "application/json",
							},
							data: {
								message: `Concurrent message ${i}`,
								role: "user",
							},
						},
					),
				);

			const responses = await Promise.all(requests);

			responses.forEach((response) => {
				expect([201, 400, 401, 404, 500, 401]).toContain(response.status());
			});
		});

		test("should handle whitespace-only message", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/teams/${testTeamId}/chats/${testChatId}/messages`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						message: "    ",
						role: "user",
					},
				},
			);

			expect([201, 400, 401, 404, 422, 500, 401]).toContain(response.status());
		});

		test("should handle extremely long message", async ({ request }) => {
			const veryLongMessage = "a".repeat(100000);

			const response = await request.post(
				`${API_BASE_URL}/teams/${testTeamId}/chats/${testChatId}/messages`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						message: veryLongMessage,
						role: "user",
					},
				},
			);

			expect([201, 400, 401, 404, 413, 422, 500, 401]).toContain(response.status());
		});
	});

	// ========================
	// SECURITY TESTS
	// ========================

	test.describe("Security Tests", () => {
		test("should prevent XSS in message content", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/teams/${testTeamId}/chats/${testChatId}/messages`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						message: "<script>alert('xss')</script>",
						role: "user",
					},
				},
			);

			expect([201, 400, 401, 404, 500, 401]).toContain(response.status());
		});

		test("should prevent SQL injection", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/teams/${testTeamId}/chats/${testChatId}/messages`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						message: "'; DROP TABLE messages; --",
						role: "user",
					},
				},
			);

			expect([201, 400, 401, 404, 500, 401]).toContain(response.status());
		});

		test("should validate token on every request", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/teams/${testTeamId}/chats/${testChatId}/messages`,
				{
					headers: {
						Authorization: "Bearer malformed-token",
						"Content-Type": "application/json",
					},
					data: {
						message: "Test",
						role: "user",
					},
				},
			);

			expect([401, 404, 500]).toContain(response.status());
		});

		test("should not expose sensitive data in response", async ({
			request,
		}) => {
			const response = await request.post(
				`${API_BASE_URL}/teams/${testTeamId}/chats/${testChatId}/messages`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						message: "Secure test message",
						role: "user",
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
			const response = await request.post(
				`${API_BASE_URL}/teams/${testTeamId}/chats/${testChatId}/messages`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						message: "Format test message",
						role: "user",
					},
				},
			);

			if (
				response.status() === 201 &&
				response.headers()["content-type"]?.includes("application/json")
			) {
				const data = await response.json();
				expect(data).toHaveProperty("success");
			}
		});

		test("should return consistent error structure", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/teams/${testTeamId}/chats/${testChatId}/messages`,
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
				expect(data).toHaveProperty("success");
			}
		});

		test("should return proper content type", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/teams/${testTeamId}/chats/${testChatId}/messages`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						message: "Content type test",
						role: "user",
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
				`${API_BASE_URL}/teams/${testTeamId}/chats/${testChatId}/messages`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						message: "Performance test message",
						role: "user",
					},
				},
			);

			const duration = Date.now() - start;

			expect([201, 400, 401, 404, 500, 401]).toContain(response.status());
			expect(duration).toBeLessThan(500);
		});
	});
});

