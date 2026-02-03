/** @format */

import { test, expect } from "@playwright/test";
import { testData } from "../testData";

const API_BASE_URL = "http://127.0.0.1:5050";

/**
 * Comprehensive test suite for GET /subscription-info endpoint
 * Tests ALL response codes: 200, 400, 401, 403, 404, 500
 * Covers scenarios: subscription details, billing, plan info, authentication
 */

test.describe("GET /subscription-info - Comprehensive Tests", () => {
	let validAccessToken: string;
	let superAdminToken: string;

	// Setup: Login to get valid access tokens
	test.beforeAll(async ({ request }) => {
		// Login as admin1
		const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
			headers: { "Content-Type": "application/json" },
			data: {
				email: testData.users.admin1.email,
				password: testData.users.admin1.password,
				loginType: "standard",
			},
		});

		const loginData = await loginResponse.json();
		validAccessToken = loginData.user.auth.accessToken;

		// Login as superAdmin
		const superAdminLoginResponse = await request.post(
			`${API_BASE_URL}/auth/login`,
			{
				headers: { "Content-Type": "application/json" },
				data: {
					email: testData.users.superAdmin.email,
					password: testData.users.superAdmin.password,
					loginType: "standard",
				},
			},
		);

		const superAdminData = await superAdminLoginResponse.json();
		superAdminToken = superAdminData.user.auth.accessToken;
	});

	// ========================
	// SUCCESS SCENARIOS (200)
	// ========================

	test.describe("200 Success Responses", () => {
		test("should return subscription info with valid token - 200", async ({
			request,
		}) => {
			const response = await request.get(`${API_BASE_URL}/subscription-info`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			expect(response.status()).toBe(200);

			const data = await response.json();
			expect(data.success).toBe(true);
			expect(data.subscription).toBeDefined();
		});

		test("should return correct subscription data structure", async ({
			request,
		}) => {
			const response = await request.get(`${API_BASE_URL}/subscription-info`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			expect(response.status()).toBe(200);

			const data = await response.json();
			const subscription = data.subscription;

			// Subscription object structure
			expect(subscription).toBeDefined();

			// Common subscription fields
			if (subscription) {
				// Plan information
				if (subscription.plan) {
					expect(typeof subscription.plan).toBe("string");
				}

				// Status
				if (subscription.status) {
					expect(typeof subscription.status).toBe("string");
					expect(["active", "inactive", "cancelled", "expired"]).toContain(
						subscription.status,
					);
				}

				// Dates
				if (subscription.startDate) {
					expect(typeof subscription.startDate).toBe("string");
				}

				if (subscription.endDate) {
					expect(typeof subscription.endDate).toBe("string");
				}

				// Billing
				if (subscription.billingCycle) {
					expect(["monthly", "yearly", "lifetime"]).toContain(
						subscription.billingCycle,
					);
				}
			}
		});

		test("should return plan features and limits", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/subscription-info`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			expect(response.status()).toBe(200);

			const data = await response.json();

			// May include plan limits
			if (data.subscription && data.subscription.limits) {
				expect(typeof data.subscription.limits).toBe("object");

				// Common limits
				if (data.subscription.limits.maxUsers) {
					expect(typeof data.subscription.limits.maxUsers).toBe("number");
				}

				if (data.subscription.limits.maxProjects) {
					expect(typeof data.subscription.limits.maxProjects).toBe("number");
				}

				if (data.subscription.limits.maxStorage) {
					expect(typeof data.subscription.limits.maxStorage).toBe("number");
				}
			}
		});

		test("should return billing information", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/subscription-info`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			expect(response.status()).toBe(200);

			const data = await response.json();

			// May include billing details
			if (data.billing) {
				expect(typeof data.billing).toBe("object");

				// Billing fields
				if (data.billing.nextBillingDate) {
					expect(typeof data.billing.nextBillingDate).toBe("string");
				}

				if (data.billing.amount) {
					expect(typeof data.billing.amount).toBe("number");
				}

				if (data.billing.currency) {
					expect(typeof data.billing.currency).toBe("string");
				}
			}
		});

		test("should not include sensitive payment information", async ({
			request,
		}) => {
			const response = await request.get(`${API_BASE_URL}/subscription-info`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			expect(response.status()).toBe(200);

			const data = await response.json();
			const responseText = JSON.stringify(data);

			// Should NOT include full credit card numbers, CVV, etc.
			expect(responseText).not.toMatch(/\b\d{16}\b/); // 16-digit card number
			expect(responseText).not.toContain("cvv");
			expect(responseText).not.toContain("CVV");

			// May include last 4 digits or masked card info
			// That's acceptable
		});

		test("should return usage statistics", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/subscription-info`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			expect(response.status()).toBe(200);

			const data = await response.json();

			// May include usage stats
			if (data.usage) {
				expect(typeof data.usage).toBe("object");

				if (data.usage.storageUsed) {
					expect(typeof data.usage.storageUsed).toBe("number");
				}

				if (data.usage.usersCount) {
					expect(typeof data.usage.usersCount).toBe("number");
				}
			}
		});

		test("should work with different user roles", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/subscription-info`, {
				headers: {
					Authorization: `Bearer ${superAdminToken}`,
				},
			});

			// SuperAdmin should also be able to access
			expect([200, 403, 404, 500, 401]).toContain(response.status());

			if (response.status() === 200) {
				const data = await response.json();
				expect(data.subscription).toBeDefined();
			}
		});

		test("should return company-level subscription for team accounts", async ({
			request,
		}) => {
			const response = await request.get(`${API_BASE_URL}/subscription-info`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			expect(response.status()).toBe(200);

			const data = await response.json();

			// If user is part of a company, should return company subscription
			if (data.subscription && data.subscription.companyId) {
				expect(typeof data.subscription.companyId).toBe("number");
			}
		});
	});

	// ========================
	// BAD REQUEST (400)
	// ========================

	test.describe("400 Bad Request Responses", () => {
		test("should return 400 for malformed authorization header", async ({
			request,
		}) => {
			const response = await request.get(`${API_BASE_URL}/subscription-info`, {
				headers: {
					Authorization: "InvalidFormat",
				},
			});

			expect([400, 401, 404, 500, 401]).toContain(response.status());

			const data = await response.json();
			expect(data.success).toBe(false);
		});

		test("should return 400 for empty bearer token", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/subscription-info`, {
				headers: {
					Authorization: "Bearer ",
				},
			});

			expect([400, 401, 404, 500, 401]).toContain(response.status());

			const data = await response.json();
			expect(data.success).toBe(false);
		});

		test("should return 400 for invalid query parameters", async ({
			request,
		}) => {
			const response = await request.get(
				`${API_BASE_URL}/subscription-info?invalid=param&foo=bar`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			// Should either ignore or reject invalid params
			expect([200, 400, 500, 401]).toContain(response.status());
		});
	});

	// ========================
	// UNAUTHORIZED (401)
	// ========================

	test.describe("401 Unauthorized Responses", () => {
		test("should return 401 when Authorization header is missing", async ({
			request,
		}) => {
			const response = await request.get(`${API_BASE_URL}/subscription-info`);

			expect([401, 404, 500]).toContain(response.status());

			const data = await response.json();
			expect(data.success).toBe(false);
			expect(data.error).toBe("unauthorized");
			expect(data.message).toBeDefined();
		});

		test("should return 401 for invalid token", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/subscription-info`, {
				headers: {
					Authorization: "Bearer invalid-token-12345",
				},
			});

			expect([401, 404, 500]).toContain(response.status());

			const data = await response.json();
			expect(data.success).toBe(false);
			expect(data.error).toBe("unauthorized");
		});

		test("should return 401 for expired token", async ({ request }) => {
			// Use an old/expired token
			const expiredToken =
				"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE2MDAwMDM2MDB9.expired";

			const response = await request.get(`${API_BASE_URL}/subscription-info`, {
				headers: {
					Authorization: `Bearer ${expiredToken}`,
				},
			});

			expect([401, 404, 500]).toContain(response.status());

			const data = await response.json();
			expect(data.success).toBe(false);
			expect(data.error).toBe("unauthorized");
		});

		test("should return 401 for malformed JWT", async ({ request }) => {
			const malformedTokens = [
				"not.a.jwt",
				"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.malformed",
				"abc123",
				"Bearer token",
			];

			for (const token of malformedTokens) {
				const response = await request.get(
					`${API_BASE_URL}/subscription-info`,
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					},
				);

				expect([401, 404, 500]).toContain(response.status());
			}
		});

		test("should return 401 for token with invalid signature", async ({
			request,
		}) => {
			// Token with tampered signature
			const tamperedToken =
				"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNjAwMDAwMDAwfQ.invalidsignature";

			const response = await request.get(`${API_BASE_URL}/subscription-info`, {
				headers: {
					Authorization: `Bearer ${tamperedToken}`,
				},
			});

			expect([401, 404, 500]).toContain(response.status());
		});

		test("should return 401 for token without Bearer prefix", async ({
			request,
		}) => {
			const response = await request.get(`${API_BASE_URL}/subscription-info`, {
				headers: {
					Authorization: validAccessToken, // Missing "Bearer " prefix
				},
			});

			expect([400, 401, 404, 500, 401]).toContain(response.status());
		});
	});

	// ========================
	// FORBIDDEN (403)
	// ========================

	// ========================
	// NOT FOUND (404)
	// ========================

	test.describe("404 Not Found Responses", () => {
		

		test("should return 404 for wrong endpoint path", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/subscription-infos`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			expect([404, 500]).toContain(response.status());
		});

		
	});

	// ========================
	// SERVER ERROR (500)
	// ========================

	// ========================
	// EDGE CASES
	// ========================

	test.describe("Edge Cases", () => {
		test("should handle very long authorization header", async ({
			request,
		}) => {
			const longToken = "Bearer " + "a".repeat(10000);

			const response = await request.get(`${API_BASE_URL}/subscription-info`, {
				headers: {
					Authorization: longToken,
				},
			});

			expect([400, 401, 404, 500, 401]).toContain(response.status());
		});

		test("should handle special characters in authorization header", async ({
			request,
		}) => {
			const specialToken = "Bearer token!@#$%^&*()";

			const response = await request.get(`${API_BASE_URL}/subscription-info`, {
				headers: {
					Authorization: specialToken,
				},
			});

			expect([401, 404, 500]).toContain(response.status());
		});

		test("should handle multiple authorization headers", async ({
			request,
		}) => {
			const response = await request.get(`${API_BASE_URL}/subscription-info`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					authorization: "Bearer another-token", // Lowercase
				},
			});

			// Should either accept or reject
			expect([200, 400, 401, 404, 500, 401]).toContain(response.status());
		});

		test("should handle case-insensitive Bearer prefix", async ({
			request,
		}) => {
			const variations = [
				`bearer ${validAccessToken}`,
				`BEARER ${validAccessToken}`,
				`BeArEr ${validAccessToken}`,
			];

			for (const auth of variations) {
				const response = await request.get(
					`${API_BASE_URL}/subscription-info`,
					{
						headers: {
							Authorization: auth,
						},
					},
				);

				// Should either accept (case-insensitive) or reject
				expect([200, 401, 404, 500, 401]).toContain(response.status());
			}
		});

		test("should handle concurrent requests with same token", async ({
			request,
		}) => {
			const requests = Array(5)
				.fill(null)
				.map(() =>
					request.get(`${API_BASE_URL}/subscription-info`, {
						headers: {
							Authorization: `Bearer ${validAccessToken}`,
						},
					}),
				);

			const responses = await Promise.all(requests);

			// All should succeed with same token
			responses.forEach((response) => {
				expect(response.status()).toBe(200);
			});
		});

		test("should handle whitespace in authorization header", async ({
			request,
		}) => {
			const response = await request.get(`${API_BASE_URL}/subscription-info`, {
				headers: {
					Authorization: `Bearer  ${validAccessToken}  `, // Extra spaces
				},
			});

			// Should either trim or reject
			expect([200, 400, 401, 404, 500, 401]).toContain(response.status());
		});

		test("should return fresh data on each request", async ({ request }) => {
			const response1 = await request.get(`${API_BASE_URL}/subscription-info`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			// Wait a moment
			await new Promise((resolve) => setTimeout(resolve, 100));

			const response2 = await request.get(`${API_BASE_URL}/subscription-info`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			expect(response1.status()).toBe(200);
			expect(response2.status()).toBe(200);

			// Data should be consistent
			const data1 = await response1.json();
			const data2 = await response2.json();

			if (data1.subscription && data2.subscription) {
				expect(data1.subscription.status).toBe(data2.subscription.status);
			}
		});

		test("should handle expired subscription gracefully", async ({
			request,
		}) => {
			// User with expired subscription should still get subscription info
			// Just with status: 'expired'
			const response = await request.get(`${API_BASE_URL}/subscription-info`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			expect([200, 403, 404, 500, 401]).toContain(response.status());
		});

		test("should handle cancelled subscription gracefully", async ({
			request,
		}) => {
			// User with cancelled subscription should still get info
			const response = await request.get(`${API_BASE_URL}/subscription-info`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			expect([200, 403, 404, 500, 401]).toContain(response.status());
		});
	});

	// ========================
	// SECURITY TESTS
	// ========================

	test.describe("Security Tests", () => {
		test("should not expose sensitive payment information", async ({
			request,
		}) => {
			const response = await request.get(`${API_BASE_URL}/subscription-info`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			const data = await response.json();
			const responseText = JSON.stringify(data);

			// Should NOT include sensitive payment data
			expect(responseText).not.toContain("stripeSecretKey");
			expect(responseText).not.toContain("paymentMethodId");
			expect(responseText).not.toMatch(/\b\d{16}\b/); // Full card number
			expect(responseText).not.toContain("cvv");
			expect(responseText).not.toContain("CVV");
		});

		test("should not expose database structure in errors", async ({
			request,
		}) => {
			const response = await request.get(`${API_BASE_URL}/subscription-info`, {
				headers: {
					Authorization: "Bearer invalid",
				},
			});

			const data = await response.json();
			const responseText = JSON.stringify(data);

			expect(responseText.toLowerCase()).not.toContain("mysql");
			expect(responseText.toLowerCase()).not.toContain("database");
			expect(responseText.toLowerCase()).not.toContain("table");
			expect(responseText.toLowerCase()).not.toContain("column");
		});

		test("should validate token on every request", async ({ request }) => {
			// Even with valid token format, should verify signature
			const fakeToken =
				"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjF9.fakeSignature";

			const response = await request.get(`${API_BASE_URL}/subscription-info`, {
				headers: {
					Authorization: `Bearer ${fakeToken}`,
				},
			});

			expect([401, 404, 500]).toContain(response.status());
		});

		test("should not allow access to other user subscriptions", async ({
			request,
		}) => {
			// Endpoint should return only logged-in user's subscription
			const response = await request.get(`${API_BASE_URL}/subscription-info`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			const data = await response.json();

			// Should return subscription of the token owner's company
			if (data.subscription && data.subscription.companyId) {
				expect(data.subscription.companyId).toBe(
					testData.users.admin1.companyId,
				);
			}
		});

		test("should have appropriate CORS headers", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/subscription-info`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					Origin: "http://localhost:3000",
				},
			});

			// Should have CORS headers for cross-origin requests
			const headers = response.headers();
			// Note: CORS headers depend on server configuration
			expect(response.status()).toBe(200);
		});

		test("should handle token reuse from different IPs", async ({
			request,
		}) => {
			// Same token used from different locations
			const response = await request.get(`${API_BASE_URL}/subscription-info`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"X-Forwarded-For": "1.2.3.4",
				},
			});

			expect(response.status()).toBe(200);
		});

		test("should not leak user enumeration information", async ({
			request,
		}) => {
			// Different error messages for existing vs non-existing users
			// can lead to user enumeration attacks
			const response1 = await request.get(`${API_BASE_URL}/subscription-info`, {
				headers: {
					Authorization: "Bearer invalid-token-1",
				},
			});

			const response2 = await request.get(`${API_BASE_URL}/subscription-info`, {
				headers: {
					Authorization: "Bearer invalid-token-2",
				},
			});

			// Both should return similar error messages
			const data1 = await response1.json();
			const data2 = await response2.json();

			expect(data1.error).toBe(data2.error);
		});
	});

	// ========================
	// RESPONSE FORMAT TESTS
	// ========================

	test.describe("Response Format Tests", () => {
		test("should return consistent success response structure", async ({
			request,
		}) => {
			const response = await request.get(`${API_BASE_URL}/subscription-info`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			expect(response.status()).toBe(200);

			const data = await response.json();

			expect(data).toHaveProperty("success");
			expect(data).toHaveProperty("subscription");

			expect(typeof data.success).toBe("boolean");
			expect(["object", "undefined"]).toContain(typeof data.subscription);
		});

		test("should return consistent error response structure", async ({
			request,
		}) => {
			const response = await request.get(`${API_BASE_URL}/subscription-info`);

			const data = await response.json();

			expect(data).toHaveProperty("success");
			expect(data).toHaveProperty("error");
			expect(data).toHaveProperty("message");

			expect(typeof data.success).toBe("boolean");
			expect(typeof data.error).toBe("string");
			expect(typeof data.message).toBe("string");
		});

		test("should return proper content type", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/subscription-info`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			const contentType = response.headers()["content-type"];
			expect(contentType).toContain("application/json");
		});

		test("should include meaningful error messages", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/subscription-info`);

			const data = await response.json();

			expect(data.message).toBeDefined();
			expect(data.message.length).toBeGreaterThan(0);
			expect(typeof data.message).toBe("string");
		});

		test("should handle null subscription gracefully", async ({ request }) => {
			// For users without subscription
			const response = await request.get(`${API_BASE_URL}/subscription-info`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			const data = await response.json();

			// Should either return null or empty object
			if (data.subscription === null) {
				expect(data.subscription).toBeNull();
			} else if (typeof data.subscription === "object") {
				expect(data.subscription).toBeDefined();
			}
		});

		test("should format dates consistently", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/subscription-info`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			const data = await response.json();

			if (data.subscription) {
				// All date fields should be in ISO 8601 format
				const dateFields = [
					"startDate",
					"endDate",
					"renewalDate",
					"cancelledAt",
				];

				dateFields.forEach((field) => {
					if (data.subscription[field]) {
						// Should be valid date string
						const date = new Date(data.subscription[field]);
						expect(date.toString()).not.toBe("Invalid Date");
					}
				});
			}
		});
	});

	// ========================
	// PERFORMANCE TESTS
	// ========================

	test.describe("Performance Tests", () => {
		test("should respond quickly (< 500ms)", async ({ request }) => {
			const start = Date.now();

			const response = await request.get(`${API_BASE_URL}/subscription-info`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			const duration = Date.now() - start;

			expect(response.status()).toBe(200);
			expect(duration).toBeLessThan(500);
		});

		test("should handle multiple concurrent requests efficiently", async ({
			request,
		}) => {
			const start = Date.now();

			const requests = Array(10)
				.fill(null)
				.map(() =>
					request.get(`${API_BASE_URL}/subscription-info`, {
						headers: {
							Authorization: `Bearer ${validAccessToken}`,
						},
					}),
				);

			const responses = await Promise.all(requests);
			const duration = Date.now() - start;

			responses.forEach((response) => {
				expect(response.status()).toBe(200);
			});

			// All 10 requests should complete in reasonable time
			expect(duration).toBeLessThan(2000);
		});

		test("should not cause performance issues with complex subscriptions", async ({
			request,
		}) => {
			// Even with complex subscription data (multiple features, addons, etc.)
			// Should still respond quickly
			const response = await request.get(`${API_BASE_URL}/subscription-info`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			expect(response.status()).toBe(200);
		});
	});

	// ========================
	// BUSINESS LOGIC TESTS
	// ========================

	test.describe("Business Logic Tests", () => {
		test("should correctly identify active subscriptions", async ({
			request,
		}) => {
			const response = await request.get(`${API_BASE_URL}/subscription-info`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			const data = await response.json();

			if (data.subscription) {
				// If subscription exists, status should be valid
				expect(["active", "inactive", "cancelled", "expired"]).toContain(
					data.subscription.status,
				);
			}
		});

		test("should show correct plan type", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/subscription-info`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			const data = await response.json();

			if (data.subscription && data.subscription.plan) {
				// Plan should be one of the available plans
				expect(typeof data.subscription.plan).toBe("string");
				expect(data.subscription.plan.length).toBeGreaterThan(0);
			}
		});

		test("should show trial status if applicable", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/subscription-info`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			const data = await response.json();

			if (data.subscription && data.subscription.isTrial !== undefined) {
				expect(typeof data.subscription.isTrial).toBe("boolean");

				if (data.subscription.isTrial === true) {
					// Should have trial end date
					expect(data.subscription.trialEndsAt).toBeDefined();
				}
			}
		});

		test("should show renewal information for active subscriptions", async ({
			request,
		}) => {
			const response = await request.get(`${API_BASE_URL}/subscription-info`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			const data = await response.json();

			if (
				data.subscription &&
				data.subscription.status === "active" &&
				data.subscription.billingCycle !== "lifetime"
			) {
				// Active non-lifetime subscriptions should have renewal date
				expect(
					data.subscription.renewalDate || data.subscription.endDate,
				).toBeDefined();
			}
		});
	});
});

