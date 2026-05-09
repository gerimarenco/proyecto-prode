const { estadoPrediccion } = require("./partido.serializer");

function prediccionResponse(prediccion) {
  const partido = prediccion.partido;
  const exacto = Boolean(
    partido.golesEquipo1 != null &&
    partido.golesEquipo2 != null &&
    prediccion.golesEquipo1Predicho === partido.golesEquipo1 &&
    prediccion.golesEquipo2Predicho === partido.golesEquipo2,
  );

  return {
    id: prediccion.id,
    matchId: prediccion.partidoId,
    equipo1: partido.equipo1.nombre,
    equipo1NombreCompleto: partido.equipo1.nombreCompleto,
    equipo1Tipo: partido.equipo1.tipo,
    equipo2: partido.equipo2.nombre,
    equipo2NombreCompleto: partido.equipo2.nombreCompleto,
    equipo2Tipo: partido.equipo2.tipo,
    liga: partido.competencia?.nombre,
    competenciaId: partido.competenciaId,
    fecha: partido.fecha,
    scoreEquipo1Pred: prediccion.golesEquipo1Predicho,
    scoreEquipo2Pred: prediccion.golesEquipo2Predicho,
    scoreEquipo1: partido.golesEquipo1,
    scoreEquipo2: partido.golesEquipo2,
    estado: estadoPrediccion(prediccion),
    puntos: prediccion.puntosOtorgados || 0,
    exacto,
  };
}

module.exports = { prediccionResponse };
