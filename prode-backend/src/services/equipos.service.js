const { prisma } = require("../config/prisma");
const { httpError } = require("../utils/httpError");

async function list({ tipo, q } = {}) {
  const where = {};
  if (tipo) where.tipo = tipo;
  if (q) {
    where.OR = [
      { nombre: { contains: q, mode: "insensitive" } },
      { nombreCompleto: { contains: q, mode: "insensitive" } },
      { abreviatura: { contains: q, mode: "insensitive" } },
    ];
  }
  return prisma.equipo.findMany({ where, orderBy: { nombre: "asc" } });
}

async function getById(id) {
  const equipo = await prisma.equipo.findUnique({ where: { id } });
  if (!equipo) throw httpError(404, "Equipo no encontrado");
  return equipo;
}

module.exports = { getById, list };
