function usuarioBreve(u) {
  if (!u) return null;
  return { id: u.id, nombre: u.nombre, apellido: u.apellido, username: u.username };
}

function torneoBreve(t) {
  if (!t) return null;
  return {
    id: t.id,
    nombre: t.nombre,
    competencia: t.competencia
      ? { id: t.competencia.id, nombre: t.competencia.nombre, slug: t.competencia.slug }
      : null,
  };
}

function invitacionResponse(invitacion) {
  return {
    id: invitacion.id,
    estado: invitacion.estado,
    torneoDeAmigosId: invitacion.torneoDeAmigosId,
    torneoDeAmigos: torneoBreve(invitacion.torneoDeAmigos),
    invitado: usuarioBreve(invitacion.invitado),
    invitadoPor: usuarioBreve(invitacion.invitadoPor),
    fechaCreacion: invitacion.fechaCreacion,
    fechaRespuesta: invitacion.fechaRespuesta,
  };
}

module.exports = { invitacionResponse };
