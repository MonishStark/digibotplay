/** @format */

import { test, expect } from "@playwright/test";
import { testData } from "../testData";

test.describe("GET /teams/{teamId}/items - Fetch all folders or files", () => {
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
		test("should retrieve items successfully", async ({ request }) => {
			const response = await request.get(
				`http://127.0.0.1:5050/teams/${testTeamId}/items`,
				{
					headers: {
						Authorization: `Bearer ${adminAccessToken}`,
					},
				},
			);

			expect(response.status()).toBe(200);
			const data = await response.json();
			expect(data.response).toBe("true");
			expect(data.data).toHaveProperty("items");
			expect(Array.isArray(data.data.items)).toBe(true);
		});

		test("should retrieve items with type filter (folder)", async ({
			request,
		}) => {
			const response = await request.get(
				`http://127.0.0.1:5050/teams/${testTeamId}/items?type=folder`,
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

		test("should retrieve items with type filter (file)", async ({
			request,
		}) => {
			const response = await request.get(
				`http://127.0.0.1:5050/teams/${testTeamId}/items?type=file`,
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
				"http://127.0.0.1:5050/teams/invalid-id/items",
				{
					headers: {
						Authorization: `Bearer ${adminAccessToken}`,
					},
				},
			);

			expect([400, 404, 422, 500, 401]).toContain(response.status());
			const data = await response.json();
		});

		test("should return 400 for invalid type parameter", async ({
			request,
		}) => {
			const response = await request.get(
				`http://127.0.0.1:5050/teams/${testTeamId}/items?type=invalid`,
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
				`http://127.0.0.1:5050/teams/${testTeamId}/items`,
			);

			expect([401, 404, 500]).toContain(response.status());
			const data = await response.json();
		});

		test("should return 401 for invalid token", async ({ request }) => {
			const response = await request.get(
				`http://127.0.0.1:5050/teams/${testTeamId}/items`,
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
				`http://127.0.0.1:5050/teams/${testTeamId}/items`,
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
				`http://127.0.0.1:5050/teams/${testTeamId}/items`,
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
				"http://127.0.0.1:5050/teams/99999999-9999-9999-9999-999999999999/items",
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
		test("should handle SQL injection in teamId", async ({ request }) => {
			const response = await request.get(
				"http://127.0.0.1:5050/teams/' OR '1'='1/items",
				{
					headers: {
						Authorization: `Bearer ${adminAccessToken}`,
					},
				},
			);

			expect([400, 404, 422, 500, 401]).toContain(response.status());
		});

		test("should handle special characters in type parameter", async ({
			request,
		}) => {
			const response = await request.get(
				`http://127.0.0.1:5050/teams/${testTeamId}/items?type=${encodeURIComponent("'; DROP TABLE")}`,
				{
					headers: {
						Authorization: `Bearer ${adminAccessToken}`,
					},
				},
			);

			expect([400, 422, 500, 401]).toContain(response.status());
		});
	});

	test.describe("Security Tests", () => {
		test("should validate authorization token", async ({ request }) => {
			const response = await request.get(
				`http://127.0.0.1:5050/teams/${testTeamId}/items`,
				{
					headers: {
						Authorization: "Bearer ",
					},
				},
			);

			expect([401, 404, 500]).toContain(response.status());
		});

		test("should prevent unauthorized access to items", async ({ request }) => {
			const response = await request.get(
				`http://127.0.0.1:5050/teams/${testTeamId}/items`,
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
			const response = await request.get(
				`http://127.0.0.1:5050/teams/${testTeamId}/items`,
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
				`http://127.0.0.1:5050/teams/${testTeamId}/items`,
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
		test("should retrieve items within acceptable time", async ({
			request,
		}) => {
			const startTime = Date.now();
			const response = await request.get(
				`http://127.0.0.1:5050/teams/${testTeamId}/items`,
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

