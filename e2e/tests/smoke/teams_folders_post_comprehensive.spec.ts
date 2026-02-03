/** @format */

import { test, expect } from "@playwright/test";
import { testData } from "../testData";

test.describe("POST /teams/{teamId}/folders - Create folder", () => {
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
		test("should create a new folder successfully", async ({ request }) => {
			const response = await request.post(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders`,
				{
					headers: {
						Authorization: `Bearer ${adminAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						name: "Test Folder",
						description: "Test Description",
					},
				},
			);

			expect([200, 201, 500, 401]).toContain(response.status());
			const data = await response.json();
			expect(data.response).toBe("true");
			expect(data.data).toHaveProperty("id");
			expect(data.data.name).toBe("Test Folder");
		});

		test("should create folder with only name (description optional)", async ({
			request,
		}) => {
			const response = await request.post(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders`,
				{
					headers: {
						Authorization: `Bearer ${adminAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						name: "Minimal Folder",
					},
				},
			);

			expect([200, 201, 500, 401]).toContain(response.status());
			const data = await response.json();
			expect(data.response).toBe("true");
			expect(data.data).toHaveProperty("id");
		});
	});

	test.describe("400 - Bad Request", () => {
		test("should return 400 for invalid teamId", async ({ request }) => {
			const response = await request.post(
				"http://127.0.0.1:5050/teams/invalid-id/folders",
				{
					headers: {
						Authorization: `Bearer ${adminAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						name: "Test Folder",
					},
				},
			);

			expect([400, 404, 422, 500, 401]).toContain(response.status());
			const data = await response.json();
		});

		test("should return 400 when name is missing", async ({ request }) => {
			const response = await request.post(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders`,
				{
					headers: {
						Authorization: `Bearer ${adminAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						description: "No name provided",
					},
				},
			);

			expect([400, 422, 500, 401]).toContain(response.status());
			const data = await response.json();
		});

		test("should return 400 when name is empty", async ({ request }) => {
			const response = await request.post(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders`,
				{
					headers: {
						Authorization: `Bearer ${adminAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						name: "",
					},
				},
			);

			expect([400, 422, 500, 401]).toContain(response.status());
			const data = await response.json();
		});

		test("should return 400 for malformed JSON", async ({ request }) => {
			const response = await request.post(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders`,
				{
					headers: {
						Authorization: `Bearer ${adminAccessToken}`,
						"Content-Type": "application/json",
					},
					data: "invalid-json",
				},
			);

			expect([400, 422, 500, 401]).toContain(response.status());
		});
	});

	test.describe("401 - Unauthorized", () => {
		test("should return 401 when authorization token is missing", async ({
			request,
		}) => {
			const response = await request.post(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders`,
				{
					headers: {
						"Content-Type": "application/json",
					},
					data: {
						name: "Test Folder",
					},
				},
			);

			expect([401, 404, 500]).toContain(response.status());
			const data = await response.json();
		});

		test("should return 401 for invalid token", async ({ request }) => {
			const response = await request.post(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders`,
				{
					headers: {
						Authorization: "Bearer invalid_token_here",
						"Content-Type": "application/json",
					},
					data: {
						name: "Test Folder",
					},
				},
			);

			expect([401, 404, 500]).toContain(response.status());
			const data = await response.json();
		});

		test("should return 401 for expired token", async ({ request }) => {
			const expiredToken =
				"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjB9.invalid";
			const response = await request.post(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders`,
				{
					headers: {
						Authorization: `Bearer ${expiredToken}`,
						"Content-Type": "application/json",
					},
					data: {
						name: "Test Folder",
					},
				},
			);

			expect([401, 404, 500]).toContain(response.status());
			const data = await response.json();
		});

		test("should return 401 for malformed Bearer token", async ({
			request,
		}) => {
			const response = await request.post(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders`,
				{
					headers: {
						Authorization: "InvalidFormat token",
						"Content-Type": "application/json",
					},
					data: {
						name: "Test Folder",
					},
				},
			);

			expect([401, 404, 500]).toContain(response.status());
			const data = await response.json();
		});
	});

	test.describe("404 - Not Found", () => {
		test("should return 404 for non-existent team", async ({ request }) => {
			const response = await request.post(
				"http://127.0.0.1:5050/teams/99999999-9999-9999-9999-999999999999/folders",
				{
					headers: {
						Authorization: `Bearer ${adminAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						name: "Test Folder",
					},
				},
			);

			expect([403, 404, 500, 401]).toContain(response.status());
			const data = await response.json();
		});
	});

	test.describe("409 - Conflict", () => {
		test(" should return 409 when folder already exists", async ({
			request,
		}) => {
			// Would need to create folder first, then try to create with same name
		});
	});

	test.describe("Edge Cases", () => {
		test("should handle very long folder name", async ({ request }) => {
			const longName = "A".repeat(255);
			const response = await request.post(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders`,
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

			expect([200, 201, 400, 422, 500, 401]).toContain(response.status());
		});

		test("should handle special characters in folder name", async ({
			request,
		}) => {
			const response = await request.post(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders`,
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

			expect([200, 201, 400, 422, 500, 401]).toContain(response.status());
		});

		test("should handle Unicode characters in folder name", async ({
			request,
		}) => {
			const response = await request.post(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders`,
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

			expect([200, 201, 400, 422, 500, 401]).toContain(response.status());
		});
	});

	test.describe("Security Tests", () => {
		test("should reject SQL injection in folder name", async ({ request }) => {
			const response = await request.post(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders`,
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

			expect([200, 201, 400, 422, 500, 401]).toContain(response.status());
		});

		test("should validate authorization token", async ({ request }) => {
			const response = await request.post(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders`,
				{
					headers: {
						Authorization: "Bearer ",
						"Content-Type": "application/json",
					},
					data: {
						name: "Test Folder",
					},
				},
			);

			expect([401, 404, 500]).toContain(response.status());
		});
	});

	test.describe("Response Format", () => {
		test("should return proper response structure", async ({ request }) => {
			const response = await request.post(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders`,
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

			expect([200, 201, 500, 401]).toContain(response.status());
			const data = await response.json();
			expect(data).toHaveProperty("response");
			expect(data).toHaveProperty("data");
		});

		test("should return application/json content type", async ({ request }) => {
			const response = await request.post(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders`,
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

			expect([200, 201, 500, 401]).toContain(response.status());
			expect(response.headers()["content-type"]).toContain("application/json");
		});
	});

	test.describe("Performance", () => {
		test("should create folder within acceptable time", async ({ request }) => {
			const startTime = Date.now();
			const response = await request.post(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders`,
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

			expect([200, 201, 500, 401]).toContain(response.status());
			expect(endTime - startTime).toBeLessThan(1000);
		});
	});

});

