require("dotenv/config");

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} no esta configurada`);
  return value;
}

function getJwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET no esta configurada");
  }
  console.warn("JWT_SECRET no esta configurada. Usando secreto local inseguro de desarrollo.");
  return "dev-insecure-jwt-secret-change-me";
}

const env = {
  PORT: Number(process.env.PORT) || 3000,
  NODE_ENV: process.env.NODE_ENV || "development",
  DATABASE_URL: required("DATABASE_URL"),
  JWT_SECRET: getJwtSecret(),
  JWT_TTL: process.env.JWT_TTL || "7d",
};

module.exports = env;
