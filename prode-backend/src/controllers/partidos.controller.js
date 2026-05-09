const partidosService = require("../services/partidos.service");
const { partidoResponse } = require("../serializers/partido.serializer");

async function list(req, res) {
  const partidos = await partidosService.list({
    filters: req.query,
    usuarioId: req.usuario?.id,
  });
  res.json(partidos.map((p) => partidoResponse(p)));
}

async function getById(req, res) {
  const partido = await partidosService.getById(req.params.id, {
    usuarioId: req.usuario?.id,
  });
  res.json(partidoResponse(partido));
}

async function cerrar(req, res) {
  const cierre = await partidosService.cerrar(req.params.id, req.body);
  res.json({
    ok: true,
    yaEstabaCerrado: cierre.yaEstabaCerrado,
    prediccionesActualizadas: cierre.prediccionesActualizadas,
    partido: partidoResponse(cierre.partido),
  });
}

module.exports = { cerrar, getById, list };
