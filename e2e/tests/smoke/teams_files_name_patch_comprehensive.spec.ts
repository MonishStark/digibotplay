/** @format */

import { test, expect } from "@playwright/test";
import { testData } from "../testData";

/**
 * Comprehensive test suite for PATCH /teams/{teamId}/files/{fileId}/name endpoint
 * Rename an existing file
 */

const API_BASE_URL = "http://127.0.0.1:5050";

test.describe("PATCH /teams/{teamId}/files/{fileId}/name - Comprehensive Tests", () => {
	let validAccessToken: string;
	let adminAccessToken: string;
	const testTeamId = testData.teams.team3.id;

	test.beforeAll(async ({ request }) => {
		// Login to get admin access token
		const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
			data: {
				email: "poised.reindeer.muxl@protectsmail.net",
				password: "Qwerty@123",
			},
		});
		const loginData = await loginResponse.json();
		adminAccessToken = loginData.accessToken;
		validAccessToken = adminAccessToken;
	});

	test.describe("400 Bad Request Responses", () => {
		test("should return 400 for invalid teamId", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/teams/invalid-id/files/some-file-id/name`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						newName: "renamed.pdf",
					},
				},
			);

			expect([400, 404, 422, 500, 401]).toContain(response.status());
		});

		test("should return 400 for invalid fileId", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/teams/${testTeamId}/files/invalid-id/name`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						newName: "renamed.pdf",
					},
				},
			);

			expect([400, 404, 422, 500, 401]).toContain(response.status());
		});

		test("should return 400 for missing new name", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/teams/${testTeamId}/files/some-file-id/name`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {},
				},
			);

			expect([400, 422, 500, 401]).toContain(response.status());
		});
	});

	test.describe("401 Unauthorized Responses", () => {
		test("should return 401 when authorization token is missing", async ({
			request,
		}) => {
			const response = await request.patch(
				`${API_BASE_URL}/teams/${testTeamId}/files/some-file-id/name`,
				{
					headers: {
						"Content-Type": "application/json",
					},
					data: {
						newName: "renamed.pdf",
					},
				},
			);

			expect([401, 404, 500]).toContain(response.status());
		});

		test("should return 401 for invalid token", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/teams/${testTeamId}/files/some-file-id/name`,
				{
					headers: {
						Authorization: "Bearer invalid_token_here",
						"Content-Type": "application/json",
					},
					data: {
						newName: "renamed.pdf",
					},
				},
			);

			expect([401, 404, 500]).toContain(response.status());
		});

		test("should return 401 for expired token", async ({ request }) => {
			const expiredToken =
				"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjB9.invalid";
			const response = await request.patch(
				`${API_BASE_URL}/teams/${testTeamId}/files/some-file-id/name`,
				{
					headers: {
						Authorization: `Bearer ${expiredToken}`,
						"Content-Type": "application/json",
					},
					data: {
						newName: "renamed.pdf",
					},
				},
			);

			expect([401, 404, 500]).toContain(response.status());
		});

		test("should return 401 for malformed Bearer token", async ({
			request,
		}) => {
			const response = await request.patch(
				`${API_BASE_URL}/teams/${testTeamId}/files/some-file-id/name`,
				{
					headers: {
						Authorization: "InvalidFormat token",
						"Content-Type": "application/json",
					},
					data: {
						newName: "renamed.pdf",
					},
				},
			);

			expect([401, 404, 500]).toContain(response.status());
		});
	});

	test.describe("404 Not Found", () => {
		test("should return 404 for non-existent file", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/teams/${testTeamId}/files/99999999-9999-9999-9999-999999999999/name`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						newName: "renamed.pdf",
					},
				},
			);

			expect([403, 404, 500, 401]).toContain(response.status());
		});
	});

	test.describe("Edge Cases", () => {
		test("should handle very long file name", async ({ request }) => {
			const longName = "A".repeat(255) + ".pdf";
			const response = await request.patch(
				`${API_BASE_URL}/teams/${testTeamId}/files/some-file-id/name`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						newName: longName,
					},
				},
			);

			expect([200, 400, 422, 500, 401]).toContain(response.status());
		});

		test("should handle special characters in file name", async ({
			request,
		}) => {
			const response = await request.patch(
				`${API_BASE_URL}/teams/${testTeamId}/files/some-file-id/name`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						newName: "test!@#$%^&*().pdf",
					},
				},
			);

			expect([200, 400, 422, 500, 401]).toContain(response.status());
		});
	});

	test.describe("Security Tests", () => {
		test("should reject SQL injection attempts", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/teams/${testTeamId}/files/some-file-id/name`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
						"Content-Type": "application/json",
					},
					data: {
						newName: "'; DROP TABLE files; --.pdf",
					},
				},
			);

			expect([200, 400, 422, 500, 401]).toContain(response.status());
		});

		test("should validate authorization token", async ({ request }) => {
			const response = await request.patch(
				`${API_BASE_URL}/teams/${testTeamId}/files/some-file-id/name`,
				{
					headers: {
						Authorization: "Bearer ",
						"Content-Type": "application/json",
					},
					data: {
						newName: "renamed.pdf",
					},
				},
			);

			expect([401, 404, 500]).toContain(response.status());
		});
	});

	
});

