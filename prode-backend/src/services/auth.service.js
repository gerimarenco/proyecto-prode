const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const env = require("../config/env");

const SALT_ROUNDS = 12;

function normalizeUsername(username) {
  return String(username || "").trim().toLowerCase();
}

function normalizeEmail(email) {
  const value = String(email || "").trim().toLowerCase();
  return value || null;
}

async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password, hash) {
  if (!hash) return false;
  return bcrypt.compare(password, hash);
}

function signAuthToken(usuario) {
  return jwt.sign(
    { sub: usuario.id, username: usuario.username, rol: usuario.rol },
    env.JWT_SECRET,
    { expiresIn: env.JWT_TTL },
  );
}

function verifyAuthToken(token) {
  return jwt.verify(token, env.JWT_SECRET);
}

function getBearerToken(req) {
  const header = req.get("authorization") || "";
  const [type, token] = header.split(" ");
  if (type?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

module.exports = {
  getBearerToken,
  hashPassword,
  normalizeEmail,
  normalizeUsername,
  signAuthToken,
  verifyAuthToken,
  verifyPassword,
};
