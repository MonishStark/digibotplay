/** @format */

// @format
/**
 * Generate bcrypt password hash for test users
 * Usage: node scripts/generate-password-hash.js
 */

const bcrypt = require("bcrypt");

const password = "Test@1234";
const saltRounds = 10;

console.log("Generating bcrypt hash for password:", password);
console.log("Salt rounds:", saltRounds);
console.log("");

const hash = bcrypt.hashSync(password, saltRounds);

console.log("✅ Generated hash:");
console.log(hash);
console.log("");
console.log(
	"Copy this hash and replace all password hashes in sql/seed-test-users.sql",
);
