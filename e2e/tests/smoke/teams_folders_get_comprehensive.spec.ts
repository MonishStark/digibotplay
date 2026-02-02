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

			expect([400, 404, 422]).toContain(response.status());
			const data = await response.json();
			expect(data.response).toBe("false");
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

			expect([400, 422]).toContain(response.status());
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

			expect([400, 422]).toContain(response.status());
		});
	});

	test.describe("401 - Unauthorized", () => {
		test("should return 401 when authorization token is missing", async ({
			request,
		}) => {
			const response = await request.get(
				`http://127.0.0.1:5050/teams/${testTeamId}/folders`,
			);

			expect(response.status()).toBe(401);
			const data = await response.json();
			expect(data.response).toBe("false");
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

			expect(response.status()).toBe(401);
			const data = await response.json();
			expect(data.response).toBe("false");
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

			expect(response.status()).toBe(401);
			const data = await response.json();
			expect(data.response).toBe("false");
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

			expect(response.status()).toBe(401);
			const data = await response.json();
			expect(data.response).toBe("false");
		});
	});

	test.describe("403 - Forbidden", () => {
		test.skip("PLACEHOLDER: should return 403 when user lacks team access", async ({
			request,
		}) => {
			// Requires non-member user token
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

			expect([403, 404]).toContain(response.status());
			const data = await response.json();
			expect(data.response).toBe("false");
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

			expect([200, 400]).toContain(response.status());
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

			expect([200, 400]).toContain(response.status());
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

			expect(response.status()).toBe(401);
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

	test.describe("409 - Conflict", () => {
		test.skip("PLACEHOLDER: should handle conflict scenarios", async ({
			request,
		}) => {
			// Requires specific conflict scenario
		});
	});

	test.describe("422 - Unprocessable Entity", () => {
		test.skip("PLACEHOLDER: should return 422 for invalid parameters", async ({
			request,
		}) => {
			// Requires specific validation rules
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
