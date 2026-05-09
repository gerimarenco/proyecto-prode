const ESTADO_FRONTEND = {
  FUTURO: "proximo",
  PROGRAMADO: "proximo",
  EN_JUEGO: "en-vivo",
  TERMINADO: "finalizado",
  SUSPENDIDO: "suspendido",
  CANCELADO: "cancelado",
};

function estadoParaFrontend(estado) {
  return ESTADO_FRONTEND[estado] || "proximo";
}

function estadoPrediccion(prediccion) {
  if (prediccion.puntosOtorgados == null) return "pendiente";
  return prediccion.puntosOtorgados > 0 ? "acierto" : "fallo";
}

function partidoResponse(partido, userPrediccion) {
  const pred = userPrediccion || partido.predicciones?.[0];
  const exacto = Boolean(
    pred &&
    partido.golesEquipo1 != null &&
    partido.golesEquipo2 != null &&
    pred.golesEquipo1Predicho === partido.golesEquipo1 &&
    pred.golesEquipo2Predicho === partido.golesEquipo2,
  );

  return {
    id: partido.id,
    competenciaId: partido.competenciaId,
    liga: partido.competencia?.nombre,
    competencia: partido.competencia
      ? { id: partido.competencia.id, nombre: partido.competencia.nombre, slug: partido.competencia.slug }
      : null,
    equipo1: partido.equipo1.nombre,
    equipo1NombreCompleto: partido.equipo1.nombreCompleto,
    equipo1Tipo: partido.equipo1.tipo,
    equipo2: partido.equipo2.nombre,
    equipo2NombreCompleto: partido.equipo2.nombreCompleto,
    equipo2Tipo: partido.equipo2.tipo,
    equipo1EsLocal: partido.equipo1EsLocal,
    estado: estadoParaFrontend(partido.estado),
    estadoRaw: partido.estado,
    scoreEquipo1: partido.golesEquipo1,
    scoreEquipo2: partido.golesEquipo2,
    fecha: partido.fecha,
    userPred: pred
      ? {
          id: pred.id,
          scoreEquipo1: pred.golesEquipo1Predicho,
          scoreEquipo2: pred.golesEquipo2Predicho,
          estado: estadoPrediccion(pred),
          puntos: pred.puntosOtorgados || 0,
          exacto,
        }
      : null,
  };
}

module.exports = { estadoParaFrontend, estadoPrediccion, partidoResponse };
