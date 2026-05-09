function resultadoDe(golesEquipo1, golesEquipo2) {
  if (golesEquipo1 > golesEquipo2) return "equipo1";
  if (golesEquipo1 < golesEquipo2) return "equipo2";
  return "empate";
}

function calcularPuntos({
  golesEquipo1Predicho,
  golesEquipo2Predicho,
  golesEquipo1Real,
  golesEquipo2Real,
}) {
  const resultadoPredicho = resultadoDe(golesEquipo1Predicho, golesEquipo2Predicho);
  const resultadoReal = resultadoDe(golesEquipo1Real, golesEquipo2Real);

  if (resultadoPredicho !== resultadoReal) return 0;

  const esExacto =
    golesEquipo1Predicho === golesEquipo1Real &&
    golesEquipo2Predicho === golesEquipo2Real;

  if (esExacto) return Math.max(3, golesEquipo1Real + golesEquipo2Real);

  const diferenciaPredicha = golesEquipo1Predicho - golesEquipo2Predicho;
  const diferenciaReal = golesEquipo1Real - golesEquipo2Real;

  if (diferenciaPredicha === diferenciaReal) return 2;

  return 1;
}

function esPrediccionExacta(prediccion) {
  return (
    prediccion.golesEquipo1Predicho === prediccion.partido.golesEquipo1 &&
    prediccion.golesEquipo2Predicho === prediccion.partido.golesEquipo2
  );
}

module.exports = { calcularPuntos, esPrediccionExacta, resultadoDe };
