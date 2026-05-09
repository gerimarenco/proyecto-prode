const { competenciaResponse } = require("./competencia.serializer");
const { usuarioPublico } = require("./usuario.serializer");

function torneoDeAmigosResponse(torneo, { miembrosCount } = {}) {
  return {
    id: torneo.id,
    nombre: torneo.nombre,
    activo: torneo.activo,
    competenciaId: torneo.competenciaId,
    competencia: torneo.competencia ? competenciaResponse(torneo.competencia) : null,
    miembrosCount: miembrosCount ?? torneo.usuarios?.length ?? torneo._count?.usuarios ?? null,
    fechaCreacion: torneo.fechaCreacion,
  };
}

function tablaEntryResponse(puntaje) {
  return {
    usuarioId: puntaje.usuarioId,
    usuario: puntaje.usuario ? usuarioPublico(puntaje.usuario) : null,
    puntos: puntaje.puntos,
    aciertos: puntaje.aciertos,
    exactos: puntaje.exactos,
  };
}

module.exports = { tablaEntryResponse, torneoDeAmigosResponse };
