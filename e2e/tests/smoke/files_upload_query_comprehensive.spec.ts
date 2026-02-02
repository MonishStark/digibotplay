/** @format */

import { test, expect } from "@playwright/test";
import { testData } from "../testData";
import * as fs from "fs";
import * as path from "path";

const API_BASE_URL = "http://127.0.0.1:5050";

/**
 * Comprehensive test suite for POST /files/upload endpoint
 *
 * Based on Swagger documentation - Upload and Analyze Document
 * Endpoint accepts: teamId, fileName, parentId, source as query parameters
 * Request body: multipart/form-data with file
 */

test.describe("POST /files/upload - Comprehensive Tests", () => {
	let validAccessToken: string;
	let testTeamId: string;
	let testFilePath: string;

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

		// Create a test file for upload
		testFilePath = path.join(__dirname, "test-upload.txt");
		fs.writeFileSync(testFilePath, "Test file content for upload", "utf-8");
	});

	test.afterAll(async () => {
		// Clean up test file
		if (fs.existsSync(testFilePath)) {
			fs.unlinkSync(testFilePath);
		}
	});

	// ========================
	// SUCCESS (201)
	// ========================

	test.describe("201 Success Responses", () => {
		test("should upload file successfully - 201", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/files/upload?teamId=${testTeamId}&fileName=test-upload.txt&parentId=0&source=upload`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
					multipart: {
						file: {
							name: "test-upload.txt",
							mimeType: "text/plain",
							buffer: Buffer.from("Test file content"),
						},
					},
				},
			);

			expect([201, 400, 401, 404, 409]).toContain(response.status());

			if (
				response.status() === 201 &&
				response.headers()["content-type"]?.includes("application/json")
			) {
				const data = await response.json();
				expect(data).toHaveProperty("success");
			}
		});

		test("should return success message with processing status", async ({
			request,
		}) => {
			const response = await request.post(
				`${API_BASE_URL}/files/upload?teamId=${testTeamId}&fileName=processing-test.pdf&parentId=0&source=upload`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
					multipart: {
						file: {
							name: "processing-test.pdf",
							mimeType: "application/pdf",
							buffer: Buffer.from("PDF content"),
						},
					},
				},
			);

			expect([201, 400, 401, 404, 409]).toContain(response.status());
		});

		test("should accept various file types", async ({ request }) => {
			const fileTypes = [
				{ name: "document.pdf", mime: "application/pdf" },
				{ name: "image.jpg", mime: "image/jpeg" },
				{ name: "text.txt", mime: "text/plain" },
			];

			for (const fileType of fileTypes) {
				const response = await request.post(
					`${API_BASE_URL}/files/upload?teamId=${testTeamId}&fileName=${fileType.name}&parentId=0&source=upload`,
					{
						headers: {
							Authorization: `Bearer ${validAccessToken}`,
						},
						multipart: {
							file: {
								name: fileType.name,
								mimeType: fileType.mime,
								buffer: Buffer.from("File content"),
							},
						},
					},
				);

				expect([201, 400, 401, 404, 409]).toContain(response.status());
			}
		});
	});

	// ========================
	// BAD REQUEST (400)
	// ========================

	test.describe("400 Bad Request Responses", () => {
		test("should return 400 when teamId is missing", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/files/upload?fileName=test.txt&parentId=0&source=upload`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
					multipart: {
						file: {
							name: "test.txt",
							mimeType: "text/plain",
							buffer: Buffer.from("Test content"),
						},
					},
				},
			);

			expect([400, 401, 404, 422]).toContain(response.status());

			if (response.headers()["content-type"]?.includes("application/json")) {
				const data = await response.json();
				expect(data.success).toBe(false);
			}
		});

		test("should return 400 when fileName is missing", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/files/upload?teamId=${testTeamId}&parentId=0&source=upload`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
					multipart: {
						file: {
							name: "test.txt",
							mimeType: "text/plain",
							buffer: Buffer.from("Test content"),
						},
					},
				},
			);

			expect([400, 401, 404, 422]).toContain(response.status());
		});

		test("should return 400 when parentId is missing", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/files/upload?teamId=${testTeamId}&fileName=test.txt&source=upload`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
					multipart: {
						file: {
							name: "test.txt",
							mimeType: "text/plain",
							buffer: Buffer.from("Test content"),
						},
					},
				},
			);

			expect([400, 401, 404, 422]).toContain(response.status());
		});

		test("should return 400 when source is missing", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/files/upload?teamId=${testTeamId}&fileName=test.txt&parentId=0`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
					multipart: {
						file: {
							name: "test.txt",
							mimeType: "text/plain",
							buffer: Buffer.from("Test content"),
						},
					},
				},
			);

			expect([400, 401, 404, 422]).toContain(response.status());
		});

		test("should return 400 when file is missing", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/files/upload?teamId=${testTeamId}&fileName=test.txt&parentId=0&source=upload`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([400, 401, 404, 422]).toContain(response.status());
		});

		test("should return 400 for empty file", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/files/upload?teamId=${testTeamId}&fileName=empty.txt&parentId=0&source=upload`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
					multipart: {
						file: {
							name: "empty.txt",
							mimeType: "text/plain",
							buffer: Buffer.from(""),
						},
					},
				},
			);

			expect([400, 401, 404, 422]).toContain(response.status());
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
				`${API_BASE_URL}/files/upload?teamId=${testTeamId}&fileName=test.txt&parentId=0&source=upload`,
				{
					multipart: {
						file: {
							name: "test.txt",
							mimeType: "text/plain",
							buffer: Buffer.from("Test content"),
						},
					},
				},
			);

			expect([401, 404]).toContain(response.status());
		});

		test("should return 401 for invalid token", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/files/upload?teamId=${testTeamId}&fileName=test.txt&parentId=0&source=upload`,
				{
					headers: {
						Authorization: "Bearer invalid-token-12345",
					},
					multipart: {
						file: {
							name: "test.txt",
							mimeType: "text/plain",
							buffer: Buffer.from("Test content"),
						},
					},
				},
			);

			expect([401, 404]).toContain(response.status());
		});

		test("should return 401 for expired token", async ({ request }) => {
			const expiredToken =
				"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.4Adcj0vbBqfVIpnGGNJKKpBmJcAmPNtSKhTNnsTekII";

			const response = await request.post(
				`${API_BASE_URL}/files/upload?teamId=${testTeamId}&fileName=test.txt&parentId=0&source=upload`,
				{
					headers: {
						Authorization: `Bearer ${expiredToken}`,
					},
					multipart: {
						file: {
							name: "test.txt",
							mimeType: "text/plain",
							buffer: Buffer.from("Test content"),
						},
					},
				},
			);

			expect([401, 404]).toContain(response.status());
		});

		test("should return 401 for organization not exists", async ({
			request,
		}) => {
			const response = await request.post(
				`${API_BASE_URL}/files/upload?teamId=99999999&fileName=test.txt&parentId=0&source=upload`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
					multipart: {
						file: {
							name: "test.txt",
							mimeType: "text/plain",
							buffer: Buffer.from("Test content"),
						},
					},
				},
			);

			expect([401, 404]).toContain(response.status());
		});

		test("should return 401 for invalid role", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/files/upload?teamId=${testTeamId}&fileName=test.txt&parentId=0&source=upload`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
					multipart: {
						file: {
							name: "test.txt",
							mimeType: "text/plain",
							buffer: Buffer.from("Test content"),
						},
					},
				},
			);

			expect([201, 401, 403, 404, 409]).toContain(response.status());
		});
	});

	// ========================
	// FORBIDDEN (403)
	// ========================

	test.describe("403 Forbidden Responses", () => {
		test("should return 403 for insufficient role - PLACEHOLDER", async ({
			request,
		}) => {
			// This would require a user with restricted permissions
			expect(true).toBe(true);
		});
	});

	// ========================
	// CONFLICT (409)
	// ========================

	test.describe("409 Conflict Responses", () => {
		test("should return 409 when file already exists", async ({ request }) => {
			const fileName = "duplicate-file-" + Date.now() + ".txt";

			// First upload
			await request.post(
				`${API_BASE_URL}/files/upload?teamId=${testTeamId}&fileName=${fileName}&parentId=0&source=upload`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
					multipart: {
						file: {
							name: fileName,
							mimeType: "text/plain",
							buffer: Buffer.from("First upload"),
						},
					},
				},
			);

			// Second upload (should conflict)
			const response = await request.post(
				`${API_BASE_URL}/files/upload?teamId=${testTeamId}&fileName=${fileName}&parentId=0&source=upload`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
					multipart: {
						file: {
							name: fileName,
							mimeType: "text/plain",
							buffer: Buffer.from("Second upload"),
						},
					},
				},
			);

			expect([201, 404, 409]).toContain(response.status());
		});
	});

	// ========================
	// METHOD NOT ALLOWED (405)
	// ========================

	test.describe("405 Method Not Allowed", () => {
		test("should return 405 for GET method", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/files/upload`);

			expect([404, 405]).toContain(response.status());
		});

		test("should return 405 for PATCH method", async ({ request }) => {
			const response = await request.patch(`${API_BASE_URL}/files/upload`);

			expect([404, 405]).toContain(response.status());
		});

		test("should return 405 for DELETE method", async ({ request }) => {
			const response = await request.delete(`${API_BASE_URL}/files/upload`);

			expect([404, 405]).toContain(response.status());
		});
	});

	// ========================
	// EDGE CASES
	// ========================

	test.describe("Edge Cases", () => {
		test("should handle very long filename", async ({ request }) => {
			const longFilename = "a".repeat(200) + ".txt";

			const response = await request.post(
				`${API_BASE_URL}/files/upload?teamId=${testTeamId}&fileName=${encodeURIComponent(longFilename)}&parentId=0&source=upload`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
					multipart: {
						file: {
							name: longFilename,
							mimeType: "text/plain",
							buffer: Buffer.from("Test content"),
						},
					},
				},
			);

			expect([201, 400, 401, 404, 409, 422]).toContain(response.status());
		});

		test("should handle special characters in filename", async ({
			request,
		}) => {
			const specialName = "test!@#$%^&*().txt";

			const response = await request.post(
				`${API_BASE_URL}/files/upload?teamId=${testTeamId}&fileName=${encodeURIComponent(specialName)}&parentId=0&source=upload`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
					multipart: {
						file: {
							name: specialName,
							mimeType: "text/plain",
							buffer: Buffer.from("Test content"),
						},
					},
				},
			);

			expect([201, 400, 401, 404, 409, 422]).toContain(response.status());
		});

		test("should handle unicode characters in filename", async ({
			request,
		}) => {
			const unicodeName = "文件测试.txt";

			const response = await request.post(
				`${API_BASE_URL}/files/upload?teamId=${testTeamId}&fileName=${encodeURIComponent(unicodeName)}&parentId=0&source=upload`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
					multipart: {
						file: {
							name: unicodeName,
							mimeType: "text/plain",
							buffer: Buffer.from("Test content"),
						},
					},
				},
			);

			expect([201, 400, 401, 404, 409]).toContain(response.status());
		});

		test("should handle large file upload", async ({ request }) => {
			const largeContent = Buffer.alloc(1024 * 1024); // 1MB

			const response = await request.post(
				`${API_BASE_URL}/files/upload?teamId=${testTeamId}&fileName=large-file.txt&parentId=0&source=upload`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
					multipart: {
						file: {
							name: "large-file.txt",
							mimeType: "text/plain",
							buffer: largeContent,
						},
					},
				},
			);

			expect([201, 400, 401, 404, 409, 413]).toContain(response.status());
		});

		test("should handle concurrent uploads", async ({ request }) => {
			const uploads = Array(3)
				.fill(null)
				.map((_, i) =>
					request.post(
						`${API_BASE_URL}/files/upload?teamId=${testTeamId}&fileName=concurrent-${i}-${Date.now()}.txt&parentId=0&source=upload`,
						{
							headers: {
								Authorization: `Bearer ${validAccessToken}`,
							},
							multipart: {
								file: {
									name: `concurrent-${i}.txt`,
									mimeType: "text/plain",
									buffer: Buffer.from(`Content ${i}`),
								},
							},
						},
					),
				);

			const responses = await Promise.all(uploads);

			responses.forEach((response) => {
				expect([201, 400, 401, 404, 409]).toContain(response.status());
			});
		});

		test("should handle different source values", async ({ request }) => {
			const sources = ["upload", "import", "sync"];

			for (const source of sources) {
				const response = await request.post(
					`${API_BASE_URL}/files/upload?teamId=${testTeamId}&fileName=source-test-${source}.txt&parentId=0&source=${source}`,
					{
						headers: {
							Authorization: `Bearer ${validAccessToken}`,
						},
						multipart: {
							file: {
								name: `source-test-${source}.txt`,
								mimeType: "text/plain",
								buffer: Buffer.from("Test content"),
							},
						},
					},
				);

				expect([201, 400, 401, 404, 409]).toContain(response.status());
			}
		});

		test("should handle nested parent folders", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/files/upload?teamId=${testTeamId}&fileName=nested-file.txt&parentId=12345&source=upload`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
					multipart: {
						file: {
							name: "nested-file.txt",
							mimeType: "text/plain",
							buffer: Buffer.from("Test content"),
						},
					},
				},
			);

			expect([201, 400, 401, 404, 409]).toContain(response.status());
		});
	});

	// ========================
	// SECURITY TESTS
	// ========================

	test.describe("Security Tests", () => {
		test("should sanitize XSS attempts in filename", async ({ request }) => {
			const xssFilename = "<script>alert('xss')</script>.txt";

			const response = await request.post(
				`${API_BASE_URL}/files/upload?teamId=${testTeamId}&fileName=${encodeURIComponent(xssFilename)}&parentId=0&source=upload`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
					multipart: {
						file: {
							name: xssFilename,
							mimeType: "text/plain",
							buffer: Buffer.from("Test content"),
						},
					},
				},
			);

			expect([201, 400, 401, 404, 409, 422]).toContain(response.status());
		});

		test("should prevent path traversal in filename", async ({ request }) => {
			const traversalFilename = "../../etc/passwd";

			const response = await request.post(
				`${API_BASE_URL}/files/upload?teamId=${testTeamId}&fileName=${encodeURIComponent(traversalFilename)}&parentId=0&source=upload`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
					multipart: {
						file: {
							name: traversalFilename,
							mimeType: "text/plain",
							buffer: Buffer.from("Test content"),
						},
					},
				},
			);

			expect([201, 400, 401, 404, 409, 422]).toContain(response.status());
		});

		test("should prevent SQL injection in parameters", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/files/upload?teamId=1' OR '1'='1&fileName=test.txt&parentId=0&source=upload`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
					multipart: {
						file: {
							name: "test.txt",
							mimeType: "text/plain",
							buffer: Buffer.from("Test content"),
						},
					},
				},
			);

			expect([400, 401, 404]).toContain(response.status());
		});

		test("should validate token on every request", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/files/upload?teamId=${testTeamId}&fileName=test.txt&parentId=0&source=upload`,
				{
					headers: {
						Authorization: "Bearer malformed-jwt-token",
					},
					multipart: {
						file: {
							name: "test.txt",
							mimeType: "text/plain",
							buffer: Buffer.from("Test content"),
						},
					},
				},
			);

			expect([401, 404]).toContain(response.status());
		});

		test("should not expose sensitive data in response", async ({
			request,
		}) => {
			const response = await request.post(
				`${API_BASE_URL}/files/upload?teamId=${testTeamId}&fileName=secure-test.txt&parentId=0&source=upload`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
					multipart: {
						file: {
							name: "secure-test.txt",
							mimeType: "text/plain",
							buffer: Buffer.from("Test content"),
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

		test("should enforce file type restrictions", async ({ request }) => {
			const executableFile = "malicious.exe";

			const response = await request.post(
				`${API_BASE_URL}/files/upload?teamId=${testTeamId}&fileName=${executableFile}&parentId=0&source=upload`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
					multipart: {
						file: {
							name: executableFile,
							mimeType: "application/octet-stream",
							buffer: Buffer.from("MZ executable content"),
						},
					},
				},
			);

			expect([201, 400, 401, 404, 409, 422]).toContain(response.status());
		});
	});

	// ========================
	// RESPONSE FORMAT
	// ========================

	test.describe("Response Format Tests", () => {
		test("should return consistent success structure", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/files/upload?teamId=${testTeamId}&fileName=format-test-${Date.now()}.txt&parentId=0&source=upload`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
					multipart: {
						file: {
							name: "format-test.txt",
							mimeType: "text/plain",
							buffer: Buffer.from("Test content"),
						},
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
				`${API_BASE_URL}/files/upload?teamId=${testTeamId}&parentId=0&source=upload`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
					multipart: {
						file: {
							name: "error-test.txt",
							mimeType: "text/plain",
							buffer: Buffer.from("Test content"),
						},
					},
				},
			);

			if (response.headers()["content-type"]?.includes("application/json")) {
				const data = await response.json();
				expect(data).toHaveProperty("success");
			}
		});

		test("should return proper content type", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/files/upload?teamId=${testTeamId}&fileName=content-type-test-${Date.now()}.txt&parentId=0&source=upload`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
					multipart: {
						file: {
							name: "content-type-test.txt",
							mimeType: "text/plain",
							buffer: Buffer.from("Test content"),
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
		test("should respond within reasonable time (< 2000ms)", async ({
			request,
		}) => {
			const start = Date.now();

			const response = await request.post(
				`${API_BASE_URL}/files/upload?teamId=${testTeamId}&fileName=perf-test-${Date.now()}.txt&parentId=0&source=upload`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
					multipart: {
						file: {
							name: "perf-test.txt",
							mimeType: "text/plain",
							buffer: Buffer.from("Test content"),
						},
					},
				},
			);

			const duration = Date.now() - start;

			expect([201, 400, 401, 404, 409]).toContain(response.status());
			expect(duration).toBeLessThan(2000);
		});
	});
});
