const { registry, z } = require("../openapi/registry");

const idParam = z.object({
  id: z.string().min(1, "id requerido"),
});

const errorResponse = registry.register(
  "Error",
  z.object({
    message: z.string(),
    issues: z
      .array(z.object({ path: z.string(), message: z.string() }))
      .optional(),
  }),
);

module.exports = { errorResponse, idParam };
