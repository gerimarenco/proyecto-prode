const { Router } = require("express");
const { registry, z } = require("../openapi/registry");
const { asyncRoute } = require("../utils/asyncRoute");
const { validate } = require("../middlewares/validate.middleware");
const { optionalAuth, requireAdmin } = require("../middlewares/auth.middleware");
const { idParam, errorResponse } = require("../schemas/common.schema");
const { cerrarPartidoBody, listPartidosQuery, partidoPayload } =
  require("../schemas/partidos.schema");
const controller = require("../controllers/partidos.controller");

const router = Router();

router.get("/", optionalAuth, validate({ query: listPartidosQuery }), asyncRoute(controller.list));
router.get(
  "/:id",
  optionalAuth,
  validate({ params: idParam }),
  asyncRoute(controller.getById),
);
router.post(
  "/:id/cerrar",
  requireAdmin,
  validate({ params: idParam, body: cerrarPartidoBody }),
  asyncRoute(controller.cerrar),
);

registry.registerPath({
  method: "get",
  path: "/partidos",
  tags: ["Partidos"],
  request: { query: listPartidosQuery },
  responses: {
    200: { description: "Lista de partidos", content: { "application/json": { schema: z.array(partidoPayload) } } },
  },
});

registry.registerPath({
  method: "get",
  path: "/partidos/{id}",
  tags: ["Partidos"],
  request: { params: idParam },
  responses: {
    200: { description: "Partido", content: { "application/json": { schema: partidoPayload } } },
    404: { description: "No encontrado", content: { "application/json": { schema: errorResponse } } },
  },
});

registry.registerPath({
  method: "post",
  path: "/partidos/{id}/cerrar",
  tags: ["Partidos"],
  security: [{ bearerAuth: [] }],
  request: {
    params: idParam,
    body: { content: { "application/json": { schema: cerrarPartidoBody } } },
  },
  responses: {
    200: {
      description: "Partido cerrado y puntajes recalculados",
      content: {
        "application/json": {
          schema: z.object({
            ok: z.boolean(),
            yaEstabaCerrado: z.boolean(),
            prediccionesActualizadas: z.number(),
            partido: partidoPayload,
          }),
        },
      },
    },
    403: { description: "Requiere admin", content: { "application/json": { schema: errorResponse } } },
    409: { description: "Conflicto de cierre", content: { "application/json": { schema: errorResponse } } },
  },
});

module.exports = router;
