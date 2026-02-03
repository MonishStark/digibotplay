/** @format */

import { defineConfig, devices } from "@playwright/test";
import * as dotenv from "dotenv";
import fs from "fs";
import path from "path";

// Load environment variables from local e2e .env files (backend lives elsewhere).
for (const file of [".env.local", ".env"]) {
	const fullPath = path.resolve(__dirname, file);
	if (fs.existsSync(fullPath)) {
		dotenv.config({ path: fullPath });
	}
}

process.env.API_URL = process.env.API_URL || "http://127.0.0.1:5050";

export default defineConfig({
	testDir: "./tests",
	testIgnore: ["tests/smoke/_deprecated/**"],
	fullyParallel: false, // Serial mode to verify stateful flows and avoid rate limits
	forbidOnly: !!process.env.CI,
	retries: 0,
	workers: 1, // Force serial execution for stability on this backend
	reporter: "line",
	globalSetup: require.resolve("./global-setup"),
	use: {
		baseURL: process.env.API_URL,
		trace: "on-first-retry",
		screenshot: "on",
		ignoreHTTPSErrors: true,
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],
});
