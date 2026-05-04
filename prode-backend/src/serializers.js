function estadoParaFrontend(estado) {
  const estados = {
    NO_COMENZO: "proximo",
    EN_JUEGO: "en-vivo",
    TERMINADO: "finalizado",
    SUSPENDIDO: "suspendido",
    CANCELADO: "cancelado",
  };

  return estados[estado] || "proximo";
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
    liga: partido.torneo.competencia.nombre,
    torneo: partido.torneo.nombre,
    equipo1: partido.equipo1.nombre,
    equipo1NombreCompleto: partido.equipo1.nombreCompleto,
    equipo1Tipo: partido.equipo1.tipo,
    equipo2: partido.equipo2.nombre,
    equipo2NombreCompleto: partido.equipo2.nombreCompleto,
    equipo2Tipo: partido.equipo2.tipo,
    equipo1EsLocal: partido.equipo1EsLocal,
    estado: estadoParaFrontend(partido.estado),
    scoreEquipo1: partido.golesEquipo1,
    scoreEquipo2: partido.golesEquipo2,
    fecha: partido.fecha,
    userPred: pred
      ? {
          scoreEquipo1: pred.golesEquipo1Predicho,
          scoreEquipo2: pred.golesEquipo2Predicho,
          estado: estadoPrediccion(pred),
          puntos: pred.puntosOtorgados || 0,
          exacto,
        }
      : null,
  };
}

function prediccionResponse(prediccion) {
  const exacto = Boolean(
    prediccion.partido.golesEquipo1 != null &&
    prediccion.partido.golesEquipo2 != null &&
    prediccion.golesEquipo1Predicho === prediccion.partido.golesEquipo1 &&
    prediccion.golesEquipo2Predicho === prediccion.partido.golesEquipo2,
  );

  return {
    id: prediccion.id,
    matchId: prediccion.partidoId,
    equipo1: prediccion.partido.equipo1.nombre,
    equipo1NombreCompleto: prediccion.partido.equipo1.nombreCompleto,
    equipo1Tipo: prediccion.partido.equipo1.tipo,
    equipo2: prediccion.partido.equipo2.nombre,
    equipo2NombreCompleto: prediccion.partido.equipo2.nombreCompleto,
    equipo2Tipo: prediccion.partido.equipo2.tipo,
    liga: prediccion.partido.torneo.competencia.nombre,
    scoreEquipo1Pred: prediccion.golesEquipo1Predicho,
    scoreEquipo2Pred: prediccion.golesEquipo2Predicho,
    estado: estadoPrediccion(prediccion),
    puntos: prediccion.puntosOtorgados || 0,
    exacto,
  };
}

module.exports = { estadoParaFrontend, partidoResponse, prediccionResponse };
