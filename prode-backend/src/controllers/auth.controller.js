const { prisma } = require("../config/prisma");
const { httpError } = require("../utils/httpError");
const { hashPassword, normalizeEmail, normalizeUsername, signAuthToken, verifyPassword } =
  require("../services/auth.service");
const { usuarioResponse } = require("../serializers/usuario.serializer");

async function register(req, res) {
  const username = normalizeUsername(req.body.username);
  const email = req.body.email ? normalizeEmail(req.body.email) : null;
  const password = req.body.password;
  const nombre = (req.body.nombre || username).trim();
  const apellido = req.body.apellido?.trim() || null;

  const existente = await prisma.usuario.findFirst({
    where: {
      OR: [
        { username },
        ...(email ? [{ email }] : []),
      ],
    },
  });
  if (existente) throw httpError(409, "Ya existe una cuenta con ese usuario o email");

  const usuario = await prisma.usuario.create({
    data: { nombre, apellido, username, email, hashClave: await hashPassword(password) },
    include: { hinchaDe: true },
  });

  res.status(201).json({
    token: signAuthToken(usuario),
    usuario: usuarioResponse(usuario),
  });
}

async function login(req, res) {
  const identificador = String(
    req.body.identificador ?? req.body.username ?? req.body.email ?? "",
  ).trim().toLowerCase();
  const password = req.body.password;

  const usuario = await prisma.usuario.findFirst({
    where: { OR: [{ username: identificador }, { email: identificador }] },
    include: { hinchaDe: true },
  });

  if (!usuario || !usuario.activo || !(await verifyPassword(password, usuario.hashClave))) {
    throw httpError(401, "Credenciales invalidas");
  }

  res.json({ token: signAuthToken(usuario), usuario: usuarioResponse(usuario) });
}

async function me(req, res) {
  res.json({ usuario: usuarioResponse(req.usuario) });
}

async function logout(req, res) {
  res.json({ ok: true });
}

module.exports = { login, logout, me, register };
