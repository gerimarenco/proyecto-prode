const { Router } = require("express");
const { registry, z } = require("../openapi/registry");
const { asyncRoute } = require("../utils/asyncRoute");
const { validate } = require("../middlewares/validate.middleware");
const { optionalAuth, requireAuth } = require("../middlewares/auth.middleware");
const { idParam, errorResponse } = require("../schemas/common.schema");
const { createTorneoBody, tablaEntryPayload, torneoPayload } =
  require("../schemas/torneos.schema");
const { prediccionPayload } = require("../schemas/predicciones.schema");
const controller = require("../controllers/torneos.controller");

const router = Router();
const listQuery = z.object({ mias: z.enum(["true", "false"]).optional() });

router.get("/", optionalAuth, validate({ query: listQuery }), asyncRoute(controller.list));
router.post(
  "/",
  requireAuth,
  validate({ body: createTorneoBody }),
  asyncRoute(controller.create),
);
router.get("/:id", validate({ params: idParam }), asyncRoute(controller.getById));
router.post(
  "/:id/unirse",
  requireAuth,
  validate({ params: idParam }),
  asyncRoute(controller.unirse),
);
router.get(
  "/:id/tabla",
  validate({ params: idParam }),
  asyncRoute(controller.getTabla),
);
router.get(
  "/:id/mis-predicciones",
  requireAuth,
  validate({ params: idParam }),
  asyncRoute(controller.getMisPredicciones),
);

registry.registerPath({
  method: "get",
  path: "/torneos",
  tags: ["TorneosDeAmigos"],
  request: { query: listQuery },
  responses: {
    200: { description: "Lista de torneos de amigos", content: { "application/json": { schema: z.array(torneoPayload) } } },
  },
});

registry.registerPath({
  method: "post",
  path: "/torneos",
  tags: ["TorneosDeAmigos"],
  security: [{ bearerAuth: [] }],
  request: { body: { content: { "application/json": { schema: createTorneoBody } } } },
  responses: {
    201: { description: "Torneo creado", content: { "application/json": { schema: torneoPayload } } },
    400: { description: "Datos invalidos", content: { "application/json": { schema: errorResponse } } },
  },
});

registry.registerPath({
  method: "get",
  path: "/torneos/{id}",
  tags: ["TorneosDeAmigos"],
  request: { params: idParam },
  responses: {
    200: { description: "Torneo", content: { "application/json": { schema: torneoPayload } } },
    404: { description: "No encontrado", content: { "application/json": { schema: errorResponse } } },
  },
});

registry.registerPath({
  method: "post",
  path: "/torneos/{id}/unirse",
  tags: ["TorneosDeAmigos"],
  security: [{ bearerAuth: [] }],
  request: { params: idParam },
  responses: {
    200: { description: "Ya era miembro", content: { "application/json": { schema: torneoPayload.extend({ yaEraMiembro: z.boolean() }) } } },
    201: { description: "Se unio al torneo", content: { "application/json": { schema: torneoPayload.extend({ yaEraMiembro: z.boolean() }) } } },
    404: { description: "No encontrado", content: { "application/json": { schema: errorResponse } } },
  },
});

registry.registerPath({
  method: "get",
  path: "/torneos/{id}/tabla",
  tags: ["TorneosDeAmigos"],
  request: { params: idParam },
  responses: {
    200: { description: "Tabla del torneo", content: { "application/json": { schema: z.array(tablaEntryPayload) } } },
    404: { description: "No encontrado", content: { "application/json": { schema: errorResponse } } },
  },
});

registry.registerPath({
  method: "get",
  path: "/torneos/{id}/mis-predicciones",
  tags: ["TorneosDeAmigos"],
  security: [{ bearerAuth: [] }],
  request: { params: idParam },
  responses: {
    200: { description: "Predicciones del usuario para este torneo", content: { "application/json": { schema: z.array(prediccionPayload) } } },
    401: { description: "No autenticado", content: { "application/json": { schema: errorResponse } } },
    404: { description: "No encontrado", content: { "application/json": { schema: errorResponse } } },
  },
});

module.exports = router;
