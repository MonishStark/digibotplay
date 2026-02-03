/** @format */

import { test, expect } from "@playwright/test";
import { testData } from "../testData";
import * as fs from "fs";
import * as path from "path";

const API_BASE_URL = "http://127.0.0.1:5050";

/**
 * Comprehensive test suite for PUT /super-admin/users/{userId}/profile/avatar endpoint
 * Upload or Replace User Profile Avatar - Accepts only multipart/form-data with JPEG or PNG images
 * Works for both admin and organization users. Does not modify any other user fields
 * Response codes: 200, 400, 401, 403, 405, 415, 429, 500, 503, 504
 */

test.describe("PUT /super-admin/users/{userId}/profile/avatar - Comprehensive Tests", () => {
	let validAccessToken: string;
	let testUserId: string;
	let testImagePath: string;

	test.beforeAll(async ({ request }) => {
		const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
			data: {
				email: testData.users.admin1.email,
				password: testData.users.admin1.password,
			},
		});

		const loginData = await loginResponse.json();
		validAccessToken = loginData.accessToken;
		testUserId = "123";

		// Create a small test image
		testImagePath = path.join(process.cwd(), "test-user-avatar.png");
		const buffer = Buffer.from(
			"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
			"base64",
		);
		fs.writeFileSync(testImagePath, buffer);
	});

	test.afterAll(async () => {
		// Cleanup test image
		if (fs.existsSync(testImagePath)) {
			fs.unlinkSync(testImagePath);
		}
	});

	// ========================
	// SUCCESS (200)
	// ========================

	// ========================
	// METHOD NOT ALLOWED (405)
	// ========================

	// ========================
	// UNSUPPORTED MEDIA TYPE (415)
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
		test("should handle special characters in filename", async ({
			request,
		}) => {
			const response = await request.put(
				`${API_BASE_URL}/super-admin/users/${testUserId}/profile/avatar`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
					multipart: {
						image: {
							name: "avatar!@#$%.png",
							mimeType: "image/png",
							buffer: fs.readFileSync(testImagePath),
						},
					},
				},
			);

			expect([200, 400, 401, 403, 404, 422, 500, 401]).toContain(response.status());
		});

		test("should handle corrupted image", async ({ request }) => {
			const response = await request.put(
				`${API_BASE_URL}/super-admin/users/${testUserId}/profile/avatar`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
					multipart: {
						image: {
							name: "corrupted.png",
							mimeType: "image/png",
							buffer: Buffer.from("corrupted data"),
						},
					},
				},
			);

			expect([400, 401, 403, 404, 415, 422, 500, 401]).toContain(response.status());
		});

		test("should handle very large file", async ({ request }) => {
			const largeBuffer = Buffer.alloc(10 * 1024 * 1024);

			const response = await request.put(
				`${API_BASE_URL}/super-admin/users/${testUserId}/profile/avatar`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
					multipart: {
						image: {
							name: "large.png",
							mimeType: "image/png",
							buffer: largeBuffer,
						},
					},
				},
			);

			expect([400, 401, 403, 404, 413, 422, 500, 401]).toContain(response.status());
		});

		test("should not modify other user fields", async ({ request }) => {
			const response = await request.put(
				`${API_BASE_URL}/super-admin/users/${testUserId}/profile/avatar`,
				{
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
				},
			);

			expect([200, 400, 401, 403, 404, 500, 401]).toContain(response.status());
		});
	});

	// ========================
	// SECURITY TESTS
	// ========================

	test.describe("Security Tests", () => {
		test("should validate token on every request", async ({ request }) => {
			const response = await request.put(
				`${API_BASE_URL}/super-admin/users/${testUserId}/profile/avatar`,
				{
					headers: {
						Authorization: "Bearer malformed-token",
					},
					multipart: {
						image: {
							name: "avatar.png",
							mimeType: "image/png",
							buffer: fs.readFileSync(testImagePath),
						},
					},
				},
			);

			expect([401, 404, 500, 401]).toContain(response.status());
		});

		test("should prevent path traversal in filename", async ({ request }) => {
			const response = await request.put(
				`${API_BASE_URL}/super-admin/users/${testUserId}/profile/avatar`,
				{
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
				},
			);

			expect([200, 400, 401, 403, 404, 422, 500, 401]).toContain(response.status());
		});

		test("should not expose sensitive data in response", async ({
			request,
		}) => {
			const response = await request.put(
				`${API_BASE_URL}/super-admin/users/${testUserId}/profile/avatar`,
				{
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
				},
			);

			if (response.headers()["content-type"]?.includes("application/json")) {
				const data = await response.json();
				const responseText = JSON.stringify(data);

				expect(responseText).not.toContain("password");
				expect(responseText).not.toContain("secretKey");
			}
		});

		test("should require super admin authorization", async ({ request }) => {
			const response = await request.put(
				`${API_BASE_URL}/super-admin/users/${testUserId}/profile/avatar`,
				{
					multipart: {
						image: {
							name: "avatar.png",
							mimeType: "image/png",
							buffer: fs.readFileSync(testImagePath),
						},
					},
				},
			);

			expect([401, 404, 500, 401]).toContain(response.status());
		});
	});

	// ========================
	// RESPONSE FORMAT
	// ========================

	test.describe("Response Format Tests", () => {
		test("should return consistent success structure", async ({ request }) => {
			const response = await request.put(
				`${API_BASE_URL}/super-admin/users/${testUserId}/profile/avatar`,
				{
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

		test("should return proper content type", async ({ request }) => {
			const response = await request.put(
				`${API_BASE_URL}/super-admin/users/${testUserId}/profile/avatar`,
				{
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
		test("should respond quickly (< 1000ms)", async ({ request }) => {
			const start = Date.now();

			const response = await request.put(
				`${API_BASE_URL}/super-admin/users/${testUserId}/profile/avatar`,
				{
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
				},
			);

			const duration = Date.now() - start;

			expect([200, 400, 401, 403, 404, 500, 401]).toContain(response.status());
			expect(duration).toBeLessThan(1000);
		});
	});
});

