const { registry, z } = require("../openapi/registry");

const equipoPayload = registry.register(
  "Equipo",
  z.object({
    id: z.string(),
    nombre: z.string(),
    nombreCompleto: z.string().nullable(),
    abreviatura: z.string().nullable(),
    tipo: z.enum(["CLUB", "SELECCION"]),
    slug: z.string(),
  }),
);

const listEquiposQuery = z.object({
  tipo: z.enum(["CLUB", "SELECCION"]).optional(),
  q: z.string().trim().min(1).optional(),
});

module.exports = { equipoPayload, listEquiposQuery };
