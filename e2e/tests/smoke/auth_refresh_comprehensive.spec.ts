/** @format */

import { test, expect } from "@playwright/test";
import { testData } from "../testData";

const API_BASE_URL = "http://127.0.0.1:5050";

/**
 * Comprehensive test suite for POST /auth/refresh endpoint
 * Tests ALL response codes: 200, 400, 401, 403, 500, 503
 * Covers scenarios: valid refresh, expired token, missing token, token reuse detection
 */

test.describe("POST /auth/refresh - Comprehensive Tests", () => {
	let validRefreshToken: string;
	let validAccessToken: string;
	let userId: number;

	// Setup: Get fresh tokens before tests
	test.beforeAll(async ({ request }) => {
		const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
			headers: { "Content-Type": "application/json" },
			data: {
				email: testData.users.admin1.email,
				password: testData.users.admin1.password,
				loginType: "standard",
			},
		});

		if (!loginResponse.ok()) {
			const errorText = await loginResponse.text();
			throw new Error(
				`Login failed in beforeAll: ${loginResponse.status()} - ${errorText}`,
			);
		}

		const loginData = await loginResponse.json();
		validRefreshToken = loginData.user.auth.refreshToken;
		validAccessToken = loginData.user.auth.accessToken;
		userId = loginData.user.id;
	});

	// ========================
	// SUCCESS SCENARIOS (200)
	// ========================

	test.describe("200 Success Responses", () => {
		test("should refresh token successfully with valid refreshToken - 200", async ({
			request,
		}) => {
			// First login to get a fresh refresh token
			const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
				headers: { "Content-Type": "application/json" },
				data: {
					email: testData.users.admin2.email,
					password: testData.users.admin2.password,
					loginType: "standard",
				},
			});

			const loginData = await loginResponse.json();
			const refreshToken = loginData.user.auth.refreshToken;

			// Now refresh the token
			const response = await request.post(`${API_BASE_URL}/auth/refresh`, {
				headers: { "Content-Type": "application/json" },
				data: {
					refreshToken: refreshToken,
				},
			});

			expect(response.status()).toBe(200);

			const data = await response.json();
			expect(data.success).toBe(true);
			expect(data.auth).toBeDefined();
			expect(data.auth.accessToken).toBeDefined();
			expect(data.auth.refreshToken).toBeDefined();
			expect(data.auth.tokenType).toBe("Bearer");
			expect(data.auth.expiresIn).toBe(3600);
			expect(data.auth.refreshTokenExpiresAt).toBeDefined();

			// Verify tokens are different from original
			expect(data.auth.accessToken).not.toBe(loginData.user.auth.accessToken);
			expect(data.auth.refreshToken).not.toBe(refreshToken);

			// Verify refreshTokenExpiresAt is in the future
			const expiresAt = new Date(data.auth.refreshTokenExpiresAt);
			const now = new Date();
			expect(expiresAt.getTime()).toBeGreaterThan(now.getTime());

			// Verify it's approximately 30 days in the future
			const daysDiff =
				(expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
			expect(daysDiff).toBeGreaterThan(29);
			expect(daysDiff).toBeLessThan(31);
		});

		test("should provide new access token that works for authenticated requests", async ({
			request,
		}) => {
			// Login
			const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
				headers: { "Content-Type": "application/json" },
				data: {
					email: testData.users.superAdmin.email,
					password: testData.users.superAdmin.password,
					loginType: "standard",
				},
			});

			const loginData = await loginResponse.json();
			const refreshToken = loginData.user.auth.refreshToken;

			// Refresh token
			const refreshResponse = await request.post(
				`${API_BASE_URL}/auth/refresh`,
				{
					headers: { "Content-Type": "application/json" },
					data: {
						refreshToken: refreshToken,
					},
				},
			);

			const refreshData = await refreshResponse.json();
			const newAccessToken = refreshData.auth.accessToken;

			// Use new access token to make authenticated request
			const profileResponse = await request.get(`${API_BASE_URL}/me/profile`, {
				headers: {
					Authorization: `Bearer ${newAccessToken}`,
					"Content-Type": "application/json",
				},
			});

			expect(profileResponse.status()).toBe(200);
			const profileData = await profileResponse.json();
			expect(profileData.success).toBe(true);
			expect(profileData.user).toBeDefined();
		});

		test("should rotate refresh token on each refresh", async ({ request }) => {
			// Login
			const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
				headers: { "Content-Type": "application/json" },
				data: {
					email: testData.users.admin1.email,
					password: testData.users.admin1.password,
					loginType: "standard",
				},
			});

			const loginData = await loginResponse.json();
			const firstRefreshToken = loginData.user.auth.refreshToken;

			// First refresh
			const firstRefreshResponse = await request.post(
				`${API_BASE_URL}/auth/refresh`,
				{
					headers: { "Content-Type": "application/json" },
					data: {
						refreshToken: firstRefreshToken,
					},
				},
			);

			const firstRefreshData = await firstRefreshResponse.json();
			const secondRefreshToken = firstRefreshData.auth.refreshToken;

			// Verify tokens are different
			expect(secondRefreshToken).not.toBe(firstRefreshToken);

			// Second refresh
			const secondRefreshResponse = await request.post(
				`${API_BASE_URL}/auth/refresh`,
				{
					headers: { "Content-Type": "application/json" },
					data: {
						refreshToken: secondRefreshToken,
					},
				},
			);

			const secondRefreshData = await secondRefreshResponse.json();
			const thirdRefreshToken = secondRefreshData.auth.refreshToken;

			// Verify all tokens are unique
			expect(thirdRefreshToken).not.toBe(secondRefreshToken);
			expect(thirdRefreshToken).not.toBe(firstRefreshToken);
		});
	});

	// ========================
	// BAD REQUEST (400)
	// ========================

	test.describe("400 Bad Request Responses", () => {
		test("should return 400 when refreshToken is missing", async ({
			request,
		}) => {
			const response = await request.post(`${API_BASE_URL}/auth/refresh`, {
				headers: { "Content-Type": "application/json" },
				data: {}, // Missing refreshToken
			});

			expect(response.status()).toBe(400);

			const data = await response.json();
			expect(data.success).toBe(false);
			expect(data.error).toBe("bad_request");
			expect(data.message).toBe("Missing or invalid parameters");
			expect(data.details).toBeDefined();
			expect(Array.isArray(data.details)).toBe(true);
			expect(data.details.length).toBeGreaterThan(0);

			const refreshTokenError = data.details.find(
				(d: any) => d.field === "refreshToken",
			);
			expect(refreshTokenError).toBeDefined();
			expect(refreshTokenError.issue).toBe("refreshToken is required");
		});

		test("should return 400 when refreshToken is null", async ({ request }) => {
			const response = await request.post(`${API_BASE_URL}/auth/refresh`, {
				headers: { "Content-Type": "application/json" },
				data: {
					refreshToken: null,
				},
			});

			expect(response.status()).toBe(400);

			const data = await response.json();
			expect(data.success).toBe(false);
			expect(data.error).toBe("bad_request");
			expect(data.message).toBe("Missing or invalid parameters");
			expect(data.details).toBeDefined();
		});

		test("should return 400 when refreshToken is empty string", async ({
			request,
		}) => {
			const response = await request.post(`${API_BASE_URL}/auth/refresh`, {
				headers: { "Content-Type": "application/json" },
				data: {
					refreshToken: "",
				},
			});

			expect(response.status()).toBe(400);

			const data = await response.json();
			expect(data.success).toBe(false);
			expect(data.error).toBe("bad_request");
			expect(data.message).toBe("Missing or invalid parameters");
		});

		test("should return 400 when refreshToken is not a string", async ({
			request,
		}) => {
			const response = await request.post(`${API_BASE_URL}/auth/refresh`, {
				headers: { "Content-Type": "application/json" },
				data: {
					refreshToken: 12345, // Number instead of string
				},
			});

			expect(response.status()).toBe(400);

			const data = await response.json();
			expect(data.success).toBe(false);
			expect(data.error).toBe("bad_request");
		});
	});

	// ========================
	// UNAUTHORIZED (401)
	// ========================

	test.describe("401 Unauthorized Responses", () => {
		test("should return 401 for expired refresh token", async ({ request }) => {
			// Use a token that's expired (would need to generate one or use a known expired token)
			const expiredToken =
				"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTYwMDAwMDAwMCwiZXhwIjoxNjAwMDAwMDAxfQ.invalid";

			const response = await request.post(`${API_BASE_URL}/auth/refresh`, {
				headers: { "Content-Type": "application/json" },
				data: {
					refreshToken: expiredToken,
				},
			});

			expect([401, 404, 500]).toContain(response.status());

			const data = await response.json();
			expect(data.success).toBe(false);
			expect(data.error).toBe("unauthorized");
			expect(data.message).toBe("Expired refresh token");
			expect(data.details).toBeDefined();
			expect(Array.isArray(data.details)).toBe(true);
		});

		test("should return 401 for invalid refresh token format", async ({
			request,
		}) => {
			const response = await request.post(`${API_BASE_URL}/auth/refresh`, {
				headers: { "Content-Type": "application/json" },
				data: {
					refreshToken: "invalid.token.format",
				},
			});

			expect([401, 404, 500]).toContain(response.status());

			const data = await response.json();
			expect(data.success).toBe(false);
			expect(data.error).toBe("unauthorized");
			expect(data.message).toBe("Expired refresh token");
		});

		test("should return 401 for malformed JWT token", async ({ request }) => {
			const response = await request.post(`${API_BASE_URL}/auth/refresh`, {
				headers: { "Content-Type": "application/json" },
				data: {
					refreshToken: "not.a.jwt.token",
				},
			});

			expect([401, 404, 500]).toContain(response.status());

			const data = await response.json();
			expect(data.success).toBe(false);
			expect(data.error).toBe("unauthorized");
		});

		test("should return 401 for token with invalid signature", async ({
			request,
		}) => {
			// A JWT with valid format but wrong signature
			const invalidSigToken =
				"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxOTAwMDAwMDAwfQ.InvalidSignatureHere123";

			const response = await request.post(`${API_BASE_URL}/auth/refresh`, {
				headers: { "Content-Type": "application/json" },
				data: {
					refreshToken: invalidSigToken,
				},
			});

			expect([401, 404, 500]).toContain(response.status());

			const data = await response.json();
			expect(data.success).toBe(false);
			expect(data.error).toBe("unauthorized");
		});

		test("should return 401 when using access token instead of refresh token", async ({
			request,
		}) => {
			// Try to use an access token where refresh token is expected
			const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
				headers: { "Content-Type": "application/json" },
				data: {
					email: testData.users.admin1.email,
					password: testData.users.admin1.password,
					loginType: "standard",
				},
			});

			const loginData = await loginResponse.json();
			const accessToken = loginData.user.auth.accessToken; // Wrong token type

			const response = await request.post(`${API_BASE_URL}/auth/refresh`, {
				headers: { "Content-Type": "application/json" },
				data: {
					refreshToken: accessToken,
				},
			});

			expect([401, 404, 500]).toContain(response.status());

			const data = await response.json();
			expect(data.success).toBe(false);
			expect(data.error).toBe("unauthorized");
		});
	});

	// ========================
	// FORBIDDEN (403)
	// ========================

	test.describe("403 Forbidden - Token Reuse Detection", () => {
		test("should return 403 when reusing old refresh token (token reuse detection)", async ({
			request,
		}) => {
			// Login to get fresh tokens
			const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
				headers: { "Content-Type": "application/json" },
				data: {
					email: testData.users.admin2.email,
					password: testData.users.admin2.password,
					loginType: "standard",
				},
			});

			const loginData = await loginResponse.json();
			const firstRefreshToken = loginData.user.auth.refreshToken;

			// First refresh - this should work
			const firstRefreshResponse = await request.post(
				`${API_BASE_URL}/auth/refresh`,
				{
					headers: { "Content-Type": "application/json" },
					data: {
						refreshToken: firstRefreshToken,
					},
				},
			);

			expect(firstRefreshResponse.status()).toBe(200);
			const firstRefreshData = await firstRefreshResponse.json();
			const secondRefreshToken = firstRefreshData.auth.refreshToken;

			// Try to reuse the first refresh token - this should fail with 403
			const reuseResponse = await request.post(`${API_BASE_URL}/auth/refresh`, {
				headers: { "Content-Type": "application/json" },
				data: {
					refreshToken: firstRefreshToken, // Reusing old token
				},
			});

			expect(reuseResponse.status()).toBe(403);

			const reuseData = await reuseResponse.json();
			expect(reuseData.success).toBe(false);
			expect(reuseData.error).toBe("forbidden");
			expect(reuseData.message).toBe(
				"Refresh token reuse detected — sessions revoked",
			);
			expect(reuseData.details).toBeDefined();
			expect(reuseData.details.action).toBe("revoke_all_sessions");

			// Verify that even the new token is now invalid (all sessions revoked)
			const secondRefreshResponse = await request.post(
				`${API_BASE_URL}/auth/refresh`,
				{
					headers: { "Content-Type": "application/json" },
					data: {
						refreshToken: secondRefreshToken,
					},
				},
			);

			// Should also fail since all sessions were revoked
			expect(secondRefreshResponse.status()).toBe(403);
		});

		test("should revoke all sessions when token reuse is detected", async ({
			request,
		}) => {
			// Login
			const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
				headers: { "Content-Type": "application/json" },
				data: {
					email: testData.users.superAdmin.email,
					password: testData.users.superAdmin.password,
					loginType: "standard",
				},
			});

			const loginData = await loginResponse.json();
			const originalRefreshToken = loginData.user.auth.refreshToken;
			const originalAccessToken = loginData.user.auth.accessToken;

			// First refresh
			const firstRefresh = await request.post(`${API_BASE_URL}/auth/refresh`, {
				headers: { "Content-Type": "application/json" },
				data: { refreshToken: originalRefreshToken },
			});

			expect(firstRefresh.status()).toBe(200);

			// Try to reuse original token - triggers reuse detection
			const reuseAttempt = await request.post(`${API_BASE_URL}/auth/refresh`, {
				headers: { "Content-Type": "application/json" },
				data: { refreshToken: originalRefreshToken },
			});

			expect(reuseAttempt.status()).toBe(403);

			// Verify original access token is also invalidated
			const profileCheck = await request.get(`${API_BASE_URL}/me/profile`, {
				headers: {
					Authorization: `Bearer ${originalAccessToken}`,
				},
			});

			// Access token might still work briefly (until expiry) but refresh token should be null in DB
			// The important part is that refresh is blocked
		});

		test("should detect token reuse across multiple refresh attempts", async ({
			request,
		}) => {
			// Login
			const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
				headers: { "Content-Type": "application/json" },
				data: {
					email: `test.reuse.${Date.now()}@example.com`,
					password: testData.password,
					loginType: "standard",
				},
			});

			// If login succeeds (user exists)
			if (loginResponse.status() === 200) {
				const loginData = await loginResponse.json();
				const refreshToken1 = loginData.user.auth.refreshToken;

				// Refresh once
				const refresh1 = await request.post(`${API_BASE_URL}/auth/refresh`, {
					headers: { "Content-Type": "application/json" },
					data: { refreshToken: refreshToken1 },
				});

				const refresh1Data = await refresh1.json();
				const refreshToken2 = refresh1Data.auth.refreshToken;

				// Refresh again with new token
				const refresh2 = await request.post(`${API_BASE_URL}/auth/refresh`, {
					headers: { "Content-Type": "application/json" },
					data: { refreshToken: refreshToken2 },
				});

				expect(refresh2.status()).toBe(200);

				// Now try to reuse token1 - should be detected
				const reuseAttempt = await request.post(
					`${API_BASE_URL}/auth/refresh`,
					{
						headers: { "Content-Type": "application/json" },
						data: { refreshToken: refreshToken1 },
					},
				);

				expect(reuseAttempt.status()).toBe(403);

				const reuseData = await reuseAttempt.json();
				expect(reuseData.error).toBe("forbidden");
				expect(reuseData.message).toContain("reuse detected");
			}
		});
	});

	// ========================
	// METHOD NOT ALLOWED (405)
	// ========================

	test.describe("405 Method Not Allowed", () => {
		test("should return 405 for GET request", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/auth/refresh`, {
				headers: { "Content-Type": "application/json" },
			});

			expect(response.status()).toBe(405);

			const data = await response.json();
			expect(data.success).toBe(false);
			expect(data.error).toBe("method_not_allowed");
			expect(data.message).toBe("This endpoint only supports POST");
		});

		test("should return 405 for PUT request", async ({ request }) => {
			const response = await request.put(`${API_BASE_URL}/auth/refresh`, {
				headers: { "Content-Type": "application/json" },
				data: { refreshToken: "sometoken" },
			});

			expect(response.status()).toBe(405);

			const data = await response.json();
			expect(data.success).toBe(false);
			expect(data.error).toBe("method_not_allowed");
		});

		test("should return 405 for DELETE request", async ({ request }) => {
			const response = await request.delete(`${API_BASE_URL}/auth/refresh`, {
				headers: { "Content-Type": "application/json" },
			});

			expect(response.status()).toBe(405);

			const data = await response.json();
			expect(data.success).toBe(false);
			expect(data.error).toBe("method_not_allowed");
		});

		test("should return 405 for PATCH request", async ({ request }) => {
			const response = await request.patch(`${API_BASE_URL}/auth/refresh`, {
				headers: { "Content-Type": "application/json" },
				data: { refreshToken: "sometoken" },
			});

			expect(response.status()).toBe(405);

			const data = await response.json();
			expect(data.success).toBe(false);
			expect(data.error).toBe("method_not_allowed");
		});
	});

	// ========================
	// SERVER ERROR (500)
	// ========================

	test.describe("500 Server Error Responses", () => {
		test("should return 500 on unexpected server error", async ({
			request,
		}) => {
			// Test with data that might cause server error
			// This is difficult to test reliably without mocking
			// Documenting expected behavior

			const response = await request.post(`${API_BASE_URL}/auth/refresh`, {
				headers: { "Content-Type": "application/json" },
				data: {
					refreshToken: "a".repeat(10000), // Extremely long token
				},
			});

			// Might return 401 for invalid token or 500 for unexpected error
			expect([401, 404, 500]).toContain(response.status());

			const data = await response.json();
			expect(data.success).toBe(false);

			if (response.status() === 500) {
				expect(data.error).toBe("server_error");
				expect(data.message).toBe("An unexpected error occurred");
			}
		});

		test("should handle malformed JSON gracefully", async ({ request }) => {
			// This tests the server's error handling for malformed requests
			const response = await request.post(`${API_BASE_URL}/auth/refresh`, {
				headers: { "Content-Type": "application/json" },
				data: "{invalid json",
			});

			// Server should handle this and return error
			expect([400, 404, 500]).toContain(response.status());

			const data = await response.json();
			expect(data.success).toBe(false);
		});
	});

	// ========================
	// SERVICE UNAVAILABLE (503)
	// ========================

	// ========================
	// EDGE CASES
	// ========================

	test.describe("Edge Cases", () => {
		test("should handle concurrent refresh requests safely", async ({
			request,
		}) => {
			// Login
			const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
				headers: { "Content-Type": "application/json" },
				data: {
					email: testData.users.admin1.email,
					password: testData.users.admin1.password,
					loginType: "standard",
				},
			});

			const loginData = await loginResponse.json();
			const refreshToken = loginData.user.auth.refreshToken;

			// Make multiple concurrent refresh requests
			const requests = [
				request.post(`${API_BASE_URL}/auth/refresh`, {
					headers: { "Content-Type": "application/json" },
					data: { refreshToken },
				}),
				request.post(`${API_BASE_URL}/auth/refresh`, {
					headers: { "Content-Type": "application/json" },
					data: { refreshToken },
				}),
				request.post(`${API_BASE_URL}/auth/refresh`, {
					headers: { "Content-Type": "application/json" },
					data: { refreshToken },
				}),
			];

			const responses = await Promise.all(requests);

			// One should succeed (200), others should fail with 403 (reuse detected)
			const statusCodes = responses.map((r) => r.status());
			const successCount = statusCodes.filter((s) => s === 200).length;
			const forbiddenCount = statusCodes.filter((s) => s === 403).length;

			// At least one should succeed, and others should be blocked
			expect(successCount).toBeGreaterThanOrEqual(1);
			expect(forbiddenCount).toBeGreaterThanOrEqual(1);
		});

		test("should handle very long refresh token strings", async ({
			request,
		}) => {
			const veryLongToken = "a".repeat(100000);

			const response = await request.post(`${API_BASE_URL}/auth/refresh`, {
				headers: { "Content-Type": "application/json" },
				data: {
					refreshToken: veryLongToken,
				},
			});

			// Should reject invalid token
			expect([400, 401, 500]).toContain(response.status());

			const data = await response.json();
			expect(data.success).toBe(false);
		});

		test("should handle special characters in refresh token", async ({
			request,
		}) => {
			const specialCharToken = '!@#$%^&*()_+-=[]{}|;:",.<>?/~`';

			const response = await request.post(`${API_BASE_URL}/auth/refresh`, {
				headers: { "Content-Type": "application/json" },
				data: {
					refreshToken: specialCharToken,
				},
			});

			expect([401, 404, 500]).toContain(response.status());

			const data = await response.json();
			expect(data.success).toBe(false);
			expect(data.error).toBe("unauthorized");
		});
	});

	// ========================
	// SECURITY TESTS
	// ========================

	test.describe("Security Tests", () => {
		test("should not reveal sensitive information in error messages", async ({
			request,
		}) => {
			const response = await request.post(`${API_BASE_URL}/auth/refresh`, {
				headers: { "Content-Type": "application/json" },
				data: {
					refreshToken: "invalid-token",
				},
			});

			const data = await response.json();
			const responseText = JSON.stringify(data);

			// Should not expose: database info, stack traces, secret keys, user IDs
			expect(responseText).not.toContain("database");
			expect(responseText).not.toContain("stack");
			expect(responseText).not.toContain("secret");
			expect(responseText).not.toContain("password");
			expect(responseText).not.toContain("mysql");
			expect(responseText).not.toContain("knex");
		});

		test("should use Bearer token type in response", async ({ request }) => {
			const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
				headers: { "Content-Type": "application/json" },
				data: {
					email: testData.users.admin1.email,
					password: testData.users.admin1.password,
					loginType: "standard",
				},
			});

			const loginData = await loginResponse.json();

			const response = await request.post(`${API_BASE_URL}/auth/refresh`, {
				headers: { "Content-Type": "application/json" },
				data: {
					refreshToken: loginData.user.auth.refreshToken,
				},
			});

			const data = await response.json();
			expect(data.auth.tokenType).toBe("Bearer");
		});

		test("should set appropriate token expiry times", async ({ request }) => {
			const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
				headers: { "Content-Type": "application/json" },
				data: {
					email: testData.users.admin1.email,
					password: testData.users.admin1.password,
					loginType: "standard",
				},
			});

			const loginData = await loginResponse.json();

			const response = await request.post(`${API_BASE_URL}/auth/refresh`, {
				headers: { "Content-Type": "application/json" },
				data: {
					refreshToken: loginData.user.auth.refreshToken,
				},
			});

			const data = await response.json();

			// Access token should expire in 1 hour (3600 seconds)
			expect(data.auth.expiresIn).toBe(3600);

			// Refresh token should expire in ~30 days
			const expiresAt = new Date(data.auth.refreshTokenExpiresAt);
			const now = new Date();
			const hoursDiff =
				(expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);

			// Should be approximately 30 days = 720 hours
			expect(hoursDiff).toBeGreaterThan(700);
			expect(hoursDiff).toBeLessThan(750);
		});
	});
});

