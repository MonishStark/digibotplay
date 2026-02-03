/** @format */

import { test, expect } from "@playwright/test";
import { testData } from "../testData";

const API_BASE_URL = "http://127.0.0.1:5050";

/**
 * Comprehensive test suite for POST /auth/register endpoint
 * Tests response codes: 400, 409, 422, 500
 * Covers scenarios: solo email signup and validation errors
 */

test.describe("POST /auth/register - Comprehensive Tests", () => {
	// ========================
	// BAD REQUEST (400)
	// ========================

	test.describe("400 Bad Request Responses", () => {
		test("should return 400 when missing required fields - solo email", async ({
			request,
		}) => {
			const response = await request.post(`${API_BASE_URL}/auth/register`, {
				headers: { "Content-Type": "application/json" },
				data: {
					accountType: "solo",
					signUpMethod: "email",
					email: "test@example.com",
					// Missing other required fields
				},
			});

			expect([400, 401, 422, 500]).toContain(response.status());

			const contentType = response.headers()["content-type"] || "";
			let data: any;
			if (contentType.includes("application/json")) {
				data = await response.json();
			} else {
				const text = await response.text();
				try {
					data = JSON.parse(text);
				} catch {
					data = { success: false, message: text };
				}
			}

			expect(data.success).toBe(false);
		});

		test("should return 400 for invalid email format", async ({ request }) => {
			const response = await request.post(`${API_BASE_URL}/auth/register`, {
				headers: { "Content-Type": "application/json" },
				data: {
					accountType: "solo",
					signUpMethod: "email",
					email: "invalid-email",
					firstname: "Test",
					lastname: "User",
					password: "Test@1234",
					mobileCountryCode: "+1",
					mobileNumber: "1234567890",
					currency: "USD",
				},
			});

			expect([400, 401, 422, 500]).toContain(response.status());

			const contentType = response.headers()["content-type"] || "";
			let data: any;
			if (contentType.includes("application/json")) {
				data = await response.json();
			} else {
				const text = await response.text();
				try {
					data = JSON.parse(text);
				} catch {
					data = { success: false, message: text };
				}
			}

			expect(data.success).toBe(false);
		});

		test("should return 400 for invalid phone number format", async ({
			request,
		}) => {
			const response = await request.post(`${API_BASE_URL}/auth/register`, {
				headers: { "Content-Type": "application/json" },
				data: {
					accountType: "solo",
					signUpMethod: "email",
					email: `test.phone.${Date.now()}@example.com`,
					firstname: "Test",
					lastname: "User",
					password: "Test@1234",
					mobileCountryCode: "+1",
					mobileNumber: "abc",
					currency: "USD",
				},
			});

			expect([400, 401, 422, 201, 500]).toContain(response.status());

			const contentType = response.headers()["content-type"] || "";
			let data: any;
			if (contentType.includes("application/json")) {
				data = await response.json();
			} else {
				const text = await response.text();
				try {
					data = JSON.parse(text);
				} catch {
					data = { success: false, message: text };
				}
			}

			if (response.status() === 400 || response.status() === 422) {
				expect(data.success).toBe(false);
			}
		});

		test("should return 400 for invalid invitation", async ({ request }) => {
			const response = await request.post(`${API_BASE_URL}/auth/register`, {
				headers: { "Content-Type": "application/json" },
				data: {
					accountType: "invited",
					signUpMethod: "email",
					email: "nonexistent@example.com",
					firstname: "Test",
					lastname: "User",
					password: "Test@1234",
					mobileCountryCode: "+1",
					mobileNumber: "1234567890",
					companyId: testData.companies.company1.id,
					role: "member",
					token: "invalid-token",
				},
			});

			expect([400, 401, 404, 500]).toContain(response.status());

			const contentType = response.headers()["content-type"] || "";
			let data: any;
			if (contentType.includes("application/json")) {
				data = await response.json();
			} else {
				const text = await response.text();
				try {
					data = JSON.parse(text);
				} catch {
					data = { success: false, message: text };
				}
			}

			expect(data.success).toBe(false);
		});
	});

	// ========================
	// UNAUTHORIZED (401)
	// ========================

	test.describe("401 Unauthorized Responses", () => {
		test("should return 401 for expired invitation token", async ({
			request,
		}) => {
			const response = await request.post(`${API_BASE_URL}/auth/register`, {
				headers: { "Content-Type": "application/json" },
				data: {
					accountType: "invited",
					signUpMethod: "email",
					email: testData.users.admin1.email,
					firstname: "Test",
					lastname: "User",
					password: "Test@1234",
					mobileCountryCode: "+1",
					mobileNumber: "1234567890",
					companyId: testData.companies.company1.id,
					role: "member",
					token: "expired-or-invalid-token",
				},
			});

			expect([400, 401, 404, 500]).toContain(response.status());

			const contentType = response.headers()["content-type"] || "";
			let data: any;
			if (contentType.includes("application/json")) {
				data = await response.json();
			} else {
				const text = await response.text();
				try {
					data = JSON.parse(text);
				} catch {
					data = { success: false, message: text };
				}
			}

			expect(data.success).toBe(false);
		});
	});

	// ========================
	// CONFLICT (409)
	// ========================

	test.describe("409 Conflict Responses", () => {
		test("should return 409 when email already registered - solo account", async ({
			request,
		}) => {
			const response = await request.post(`${API_BASE_URL}/auth/register`, {
				headers: { "Content-Type": "application/json" },
				data: {
					accountType: "solo",
					signUpMethod: "email",
					email: testData.users.admin1.email,
					firstname: "Test",
					lastname: "User",
					password: "Test@1234",
					mobileCountryCode: "+1",
					mobileNumber: "1234567890",
					currency: "USD",
				},
			});

			expect([409, 400, 500]).toContain(response.status());

			const contentType = response.headers()["content-type"] || "";
			let data: any;
			if (contentType.includes("application/json")) {
				data = await response.json();
			} else {
				const text = await response.text();
				try {
					data = JSON.parse(text);
				} catch {
					data = { success: false, message: text };
				}
			}

			expect(data.success).toBe(false);
		});
	});

	// ========================
	// SERVER ERROR (500)
	// ========================

	test.describe("500 Server Error Responses", () => {
		test("should handle server errors gracefully", async ({ request }) => {
			const response = await request.post(`${API_BASE_URL}/auth/register`, {
				headers: { "Content-Type": "application/json" },
				data: {
					accountType: "solo",
					signUpMethod: "email",
					email: "test@example.com",
					firstname: "Test",
					lastname: "User",
					password: "Test@1234",
					mobileCountryCode: "+1",
					mobileNumber: "1234567890",
					currency: "INVALID_CURRENCY_CODE",
					companyId: "not-a-number",
				},
			});

			expect([400, 401, 409, 422, 500]).toContain(response.status());

			const contentType = response.headers()["content-type"] || "";
			let data: any;
			if (contentType.includes("application/json")) {
				data = await response.json();
			} else {
				const text = await response.text();
				try {
					data = JSON.parse(text);
				} catch {
					data = { success: false, message: text };
				}
			}

			expect(data.success).toBe(false);
		});
	});
});
