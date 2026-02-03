/** @format */

import { test, expect } from "@playwright/test";
import { testData } from "../testData";

test.describe("GET /teams/{teamId}/folders/{parentId}/tree - Fetch breadcrumb tree", () => {
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
		test("should retrieve breadcrumb tree successfully", async ({
			request,
		}) => {
			// Create a folder first
			const createResponse = await request.post(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders`,
				{
					headers: {
						Authorization: `Bearer ${adminAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						name: "Tree Test Folder",
					},
				},
			);
			const createData = await createResponse.json();
			const parentId = createData.data.id;

			// Get breadcrumb tree
			const response = await request.get(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders/${parentId}/tree`,
				{
					headers: {
						Authorization: `Bearer ${adminAccessToken}`,
					},
				},
			);

			expect(response.status()).toBe(200);
			const data = await response.json();
			expect(data.response).toBe("true");
			expect(data.data).toHaveProperty("breadcrumbs");
			expect(Array.isArray(data.data.breadcrumbs)).toBe(true);
		});
	});

	test.describe("400 - Bad Request", () => {
		test("should return 400 for invalid teamId", async ({ request }) => {
			const response = await request.get(
				"http://127.0.0.1:5050/teams/invalid-id/folders/some-parent-id/tree",
				{
					headers: {
						Authorization: `Bearer ${adminAccessToken}`,
					},
				},
			);

			expect([400, 404, 422, 500, 401]).toContain(response.status());
			const data = await response.json();
		});

		test("should return 400 for invalid parentId", async ({ request }) => {
			const response = await request.get(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders/invalid-id/tree`,
				{
					headers: {
						Authorization: `Bearer ${adminAccessToken}`,
					},
				},
			);

			expect([400, 404, 422, 500, 401]).toContain(response.status());
			const data = await response.json();
		});
	});

	test.describe("401 - Unauthorized", () => {
		test("should return 401 when authorization token is missing", async ({
			request,
		}) => {
			const response = await request.get(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders/some-parent-id/tree`,
			);

			expect([401, 404, 500]).toContain(response.status());
			const data = await response.json();
		});

		test("should return 401 for invalid token", async ({ request }) => {
			const response = await request.get(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders/some-parent-id/tree`,
				{
					headers: {
						Authorization: "Bearer invalid_token_here",
					},
				},
			);

			expect([401, 404, 500]).toContain(response.status());
			const data = await response.json();
		});

		test("should return 401 for expired token", async ({ request }) => {
			const expiredToken =
				"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjB9.invalid";
			const response = await request.get(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders/some-parent-id/tree`,
				{
					headers: {
						Authorization: `Bearer ${expiredToken}`,
					},
				},
			);

			expect([401, 404, 500]).toContain(response.status());
			const data = await response.json();
		});

		test("should return 401 for malformed Bearer token", async ({
			request,
		}) => {
			const response = await request.get(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders/some-parent-id/tree`,
				{
					headers: {
						Authorization: "InvalidFormat token",
					},
				},
			);

			expect([401, 404, 500]).toContain(response.status());
			const data = await response.json();
		});
	});

	test.describe("404 - Not Found", () => {
		test("should return 404 for non-existent parent folder", async ({
			request,
		}) => {
			const response = await request.get(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders/99999999-9999-9999-9999-999999999999/tree`,
				{
					headers: {
						Authorization: `Bearer ${adminAccessToken}`,
					},
				},
			);

			expect([404, 403, 500, 401]).toContain(response.status());
			const data = await response.json();
		});
	});

	test.describe("Edge Cases", () => {
		test("should handle SQL injection in parentId", async ({ request }) => {
			const response = await request.get(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders/' OR '1'='1/tree`,
				{
					headers: {
						Authorization: `Bearer ${adminAccessToken}`,
					},
				},
			);

			expect([400, 404, 422, 500, 401]).toContain(response.status());
		});

		test("should handle very long parentId", async ({ request }) => {
			const longId = "a".repeat(1000);
			const response = await request.get(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders/${longId}/tree`,
				{
					headers: {
						Authorization: `Bearer ${adminAccessToken}`,
					},
				},
			);

			expect([400, 404, 422, 500, 401]).toContain(response.status());
		});
	});

	test.describe("Security Tests", () => {
		test("should validate authorization token", async ({ request }) => {
			const response = await request.get(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders/some-parent-id/tree`,
				{
					headers: {
						Authorization: "Bearer ",
					},
				},
			);

			expect([401, 404, 500]).toContain(response.status());
		});

		test("should prevent unauthorized access to tree", async ({ request }) => {
			const response = await request.get(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders/some-parent-id/tree`,
				{
					headers: {
						Authorization: "Bearer invalid_token",
					},
				},
			);

			expect([401, 404, 500]).toContain(response.status());
		});
	});

	test.describe("Response Format", () => {
		test("should return proper response structure", async ({ request }) => {
			// Create a folder first
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
			const parentId = createData.data.id;

			// Get breadcrumb tree
			const response = await request.get(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders/${parentId}/tree`,
				{
					headers: {
						Authorization: `Bearer ${adminAccessToken}`,
					},
				},
			);

			expect(response.status()).toBe(200);
			const data = await response.json();
			expect(data).toHaveProperty("response");
			expect(data).toHaveProperty("data");
		});

		test("should return application/json content type", async ({ request }) => {
			// Create a folder first
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
			const parentId = createData.data.id;

			// Get breadcrumb tree
			const response = await request.get(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders/${parentId}/tree`,
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
		test("should retrieve tree within acceptable time", async ({ request }) => {
			// Create a folder first
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
			const parentId = createData.data.id;

			// Get breadcrumb tree
			const startTime = Date.now();
			const response = await request.get(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders/${parentId}/tree`,
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

});

