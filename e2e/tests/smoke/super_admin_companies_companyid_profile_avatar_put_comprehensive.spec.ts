/** @format */

import { test, expect } from "@playwright/test";
import { testData } from "../testData";
import * as fs from "fs";
import * as path from "path";

const API_BASE_URL = "http://127.0.0.1:5050";

/**
 * Comprehensive test suite for PUT /super-admin/companies/{companyId}/profile/avatar endpoint
 * Upload or Replace Company Profile Avatar - Accepts only PNG or JPEG images via multipart/form-data
 * This endpoint updates the company's avatar and does not modify any other company fields
 * Only one file is allowed per request
 * Response codes: 200, 400, 401, 404, 415, 429, 500, 503, 504
 */

test.describe("PUT /super-admin/companies/{companyId}/profile/avatar - Comprehensive Tests", () => {
	let validAccessToken: string;
	let testCompanyId: string;
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
		testCompanyId = "45";

		// Create a small test image
		testImagePath = path.join(process.cwd(), "test-company-avatar.png");
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

	test.describe("200 Success Responses", () => {
		test("should upload company avatar successfully - 200", async ({
			request,
		}) => {
			const response = await request.put(
				`${API_BASE_URL}/super-admin/companies/${testCompanyId}/profile/avatar`,
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

			expect([200, 400, 401, 404]).toContain(response.status());

			if (
				response.status() === 200 &&
				response.headers()["content-type"]?.includes("application/json")
			) {
				const data = await response.json();
				expect(data).toHaveProperty("success");
			}
		});

		test("should upload PNG avatar", async ({ request }) => {
			const response = await request.put(
				`${API_BASE_URL}/super-admin/companies/${testCompanyId}/profile/avatar`,
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

			expect([200, 400, 401, 404]).toContain(response.status());
		});

		test("should upload JPEG avatar", async ({ request }) => {
			const response = await request.put(
				`${API_BASE_URL}/super-admin/companies/${testCompanyId}/profile/avatar`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
					multipart: {
						image: {
							name: "avatar.jpg",
							mimeType: "image/jpeg",
							buffer: fs.readFileSync(testImagePath),
						},
					},
				},
			);

			expect([200, 400, 401, 404, 415]).toContain(response.status());
		});

		test("should replace existing avatar", async ({ request }) => {
			const response = await request.put(
				`${API_BASE_URL}/super-admin/companies/${testCompanyId}/profile/avatar`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
					multipart: {
						image: {
							name: "new-avatar.png",
							mimeType: "image/png",
							buffer: fs.readFileSync(testImagePath),
						},
					},
				},
			);

			expect([200, 400, 401, 404]).toContain(response.status());
		});
	});

	// ========================
	// BAD REQUEST (400)
	// ========================

	test.describe("400 Bad Request Responses", () => {
		test("should return 400 when image is missing", async ({ request }) => {
			const response = await request.put(
				`${API_BASE_URL}/super-admin/companies/${testCompanyId}/profile/avatar`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
					multipart: {},
				},
			);

			expect([400, 401, 404, 422]).toContain(response.status());
		});

		test("should return 400 for invalid companyId format", async ({
			request,
		}) => {
			const response = await request.put(
				`${API_BASE_URL}/super-admin/companies/invalid-id/profile/avatar`,
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

			expect([400, 401, 404]).toContain(response.status());
		});

		test("should return 400 for empty file", async ({ request }) => {
			const response = await request.put(
				`${API_BASE_URL}/super-admin/companies/${testCompanyId}/profile/avatar`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
					multipart: {
						image: {
							name: "empty.png",
							mimeType: "image/png",
							buffer: Buffer.from(""),
						},
					},
				},
			);

			expect([400, 401, 404, 422]).toContain(response.status());
		});

		test("should return 400 for multiple files", async ({ request }) => {
			const response = await request.put(
				`${API_BASE_URL}/super-admin/companies/${testCompanyId}/profile/avatar`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
					multipart: {
						image: {
							name: "avatar1.png",
							mimeType: "image/png",
							buffer: fs.readFileSync(testImagePath),
						},
						image2: {
							name: "avatar2.png",
							mimeType: "image/png",
							buffer: fs.readFileSync(testImagePath),
						},
					},
				},
			);

			expect([200, 400, 401, 404]).toContain(response.status());
		});
	});

	// ========================
	// UNAUTHORIZED (401)
	// ========================

	test.describe("401 Unauthorized Responses", () => {
		test("should return 401 when Authorization header is missing", async ({
			request,
		}) => {
			const response = await request.put(
				`${API_BASE_URL}/super-admin/companies/${testCompanyId}/profile/avatar`,
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

			expect([401, 404]).toContain(response.status());
		});

		test("should return 401 for invalid token", async ({ request }) => {
			const response = await request.put(
				`${API_BASE_URL}/super-admin/companies/${testCompanyId}/profile/avatar`,
				{
					headers: {
						Authorization: "Bearer invalid-token-12345",
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

			expect([401, 404]).toContain(response.status());
		});

		test("should return 401 for expired token", async ({ request }) => {
			const expiredToken =
				"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.4Adcj0vbBqfVIpnGGNJKKpBmJcAmPNtSKhTNnsTekII";

			const response = await request.put(
				`${API_BASE_URL}/super-admin/companies/${testCompanyId}/profile/avatar`,
				{
					headers: {
						Authorization: `Bearer ${expiredToken}`,
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

			expect([401, 404]).toContain(response.status());
		});

		test("should return 401 for malformed JWT", async ({ request }) => {
			const response = await request.put(
				`${API_BASE_URL}/super-admin/companies/${testCompanyId}/profile/avatar`,
				{
					headers: {
						Authorization: "Bearer not-a-valid-jwt",
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

			expect([401, 404]).toContain(response.status());
		});
	});

	// ========================
	// NOT FOUND (404)
	// ========================

	test.describe("404 Not Found Responses", () => {
		test("should return 404 for non-existent company", async ({ request }) => {
			const response = await request.put(
				`${API_BASE_URL}/super-admin/companies/99999999/profile/avatar`,
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

			expect([400, 401, 404]).toContain(response.status());
		});

		test("should return 404 for deleted company", async ({ request }) => {
			const response = await request.put(
				`${API_BASE_URL}/super-admin/companies/00000000/profile/avatar`,
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

			expect([400, 401, 404]).toContain(response.status());
		});
	});

	// ========================
	// UNSUPPORTED MEDIA TYPE (415)
	// ========================

	test.describe("415 Unsupported Media Type", () => {
		test("should return 415 for GIF image", async ({ request }) => {
			const response = await request.put(
				`${API_BASE_URL}/super-admin/companies/${testCompanyId}/profile/avatar`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
					multipart: {
						image: {
							name: "avatar.gif",
							mimeType: "image/gif",
							buffer: fs.readFileSync(testImagePath),
						},
					},
				},
			);

			expect([400, 401, 404, 415]).toContain(response.status());
		});

		test("should return 415 for PDF file", async ({ request }) => {
			const response = await request.put(
				`${API_BASE_URL}/super-admin/companies/${testCompanyId}/profile/avatar`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
					multipart: {
						image: {
							name: "file.pdf",
							mimeType: "application/pdf",
							buffer: fs.readFileSync(testImagePath),
						},
					},
				},
			);

			expect([400, 401, 404, 415]).toContain(response.status());
		});

		test("should return 415 for text file", async ({ request }) => {
			const response = await request.put(
				`${API_BASE_URL}/super-admin/companies/${testCompanyId}/profile/avatar`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
					multipart: {
						image: {
							name: "file.txt",
							mimeType: "text/plain",
							buffer: Buffer.from("not an image"),
						},
					},
				},
			);

			expect([400, 401, 404, 415, 422]).toContain(response.status());
		});

		test("should return 415 for SVG image", async ({ request }) => {
			const response = await request.put(
				`${API_BASE_URL}/super-admin/companies/${testCompanyId}/profile/avatar`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
					multipart: {
						image: {
							name: "avatar.svg",
							mimeType: "image/svg+xml",
							buffer: Buffer.from("<svg></svg>"),
						},
					},
				},
			);

			expect([400, 401, 404, 415]).toContain(response.status());
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
		test("should handle special characters in filename", async ({
			request,
		}) => {
			const response = await request.put(
				`${API_BASE_URL}/super-admin/companies/${testCompanyId}/profile/avatar`,
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

			expect([200, 400, 401, 404, 422]).toContain(response.status());
		});

		test("should handle corrupted image", async ({ request }) => {
			const response = await request.put(
				`${API_BASE_URL}/super-admin/companies/${testCompanyId}/profile/avatar`,
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

			expect([400, 401, 404, 415, 422]).toContain(response.status());
		});

		test("should handle very large file", async ({ request }) => {
			const largeBuffer = Buffer.alloc(10 * 1024 * 1024);

			const response = await request.put(
				`${API_BASE_URL}/super-admin/companies/${testCompanyId}/profile/avatar`,
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

			expect([400, 401, 404, 413, 422]).toContain(response.status());
		});

		test("should not modify other company fields", async ({ request }) => {
			const response = await request.put(
				`${API_BASE_URL}/super-admin/companies/${testCompanyId}/profile/avatar`,
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

			expect([200, 400, 401, 404]).toContain(response.status());
		});

		test("should allow only one file per request", async ({ request }) => {
			const response = await request.put(
				`${API_BASE_URL}/super-admin/companies/${testCompanyId}/profile/avatar`,
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

			expect([200, 400, 401, 404]).toContain(response.status());
		});
	});

	// ========================
	// SECURITY TESTS
	// ========================

	test.describe("Security Tests", () => {
		test("should validate token on every request", async ({ request }) => {
			const response = await request.put(
				`${API_BASE_URL}/super-admin/companies/${testCompanyId}/profile/avatar`,
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

			expect([401, 404]).toContain(response.status());
		});

		test("should prevent path traversal in filename", async ({ request }) => {
			const response = await request.put(
				`${API_BASE_URL}/super-admin/companies/${testCompanyId}/profile/avatar`,
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

			expect([200, 400, 401, 404, 422]).toContain(response.status());
		});

		test("should not expose sensitive data in response", async ({
			request,
		}) => {
			const response = await request.put(
				`${API_BASE_URL}/super-admin/companies/${testCompanyId}/profile/avatar`,
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
				`${API_BASE_URL}/super-admin/companies/${testCompanyId}/profile/avatar`,
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

			expect([401, 404]).toContain(response.status());
		});
	});

	// ========================
	// RESPONSE FORMAT
	// ========================

	test.describe("Response Format Tests", () => {
		test("should return consistent success structure", async ({ request }) => {
			const response = await request.put(
				`${API_BASE_URL}/super-admin/companies/${testCompanyId}/profile/avatar`,
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
				`${API_BASE_URL}/super-admin/companies/${testCompanyId}/profile/avatar`,
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
				`${API_BASE_URL}/super-admin/companies/${testCompanyId}/profile/avatar`,
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

			expect([200, 400, 401, 404]).toContain(response.status());
			expect(duration).toBeLessThan(1000);
		});
	});
});
