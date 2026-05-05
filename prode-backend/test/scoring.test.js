const test = require("node:test");
const assert = require("node:assert/strict");
const { calcularPuntos } = require("../src/scoring");

function puntos(predicho, real) {
  return calcularPuntos({
    golesEquipo1Predicho: predicho[0],
    golesEquipo2Predicho: predicho[1],
    golesEquipo1Real: real[0],
    golesEquipo2Real: real[1],
  });
}

test("otorga 1 punto por resultado correcto", () => {
  assert.equal(puntos([2, 0], [1, 0]), 1);
});

test("otorga 2 puntos por resultado y diferencia correcta", () => {
  assert.equal(puntos([2, 1], [3, 2]), 2);
  assert.equal(puntos([1, 1], [2, 2]), 2);
});

test("otorga maximo entre 3 y goles totales cuando el resultado es exacto", () => {
  assert.equal(puntos([1, 0], [1, 0]), 3);
  assert.equal(puntos([2, 1], [2, 1]), 3);
  assert.equal(puntos([4, 1], [4, 1]), 5);
});

test("otorga 0 puntos si falla ganador o empate", () => {
  assert.equal(puntos([1, 0], [0, 2]), 0);
  assert.equal(puntos([1, 1], [2, 1]), 0);
  assert.equal(puntos([0, 1], [666, 666]), 0);
});
