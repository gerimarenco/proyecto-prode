const torneosService = require("../services/torneos.service");
const prediccionesService = require("../services/predicciones.service");
const {
  tablaEntryResponse,
  torneoDeAmigosResponse,
} = require("../serializers/torneoDeAmigos.serializer");
const { prediccionResponse } = require("../serializers/prediccion.serializer");

function torneoToJson(torneo) {
  return torneoDeAmigosResponse(torneo, { miembrosCount: torneo._count?.usuarios });
}

async function list(req, res) {
  const usuarioId = req.query.mias === "true" && req.usuario ? req.usuario.id : undefined;
  const torneos = await torneosService.list({ usuarioId });
  res.json(torneos.map(torneoToJson));
}

async function getById(req, res) {
  const torneo = await torneosService.getById(req.params.id);
  res.json(torneoToJson(torneo));
}

async function create(req, res) {
  const torneo = await torneosService.create({
    nombre: req.body.nombre,
    competenciaId: req.body.competenciaId,
    creadorId: req.usuario.id,
  });
  res.status(201).json(torneoToJson(torneo));
}

async function unirse(req, res) {
  const { torneo, yaEraMiembro } = await torneosService.joinUser(
    req.params.id,
    req.usuario.id,
  );
  res.status(yaEraMiembro ? 200 : 201).json({
    ...torneoToJson(torneo),
    yaEraMiembro,
  });
}

async function getTabla(req, res) {
  const puntajes = await torneosService.getTabla(req.params.id);
  res.json(puntajes.map(tablaEntryResponse));
}

async function getMisPredicciones(req, res) {
  const predicciones = await prediccionesService.listByTorneoForUser(
    req.params.id,
    req.usuario.id,
  );
  res.json(predicciones.map(prediccionResponse));
}

module.exports = { create, getById, getMisPredicciones, getTabla, list, unirse };
