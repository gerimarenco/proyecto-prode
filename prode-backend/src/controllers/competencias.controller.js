const competenciasService = require("../services/competencias.service");
const { competenciaResponse } = require("../serializers/competencia.serializer");

async function list(req, res) {
  const competencias = await competenciasService.list();
  res.json(competencias.map(competenciaResponse));
}

async function getById(req, res) {
  const competencia = await competenciasService.getById(req.params.id);
  res.json(competenciaResponse(competencia));
}

module.exports = { getById, list };
