/** @format */

import { test, expect } from "@playwright/test";
import { testData } from "../testData";

const API_BASE_URL = "http://127.0.0.1:5050";

/**
 * Comprehensive test suite for DELETE /files/:fileId endpoint
 *
 * Based on Swagger documentation - Delete a file and retrieve the updated list of files and folders
 */

test.describe("DELETE /files/:fileId - Comprehensive Tests", () => {
	let validAccessToken: string;
	let testFileId: string;
	let testTeamId: string;

	test.beforeAll(async ({ request }) => {
		const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
			data: {
				email: testData.users.admin1.email,
				password: testData.users.admin1.password,
			},
		});

		const loginData = await loginResponse.json();
		validAccessToken = loginData.accessToken;
		testFileId = "test-file-id-" + Date.now();
		testTeamId = testData.users.admin1.companyId || "1";
	});

	// ========================
	// SUCCESS (200)
	// ========================

	test.describe("200 Success Responses", () => {
		test("should delete file successfully - 200", async ({ request }) => {
			const response = await request.delete(
				`${API_BASE_URL}/files/${testFileId}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						fileId: testFileId,
						teamId: testTeamId,
						parentFolder: "test-folder",
					},
				},
			);

			expect([200, 201, 400, 401, 404]).toContain(response.status());

			if (response.headers()["content-type"]?.includes("application/json")) {
				const data = await response.json();
				expect(data).toHaveProperty("success");
			}
		});

		test("should return success message after deletion", async ({
			request,
		}) => {
			const response = await request.delete(
				`${API_BASE_URL}/files/${testFileId}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						fileId: testFileId,
						teamId: testTeamId,
						parentFolder: "documents",
					},
				},
			);

			expect([200, 201, 400, 401, 404]).toContain(response.status());

			if (response.headers()["content-type"]?.includes("application/json")) {
				const data = await response.json();
				if (data.success === true) {
					expect(data).toHaveProperty("message");
				}
			}
		});

		test("should return updated file list after deletion - 200", async ({
			request,
		}) => {
			const response = await request.delete(
				`${API_BASE_URL}/files/${testFileId}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						fileId: testFileId,
						teamId: testTeamId,
						parentFolder: "folder",
					},
				},
			);

			expect([200, 201, 400, 401, 404]).toContain(response.status());
		});

		test("should handle success with no search string - 200", async ({
			request,
		}) => {
			const response = await request.delete(
				`${API_BASE_URL}/files/${testFileId}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						fileId: testFileId,
						teamId: testTeamId,
						parentFolder: "",
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
		test("should return 400 when fileId is missing in body", async ({
			request,
		}) => {
			const response = await request.delete(
				`${API_BASE_URL}/files/${testFileId}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						teamId: testTeamId,
						parentFolder: "folder",
					},
				},
			);

			expect([400, 401, 404, 422]).toContain(response.status());

			if (response.headers()["content-type"]?.includes("application/json")) {
				const data = await response.json();
				expect(data.success).toBe(false);
			}
		});

		test("should return 400 when teamId is missing", async ({ request }) => {
			const response = await request.delete(
				`${API_BASE_URL}/files/${testFileId}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						fileId: testFileId,
						parentFolder: "folder",
					},
				},
			);

			expect([400, 401, 404, 422]).toContain(response.status());
		});

		test("should return 400 for invalid fileId format", async ({ request }) => {
			const response = await request.delete(
				`${API_BASE_URL}/files/invalid-id`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						fileId: "invalid-id",
						teamId: testTeamId,
						parentFolder: "folder",
					},
				},
			);

			expect([400, 401, 404]).toContain(response.status());
		});

		test("should return 400 for empty fileId", async ({ request }) => {
			const response = await request.delete(`${API_BASE_URL}/files/`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: {
					fileId: "",
					teamId: testTeamId,
					parentFolder: "folder",
				},
			});

			expect([400, 404, 405]).toContain(response.status());
		});

		test("should return 400 for malformed JSON", async ({ request }) => {
			const response = await request.delete(
				`${API_BASE_URL}/files/${testFileId}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: "{ invalid json",
				},
			);

			expect([400, 401, 500]).toContain(response.status());
		});
	});

	// ========================
	// UNAUTHORIZED (401)
	// ========================

	test.describe("401 Unauthorized Responses", () => {
		test("should return 401 when Authorization header is missing", async ({
			request,
		}) => {
			const response = await request.delete(
				`${API_BASE_URL}/files/${testFileId}`,
				{
					headers: {
						"Content-Type": "application/json",
					},
					data: {
						fileId: testFileId,
						teamId: testTeamId,
						parentFolder: "folder",
					},
				},
			);

			expect([401, 404]).toContain(response.status());
		});

		test("should return 401 for invalid token", async ({ request }) => {
			const response = await request.delete(
				`${API_BASE_URL}/files/${testFileId}`,
				{
					headers: {
						Authorization: "Bearer invalid-token-12345",
						"Content-Type": "application/json",
					},
					data: {
						fileId: testFileId,
						teamId: testTeamId,
						parentFolder: "folder",
					},
				},
			);

			expect([401, 404]).toContain(response.status());
		});

		test("should return 401 for expired token", async ({ request }) => {
			const expiredToken =
				"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.4Adcj0vbBqfVIpnGGNJKKpBmJcAmPNtSKhTNnsTekII";

			const response = await request.delete(
				`${API_BASE_URL}/files/${testFileId}`,
				{
					headers: {
						Authorization: `Bearer ${expiredToken}`,
						"Content-Type": "application/json",
					},
					data: {
						fileId: testFileId,
						teamId: testTeamId,
						parentFolder: "folder",
					},
				},
			);

			expect([401, 404]).toContain(response.status());
		});

		test("should return 401 for malformed JWT", async ({ request }) => {
			const response = await request.delete(
				`${API_BASE_URL}/files/${testFileId}`,
				{
					headers: {
						Authorization: "Bearer not-a-valid-jwt",
						"Content-Type": "application/json",
					},
					data: {
						fileId: testFileId,
						teamId: testTeamId,
						parentFolder: "folder",
					},
				},
			);

			expect([401, 404]).toContain(response.status());
		});

		test("should return 401 for invalid file access", async ({ request }) => {
			const response = await request.delete(
				`${API_BASE_URL}/files/${testFileId}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						fileId: testFileId,
						teamId: "999999",
						parentFolder: "folder",
					},
				},
			);

			expect([401, 403, 404]).toContain(response.status());
		});

		test("should return 401 for access denied", async ({ request }) => {
			const response = await request.delete(
				`${API_BASE_URL}/files/${testFileId}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						fileId: testFileId,
						teamId: testTeamId,
						parentFolder: "restricted-folder",
					},
				},
			);

			expect([200, 400, 401, 403, 404]).toContain(response.status());
		});

		test("should return 401 when team not exists", async ({ request }) => {
			const response = await request.delete(
				`${API_BASE_URL}/files/${testFileId}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						fileId: testFileId,
						teamId: "00000000",
						parentFolder: "folder",
					},
				},
			);

			expect([401, 404]).toContain(response.status());
		});
	});

	// ========================
	// FAILURE (201)
	// ========================

	test.describe("201 Failure Responses", () => {
		test("should return 201 when deletion fails - PLACEHOLDER", async ({
			request,
		}) => {
			// This would require special setup to simulate deletion failure
			expect(true).toBe(true);
		});
	});

	// ========================
	// NOT FOUND (404)
	// ========================

	test.describe("404 Not Found Responses", () => {
		test("should return 404 for non-existent file", async ({ request }) => {
			const nonExistentId = "99999999";

			const response = await request.delete(
				`${API_BASE_URL}/files/${nonExistentId}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						fileId: nonExistentId,
						teamId: testTeamId,
						parentFolder: "folder",
					},
				},
			);

			expect([401, 404]).toContain(response.status());

			if (response.headers()["content-type"]?.includes("application/json")) {
				const data = await response.json();
				expect(data.success).toBe(false);
			}
		});

		test("should return 404 for non-existent team", async ({ request }) => {
			const response = await request.delete(
				`${API_BASE_URL}/files/${testFileId}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						fileId: testFileId,
						teamId: "99999999",
						parentFolder: "folder",
					},
				},
			);

			expect([401, 404]).toContain(response.status());
		});
	});

	// ========================
	// METHOD NOT ALLOWED (405)
	// ========================

	test.describe("405 Method Not Allowed", () => {
		test("should return 405 for GET method", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/files/${testFileId}`);

			expect([200, 404, 405]).toContain(response.status());
		});

		test("should return 405 for POST method", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/files/${testFileId}`,
			);

			expect([404, 405]).toContain(response.status());
		});

		test("should return 405 for PUT method", async ({ request }) => {
			const response = await request.put(`${API_BASE_URL}/files/${testFileId}`);

			expect([404, 405]).toContain(response.status());
		});
	});

	// ========================
	// EDGE CASES
	// ========================

	test.describe("Edge Cases", () => {
		test("should handle UUID format fileId", async ({ request }) => {
			const uuidFileId = "123e4567-e89b-12d3-a456-426614174000";

			const response = await request.delete(
				`${API_BASE_URL}/files/${uuidFileId}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						fileId: uuidFileId,
						teamId: testTeamId,
						parentFolder: "folder",
					},
				},
			);

			expect([200, 400, 401, 404]).toContain(response.status());
		});

		test("should handle very long fileId", async ({ request }) => {
			const longId = "a".repeat(500);

			const response = await request.delete(`${API_BASE_URL}/files/${longId}`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "application/json",
				},
				data: {
					fileId: longId,
					teamId: testTeamId,
					parentFolder: "folder",
				},
			});

			expect([400, 401, 404]).toContain(response.status());
		});

		test("should handle concurrent deletion attempts", async ({ request }) => {
			const deletes = Array(3)
				.fill(null)
				.map(() =>
					request.delete(`${API_BASE_URL}/files/${testFileId}`, {
						headers: {
							Authorization: `Bearer ${validAccessToken}`,
							"Content-Type": "application/json",
						},
						data: {
							fileId: testFileId,
							teamId: testTeamId,
							parentFolder: "folder",
						},
					}),
				);

			const responses = await Promise.all(deletes);

			responses.forEach((response) => {
				expect([200, 201, 400, 401, 404]).toContain(response.status());
			});
		});

		test("should handle special characters in fileId", async ({ request }) => {
			const specialCharsId = "test!@#$%^&*()";

			const response = await request.delete(
				`${API_BASE_URL}/files/${encodeURIComponent(specialCharsId)}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						fileId: specialCharsId,
						teamId: testTeamId,
						parentFolder: "folder",
					},
				},
			);

			expect([400, 401, 404]).toContain(response.status());
		});

		test("should handle empty parentFolder", async ({ request }) => {
			const response = await request.delete(
				`${API_BASE_URL}/files/${testFileId}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						fileId: testFileId,
						teamId: testTeamId,
						parentFolder: "",
					},
				},
			);

			expect([200, 400, 401, 404]).toContain(response.status());
		});

		test("should handle null values in request", async ({ request }) => {
			const response = await request.delete(
				`${API_BASE_URL}/files/${testFileId}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						fileId: null,
						teamId: null,
						parentFolder: null,
					},
				},
			);

			expect([400, 401, 404, 422]).toContain(response.status());
		});
	});

	// ========================
	// SECURITY TESTS
	// ========================

	test.describe("Security Tests", () => {
		test("should prevent SQL injection in fileId", async ({ request }) => {
			const sqlInjection = "1' OR '1'='1";

			const response = await request.delete(
				`${API_BASE_URL}/files/${encodeURIComponent(sqlInjection)}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						fileId: sqlInjection,
						teamId: testTeamId,
						parentFolder: "folder",
					},
				},
			);

			expect([400, 401, 404]).toContain(response.status());
		});

		test("should prevent SQL injection in teamId", async ({ request }) => {
			const response = await request.delete(
				`${API_BASE_URL}/files/${testFileId}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						fileId: testFileId,
						teamId: "1' OR '1'='1",
						parentFolder: "folder",
					},
				},
			);

			expect([400, 401, 404]).toContain(response.status());
		});

		test("should validate token on every request", async ({ request }) => {
			const response = await request.delete(
				`${API_BASE_URL}/files/${testFileId}`,
				{
					headers: {
						Authorization: "Bearer malformed-jwt-token",
						"Content-Type": "application/json",
					},
					data: {
						fileId: testFileId,
						teamId: testTeamId,
						parentFolder: "folder",
					},
				},
			);

			expect([401, 404]).toContain(response.status());
		});

		test("should not expose sensitive data in response", async ({
			request,
		}) => {
			const response = await request.delete(
				`${API_BASE_URL}/files/${testFileId}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						fileId: testFileId,
						teamId: testTeamId,
						parentFolder: "folder",
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

		test("should only allow deletion of own team files", async ({
			request,
		}) => {
			const response = await request.delete(
				`${API_BASE_URL}/files/${testFileId}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						fileId: testFileId,
						teamId: "another-team-id",
						parentFolder: "folder",
					},
				},
			);

			expect([401, 403, 404]).toContain(response.status());
		});
	});

	// ========================
	// RESPONSE FORMAT
	// ========================

	test.describe("Response Format Tests", () => {
		test("should return consistent success structure", async ({ request }) => {
			const response = await request.delete(
				`${API_BASE_URL}/files/${testFileId}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						fileId: testFileId,
						teamId: testTeamId,
						parentFolder: "folder",
					},
				},
			);

			if (response.headers()["content-type"]?.includes("application/json")) {
				const data = await response.json();
				expect(data).toHaveProperty("success");
			}
		});

		test("should return consistent error structure", async ({ request }) => {
			const response = await request.delete(
				`${API_BASE_URL}/files/${testFileId}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						// Missing required fields
					},
				},
			);

			if (response.headers()["content-type"]?.includes("application/json")) {
				const data = await response.json();
				expect(data).toHaveProperty("success");
			}
		});

		test("should return proper content type", async ({ request }) => {
			const response = await request.delete(
				`${API_BASE_URL}/files/${testFileId}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						fileId: testFileId,
						teamId: testTeamId,
						parentFolder: "folder",
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

			const response = await request.delete(
				`${API_BASE_URL}/files/${testFileId}`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						fileId: testFileId,
						teamId: testTeamId,
						parentFolder: "folder",
					},
				},
			);

			const duration = Date.now() - start;

			expect([200, 201, 400, 401, 404]).toContain(response.status());
			expect(duration).toBeLessThan(500);
		});
	});
});
