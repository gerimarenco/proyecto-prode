const { prisma } = require("../config/prisma");
const { getBearerToken, verifyAuthToken } = require("../services/auth.service");
const { httpError } = require("../utils/httpError");
const { asyncRoute } = require("../utils/asyncRoute");

async function loadUsuario(req, tx = prisma) {
  if (req.usuario) return req.usuario;

  const token = getBearerToken(req);
  if (!token) return null;

  let payload;
  try {
    payload = verifyAuthToken(token);
  } catch {
    throw httpError(401, "Sesión inválida o expirada");
  }

  const usuario = await tx.usuario.findUnique({
    where: { id: payload.sub },
    include: { hinchaDe: true },
  });

  if (!usuario || !usuario.activo) throw httpError(401, "Usuario no valido");

  req.usuario = usuario;
  return usuario;
}

const requireAuth = asyncRoute(async (req, res, next) => {
  const usuario = await loadUsuario(req);
  if (!usuario) throw httpError(401, "Tenés que iniciar sesión");
  next();
});

const optionalAuth = asyncRoute(async (req, res, next) => {
  try {
    await loadUsuario(req);
  } catch (err) {
    if (err.status !== 401) throw err;
  }
  next();
});

const requireAdmin = asyncRoute(async (req, res, next) => {
  const usuario = await loadUsuario(req);
  if (!usuario) throw httpError(401, "Tenés que iniciar sesión");
  if (usuario.rol !== "ADMIN") throw httpError(403, "Requiere permisos de administrador");
  next();
});

module.exports = { loadUsuario, optionalAuth, requireAdmin, requireAuth };
