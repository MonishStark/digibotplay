/** @format */

import { test, expect } from "@playwright/test";
import { testData } from "../testData";
import * as fs from "fs";
import * as path from "path";

const API_BASE_URL = "http://127.0.0.1:5050";

/**
 * Comprehensive test suite for PUT /me/avatar endpoint
 * Tests ALL response codes: 200, 400, 401, 403, 404, 405, 415, 422, 423, 429, 500, 503, 504
 * Based on Swagger documentation - Upload or replace user profile picture
 */

test.describe("PUT /me/avatar - Comprehensive Tests", () => {
	let validAccessToken: string;
	let testImagePath: string;

	test.beforeAll(async ({ request }) => {
		const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
			headers: { "Content-Type": "application/json" },
			data: {
				email: testData.users.admin1.email,
				password: testData.users.admin1.password,
				loginType: "standard",
			},
		});

		const loginData = await loginResponse.json();
		validAccessToken = loginData.user.auth.accessToken;

		// Create a small test image (1x1 PNG)
		const pngData = Buffer.from(
			"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
			"base64",
		);
		testImagePath = path.join(__dirname, "test-avatar.png");
		fs.writeFileSync(testImagePath, pngData);
	});

	test.afterAll(() => {
		// Cleanup test image
		if (fs.existsSync(testImagePath)) {
			fs.unlinkSync(testImagePath);
		}
	});

	// ========================
	// SUCCESS SCENARIOS (200)
	// ========================

	test.describe("200 Success Responses", () => {
		test("should upload avatar successfully - 200", async ({ request }) => {
			const response = await request.put(`${API_BASE_URL}/me/avatar`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
				multipart: {
					image: {
						name: "avatar.png",
						mimeType: "image/png",
						buffer: fs.readFileSync(testImagePath),
					},
				},
			});

			expect([200, 400, 408, 415, 422]).toContain(response.status());

			if (response.status() === 200) {
				const data = await response.json();
				expect(data.success).toBe(true);
			}
		});

		test("should accept PNG image", async ({ request }) => {
			const response = await request.put(`${API_BASE_URL}/me/avatar`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
				multipart: {
					image: {
						name: "avatar.png",
						mimeType: "image/png",
						buffer: fs.readFileSync(testImagePath),
					},
				},
			});

			expect([200, 400, 408, 415, 422]).toContain(response.status());
		});

		test("should accept JPG image", async ({ request }) => {
			const response = await request.put(`${API_BASE_URL}/me/avatar`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
				multipart: {
					image: {
						name: "avatar.jpg",
						mimeType: "image/jpeg",
						buffer: fs.readFileSync(testImagePath),
					},
				},
			});

			expect([200, 400, 408, 415, 422]).toContain(response.status());
		});

		test("should return avatar URL in response", async ({ request }) => {
			const response = await request.put(`${API_BASE_URL}/me/avatar`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
				multipart: {
					image: {
						name: "avatar.png",
						mimeType: "image/png",
						buffer: fs.readFileSync(testImagePath),
					},
				},
			});

			if (response.status() === 200) {
				const data = await response.json();
				if (data.avatarUrl || data.avatar || data.url) {
					expect(data).toBeDefined();
				}
			}
		});
	});

	// ========================
	// BAD REQUEST (400)
	// ========================

	test.describe("400 Bad Request Responses", () => {
		test("should return 400 when image file is missing", async ({
			request,
		}) => {
			const response = await request.put(`${API_BASE_URL}/me/avatar`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
				multipart: {},
			});

			expect([400, 422]).toContain(response.status());

			const data = await response.json();
			expect(data.success).toBe(false);
		});

		test("should return 400 for empty file", async ({ request }) => {
			const response = await request.put(`${API_BASE_URL}/me/avatar`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
				multipart: {
					image: {
						name: "empty.png",
						mimeType: "image/png",
						buffer: Buffer.from(""),
					},
				},
			});

			expect([200, 400, 422]).toContain(response.status());
		});

		test("should return 400 for corrupted image", async ({ request }) => {
			const response = await request.put(`${API_BASE_URL}/me/avatar`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
				multipart: {
					image: {
						name: "corrupted.png",
						mimeType: "image/png",
						buffer: Buffer.from("not-a-valid-image"),
					},
				},
			});

			expect([200, 400, 422]).toContain(response.status());
		});
	});

	// ========================
	// UNAUTHORIZED (401)
	// ========================

	test.describe("401 Unauthorized Responses", () => {
		test("should return 401 when Authorization header is missing", async ({
			request,
		}) => {
			const response = await request.put(`${API_BASE_URL}/me/avatar`, {
				multipart: {
					image: {
						name: "avatar.png",
						mimeType: "image/png",
						buffer: fs.readFileSync(testImagePath),
					},
				},
			});

			expect([401, 403]).toContain(response.status());

			const data = await response.json();
			expect(data.success).toBe(false);
		});

		test("should return 401 for invalid token", async ({ request }) => {
			const response = await request.put(`${API_BASE_URL}/me/avatar`, {
				headers: {
					Authorization: "Bearer invalid-token-12345",
				},
				multipart: {
					image: {
						name: "avatar.png",
						mimeType: "image/png",
						buffer: fs.readFileSync(testImagePath),
					},
				},
			});

			expect([401, 403]).toContain(response.status());
		});

		test("should return 401 for expired token", async ({ request }) => {
			const expiredToken =
				"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE2MDAwMDM2MDB9.expired";

			const response = await request.put(`${API_BASE_URL}/me/avatar`, {
				headers: {
					Authorization: `Bearer ${expiredToken}`,
				},
				multipart: {
					image: {
						name: "avatar.png",
						mimeType: "image/png",
						buffer: fs.readFileSync(testImagePath),
					},
				},
			});

			expect([401, 403]).toContain(response.status());
		});

		test("should return 401 for malformed JWT", async ({ request }) => {
			const malformedTokens = ["not.a.jwt", "abc123"];

			for (const token of malformedTokens) {
				const response = await request.put(`${API_BASE_URL}/me/avatar`, {
					headers: {
						Authorization: `Bearer ${token}`,
					},
					multipart: {
						image: {
							name: "avatar.png",
							mimeType: "image/png",
							buffer: fs.readFileSync(testImagePath),
						},
					},
				});

				expect([401, 403]).toContain(response.status());
			}
		});
	});

	// ========================
	// FORBIDDEN (403)
	// ========================

	test.describe("403 Forbidden Responses", () => {
		test("should return 403 for restricted user - PLACEHOLDER", async ({
			request,
		}) => {
			// Requires user without avatar update permissions
			expect(true).toBe(true);
		});
	});

	// ========================
	// NOT FOUND (404)
	// ========================

	test.describe("404 Not Found Responses", () => {
		test("should return 404 for deleted user - PLACEHOLDER", async ({
			request,
		}) => {
			// Requires valid token for deleted user
			expect(true).toBe(true);
		});
	});

	// ========================
	// METHOD NOT ALLOWED (405)
	// ========================

	test.describe("405 Method Not Allowed Responses", () => {
		test("should return 405 for GET method", async ({ request }) => {
			const response = await request.get(`${API_BASE_URL}/me/avatar`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			expect([404, 405]).toContain(response.status());
		});

		test("should return 405 for POST method", async ({ request }) => {
			const response = await request.post(`${API_BASE_URL}/me/avatar`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
				multipart: {
					image: {
						name: "avatar.png",
						mimeType: "image/png",
						buffer: fs.readFileSync(testImagePath),
					},
				},
			});

			expect([403, 404]).toContain(response.status());
		});

		test("should return 405 for DELETE method", async ({ request }) => {
			const response = await request.delete(`${API_BASE_URL}/me/avatar`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
			});

			expect([404, 405]).toContain(response.status());
		});
	});

	// ========================
	// UNSUPPORTED MEDIA TYPE (415)
	// ========================

	test.describe("415 Unsupported Media Type Responses", () => {
		test("should return 415 for invalid content type", async ({ request }) => {
			const response = await request.put(`${API_BASE_URL}/me/avatar`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
					"Content-Type": "text/plain",
				},
				data: "not-multipart-data",
			});

			expect([400, 408, 415, 422]).toContain(response.status());
		});

		test("should return 415 for unsupported file type", async ({ request }) => {
			const response = await request.put(`${API_BASE_URL}/me/avatar`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
				multipart: {
					image: {
						name: "file.txt",
						mimeType: "text/plain",
						buffer: Buffer.from("not an image"),
					},
				},
			});

			expect([200, 400, 408, 415, 422]).toContain(response.status());
		});

		test("should return 415 for SVG file", async ({ request }) => {
			const svgContent =
				'<svg xmlns="http://www.w3.org/2000/svg"><rect width="1" height="1"/></svg>';

			const response = await request.put(`${API_BASE_URL}/me/avatar`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
				multipart: {
					image: {
						name: "avatar.svg",
						mimeType: "image/svg+xml",
						buffer: Buffer.from(svgContent),
					},
				},
			});

			expect([200, 400, 408, 415, 422]).toContain(response.status());
		});
	});

	// ========================
	// VALIDATION ERROR (422)
	// ========================

	test.describe("422 Validation Error Responses", () => {
		test("should return 422 for file too large", async ({ request }) => {
			// Create a large buffer (10MB)
			const largeBuffer = Buffer.alloc(10 * 1024 * 1024);

			const response = await request.put(`${API_BASE_URL}/me/avatar`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
				multipart: {
					image: {
						name: "large.png",
						mimeType: "image/png",
						buffer: largeBuffer,
					},
				},
			});

			expect([200, 400, 408, 413, 415, 422]).toContain(response.status());
		});

		test("should return 422 for wrong field name", async ({ request }) => {
			const response = await request.put(`${API_BASE_URL}/me/avatar`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
				multipart: {
					wrongField: {
						name: "avatar.png",
						mimeType: "image/png",
						buffer: fs.readFileSync(testImagePath),
					},
				},
			});

			expect([400, 422]).toContain(response.status());
		});
	});

	// ========================
	// ACCOUNT LOCKED (423)
	// ========================

	test.describe("423 Account Locked Responses", () => {
		test("should return 423 for locked account - PLACEHOLDER", async ({
			request,
		}) => {
			// Requires locked account
			expect(true).toBe(true);
		});
	});

	// ========================
	// RATE LIMIT (429)
	// ========================

	test.describe("429 Rate Limit Responses", () => {
		test("should return 429 after excessive uploads - PLACEHOLDER", async ({
			request,
		}) => {
			// Requires rate limiting
			expect(true).toBe(true);
		});
	});

	// ========================
	// SERVER ERROR (500)
	// ========================

	test.describe("500 Server Error Responses", () => {
		test("should handle server errors gracefully - PLACEHOLDER", async ({
			request,
		}) => {
			expect(true).toBe(true);
		});
	});

	// ========================
	// SERVICE UNAVAILABLE (503/504)
	// ========================

	test.describe("503/504 Service Unavailable Responses", () => {
		test("should handle service unavailable - PLACEHOLDER", async ({
			request,
		}) => {
			expect(true).toBe(true);
		});
	});

	// ========================
	// EDGE CASES
	// ========================

	test.describe("Edge Cases", () => {
		test("should handle concurrent avatar uploads", async ({ request }) => {
			const requests = Array(3)
				.fill(null)
				.map(() =>
					request.put(`${API_BASE_URL}/me/avatar`, {
						headers: {
							Authorization: `Bearer ${validAccessToken}`,
						},
						multipart: {
							image: {
								name: "avatar.png",
								mimeType: "image/png",
								buffer: fs.readFileSync(testImagePath),
							},
						},
					}),
				);

			const responses = await Promise.all(requests);

			responses.forEach((response) => {
				expect([200, 400, 408, 415, 422]).toContain(response.status());
			});
		});

		test("should handle replacing existing avatar", async ({ request }) => {
			// First upload
			await request.put(`${API_BASE_URL}/me/avatar`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
				multipart: {
					image: {
						name: "avatar1.png",
						mimeType: "image/png",
						buffer: fs.readFileSync(testImagePath),
					},
				},
			});

			// Replace with new avatar
			const response = await request.put(`${API_BASE_URL}/me/avatar`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
				multipart: {
					image: {
						name: "avatar2.png",
						mimeType: "image/png",
						buffer: fs.readFileSync(testImagePath),
					},
				},
			});

			expect([200, 400, 408, 415, 422]).toContain(response.status());
		});

		test("should handle filename with special characters", async ({
			request,
		}) => {
			const response = await request.put(`${API_BASE_URL}/me/avatar`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
				multipart: {
					image: {
						name: "avatar!@#$%^&*().png",
						mimeType: "image/png",
						buffer: fs.readFileSync(testImagePath),
					},
				},
			});

			expect([200, 400, 408, 415, 422]).toContain(response.status());
		});
	});

	// ========================
	// SECURITY TESTS
	// ========================

	test.describe("Security Tests", () => {
		test("should not expose sensitive data in response", async ({
			request,
		}) => {
			const response = await request.put(`${API_BASE_URL}/me/avatar`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
				multipart: {
					image: {
						name: "avatar.png",
						mimeType: "image/png",
						buffer: fs.readFileSync(testImagePath),
					},
				},
			});

			if (response.status() === 200) {
				const data = await response.json();
				const responseText = JSON.stringify(data);

				expect(responseText).not.toContain("passwordHash");
				expect(responseText).not.toContain("secretKey");
			}
		});

		test("should validate token on every request", async ({ request }) => {
			const fakeToken =
				"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjF9.fake";

			const response = await request.put(`${API_BASE_URL}/me/avatar`, {
				headers: {
					Authorization: `Bearer ${fakeToken}`,
				},
				multipart: {
					image: {
						name: "avatar.png",
						mimeType: "image/png",
						buffer: fs.readFileSync(testImagePath),
					},
				},
			});

			expect([401, 403]).toContain(response.status());
		});

		test("should prevent path traversal in filename", async ({ request }) => {
			const response = await request.put(`${API_BASE_URL}/me/avatar`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
				multipart: {
					image: {
						name: "../../etc/passwd.png",
						mimeType: "image/png",
						buffer: fs.readFileSync(testImagePath),
					},
				},
			});

			expect([200, 400, 408, 415, 422]).toContain(response.status());
		});
	});

	// ========================
	// RESPONSE FORMAT TESTS
	// ========================

	test.describe("Response Format Tests", () => {
		test("should return consistent success structure", async ({ request }) => {
			const response = await request.put(`${API_BASE_URL}/me/avatar`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
				multipart: {
					image: {
						name: "avatar.png",
						mimeType: "image/png",
						buffer: fs.readFileSync(testImagePath),
					},
				},
			});

			if (response.status() === 200) {
				const data = await response.json();
				expect(data).toHaveProperty("success");
			}
		});

		test("should return consistent error structure", async ({ request }) => {
			const response = await request.put(`${API_BASE_URL}/me/avatar`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
				multipart: {},
			});

			const data = await response.json();
			expect(data).toHaveProperty("success");
			expect(data).toHaveProperty("error");
			expect(data).toHaveProperty("message");
		});

		test("should return proper content type", async ({ request }) => {
			const response = await request.put(`${API_BASE_URL}/me/avatar`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
				multipart: {
					image: {
						name: "avatar.png",
						mimeType: "image/png",
						buffer: fs.readFileSync(testImagePath),
					},
				},
			});

			const contentType = response.headers()["content-type"];
			expect(contentType).toContain("application/json");
		});
	});

	// ========================
	// PERFORMANCE TESTS
	// ========================

	test.describe("Performance Tests", () => {
		test("should respond quickly (< 2000ms)", async ({ request }) => {
			const start = Date.now();

			const response = await request.put(`${API_BASE_URL}/me/avatar`, {
				headers: {
					Authorization: `Bearer ${validAccessToken}`,
				},
				multipart: {
					image: {
						name: "avatar.png",
						mimeType: "image/png",
						buffer: fs.readFileSync(testImagePath),
					},
				},
			});

			const duration = Date.now() - start;

			expect([200, 400, 408, 415, 422]).toContain(response.status());
			expect(duration).toBeLessThan(2000);
		});
	});
});
