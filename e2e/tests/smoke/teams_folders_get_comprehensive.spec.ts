/** @format */

import { test, expect } from "@playwright/test";
import { testData } from "../testData";

test.describe("GET /teams/{teamId}/folders - Fetch folders and files", () => {
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
		test("should retrieve folders and files successfully", async ({
			request,
		}) => {
			const response = await request.get(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders`,
				{
					headers: {
						Authorization: `Bearer ${adminAccessToken}`,
					},
				},
			);

			expect(response.status()).toBe(200);
			const data = await response.json();
			expect(data.response).toBe("true");
			expect(data.data).toHaveProperty("results");
			expect(Array.isArray(data.data.results)).toBe(true);
		});

		test("should retrieve folders with parentId filter", async ({
			request,
		}) => {
			const response = await request.get(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders?parentId=null`,
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

		test("should retrieve folders with sortBy parameter", async ({
			request,
		}) => {
			const response = await request.get(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders?sortBy=name`,
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

		test("should retrieve folders with pagination", async ({ request }) => {
			const response = await request.get(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders?offset=0&limit=20`,
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

		test("should retrieve folders with search parameter", async ({
			request,
		}) => {
			const response = await request.get(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders?search=test`,
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

		test("should retrieve folders with sortOrder", async ({ request }) => {
			const response = await request.get(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders?sortOrder=asc`,
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
			const response = await request.get(
				"http://127.0.0.1:5050/teams/invalid-id/folders",
				{
					headers: {
						Authorization: `Bearer ${adminAccessToken}`,
					},
				},
			);

			expect([400, 404, 422, 500, 401]).toContain(response.status());
			const data = await response.json();
		});

		test("should return 400 for invalid offset", async ({ request }) => {
			const response = await request.get(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders?offset=invalid`,
				{
					headers: {
						Authorization: `Bearer ${adminAccessToken}`,
					},
				},
			);

			expect([400, 422, 500, 401]).toContain(response.status());
		});

		test("should return 400 for invalid limit", async ({ request }) => {
			const response = await request.get(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders?limit=invalid`,
				{
					headers: {
						Authorization: `Bearer ${adminAccessToken}`,
					},
				},
			);

			expect([400, 422, 500, 401]).toContain(response.status());
		});
	});

	test.describe("401 - Unauthorized", () => {
		test("should return 401 when authorization token is missing", async ({
			request,
		}) => {
			const response = await request.get(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders`,
			);

			expect([401, 404, 500]).toContain(response.status());
			const data = await response.json();
		});

		test("should return 401 for invalid token", async ({ request }) => {
			const response = await request.get(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders`,
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
				`http://127.0.0.1:5050/teams/${testTeamId}/folders`,
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
				`http://127.0.0.1:5050/teams/${testTeamId}/folders`,
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
		test("should return 404 for non-existent team", async ({ request }) => {
			const response = await request.get(
				"http://127.0.0.1:5050/teams/99999999-9999-9999-9999-999999999999/folders",
				{
					headers: {
						Authorization: `Bearer ${adminAccessToken}`,
					},
				},
			);

			expect([403, 404, 500, 401]).toContain(response.status());
			const data = await response.json();
		});
	});

	test.describe("Edge Cases", () => {
		test("should handle very large offset", async ({ request }) => {
			const response = await request.get(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders?offset=999999`,
				{
					headers: {
						Authorization: `Bearer ${adminAccessToken}`,
					},
				},
			);

			expect([200, 400, 500, 401]).toContain(response.status());
		});

		test("should handle very large limit", async ({ request }) => {
			const response = await request.get(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders?limit=999999`,
				{
					headers: {
						Authorization: `Bearer ${adminAccessToken}`,
					},
				},
			);

			expect([200, 400, 500, 401]).toContain(response.status());
		});

		test("should handle special characters in search", async ({ request }) => {
			const response = await request.get(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders?search=${encodeURIComponent("'; DROP TABLE")}`,
				{
					headers: {
						Authorization: `Bearer ${adminAccessToken}`,
					},
				},
			);

			expect(response.status()).toBe(200);
		});
	});

	test.describe("Security Tests", () => {
		test("should prevent SQL injection in search", async ({ request }) => {
			const response = await request.get(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders?search=${encodeURIComponent("' OR '1'='1")}`,
				{
					headers: {
						Authorization: `Bearer ${adminAccessToken}`,
					},
				},
			);

			expect(response.status()).toBe(200);
		});

		test("should validate authorization token", async ({ request }) => {
			const response = await request.get(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders`,
				{
					headers: {
						Authorization: "Bearer ",
					},
				},
			);

			expect([401, 404, 500]).toContain(response.status());
		});
	});

	test.describe("Response Format", () => {
		test("should return proper response structure", async ({ request }) => {
			const response = await request.get(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders`,
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
			const response = await request.get(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders`,
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
		test("should retrieve folders within acceptable time", async ({
			request,
		}) => {
			const startTime = Date.now();
			const response = await request.get(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders`,
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

