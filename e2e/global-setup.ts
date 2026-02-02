/** @format */

import type { FullConfig } from "@playwright/test";

async function sleep(ms: number) {
	await new Promise((resolve) => setTimeout(resolve, ms));
}

async function canReach(url: string): Promise<boolean> {
	try {
		const res = await fetch(url, { method: "GET" });
		return res.ok;
	} catch {
		return false;
	}
}

export default async function globalSetup(_config: FullConfig) {
	const apiUrl = process.env.API_URL || "http://127.0.0.1:5050";

	// Prefer /docs because this backend serves it without auth and it returns 200.
	const probeUrl = new URL("/docs", apiUrl).toString();

	const timeoutMs = Number(process.env.API_WAIT_TIMEOUT_MS || 60_000);
	const start = Date.now();

	while (Date.now() - start < timeoutMs) {
		if (await canReach(probeUrl)) return;
		await sleep(1000);
	}

	throw new Error(
		[
			`Backend not reachable for smoke tests.`,
			`Expected API at: ${apiUrl}`,
			`Tried: GET ${probeUrl} for ${timeoutMs}ms`,
			`Start your backend separately, then re-run:`,
			`  set API_URL=${apiUrl} ; npm test -- --project=chromium tests/smoke`,
		].join("\n"),
	);
}
