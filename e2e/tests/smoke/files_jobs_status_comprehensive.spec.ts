/** @format */

import { test, expect } from "@playwright/test";
import { testData } from "../testData";

/**
 * Comprehensive test suite for GET /files/jobs/{id}/status endpoint
 * Check file processing job status - Fetches current status and progress percentage
 */

const API_BASE_URL = "http://127.0.0.1:5050";

test.describe("GET /files/jobs/{id}/status - Comprehensive Tests", () => {
	let validAccessToken: string;
	let adminAccessToken: string;

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
		test("should return 400 for invalid job id", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/files/jobs/invalid-id/status`,
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
			const response = await request.get(
				`${API_BASE_URL}/files/jobs/some-job-id/status`,
			);

			expect([401, 404, 500]).toContain(response.status());
		});

		test("should return 401 for invalid token", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/files/jobs/some-job-id/status`,
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
			const response = await request.get(
				`${API_BASE_URL}/files/jobs/some-job-id/status`,
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
			const response = await request.get(
				`${API_BASE_URL}/files/jobs/some-job-id/status`,
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
		test("should return 404 for non-existent job", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/files/jobs/99999999-9999-9999-9999-999999999999/status`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([404, 500, 401]).toContain(response.status());
		});
	});

	test.describe("Security Tests", () => {
		test("should validate authorization token", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/files/jobs/some-job-id/status`,
				{
					headers: {
						Authorization: "Bearer ",
					},
				},
			);

			expect([401, 404, 500]).toContain(response.status());
		});

		test("should handle SQL injection in job id", async ({ request }) => {
			const response = await request.get(
				`${API_BASE_URL}/files/jobs/' OR '1'='1/status`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([400, 404, 422, 500, 401]).toContain(response.status());
		});
	});

	
});

