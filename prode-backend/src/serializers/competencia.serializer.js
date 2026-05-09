function competenciaResponse(competencia) {
  return {
    id: competencia.id,
    nombre: competencia.nombre,
    slug: competencia.slug,
  };
}

module.exports = { competenciaResponse };
