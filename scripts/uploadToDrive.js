/** @format */

// @format
const https = require("https");
const fs = require("fs");
const path = require("path");

/**
 * Upload file to Google Drive using OAuth2
 * Requires environment variables:
 * - GDRIVE_CLIENT_ID
 * - GDRIVE_CLIENT_SECRET
 * - GDRIVE_REFRESH_TOKEN
 * - REPORT_ZIP (path to zip file)
 * - REPORT_NAME_PREFIX (prefix for uploaded file name)
 */

const CLIENT_ID = process.env.GDRIVE_CLIENT_ID;
const CLIENT_SECRET = process.env.GDRIVE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GDRIVE_REFRESH_TOKEN;
const REPORT_ZIP = process.env.REPORT_ZIP;
const REPORT_NAME_PREFIX = process.env.REPORT_NAME_PREFIX || "digibot-report";

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN || !REPORT_ZIP) {
	console.error("❌ Missing required environment variables");
	console.log("REPORT_LINK=");
	process.exit(1);
}

// Get access token from refresh token
function getAccessToken() {
	return new Promise((resolve, reject) => {
		const postData = new URLSearchParams({
			client_id: CLIENT_ID,
			client_secret: CLIENT_SECRET,
			refresh_token: REFRESH_TOKEN,
			grant_type: "refresh_token",
		}).toString();

		const options = {
			hostname: "oauth2.googleapis.com",
			path: "/token",
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
				"Content-Length": Buffer.byteLength(postData),
			},
		};

		const req = https.request(options, (res) => {
			let data = "";
			res.on("data", (chunk) => (data += chunk));
			res.on("end", () => {
				try {
					const json = JSON.parse(data);
					if (json.access_token) {
						resolve(json.access_token);
					} else {
						reject(new Error("No access token in response"));
					}
				} catch (e) {
					reject(e);
				}
			});
		});

		req.on("error", reject);
		req.write(postData);
		req.end();
	});
}

// Upload file to Google Drive
function uploadFile(accessToken, filePath, fileName) {
	return new Promise((resolve, reject) => {
		const fileContent = fs.readFileSync(filePath);
		const boundary =
			"----WebKitFormBoundary" + Math.random().toString(36).substring(2);

		const metadata = {
			name: fileName,
			mimeType: "application/zip",
		};

		const multipartBody =
			`--${boundary}\r\n` +
			`Content-Type: application/json; charset=UTF-8\r\n\r\n` +
			`${JSON.stringify(metadata)}\r\n` +
			`--${boundary}\r\n` +
			`Content-Type: application/zip\r\n\r\n` +
			`${fileContent.toString("binary")}\r\n` +
			`--${boundary}--`;

		const options = {
			hostname: "www.googleapis.com",
			path: "/upload/drive/v3/files?uploadType=multipart",
			method: "POST",
			headers: {
				Authorization: `Bearer ${accessToken}`,
				"Content-Type": `multipart/related; boundary=${boundary}`,
				"Content-Length": Buffer.byteLength(multipartBody, "binary"),
			},
		};

		const req = https.request(options, (res) => {
			let data = "";
			res.on("data", (chunk) => (data += chunk));
			res.on("end", () => {
				try {
					const json = JSON.parse(data);
					if (json.id) {
						resolve(json.id);
					} else {
						reject(new Error("No file ID in response"));
					}
				} catch (e) {
					reject(e);
				}
			});
		});

		req.on("error", reject);
		req.write(multipartBody, "binary");
		req.end();
	});
}

// Make file publicly accessible
function makeFilePublic(accessToken, fileId) {
	return new Promise((resolve, reject) => {
		const postData = JSON.stringify({
			role: "reader",
			type: "anyone",
		});

		const options = {
			hostname: "www.googleapis.com",
			path: `/drive/v3/files/${fileId}/permissions`,
			method: "POST",
			headers: {
				Authorization: `Bearer ${accessToken}`,
				"Content-Type": "application/json",
				"Content-Length": Buffer.byteLength(postData),
			},
		};

		const req = https.request(options, (res) => {
			let data = "";
			res.on("data", (chunk) => (data += chunk));
			res.on("end", () => resolve());
		});

		req.on("error", reject);
		req.write(postData);
		req.end();
	});
}

// Main execution
(async () => {
	try {
		console.log("🔐 Getting access token...");
		const accessToken = await getAccessToken();

		const timestamp = new Date()
			.toISOString()
			.replace(/[:.]/g, "-")
			.slice(0, -5);
		const fileName = `${REPORT_NAME_PREFIX}-${timestamp}.zip`;

		console.log(`📤 Uploading ${REPORT_ZIP} as ${fileName}...`);
		const fileId = await uploadFile(accessToken, REPORT_ZIP, fileName);

		console.log("🔓 Making file publicly accessible...");
		await makeFilePublic(accessToken, fileId);

		const driveLink = `https://drive.google.com/file/d/${fileId}/view`;
		console.log(`✅ Upload successful!`);
		console.log(`REPORT_LINK=${driveLink}`);
	} catch (error) {
		console.error("❌ Upload failed:", error.message);
		console.log("REPORT_LINK=");
		process.exit(1);
	}
})();
