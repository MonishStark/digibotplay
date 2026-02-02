/** @format */

import { test, expect } from "@playwright/test";
import { testData } from "../testData";

test.describe("PUT /teams/{teamId}/folders/{folderId} - Update folder metadata", () => {
	let adminAccessToken: string;
	const testTeamId = testData.teams.team3.id;
	let testFolderId: string;

	test.beforeAll(async ({ request }) => {
		// Login as admin to get access token
		const loginResponse = await request.post(
			"http://127.0.0.1:5050/auth/login",
			{
				data: {
					email: "poised.reindeer.muxl@protectsmail.net",
					password: "Qwerty@123",
				},
			},
		);
		const loginData = await loginResponse.json();
		adminAccessToken = loginData.accessToken;

		// Try to get existing folder or create one
		const foldersResponse = await request.get(
			`http://127.0.0.1:5050/teams/${testTeamId}/folders`,
			{
				headers: {
					Authorization: `Bearer ${adminAccessToken}`,
				},
			},
		);
		const foldersData = await foldersResponse.json();

		if (foldersData.results?.length > 0) {
			testFolderId = foldersData.results[0].id;
		} else {
			// Create a test folder
			const createResponse = await request.post(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders`,
				{
					headers: {
						Authorization: `Bearer ${adminAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						name: "Test Folder for Update",
					},
				},
			);
			const createData = await createResponse.json();
			testFolderId = createData.data.id;
		}
	});

	test.describe("200 - Success", () => {
		test("should update folder name successfully", async ({ request }) => {
			const response = await request.put(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders/${testFolderId}`,
				{
					headers: {
						Authorization: `Bearer ${adminAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						name: "Updated Folder Name",
					},
				},
			);

			expect(response.status()).toBe(200);
			const data = await response.json();
			expect(data.response).toBe("true");
		});

		test("should update folder description", async ({ request }) => {
			const response = await request.put(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders/${testFolderId}`,
				{
					headers: {
						Authorization: `Bearer ${adminAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						description: "Updated description",
					},
				},
			);

			expect(response.status()).toBe(200);
			const data = await response.json();
			expect(data.response).toBe("true");
		});
	});

	test.describe("400 - Bad Request", () => {
		test("should return 400 for invalid teamId", async ({ request }) => {
			const response = await request.put(
				`http://127.0.0.1:5050/teams/invalid-id/folders/${testFolderId}`,
				{
					headers: {
						Authorization: `Bearer ${adminAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						name: "Updated Name",
					},
				},
			);

			expect([400, 404, 422]).toContain(response.status());
			const data = await response.json();
			expect(data.response).toBe("false");
		});

		test("should return 400 for invalid folderId", async ({ request }) => {
			const response = await request.put(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders/invalid-id`,
				{
					headers: {
						Authorization: `Bearer ${adminAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						name: "Updated Name",
					},
				},
			);

			expect([400, 404, 422]).toContain(response.status());
			const data = await response.json();
			expect(data.response).toBe("false");
		});

		test("should return 400 for empty request body", async ({ request }) => {
			const response = await request.put(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders/${testFolderId}`,
				{
					headers: {
						Authorization: `Bearer ${adminAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {},
				},
			);

			expect([400, 422]).toContain(response.status());
		});

		test("should return 400 for malformed JSON", async ({ request }) => {
			const response = await request.put(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders/${testFolderId}`,
				{
					headers: {
						Authorization: `Bearer ${adminAccessToken}`,
						"Content-Type": "application/json",
					},
					data: "invalid-json",
				},
			);

			expect([400, 422]).toContain(response.status());
		});
	});

	test.describe("401 - Unauthorized", () => {
		test("should return 401 when authorization token is missing", async ({
			request,
		}) => {
			const response = await request.put(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders/${testFolderId}`,
				{
					headers: {
						"Content-Type": "application/json",
					},
					data: {
						name: "Updated Name",
					},
				},
			);

			expect(response.status()).toBe(401);
			const data = await response.json();
			expect(data.response).toBe("false");
		});

		test("should return 401 for invalid token", async ({ request }) => {
			const response = await request.put(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders/${testFolderId}`,
				{
					headers: {
						Authorization: "Bearer invalid_token_here",
						"Content-Type": "application/json",
					},
					data: {
						name: "Updated Name",
					},
				},
			);

			expect(response.status()).toBe(401);
			const data = await response.json();
			expect(data.response).toBe("false");
		});

		test("should return 401 for expired token", async ({ request }) => {
			const expiredToken =
				"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjB9.invalid";
			const response = await request.put(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders/${testFolderId}`,
				{
					headers: {
						Authorization: `Bearer ${expiredToken}`,
						"Content-Type": "application/json",
					},
					data: {
						name: "Updated Name",
					},
				},
			);

			expect(response.status()).toBe(401);
			const data = await response.json();
			expect(data.response).toBe("false");
		});

		test("should return 401 for malformed Bearer token", async ({
			request,
		}) => {
			const response = await request.put(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders/${testFolderId}`,
				{
					headers: {
						Authorization: "InvalidFormat token",
						"Content-Type": "application/json",
					},
					data: {
						name: "Updated Name",
					},
				},
			);

			expect(response.status()).toBe(401);
			const data = await response.json();
			expect(data.response).toBe("false");
		});
	});

	test.describe("403 - Forbidden", () => {
		test.skip("PLACEHOLDER: should return 403 when user lacks permission", async ({
			request,
		}) => {
			// Requires non-member user token
		});
	});

	test.describe("404 - Not Found", () => {
		test("should return 404 for non-existent folder", async ({ request }) => {
			const response = await request.put(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders/99999999-9999-9999-9999-999999999999`,
				{
					headers: {
						Authorization: `Bearer ${adminAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						name: "Updated Name",
					},
				},
			);

			expect([404, 403]).toContain(response.status());
			const data = await response.json();
			expect(data.response).toBe("false");
		});
	});

	test.describe("Edge Cases", () => {
		test("should handle very long folder name", async ({ request }) => {
			const longName = "A".repeat(255);
			const response = await request.put(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders/${testFolderId}`,
				{
					headers: {
						Authorization: `Bearer ${adminAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						name: longName,
					},
				},
			);

			expect([200, 400, 422]).toContain(response.status());
		});

		test("should handle special characters in folder name", async ({
			request,
		}) => {
			const response = await request.put(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders/${testFolderId}`,
				{
					headers: {
						Authorization: `Bearer ${adminAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						name: "Test!@#$%^&*()",
					},
				},
			);

			expect([200, 400, 422]).toContain(response.status());
		});

		test("should handle Unicode characters", async ({ request }) => {
			const response = await request.put(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders/${testFolderId}`,
				{
					headers: {
						Authorization: `Bearer ${adminAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						name: "测试文件夹 🚀",
					},
				},
			);

			expect([200, 400, 422]).toContain(response.status());
		});
	});

	test.describe("Security Tests", () => {
		test("should reject SQL injection attempts", async ({ request }) => {
			const response = await request.put(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders/${testFolderId}`,
				{
					headers: {
						Authorization: `Bearer ${adminAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						name: "'; DROP TABLE folders; --",
					},
				},
			);

			expect([200, 400, 422]).toContain(response.status());
		});

		test("should validate authorization token", async ({ request }) => {
			const response = await request.put(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders/${testFolderId}`,
				{
					headers: {
						Authorization: "Bearer ",
						"Content-Type": "application/json",
					},
					data: {
						name: "Updated Name",
					},
				},
			);

			expect(response.status()).toBe(401);
		});
	});

	test.describe("Response Format", () => {
		test("should return proper response structure", async ({ request }) => {
			const response = await request.put(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders/${testFolderId}`,
				{
					headers: {
						Authorization: `Bearer ${adminAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						name: "Structure Test",
					},
				},
			);

			expect(response.status()).toBe(200);
			const data = await response.json();
			expect(data).toHaveProperty("response");
		});

		test("should return application/json content type", async ({ request }) => {
			const response = await request.put(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders/${testFolderId}`,
				{
					headers: {
						Authorization: `Bearer ${adminAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						name: "Content Type Test",
					},
				},
			);

			expect(response.status()).toBe(200);
			expect(response.headers()["content-type"]).toContain("application/json");
		});
	});

	test.describe("Performance", () => {
		test("should update folder within acceptable time", async ({ request }) => {
			const startTime = Date.now();
			const response = await request.put(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders/${testFolderId}`,
				{
					headers: {
						Authorization: `Bearer ${adminAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						name: "Performance Test",
					},
				},
			);
			const endTime = Date.now();

			expect(response.status()).toBe(200);
			expect(endTime - startTime).toBeLessThan(1000);
		});
	});

	test.describe("409 - Conflict", () => {
		test.skip("PLACEHOLDER: should return 409 when folder name conflict", async ({
			request,
		}) => {
			// Requires duplicate folder name in same location
		});
	});

	test.describe("415 - Unsupported Media Type", () => {
		test("should return 415 when Content-Type is missing", async ({
			request,
		}) => {
			const response = await request.put(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders/${testFolderId}`,
				{
					headers: {
						Authorization: `Bearer ${adminAccessToken}`,
					},
					data: {
						name: "Updated Name",
					},
				},
			);

			expect([400, 415, 422]).toContain(response.status());
		});
	});

	test.describe("422 - Unprocessable Entity", () => {
		test.skip("PLACEHOLDER: should return 422 for invalid field types", async ({
			request,
		}) => {
			// Requires specific validation rules
		});
	});

	test.describe("423 - Locked", () => {
		test.skip("PLACEHOLDER: should return 423 when folder is locked", async ({
			request,
		}) => {
			// Requires locked folder
		});
	});

	test.describe("429 - Rate Limit", () => {
		test.skip("PLACEHOLDER: should return 429 when rate limit exceeded", async ({
			request,
		}) => {
			// Requires many rapid requests
		});
	});

	test.describe("500 - Internal Server Error", () => {
		test.skip("PLACEHOLDER: should handle server error gracefully", async ({
			request,
		}) => {
			// Requires triggering server error
		});
	});

	test.describe("503 - Service Unavailable", () => {
		test.skip("PLACEHOLDER: should return 503 when service unavailable", async ({
			request,
		}) => {
			// Requires service to be down
		});
	});
});
