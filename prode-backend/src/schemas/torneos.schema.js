const { registry, z } = require("../openapi/registry");

const createTorneoBody = registry.register(
  "TorneoDeAmigosCreateBody",
  z.object({
    nombre: z.string().trim().min(1).max(120),
    competenciaId: z.string().min(1),
  }),
);

const torneoPayload = registry.register(
  "TorneoDeAmigos",
  z.object({
    id: z.string(),
    nombre: z.string(),
    activo: z.boolean(),
    competenciaId: z.string(),
    competencia: z
      .object({ id: z.string(), nombre: z.string(), slug: z.string() })
      .nullable(),
    miembrosCount: z.number().nullable(),
    fechaCreacion: z.string().datetime().or(z.date()),
  }),
);

const tablaEntryPayload = registry.register(
  "TablaEntry",
  z.object({
    usuarioId: z.string(),
    usuario: z
      .object({
        id: z.string(),
        nombre: z.string(),
        apellido: z.string().nullable(),
        username: z.string(),
        hinchaDe: z
          .object({
            id: z.string(),
            nombre: z.string(),
            nombreCompleto: z.string().nullable(),
            tipo: z.enum(["CLUB", "SELECCION"]),
          })
          .nullable(),
      })
      .nullable(),
    puntos: z.number(),
    aciertos: z.number(),
    exactos: z.number(),
  }),
);

module.exports = { createTorneoBody, tablaEntryPayload, torneoPayload };
