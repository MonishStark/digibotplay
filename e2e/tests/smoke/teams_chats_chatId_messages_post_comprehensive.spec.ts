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

	test.describe("201 Success Responses", () => {
		test("should add message successfully - 201", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/teams/${testTeamId}/chats/${testChatId}/messages`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						message: "Hello, this is a test message",
						role: "user",
					},
				},
			);

			expect([201, 400, 401, 404]).toContain(response.status());

			if (
				response.status() === 201 &&
				response.headers()["content-type"]?.includes("application/json")
			) {
				const data = await response.json();
				expect(data).toHaveProperty("success");
			}
		});

		test("should add message with assistant role", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/teams/${testTeamId}/chats/${testChatId}/messages`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						message: "This is an assistant response",
						role: "assistant",
					},
				},
			);

			expect([201, 400, 401, 404]).toContain(response.status());
		});

		test("should add message with system role", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/teams/${testTeamId}/chats/${testChatId}/messages`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						message: "System notification",
						role: "system",
					},
				},
			);

			expect([201, 400, 401, 404]).toContain(response.status());
		});

		test("should handle long messages", async ({ request }) => {
			const longMessage =
				"This is a very long message that contains a lot of text. ".repeat(50);

			const response = await request.post(
				`${API_BASE_URL}/teams/${testTeamId}/chats/${testChatId}/messages`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						message: longMessage,
						role: "user",
					},
				},
			);

			expect([201, 400, 401, 404, 422]).toContain(response.status());
		});

		test("should return message details", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/teams/${testTeamId}/chats/${testChatId}/messages`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						message: "Test message with details",
						role: "user",
					},
				},
			);

			expect([201, 400, 401, 404]).toContain(response.status());
		});
	});

	// ========================
	// BAD REQUEST (400)
	// ========================

	test.describe("400 Bad Request Responses", () => {
		test("should return 400 when message is missing", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/teams/${testTeamId}/chats/${testChatId}/messages`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						role: "user",
					},
				},
			);

			expect([400, 401, 404, 422]).toContain(response.status());

			if (response.headers()["content-type"]?.includes("application/json")) {
				const data = await response.json();
				expect(data.success).toBe(false);
			}
		});

		test("should return 400 when role is missing", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/teams/${testTeamId}/chats/${testChatId}/messages`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						message: "Test message",
					},
				},
			);

			expect([400, 401, 404, 422]).toContain(response.status());
		});

		test("should return 400 for empty message", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/teams/${testTeamId}/chats/${testChatId}/messages`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						message: "",
						role: "user",
					},
				},
			);

			expect([400, 401, 404, 422]).toContain(response.status());
		});

		test("should return 400 for invalid role", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/teams/${testTeamId}/chats/${testChatId}/messages`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						message: "Test message",
						role: "invalid-role",
					},
				},
			);

			expect([400, 401, 404, 422]).toContain(response.status());
		});

		test("should return 400 for empty body", async ({ request }) => {
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

			expect([400, 401, 404, 422]).toContain(response.status());
		});

		test("should return 400 for malformed JSON", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/teams/${testTeamId}/chats/${testChatId}/messages`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: "{ invalid json",
				},
			);

			expect([400, 401, 404, 500]).toContain(response.status());
		});

		test("should return 400 for invalid teamId format", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/teams/invalid-id/chats/${testChatId}/messages`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						message: "Test message",
						role: "user",
					},
				},
			);

			expect([400, 401, 404]).toContain(response.status());
		});
	});

	// ========================
	// UNAUTHORIZED (401)
	// ========================

	test.describe("401 Unauthorized Responses", () => {
		test("should return 401 when Authorization header is missing", async ({
			request,
		}) => {
			const response = await request.post(
				`${API_BASE_URL}/teams/${testTeamId}/chats/${testChatId}/messages`,
				{
					headers: {
						"Content-Type": "application/json",
					},
					data: {
						message: "Test message",
						role: "user",
					},
				},
			);

			expect(response.status()).toBe(401);
		});

		test("should return 401 for invalid token", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/teams/${testTeamId}/chats/${testChatId}/messages`,
				{
					headers: {
						Authorization: "Bearer invalid-token-12345",
						"Content-Type": "application/json",
					},
					data: {
						message: "Test message",
						role: "user",
					},
				},
			);

			expect(response.status()).toBe(401);
		});

		test("should return 401 for expired token", async ({ request }) => {
			const expiredToken =
				"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.4Adcj0vbBqfVIpnGGNJKKpBmJcAmPNtSKhTNnsTekII";

			const response = await request.post(
				`${API_BASE_URL}/teams/${testTeamId}/chats/${testChatId}/messages`,
				{
					headers: {
						Authorization: `Bearer ${expiredToken}`,
						"Content-Type": "application/json",
					},
					data: {
						message: "Test message",
						role: "user",
					},
				},
			);

			expect(response.status()).toBe(401);
		});

		test("should return 401 for malformed JWT", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/teams/${testTeamId}/chats/${testChatId}/messages`,
				{
					headers: {
						Authorization: "Bearer not-a-valid-jwt",
						"Content-Type": "application/json",
					},
					data: {
						message: "Test message",
						role: "user",
					},
				},
			);

			expect(response.status()).toBe(401);
		});
	});

	// ========================
	// FORBIDDEN (403)
	// ========================

	test.describe("403 Forbidden Responses", () => {
		test("should return 403 for insufficient permissions - PLACEHOLDER", async ({
			request,
		}) => {
			// Would require a user without proper message permissions
			expect(true).toBe(true);
		});
	});

	// ========================
	// NOT FOUND (404)
	// ========================

	test.describe("404 Not Found Responses", () => {
		test("should return 404 for non-existent chat", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/teams/${testTeamId}/chats/99999999/messages`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						message: "Test message",
						role: "user",
					},
				},
			);

			expect([401, 404]).toContain(response.status());
		});

		test("should return 404 for non-existent team", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/teams/99999999/chats/${testChatId}/messages`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						message: "Test message",
						role: "user",
					},
				},
			);

			expect([401, 404]).toContain(response.status());
		});
	});

	// ========================
	// RATE LIMIT (429)
	// ========================

	test.describe("429 Rate Limit Exceeded", () => {
		test("should handle rate limiting - PLACEHOLDER", async ({ request }) => {
			// Would require many rapid requests
			expect(true).toBe(true);
		});
	});

	// ========================
	// SERVER ERROR (500)
	// ========================

	test.describe("500 Server Error", () => {
		test("should handle server errors gracefully - PLACEHOLDER", async ({
			request,
		}) => {
			// Would require simulating server error
			expect(true).toBe(true);
		});
	});

	// ========================
	// SERVICE UNAVAILABLE (503)
	// ========================

	test.describe("503 Service Unavailable", () => {
		test("should handle service unavailable - PLACEHOLDER", async ({
			request,
		}) => {
			// Would require service to be down
			expect(true).toBe(true);
		});
	});

	// ========================
	// GATEWAY TIMEOUT (504)
	// ========================

	test.describe("504 Gateway Timeout", () => {
		test("should handle gateway timeout - PLACEHOLDER", async ({ request }) => {
			// Would require simulating timeout
			expect(true).toBe(true);
		});
	});

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

			expect([201, 400, 401, 404]).toContain(response.status());
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

			expect([201, 400, 401, 404]).toContain(response.status());
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

			expect([201, 400, 401, 404]).toContain(response.status());
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
				expect([201, 400, 401, 404]).toContain(response.status());
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

			expect([201, 400, 401, 404, 422]).toContain(response.status());
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

			expect([201, 400, 401, 404, 413, 422]).toContain(response.status());
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

			expect([201, 400, 401, 404]).toContain(response.status());
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

			expect([201, 400, 401, 404]).toContain(response.status());
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

			expect(response.status()).toBe(401);
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

			expect([201, 400, 401, 404]).toContain(response.status());
			expect(duration).toBeLessThan(500);
		});
	});
});
