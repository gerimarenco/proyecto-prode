const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const SALT_ROUNDS = 12;
const TOKEN_TTL = "7d";

function getJwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;

  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET no esta configurada");
  }

  console.warn("JWT_SECRET no esta configurada. Usando secreto local inseguro de desarrollo.");
  return "dev-insecure-jwt-secret-change-me";
}

function normalizeUsername(username) {
  return String(username || "").trim().toLowerCase();
}

function normalizeEmail(email) {
  const value = String(email || "").trim().toLowerCase();
  return value || null;
}

function isValidUsername(username) {
  return /^[a-z0-9_.-]{3,24}$/.test(username);
}

function isValidEmail(email) {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPassword(password) {
  return typeof password === "string" && password.length >= 8 && password.length <= 128;
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
    {
      sub: usuario.id,
      username: usuario.username,
    },
    getJwtSecret(),
    { expiresIn: TOKEN_TTL },
  );
}

function getBearerToken(req) {
  const header = req.get("authorization") || "";
  const [type, token] = header.split(" ");
  if (type?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

function verifyAuthToken(token) {
  return jwt.verify(token, getJwtSecret());
}

function usuarioResponse(usuario) {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    apellido: usuario.apellido,
    username: usuario.username,
    email: usuario.email,
    emailVerificado: usuario.emailVerificado,
    telefono: usuario.telefono,
    activo: usuario.activo,
    hinchaDe: usuario.hinchaDe
      ? {
          id: usuario.hinchaDe.id,
          nombre: usuario.hinchaDe.nombre,
          nombreCompleto: usuario.hinchaDe.nombreCompleto,
          tipo: usuario.hinchaDe.tipo,
        }
      : null,
  };
}

module.exports = {
  getBearerToken,
  hashPassword,
  isValidEmail,
  isValidPassword,
  isValidUsername,
  normalizeEmail,
  normalizeUsername,
  signAuthToken,
  usuarioResponse,
  verifyAuthToken,
  verifyPassword,
};
