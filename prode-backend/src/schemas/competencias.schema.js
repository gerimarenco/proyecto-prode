const { registry, z } = require("../openapi/registry");

const competenciaPayload = registry.register(
  "Competencia",
  z.object({
    id: z.string(),
    nombre: z.string(),
    slug: z.string(),
  }),
);

module.exports = { competenciaPayload };
