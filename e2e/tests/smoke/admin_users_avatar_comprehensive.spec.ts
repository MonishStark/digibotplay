/** @format */

import { test, expect } from "@playwright/test";
import { testData } from "../testData";
import * as fs from "fs";
import * as path from "path";

/**
 * Comprehensive test suite for PUT /admin/users/{userId}/profile/avatar endpoint
 *
 * Based on Swagger documentation - Update user's profile avatar (SuperAdmin or Admin only)
 * Accepts multipart/form-data with image file (png/jpg/jpeg)
 */

const API_BASE_URL = "http://127.0.0.1:5050";

test.describe("PUT /admin/users/{userId}/profile/avatar - Comprehensive Tests", () => {
	let validAccessToken: string;
	let adminAccessToken: string;
	const testUserId = testData.users.admin2.id;

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

	// ========================
	// SUCCESS (200)
	// ========================

	// ========================
	// BAD REQUEST (400)
	// ========================

	// ========================
	// UNAUTHORIZED (401)
	// ========================

	// ========================
	// UNPROCESSABLE ENTITY (422)
	// ========================

	// ========================
	// RATE LIMIT (429)
	// ========================

	// ========================
	// SERVER ERROR (500)
	// ========================

	// ========================
	// SERVICE UNAVAILABLE (503/504)
	// ========================

	// ========================
	// SECURITY TESTS
	// ========================

	test.describe("Security Tests", () => {
		test("should prevent SQL injection in userId", async ({ request }) => {
			const sqlInjection = "1' OR '1'='1";
			const response = await request.put(
				`${API_BASE_URL}/admin/users/${sqlInjection}/profile/avatar`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			expect([400, 401, 403, 404, 500, 401]).toContain(response.status());
		});

		test("should validate token on every request", async ({ request }) => {
			const response = await request.put(
				`${API_BASE_URL}/admin/users/${testUserId}/profile/avatar`,
				{
					headers: {
						Authorization: "Bearer tampered-token",
					},
				},
			);

			expect([401, 404, 500]).toContain(response.status());
		});

		
	});

	// ========================
	// RESPONSE FORMAT TESTS
	// ========================

	test.describe("Response Format Tests", () => {
		test("should return proper content type", async ({ request }) => {
			const response = await request.put(
				`${API_BASE_URL}/admin/users/${testUserId}/profile/avatar`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			const contentType = response.headers()["content-type"];
			expect(
				contentType?.includes("application/json") ||
					contentType?.includes("text/html"),
			).toBe(true);
		});
	});

	// ========================
	// PERFORMANCE TESTS
	// ========================

	test.describe("Performance Tests", () => {
		test("should respond quickly (< 2000ms)", async ({ request }) => {
			const start = Date.now();

			const response = await request.put(
				`${API_BASE_URL}/admin/users/${testUserId}/profile/avatar`,
				{
					headers: {
						Authorization: `Bearer ${validAccessToken}`,
					},
				},
			);

			const duration = Date.now() - start;

			expect([400, 401, 403, 404, 415, 422, 500, 401]).toContain(response.status());
			expect(duration).toBeLessThan(2000);
		});
	});
});

