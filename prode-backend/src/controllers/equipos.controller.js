const equiposService = require("../services/equipos.service");
const { equipoResponse } = require("../serializers/equipo.serializer");

async function list(req, res) {
  const equipos = await equiposService.list(req.query);
  res.json(equipos.map(equipoResponse));
}

async function getById(req, res) {
  const equipo = await equiposService.getById(req.params.id);
  res.json(equipoResponse(equipo));
}

module.exports = { getById, list };
