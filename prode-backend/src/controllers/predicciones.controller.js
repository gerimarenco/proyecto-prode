const prediccionesService = require("../services/predicciones.service");
const { prediccionResponse } = require("../serializers/prediccion.serializer");

async function create(req, res) {
  const prediccion = await prediccionesService.upsertForUser(req.usuario.id, req.body);
  res.status(201).json(prediccionResponse(prediccion));
}

async function update(req, res) {
  const prediccion = await prediccionesService.updateById(
    req.params.id,
    req.usuario.id,
    req.body,
  );
  res.json(prediccionResponse(prediccion));
}

module.exports = { create, update };
