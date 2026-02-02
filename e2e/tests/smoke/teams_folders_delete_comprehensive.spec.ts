/** @format */

import { test, expect } from "@playwright/test";
import { testData } from "../testData";

test.describe("DELETE /teams/{teamId}/folders/{folderId} - Delete folder", () => {
	let adminAccessToken: string;
	const testTeamId = testData.teams.team3.id;

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
	});

	test.describe("200 - Success", () => {
		test("should delete folder successfully", async ({ request }) => {
			// Create a folder to delete
			const createResponse = await request.post(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders`,
				{
					headers: {
						Authorization: `Bearer ${adminAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						name: "Folder to Delete",
					},
				},
			);
			const createData = await createResponse.json();
			const folderId = createData.data.id;

			// Delete the folder
			const response = await request.delete(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders/${folderId}`,
				{
					headers: {
						Authorization: `Bearer ${adminAccessToken}`,
					},
				},
			);

			expect(response.status()).toBe(200);
			const data = await response.json();
			expect(data.response).toBe("true");
		});

		test("should permanently delete folder when deletePermanently is true", async ({
			request,
		}) => {
			// Create a folder to delete
			const createResponse = await request.post(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders`,
				{
					headers: {
						Authorization: `Bearer ${adminAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						name: "Folder to Permanently Delete",
					},
				},
			);
			const createData = await createResponse.json();
			const folderId = createData.data.id;

			// Permanently delete the folder
			const response = await request.delete(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders/${folderId}?deletePermanently=true`,
				{
					headers: {
						Authorization: `Bearer ${adminAccessToken}`,
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
			const response = await request.delete(
				"http://127.0.0.1:5050/teams/invalid-id/folders/some-folder-id",
				{
					headers: {
						Authorization: `Bearer ${adminAccessToken}`,
					},
				},
			);

			expect([400, 404, 422]).toContain(response.status());
			const data = await response.json();
			expect(data.response).toBe("false");
		});

		test("should return 400 for invalid folderId", async ({ request }) => {
			const response = await request.delete(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders/invalid-id`,
				{
					headers: {
						Authorization: `Bearer ${adminAccessToken}`,
					},
				},
			);

			expect([400, 404, 422]).toContain(response.status());
			const data = await response.json();
			expect(data.response).toBe("false");
		});
	});

	test.describe("401 - Unauthorized", () => {
		test("should return 401 when authorization token is missing", async ({
			request,
		}) => {
			const response = await request.delete(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders/some-folder-id`,
			);

			expect(response.status()).toBe(401);
			const data = await response.json();
			expect(data.response).toBe("false");
		});

		test("should return 401 for invalid token", async ({ request }) => {
			const response = await request.delete(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders/some-folder-id`,
				{
					headers: {
						Authorization: "Bearer invalid_token_here",
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
			const response = await request.delete(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders/some-folder-id`,
				{
					headers: {
						Authorization: `Bearer ${expiredToken}`,
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
			const response = await request.delete(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders/some-folder-id`,
				{
					headers: {
						Authorization: "InvalidFormat token",
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
			const response = await request.delete(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders/99999999-9999-9999-9999-999999999999`,
				{
					headers: {
						Authorization: `Bearer ${adminAccessToken}`,
					},
				},
			);

			expect([404, 403]).toContain(response.status());
			const data = await response.json();
			expect(data.response).toBe("false");
		});
	});

	test.describe("Edge Cases", () => {
		test("should handle SQL injection in folderId", async ({ request }) => {
			const response = await request.delete(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders/' OR '1'='1`,
				{
					headers: {
						Authorization: `Bearer ${adminAccessToken}`,
					},
				},
			);

			expect([400, 404, 422]).toContain(response.status());
		});

		test("should handle very long folderId", async ({ request }) => {
			const longId = "a".repeat(1000);
			const response = await request.delete(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders/${longId}`,
				{
					headers: {
						Authorization: `Bearer ${adminAccessToken}`,
					},
				},
			);

			expect([400, 404, 422]).toContain(response.status());
		});
	});

	test.describe("Security Tests", () => {
		test("should validate authorization token", async ({ request }) => {
			const response = await request.delete(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders/some-folder-id`,
				{
					headers: {
						Authorization: "Bearer ",
					},
				},
			);

			expect(response.status()).toBe(401);
		});

		test("should prevent unauthorized folder deletion", async ({ request }) => {
			const response = await request.delete(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders/some-folder-id`,
				{
					headers: {
						Authorization: "Bearer invalid_token",
					},
				},
			);

			expect(response.status()).toBe(401);
		});
	});

	test.describe("Response Format", () => {
		test("should return proper response structure", async ({ request }) => {
			// Create a folder to delete
			const createResponse = await request.post(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders`,
				{
					headers: {
						Authorization: `Bearer ${adminAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						name: "Structure Test Folder",
					},
				},
			);
			const createData = await createResponse.json();
			const folderId = createData.data.id;

			// Delete the folder
			const response = await request.delete(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders/${folderId}`,
				{
					headers: {
						Authorization: `Bearer ${adminAccessToken}`,
					},
				},
			);

			expect(response.status()).toBe(200);
			const data = await response.json();
			expect(data).toHaveProperty("response");
		});

		test("should return application/json content type", async ({ request }) => {
			// Create a folder to delete
			const createResponse = await request.post(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders`,
				{
					headers: {
						Authorization: `Bearer ${adminAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						name: "Content Type Test Folder",
					},
				},
			);
			const createData = await createResponse.json();
			const folderId = createData.data.id;

			// Delete the folder
			const response = await request.delete(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders/${folderId}`,
				{
					headers: {
						Authorization: `Bearer ${adminAccessToken}`,
					},
				},
			);

			expect(response.status()).toBe(200);
			expect(response.headers()["content-type"]).toContain("application/json");
		});
	});

	test.describe("Performance", () => {
		test("should delete folder within acceptable time", async ({ request }) => {
			// Create a folder to delete
			const createResponse = await request.post(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders`,
				{
					headers: {
						Authorization: `Bearer ${adminAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						name: "Performance Test Folder",
					},
				},
			);
			const createData = await createResponse.json();
			const folderId = createData.data.id;

			// Delete the folder
			const startTime = Date.now();
			const response = await request.delete(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders/${folderId}`,
				{
					headers: {
						Authorization: `Bearer ${adminAccessToken}`,
					},
				},
			);
			const endTime = Date.now();

			expect(response.status()).toBe(200);
			expect(endTime - startTime).toBeLessThan(1000);
		});
	});

	test.describe("404 - Invalid Parent", () => {
		test.skip("PLACEHOLDER: should return 404 when parent is invalid", async ({
			request,
		}) => {
			// Requires specific parent validation scenario
		});
	});

	test.describe("409 - Conflict", () => {
		test.skip("PLACEHOLDER: should return 409 when folder cannot be deleted", async ({
			request,
		}) => {
			// Requires folder with child items or in use
		});
	});

	test.describe("426 - Conflict Creating Folder", () => {
		test.skip("PLACEHOLDER: should handle folder creation conflict", async ({
			request,
		}) => {
			// Specific to folder operations
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
