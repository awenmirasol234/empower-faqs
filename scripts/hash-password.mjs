import crypto from "node:crypto";

const password = process.argv[2];

if (!password) {
  console.error("Usage: npm run hash-password -- \"your-admin-password\"");
  process.exit(1);
}

const salt = crypto.randomBytes(16).toString("hex");
const derived = crypto.scryptSync(password, salt, 64).toString("hex");
console.log(`scrypt:${salt}:${derived}`);
