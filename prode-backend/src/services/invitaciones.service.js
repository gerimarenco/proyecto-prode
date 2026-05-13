const { prisma } = require("../config/prisma");
const { httpError } = require("../utils/httpError");
const { assertEsCreador, joinUser } = require("./torneos.service");

const invitacionInclude = {
  torneoDeAmigos: { include: { competencia: true } },
  invitado: { select: { id: true, nombre: true, apellido: true, username: true, email: true } },
  invitadoPor: { select: { id: true, nombre: true, apellido: true, username: true } },
};

async function findUsuarioByIdentificador(identificador) {
  const value = String(identificador || "").trim().toLowerCase();
  if (!value) throw httpError(400, "Identificador requerido");
  const usuario = await prisma.usuario.findFirst({
    where: { OR: [{ username: value }, { email: value }] },
  });
  if (!usuario) throw httpError(404, "No encontramos a ese usuario");
  if (!usuario.activo) throw httpError(409, "El usuario esta inactivo");
  return usuario;
}

async function crearInvitacion({ torneoId, invitadoPorId, identificador }) {
  const torneo = await prisma.torneoDeAmigos.findUnique({
    where: { id: torneoId },
    include: { usuarios: { select: { id: true } } },
  });
  if (!torneo) throw httpError(404, "Torneo no encontrado");
  assertEsCreador(torneo, invitadoPorId);

  const invitado = await findUsuarioByIdentificador(identificador);

  if (invitado.id === invitadoPorId) {
    throw httpError(400, "Ya sos parte del torneo");
  }
  if (torneo.usuarios.some((u) => u.id === invitado.id)) {
    throw httpError(409, "Ese usuario ya es miembro del torneo");
  }

  return prisma.invitacion.upsert({
    where: {
      torneoDeAmigosId_invitadoId: {
        torneoDeAmigosId: torneoId,
        invitadoId: invitado.id,
      },
    },
    create: {
      torneoDeAmigosId: torneoId,
      invitadoId: invitado.id,
      invitadoPorId,
    },
    update: {
      estado: "PENDIENTE",
      invitadoPorId,
      fechaRespuesta: null,
    },
    include: invitacionInclude,
  });
}

async function listarPendientesParaUsuario(usuarioId) {
  return prisma.invitacion.findMany({
    where: { invitadoId: usuarioId, estado: "PENDIENTE" },
    include: invitacionInclude,
    orderBy: { fechaCreacion: "desc" },
  });
}

async function listarParaTorneo(torneoId, solicitanteId) {
  const torneo = await prisma.torneoDeAmigos.findUnique({
    where: { id: torneoId },
    select: { id: true, creadorId: true },
  });
  if (!torneo) throw httpError(404, "Torneo no encontrado");
  assertEsCreador(torneo, solicitanteId);

  return prisma.invitacion.findMany({
    where: { torneoDeAmigosId: torneoId },
    include: invitacionInclude,
    orderBy: { fechaCreacion: "desc" },
  });
}

async function aceptar(invitacionId, usuarioId) {
  const invitacion = await prisma.invitacion.findUnique({
    where: { id: invitacionId },
    include: invitacionInclude,
  });
  if (!invitacion) throw httpError(404, "Invitacion no encontrada");
  if (invitacion.invitadoId !== usuarioId) throw httpError(403, "Esa invitacion no es para vos");
  if (invitacion.estado !== "PENDIENTE") {
    throw httpError(409, `La invitacion ya esta ${invitacion.estado.toLowerCase()}`);
  }

  await joinUser(invitacion.torneoDeAmigosId, usuarioId);

  return prisma.invitacion.update({
    where: { id: invitacionId },
    data: { estado: "ACEPTADA", fechaRespuesta: new Date() },
    include: invitacionInclude,
  });
}

async function rechazar(invitacionId, usuarioId) {
  const invitacion = await prisma.invitacion.findUnique({ where: { id: invitacionId } });
  if (!invitacion) throw httpError(404, "Invitacion no encontrada");
  if (invitacion.invitadoId !== usuarioId) throw httpError(403, "Esa invitacion no es para vos");
  if (invitacion.estado !== "PENDIENTE") {
    throw httpError(409, `La invitacion ya esta ${invitacion.estado.toLowerCase()}`);
  }

  return prisma.invitacion.update({
    where: { id: invitacionId },
    data: { estado: "RECHAZADA", fechaRespuesta: new Date() },
    include: invitacionInclude,
  });
}

async function cancelar(invitacionId, usuarioId) {
  const invitacion = await prisma.invitacion.findUnique({
    where: { id: invitacionId },
    include: { torneoDeAmigos: { select: { creadorId: true } } },
  });
  if (!invitacion) throw httpError(404, "Invitacion no encontrada");
  if (invitacion.torneoDeAmigos.creadorId !== usuarioId) {
    throw httpError(403, "Solo el creador del torneo puede cancelar la invitacion");
  }
  if (invitacion.estado !== "PENDIENTE") {
    throw httpError(409, `La invitacion ya esta ${invitacion.estado.toLowerCase()}`);
  }

  return prisma.invitacion.update({
    where: { id: invitacionId },
    data: { estado: "CANCELADA", fechaRespuesta: new Date() },
    include: invitacionInclude,
  });
}

module.exports = {
  aceptar,
  cancelar,
  crearInvitacion,
  listarParaTorneo,
  listarPendientesParaUsuario,
  rechazar,
};
