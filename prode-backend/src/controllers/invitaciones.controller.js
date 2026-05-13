const invitacionesService = require("../services/invitaciones.service");
const { invitacionResponse } = require("../serializers/invitacion.serializer");

async function listMiasPendientes(req, res) {
  const invitaciones = await invitacionesService.listarPendientesParaUsuario(req.usuario.id);
  res.json(invitaciones.map(invitacionResponse));
}

async function aceptar(req, res) {
  const invitacion = await invitacionesService.aceptar(req.params.id, req.usuario.id);
  res.json(invitacionResponse(invitacion));
}

async function rechazar(req, res) {
  const invitacion = await invitacionesService.rechazar(req.params.id, req.usuario.id);
  res.json(invitacionResponse(invitacion));
}

async function cancelar(req, res) {
  const invitacion = await invitacionesService.cancelar(req.params.id, req.usuario.id);
  res.json(invitacionResponse(invitacion));
}

module.exports = { aceptar, cancelar, listMiasPendientes, rechazar };
