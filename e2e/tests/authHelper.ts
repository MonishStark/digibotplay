/** @format */

import { request, APIRequestContext } from "@playwright/test";
import { testData } from "./testData";

/**
 * Login and get auth token for API requests
 */
export async function getAuthToken(
	email: string,
	password: string,
): Promise<string> {
	const apiUrl = process.env.API_URL || "http://127.0.0.1:5050";
	const context = await request.newContext({ baseURL: apiUrl });

	const response = await context.post("/auth/login", {
		data: {
			loginType: "standard",
			email,
			password,
		},
	});

	if (!response.ok()) {
		throw new Error(
			`Login failed for ${email}: ${response.status()} ${await response.text()}`,
		);
	}

	const body = await response.json();
	await context.dispose();

	// Extract token from response - check multiple possible locations
	return (
		body.user?.auth?.accessToken ||
		body.token?.accessToken ||
		body.accessToken ||
		body.token
	);
}

/**
 * Get auth token for admin1 (userId 69)
 */
export async function getAdmin1Token(): Promise<string> {
	const user = testData.users.admin1;
	return getAuthToken(user.email, user.password);
}

/**
 * Get auth token for admin2 (userId 70)
 */
export async function getAdmin2Token(): Promise<string> {
	const user = testData.users.admin2;
	return getAuthToken(user.email, user.password);
}

/**
 * Get auth token for super admin (userId 71)
 */
export async function getSuperAdminToken(): Promise<string> {
	const user = testData.users.superAdmin;
	return getAuthToken(user.email, user.password);
}

/**
 * Create authenticated API context
 */
export async function createAuthContext(
	email: string,
	password: string,
): Promise<APIRequestContext> {
	const token = await getAuthToken(email, password);
	const apiUrl = process.env.API_URL || "http://127.0.0.1:5050";

	return request.newContext({
		baseURL: apiUrl,
		extraHTTPHeaders: {
			Authorization: `Bearer ${token}`,
		},
	});
}

/**
 * Create authenticated API context for admin1
 */
export async function createAdmin1Context(): Promise<APIRequestContext> {
	const user = testData.users.admin1;
	return createAuthContext(user.email, user.password);
}

/**
 * Create authenticated API context for admin2
 */
export async function createAdmin2Context(): Promise<APIRequestContext> {
	const user = testData.users.admin2;
	return createAuthContext(user.email, user.password);
}

/**
 * Create authenticated API context for super admin
 */
export async function createSuperAdminContext(): Promise<APIRequestContext> {
	const user = testData.users.superAdmin;
	return createAuthContext(user.email, user.password);
}
