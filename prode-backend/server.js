require("dotenv/config");

const express = require("express");
const cors = require("cors");
const { prisma } = require("./src/db");
const {
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
} = require("./src/auth");
const { calcularPuntos, esPrediccionExacta } = require("./src/scoring");
const { partidoResponse, prediccionResponse } = require("./src/serializers");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const includePartido = {
  torneo: { include: { competencia: true } },
  equipo1: true,
  equipo2: true,
};

const ligaMap = {
  champions: "champions-league",
  laliga: "la-liga",
  premier: "premier-league",
  seriea: "serie-a",
  bundesliga: "bundesliga",
  libertadores: "copa-libertadores",
};

function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function parseGoles(value, fieldName) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0 || number > 20) {
    throw httpError(400, `${fieldName} debe ser un entero entre 0 y 20`);
  }
  return number;
}

async function getUsuarioActual(req, tx = prisma) {
  if (req.usuario) return req.usuario;

  const token = getBearerToken(req);
  if (!token) throw httpError(401, "Tenes que iniciar sesion");

  let payload;
  try {
    payload = verifyAuthToken(token);
  } catch {
    throw httpError(401, "Sesion invalida o expirada");
  }

  const usuario = await tx.usuario.findUnique({
    where: { id: payload.sub },
    include: { hinchaDe: true },
  });

  if (!usuario || !usuario.activo) throw httpError(401, "Usuario no valido");

  return usuario;
}

async function getUsuarioOpcional(req, tx = prisma) {
  try {
    return await getUsuarioActual(req, tx);
  } catch (error) {
    if (error.status === 401) return null;
    throw error;
  }
}

function buildPartidoWhere(query) {
  const where = {};

  if (query.estado) {
    where.estado = query.estado;
  }

  if (query.liga) {
    const slug = ligaMap[query.liga] || query.liga;
    where.torneo = {
      competencia: {
        OR: [
          { slug },
          { nombre: { contains: query.liga, mode: "insensitive" } },
        ],
      },
    };
  }

  return where;
}

async function recalcularPuntajesTorneo(tx, torneoId) {
  const predicciones = await tx.prediccion.findMany({
    where: {
      partido: {
        torneoId,
        estado: "TERMINADO",
      },
      puntosOtorgados: { not: null },
    },
    include: {
      partido: true,
    },
  });

  const totales = new Map();

  for (const prediccion of predicciones) {
    const actual = totales.get(prediccion.usuarioId) || {
      puntos: 0,
      aciertos: 0,
      exactos: 0,
    };

    actual.puntos += prediccion.puntosOtorgados || 0;
    if ((prediccion.puntosOtorgados || 0) > 0) actual.aciertos += 1;
    if (esPrediccionExacta(prediccion)) actual.exactos += 1;

    totales.set(prediccion.usuarioId, actual);
  }

  for (const [usuarioId, total] of totales.entries()) {
    await tx.puntajeUsuario.upsert({
      where: { torneoId_usuarioId: { torneoId, usuarioId } },
      create: { torneoId, usuarioId, ...total },
      update: total,
    });
  }
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.post("/api/auth/register", asyncRoute(async (req, res) => {
  const username = normalizeUsername(req.body.username);
  const email = normalizeEmail(req.body.email);
  const password = req.body.password;
  const nombre = String(req.body.nombre || username).trim();

  if (!isValidUsername(username)) {
    throw httpError(400, "El usuario debe tener 3-24 caracteres: letras, numeros, punto, guion o guion bajo");
  }

  if (!isValidEmail(email)) {
    throw httpError(400, "El email no tiene un formato valido");
  }

  if (!isValidPassword(password)) {
    throw httpError(400, "La clave debe tener entre 8 y 128 caracteres");
  }

  const existente = await prisma.usuario.findFirst({
    where: {
      OR: [
        { username },
        ...(email ? [{ email }] : []),
      ],
    },
  });

  if (existente) {
    throw httpError(409, "Ya existe una cuenta con ese usuario o email");
  }

  const usuario = await prisma.usuario.create({
    data: {
      nombre,
      username,
      email,
      hashClave: await hashPassword(password),
    },
    include: { hinchaDe: true },
  });

  res.status(201).json({
    token: signAuthToken(usuario),
    usuario: usuarioResponse(usuario),
  });
}));

app.post("/api/auth/login", asyncRoute(async (req, res) => {
  const identificador = String(req.body.identificador || req.body.username || req.body.email || "")
    .trim()
    .toLowerCase();
  const password = req.body.password;

  if (!identificador || !password) {
    throw httpError(400, "Usuario/email y clave son requeridos");
  }

  const usuario = await prisma.usuario.findFirst({
    where: {
      OR: [
        { username: identificador },
        { email: identificador },
      ],
    },
    include: { hinchaDe: true },
  });

  if (!usuario || !usuario.activo || !(await verifyPassword(password, usuario.hashClave))) {
    throw httpError(401, "Credenciales invalidas");
  }

  res.json({
    token: signAuthToken(usuario),
    usuario: usuarioResponse(usuario),
  });
}));

app.get("/api/auth/me", asyncRoute(async (req, res) => {
  const usuario = await getUsuarioActual(req);
  res.json({ usuario: usuarioResponse(usuario) });
}));

app.post("/api/auth/logout", (req, res) => {
  res.json({ ok: true });
});

app.get("/api/partidos", asyncRoute(async (req, res) => {
  const usuario = await getUsuarioOpcional(req);
  const partidos = await prisma.partido.findMany({
    where: buildPartidoWhere(req.query),
    include: {
      ...includePartido,
      predicciones: usuario
        ? { where: { usuarioId: usuario.id }, take: 1 }
        : false,
    },
    orderBy: { fecha: "asc" },
  });

  res.json(partidos.map((partido) => partidoResponse(partido)));
}));

app.get("/api/partidos/:id", asyncRoute(async (req, res) => {
  const usuario = await getUsuarioOpcional(req);
  const partido = await prisma.partido.findUnique({
    where: { id: req.params.id },
    include: {
      ...includePartido,
      predicciones: usuario
        ? { where: { usuarioId: usuario.id }, take: 1 }
        : false,
    },
  });

  if (!partido) throw httpError(404, "Partido no encontrado");

  res.json(partidoResponse(partido));
}));

app.post("/api/predicciones", asyncRoute(async (req, res) => {
  const scoreEquipo1 = req.body.scoreEquipo1 ?? req.body.scoreLocal;
  const scoreEquipo2 = req.body.scoreEquipo2 ?? req.body.scoreVisitante;
  const golesEquipo1Predicho = parseGoles(scoreEquipo1, "scoreEquipo1");
  const golesEquipo2Predicho = parseGoles(scoreEquipo2, "scoreEquipo2");
  const partidoId = req.body.matchId;

  if (!partidoId) throw httpError(400, "matchId es requerido");

  const prediccion = await prisma.$transaction(async (tx) => {
    const usuario = await getUsuarioActual(req, tx);
    const partido = await tx.partido.findUnique({
      where: { id: partidoId },
      include: includePartido,
    });

    if (!partido) throw httpError(404, "Partido no encontrado");
    if (partido.estado !== "NO_COMENZO") {
      throw httpError(409, "Solo se puede predecir antes de que empiece el partido");
    }

    await tx.torneo.update({
      where: { id: partido.torneoId },
      data: { usuarios: { connect: { id: usuario.id } } },
    });

    return tx.prediccion.upsert({
      where: { partidoId_usuarioId: { partidoId, usuarioId: usuario.id } },
      create: {
        partidoId,
        usuarioId: usuario.id,
        golesEquipo1Predicho,
        golesEquipo2Predicho,
      },
      update: {
        golesEquipo1Predicho,
        golesEquipo2Predicho,
      },
      include: {
        partido: { include: includePartido },
      },
    });
  });

  res.status(201).json(prediccionResponse(prediccion));
}));

app.get("/api/predicciones/me", asyncRoute(async (req, res) => {
  const usuario = await getUsuarioActual(req);
  const predicciones = await prisma.prediccion.findMany({
    where: { usuarioId: usuario.id },
    include: {
      partido: { include: includePartido },
    },
    orderBy: { fechaCreacion: "desc" },
  });

  const response = predicciones
    .map(prediccionResponse)
    .filter((prediccion) => {
      if (req.query.estado === "pendiente") return prediccion.estado === "pendiente";
      if (req.query.estado === "resuelta") return prediccion.estado !== "pendiente";
      return true;
    });

  res.json(response);
}));

app.get("/api/clasificacion", asyncRoute(async (req, res) => {
  const limit = Number.parseInt(req.query.limit || "50", 10);
  const take = Number.isInteger(limit) && limit > 0 ? Math.min(limit, 100) : 50;

  const puntajes = await prisma.puntajeUsuario.findMany({
    take,
    include: { usuario: true },
    orderBy: [
      { puntos: "desc" },
      { aciertos: "desc" },
      { exactos: "desc" },
      { fechaActualizacion: "asc" },
    ],
  });

  res.json(puntajes.map((puntaje) => ({
    id: puntaje.usuarioId,
    nombre: `${puntaje.usuario.nombre}${puntaje.usuario.apellido ? ` ${puntaje.usuario.apellido}` : ""}`,
    puntos: puntaje.puntos,
    aciertos: puntaje.aciertos,
    exactos: puntaje.exactos,
  })));
}));

app.post("/api/partidos/:id/cerrar", asyncRoute(async (req, res) => {
  const bodyGolesEquipo1 = req.body.golesEquipo1 ?? req.body.golesLocal;
  const bodyGolesEquipo2 = req.body.golesEquipo2 ?? req.body.golesVisitante;
  const golesEquipo1 = parseGoles(bodyGolesEquipo1, "golesEquipo1");
  const golesEquipo2 = parseGoles(bodyGolesEquipo2, "golesEquipo2");

  const cierre = await prisma.$transaction(async (tx) => {
    const partido = await tx.partido.findUnique({
      where: { id: req.params.id },
      include: includePartido,
    });

    if (!partido) throw httpError(404, "Partido no encontrado");

    if (partido.estado === "TERMINADO") {
      const mismoResultado =
        partido.golesEquipo1 === golesEquipo1 &&
        partido.golesEquipo2 === golesEquipo2;

      if (!mismoResultado) {
        throw httpError(409, "El partido ya fue cerrado con otro resultado");
      }

      return { partido, prediccionesActualizadas: 0, yaEstabaCerrado: true };
    }

    const update = await tx.partido.updateMany({
      where: { id: partido.id, estado: { not: "TERMINADO" } },
      data: {
        estado: "TERMINADO",
        golesEquipo1,
        golesEquipo2,
      },
    });

    if (update.count === 0) {
      throw httpError(409, "El partido ya fue cerrado por otra operacion");
    }

    const partidoCerrado = await tx.partido.findUnique({
      where: { id: partido.id },
      include: {
        ...includePartido,
        predicciones: true,
      },
    });

    for (const prediccion of partidoCerrado.predicciones) {
      await tx.prediccion.update({
        where: { id: prediccion.id },
        data: {
          puntosOtorgados: calcularPuntos({
            golesEquipo1Predicho: prediccion.golesEquipo1Predicho,
            golesEquipo2Predicho: prediccion.golesEquipo2Predicho,
            golesEquipo1Real: golesEquipo1,
            golesEquipo2Real: golesEquipo2,
          }),
        },
      });
    }

    await recalcularPuntajesTorneo(tx, partidoCerrado.torneoId);

    return {
      partido: partidoCerrado,
      prediccionesActualizadas: partidoCerrado.predicciones.length,
      yaEstabaCerrado: false,
    };
  });

  res.json({
    ok: true,
    yaEstabaCerrado: cierre.yaEstabaCerrado,
    prediccionesActualizadas: cierre.prediccionesActualizadas,
    partido: partidoResponse(cierre.partido),
  });
}));

app.use((req, res) => {
  res.status(404).json({ message: "Ruta no encontrada" });
});

app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = status === 500 ? "Error interno del servidor" : err.message;

  if (status === 500) console.error(err);

  res.status(status).json({ message });
});

app.listen(PORT, () => {
  console.log(`Servidor en puerto ${PORT}`);
});
