const { registry, z } = require("../openapi/registry");

const crearInvitacionBody = registry.register(
  "InvitacionCrearBody",
  z.object({
    identificador: z.string().trim().min(1, "Usuario o email requerido"),
  }),
);

const invitacionPayload = registry.register(
  "Invitacion",
  z.object({
    id: z.string(),
    estado: z.enum(["PENDIENTE", "ACEPTADA", "RECHAZADA", "CANCELADA"]),
    torneoDeAmigosId: z.string(),
    torneoDeAmigos: z
      .object({
        id: z.string(),
        nombre: z.string(),
        competencia: z
          .object({ id: z.string(), nombre: z.string(), slug: z.string() })
          .nullable(),
      })
      .nullable(),
    invitado: z
      .object({
        id: z.string(),
        nombre: z.string(),
        apellido: z.string().nullable(),
        username: z.string(),
      })
      .nullable(),
    invitadoPor: z
      .object({
        id: z.string(),
        nombre: z.string(),
        apellido: z.string().nullable(),
        username: z.string(),
      })
      .nullable(),
    fechaCreacion: z.string().datetime().or(z.date()),
    fechaRespuesta: z.string().datetime().or(z.date()).nullable(),
  }),
);

const inviteLinkPayload = registry.register(
  "InviteLink",
  z.object({
    token: z.string().nullable(),
  }),
);

const inviteTokenParam = z.object({
  token: z.string().min(1, "Token requerido"),
});

module.exports = {
  crearInvitacionBody,
  invitacionPayload,
  inviteLinkPayload,
  inviteTokenParam,
};
