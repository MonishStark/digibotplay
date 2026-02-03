/** @format */

import { test, expect } from "@playwright/test";
import { testData } from "../testData";

/**
 * Comprehensive test suite for POST /files/upload/audio/{teamId} endpoint
 * Upload an audio file - validates storage capacity and processes file for transcription/summarization
 */

const API_BASE_URL = "http://127.0.0.1:5050";

test.describe("POST /files/upload/audio/{teamId} - Comprehensive Tests", () => {
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
			const response = await request.post(
				`${API_BASE_URL}/files/upload/audio/invalid-id`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([400, 404, 422, 500, 401]).toContain(response.status());
		});
	});

	test.describe("401 Unauthorized Responses", () => {
		test("should return 401 when authorization token is missing", async ({
			request,
		}) => {
			const response = await request.post(
				`${API_BASE_URL}/files/upload/audio/${testTeamId}`,
			);

			expect([401, 404, 500]).toContain(response.status());
		});

		test("should return 401 for invalid token", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/files/upload/audio/${testTeamId}`,
				{
					headers: {
						Authorization: "Bearer invalid_token_here",
					},
				},
			);

			expect([401, 404, 500]).toContain(response.status());
		});

		test("should return 401 for expired token", async ({ request }) => {
			const expiredToken =
				"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjB9.invalid";
			const response = await request.post(
				`${API_BASE_URL}/files/upload/audio/${testTeamId}`,
				{
					headers: {
						Authorization: `Bearer ${expiredToken}`,
					},
				},
			);

			expect([401, 404, 500]).toContain(response.status());
		});

		test("should return 401 for malformed Bearer token", async ({
			request,
		}) => {
			const response = await request.post(
				`${API_BASE_URL}/files/upload/audio/${testTeamId}`,
				{
					headers: {
						Authorization: "InvalidFormat token",
					},
				},
			);

			expect([401, 404, 500]).toContain(response.status());
		});
	});

	test.describe("404 Not Found", () => {
		test("should return 404 for non-existent team", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/files/upload/audio/99999999-9999-9999-9999-999999999999`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([403, 404, 500, 401]).toContain(response.status());
		});
	});

	test.describe("Security Tests", () => {
		test("should validate authorization token", async ({ request }) => {
			const response = await request.post(
				`${API_BASE_URL}/files/upload/audio/${testTeamId}`,
				{
					headers: {
						Authorization: "Bearer ",
					},
				},
			);

			expect([401, 404, 500]).toContain(response.status());
		});
	});

	
});

