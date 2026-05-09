function equipoResponse(equipo) {
  return {
    id: equipo.id,
    nombre: equipo.nombre,
    nombreCompleto: equipo.nombreCompleto,
    abreviatura: equipo.abreviatura,
    tipo: equipo.tipo,
    slug: equipo.slug,
  };
}

module.exports = { equipoResponse };
