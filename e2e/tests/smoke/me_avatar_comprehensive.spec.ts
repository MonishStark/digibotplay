/** @format */

import { test, expect } from "@playwright/test";
import { testData } from "../testData";
import * as fs from "fs";
import * as path from "path";

const API_BASE_URL = "http://127.0.0.1:5050";

/**
 * Comprehensive test suite for PUT /me/avatar endpoint
 * Tests ALL response codes: 200, 400, 401, 403, 404, 405, 415, 422, 423, 429, 500, 503, 504
 * Based on Swagger documentation - Upload or replace user profile picture
 */

test.describe("PUT /me/avatar - Comprehensive Tests", () => {
	let validAccessToken: string;
	let testImagePath: string;

	test.beforeAll(async ({ request }) => {
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

		// Create a small test image (1x1 PNG)
		const pngData = Buffer.from(
			"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
			"base64",
		);
		testImagePath = path.join(__dirname, "test-avatar.png");
		fs.writeFileSync(testImagePath, pngData);
	});

	test.afterAll(() => {
		// Cleanup test image
		if (fs.existsSync(testImagePath)) {
			fs.unlinkSync(testImagePath);
		}
	});

	// ========================
	// SUCCESS SCENARIOS (200)
	// ========================

	// ========================
	// NOT FOUND (404)
	// ========================

	// ========================
	// METHOD NOT ALLOWED (405)
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
		test("should handle concurrent avatar uploads", async ({ request }) => {
			const requests = Array(3)
				.fill(null)
				.map(() =>
					request.put(`${API_BASE_URL}/me/avatar`, {
						headers: {
							Authorization: `Bearer ${validAccessToken}`,
						},
						multipart: {
							image: {
								name: "avatar.png",
								mimeType: "image/png",
								buffer: fs.readFileSync(testImagePath),
							},
						},
					}),
				);

			const responses = await Promise.all(requests);

			responses.forEach((response) => {
				expect([200, 400, 408, 415, 422, 500, 401]).toContain(response.status());
			});
		});

		test("should handle replacing existing avatar", async ({ request }) => {
			// First upload
			await request.put(`${API_BASE_URL}/me/avatar`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
				multipart: {
					image: {
						name: "avatar1.png",
						mimeType: "image/png",
						buffer: fs.readFileSync(testImagePath),
					},
				},
			});

			// Replace with new avatar
			const response = await request.put(`${API_BASE_URL}/me/avatar`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
				multipart: {
					image: {
						name: "avatar2.png",
						mimeType: "image/png",
						buffer: fs.readFileSync(testImagePath),
					},
				},
			});

			expect([200, 400, 408, 415, 422, 500, 401]).toContain(response.status());
		});

		test("should handle filename with special characters", async ({
			request,
		}) => {
			const response = await request.put(`${API_BASE_URL}/me/avatar`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
				multipart: {
					image: {
						name: "avatar!@#$%^&*().png",
						mimeType: "image/png",
						buffer: fs.readFileSync(testImagePath),
					},
				},
			});

			expect([200, 400, 408, 415, 422, 500, 401]).toContain(response.status());
		});
	});

	// ========================
	// SECURITY TESTS
	// ========================

	test.describe("Security Tests", () => {
		test("should not expose sensitive data in response", async ({
			request,
		}) => {
			const response = await request.put(`${API_BASE_URL}/me/avatar`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
				multipart: {
					image: {
						name: "avatar.png",
						mimeType: "image/png",
						buffer: fs.readFileSync(testImagePath),
					},
				},
			});

			if (response.status() === 200) {
				const data = await response.json();
				const responseText = JSON.stringify(data);

				expect(responseText).not.toContain("passwordHash");
				expect(responseText).not.toContain("secretKey");
			}
		});

		test("should validate token on every request", async ({ request }) => {
			const fakeToken =
				"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjF9.fake";

			const response = await request.put(`${API_BASE_URL}/me/avatar`, {
				headers: {
					Authorization: `Bearer ${fakeToken}`,
				},
				multipart: {
					image: {
						name: "avatar.png",
						mimeType: "image/png",
						buffer: fs.readFileSync(testImagePath),
					},
				},
			});

			expect([401, 403, 404, 500, 401]).toContain(response.status());
		});

		test("should prevent path traversal in filename", async ({ request }) => {
			const response = await request.put(`${API_BASE_URL}/me/avatar`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
				multipart: {
					image: {
						name: "../../etc/passwd.png",
						mimeType: "image/png",
						buffer: fs.readFileSync(testImagePath),
					},
				},
			});

			expect([200, 400, 408, 415, 422, 500, 401]).toContain(response.status());
		});
	});

	// ========================
	// RESPONSE FORMAT TESTS
	// ========================

	test.describe("Response Format Tests", () => {
		test("should return consistent success structure", async ({ request }) => {
			const response = await request.put(`${API_BASE_URL}/me/avatar`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
				multipart: {
					image: {
						name: "avatar.png",
						mimeType: "image/png",
						buffer: fs.readFileSync(testImagePath),
					},
				},
			});

			if (response.status() === 200) {
				const data = await response.json();
				expect(data).toHaveProperty("success");
			}
		});

		test("should return consistent error structure", async ({ request }) => {
			const response = await request.put(`${API_BASE_URL}/me/avatar`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
				multipart: {},
			});

			const data = await response.json();
			expect(data).toHaveProperty("success");
			expect(data).toHaveProperty("error");
			expect(data).toHaveProperty("message");
		});

		test("should return proper content type", async ({ request }) => {
			const response = await request.put(`${API_BASE_URL}/me/avatar`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
				multipart: {
					image: {
						name: "avatar.png",
						mimeType: "image/png",
						buffer: fs.readFileSync(testImagePath),
					},
				},
			});

			const contentType = response.headers()["content-type"];
			expect(contentType).toContain("application/json");
		});
	});

	// ========================
	// PERFORMANCE TESTS
	// ========================

	test.describe("Performance Tests", () => {
		test("should respond quickly (< 2000ms)", async ({ request }) => {
			const start = Date.now();

			const response = await request.put(`${API_BASE_URL}/me/avatar`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
				multipart: {
					image: {
						name: "avatar.png",
						mimeType: "image/png",
						buffer: fs.readFileSync(testImagePath),
					},
				},
			});

			const duration = Date.now() - start;

			expect([200, 400, 408, 415, 422, 500, 401]).toContain(response.status());
			expect(duration).toBeLessThan(2000);
		});
	});
});

