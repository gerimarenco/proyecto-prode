const { prisma } = require("../config/prisma");
const { httpError } = require("../utils/httpError");
const { esPrediccionExacta } = require("./scoring.service");

async function list({ usuarioId } = {}) {
  return prisma.torneoDeAmigos.findMany({
    where: usuarioId ? { usuarios: { some: { id: usuarioId } } } : undefined,
    include: {
      competencia: true,
      _count: { select: { usuarios: true } },
    },
    orderBy: { fechaCreacion: "desc" },
  });
}

async function getById(id) {
  const torneo = await prisma.torneoDeAmigos.findUnique({
    where: { id },
    include: {
      competencia: true,
      _count: { select: { usuarios: true } },
    },
  });
  if (!torneo) throw httpError(404, "Torneo no encontrado");
  return torneo;
}

async function create({ nombre, competenciaId, creadorId }) {
  const competencia = await prisma.competencia.findUnique({ where: { id: competenciaId } });
  if (!competencia) throw httpError(400, "La competencia no existe");

  return prisma.torneoDeAmigos.create({
    data: {
      nombre,
      competenciaId,
      usuarios: { connect: { id: creadorId } },
    },
    include: {
      competencia: true,
      _count: { select: { usuarios: true } },
    },
  });
}

async function joinUser(torneoId, usuarioId) {
  const torneo = await prisma.torneoDeAmigos.findUnique({
    where: { id: torneoId },
    include: { usuarios: { where: { id: usuarioId }, select: { id: true } } },
  });

  if (!torneo) throw httpError(404, "Torneo no encontrado");
  if (!torneo.activo) throw httpError(409, "El torneo esta inactivo");

  const yaEra = torneo.usuarios.length > 0;

  if (!yaEra) {
    await prisma.torneoDeAmigos.update({
      where: { id: torneoId },
      data: { usuarios: { connect: { id: usuarioId } } },
    });
  }

  const torneoFinal = await prisma.torneoDeAmigos.findUnique({
    where: { id: torneoId },
    include: {
      competencia: true,
      _count: { select: { usuarios: true } },
    },
  });

  return { torneo: torneoFinal, yaEraMiembro: yaEra };
}

async function getTabla(torneoId) {
  const torneo = await prisma.torneoDeAmigos.findUnique({
    where: { id: torneoId },
    include: {
      usuarios: { include: { hinchaDe: true } },
    },
  });
  if (!torneo) throw httpError(404, "Torneo no encontrado");
  if (torneo.usuarios.length === 0) return [];

  const usuarioIds = torneo.usuarios.map((u) => u.id);

  const predicciones = await prisma.prediccion.findMany({
    where: {
      usuarioId: { in: usuarioIds },
      partido: { competenciaId: torneo.competenciaId, estado: "TERMINADO" },
      puntosOtorgados: { not: null },
    },
    include: { partido: true },
  });

  const totales = new Map(
    usuarioIds.map((id) => [id, { puntos: 0, aciertos: 0, exactos: 0 }]),
  );

  for (const prediccion of predicciones) {
    const acc = totales.get(prediccion.usuarioId);
    if (!acc) continue;
    acc.puntos += prediccion.puntosOtorgados;
    if (prediccion.puntosOtorgados > 0) acc.aciertos += 1;
    if (esPrediccionExacta(prediccion)) acc.exactos += 1;
  }

  return torneo.usuarios
    .map((usuario) => ({
      usuarioId: usuario.id,
      usuario,
      ...totales.get(usuario.id),
    }))
    .sort((a, b) =>
      b.puntos - a.puntos ||
      b.aciertos - a.aciertos ||
      b.exactos - a.exactos ||
      a.usuario.username.localeCompare(b.usuario.username),
    );
}

module.exports = { create, getById, getTabla, joinUser, list };
