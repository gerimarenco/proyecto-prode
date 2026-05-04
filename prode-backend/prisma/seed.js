require("dotenv/config");

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function upsertEquipo(nombre, abreviatura, nombreCompleto = null, tipo = "CLUB") {
  return prisma.equipo.upsert({
    where: { slug: slugify(nombre) },
    update: { nombre, nombreCompleto, tipo, abreviatura },
    create: { nombre, nombreCompleto, tipo, slug: slugify(nombre), abreviatura },
  });
}

async function main() {
  const usuario = await prisma.usuario.upsert({
    where: { username: "demo" },
    update: {},
    create: {
      nombre: "Usuario",
      apellido: "Demo",
      username: "demo",
      hashClave: "seed-no-usar-en-produccion",
    },
  });

  const competencia = await prisma.competencia.upsert({
    where: { slug: "copa-libertadores" },
    update: { nombre: "Copa Libertadores" },
    create: { nombre: "Copa Libertadores", slug: "copa-libertadores" },
  });

  const torneo = await prisma.torneo.upsert({
    where: { id: "torneo-demo-libertadores-2026" },
    update: { nombre: "Libertadores Amigos 2026", competenciaId: competencia.id },
    create: {
      id: "torneo-demo-libertadores-2026",
      nombre: "Libertadores Amigos 2026",
      competenciaId: competencia.id,
    },
  });

  await prisma.torneo.update({
    where: { id: torneo.id },
    data: {
      usuarios: { connect: { id: usuario.id } },
    },
  });

  const equipos = {};
  for (const [nombre, abbr, nombreCompleto, tipo] of [
    ["Boca", "BOC", "Club Atletico Boca Juniors", "CLUB"],
    ["River", "RIV", "Club Atletico River Plate", "CLUB"],
    ["Flamengo", "FLA", "Clube de Regatas do Flamengo", "CLUB"],
    ["Palmeiras", "PAL", "Sociedade Esportiva Palmeiras", "CLUB"],
  ]) {
    equipos[nombre] = await upsertEquipo(nombre, abbr, nombreCompleto, tipo);
  }

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { hinchaDe: { connect: { id: equipos["Boca"].id } } },
  });

  const partidos = [
    {
      id: "partido-demo-1",
      equipo1: "Boca",
      equipo2: "Flamengo",
      fecha: "2026-05-10T22:00:00.000Z",
      equipo1EsLocal: false,
    },
    {
      id: "partido-demo-2",
      equipo1: "River",
      equipo2: "Palmeiras",
      fecha: "2026-05-11T00:30:00.000Z",
      equipo1EsLocal: false,
    },
  ];

  for (const partido of partidos) {
    await prisma.partido.upsert({
      where: { id: partido.id },
      update: {
        torneoId: torneo.id,
        equipo1Id: equipos[partido.equipo1].id,
        equipo2Id: equipos[partido.equipo2].id,
        equipo1EsLocal: partido.equipo1EsLocal,
        fecha: new Date(partido.fecha),
      },
      create: {
        id: partido.id,
        torneoId: torneo.id,
        equipo1Id: equipos[partido.equipo1].id,
        equipo2Id: equipos[partido.equipo2].id,
        equipo1EsLocal: partido.equipo1EsLocal,
        fecha: new Date(partido.fecha),
      },
    });
  }

  console.log("Seed listo");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
