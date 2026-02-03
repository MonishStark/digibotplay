/** @format */

const { spawnSync, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

function run(command, args, options = {}) {
	const result = spawnSync(command, args, {
		stdio: "inherit",
		shell: false,
		...options,
	});
	if (result.error) throw result.error;
	if (result.status !== 0) {
		throw new Error(
			`${command} ${args.join(" ")} exited with code ${result.status}`,
		);
	}
}

function runCapture(command, args, options = {}) {
	const result = spawnSync(command, args, {
		stdio: ["ignore", "pipe", "pipe"],
		shell: false,
		encoding: "utf8",
		...options,
	});
	if (result.error) throw result.error;
	if (result.status !== 0) {
		throw new Error(
			`${command} ${args.join(" ")} exited with code ${result.status}: ${result.stderr}`,
		);
	}
	return result.stdout;
}

function ensureDockerAvailable() {
	// This will fail fast with a clear message if Docker Desktop/daemon isn't running.
	run("docker", ["version"]);
}

function containerRunning(name) {
	try {
		const out = runCapture("docker", [
			"ps",
			"--filter",
			`name=^/${name}$`,
			"--format",
			"{{.Names}}",
		]);
		return out.split(/\r?\n/).some((line) => line.trim() === name);
	} catch {
		return false;
	}
}

function removeContainerIfExists(name) {
	try {
		// Remove if exists (running or stopped)
		spawnSync("docker", ["rm", "-f", name], { stdio: "ignore", shell: false });
	} catch {
		// ignore
	}
}

function ensureRedis() {
	const name = "digibot-redis";
	if (containerRunning(name)) return;

	// If a stopped container exists, remove it so we can start clean.
	removeContainerIfExists(name);

	run("docker", [
		"run",
		"--name",
		name,
		"--rm",
		"-p",
		"6379:6379",
		"-d",
		"redis:7-alpine",
	]);
}

function ensureMysql() {
	const name = "digibot-mysql";
	// Always recreate for a deterministic, clean DB.
	removeContainerIfExists(name);

	// Use MySQL 5.7 + native auth to be compatible with the backend's `mysql` driver.
	run("docker", [
		"run",
		"--name",
		name,
		"--rm",
		"-e",
		"MYSQL_ROOT_PASSWORD=root",
		"-e",
		"MYSQL_DATABASE=community_aid",
		"-p",
		"3307:3306",
		"-d",
		"mysql:5.7",
		"--default-authentication-plugin=mysql_native_password",
	]);
}

function waitForMysqlReady() {
	const name = "digibot-mysql";
	const start = Date.now();
	const timeoutMs = 120_000;

	while (Date.now() - start < timeoutMs) {
		const result = spawnSync(
			"docker",
			[
				"exec",
				name,
				"mysqladmin",
				"-uroot",
				"-proot",
				"ping",
				"-h",
				"127.0.0.1",
			],
			{ stdio: "ignore", shell: false },
		);

		if (result.status === 0) return;

		Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000);
	}

	throw new Error("Timed out waiting for MySQL container to become ready.");
}

function execMysqlSql(sqlFileOnHost) {
	const name = "digibot-mysql";
	const base = path.basename(sqlFileOnHost);
	const containerPath = `/tmp/${base}`;

	run("docker", ["cp", sqlFileOnHost, `${name}:${containerPath}`]);
	run("docker", [
		"exec",
		name,
		"sh",
		"-lc",
		`mysql -uroot -proot community_aid < ${containerPath}`,
	]);
}

function ensureSchemaSeeded() {
	const repoRoot = path.resolve(__dirname, "..", "..");
	const ddl = path.join(repoRoot, "sql", "ddl.sql");
	const dml = path.join(repoRoot, "sql", "dml.sql");

	// Prefer the full dump if present; it includes table definitions + seed data.
	if (fs.existsSync(dml)) {
		execMysqlSql(dml);
		return;
	}

	if (!fs.existsSync(ddl)) {
		throw new Error(`Missing schema file: ${ddl}`);
	}

	execMysqlSql(ddl);
}

function startBackend() {
	const repoRoot = path.resolve(__dirname, "..", "..");
	const backendDir = path.join(repoRoot, "backend");

	// Override DB settings to use our MySQL 5.7 container.
	// Keep PORT stable (5050) so existing smoke tests continue to work.
	const env = {
		...process.env,
		PORT: process.env.PORT || "5050",
		DATABASE_HOST: "127.0.0.1",
		DATABASE_PORT: "3307",
		DATABASE_USER_NAME: "root",
		DATABASE_PASSWORD: "root",
		DATABASE_NAME: "community_aid",
		CACHE_MODE: process.env.CACHE_MODE || "0",
		GOOGLE_CLOUD_STORAGE: process.env.GOOGLE_CLOUD_STORAGE || "0",
	};

	const child = spawn("node", ["server.js"], {
		cwd: backendDir,
		env,
		stdio: "inherit",
		shell: false,
	});

	const forwardSignal = (signal) => {
		try {
			child.kill(signal);
		} catch {
			// ignore
		}
	};

	process.on("SIGINT", () => forwardSignal("SIGINT"));
	process.on("SIGTERM", () => forwardSignal("SIGTERM"));

	child.on("exit", (code) => process.exit(code ?? 0));
}

function main() {
	ensureDockerAvailable();
	ensureRedis();
	ensureMysql();
	waitForMysqlReady();
	ensureSchemaSeeded();
	startBackend();
}

main();
