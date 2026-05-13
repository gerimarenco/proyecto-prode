const { Router } = require("express");
const { registry, z } = require("../openapi/registry");
const { asyncRoute } = require("../utils/asyncRoute");
const { validate } = require("../middlewares/validate.middleware");
const { requireAuth } = require("../middlewares/auth.middleware");
const { idParam, errorResponse } = require("../schemas/common.schema");
const { invitacionPayload } = require("../schemas/invitaciones.schema");
const controller = require("../controllers/invitaciones.controller");

const router = Router();

router.get("/", requireAuth, asyncRoute(controller.listMiasPendientes));
router.post(
  "/:id/aceptar",
  requireAuth,
  validate({ params: idParam }),
  asyncRoute(controller.aceptar),
);
router.post(
  "/:id/rechazar",
  requireAuth,
  validate({ params: idParam }),
  asyncRoute(controller.rechazar),
);
router.delete(
  "/:id",
  requireAuth,
  validate({ params: idParam }),
  asyncRoute(controller.cancelar),
);

registry.registerPath({
  method: "get",
  path: "/invitaciones",
  tags: ["Invitaciones"],
  security: [{ bearerAuth: [] }],
  responses: {
    200: { description: "Mis invitaciones pendientes", content: { "application/json": { schema: z.array(invitacionPayload) } } },
    401: { description: "No autenticado", content: { "application/json": { schema: errorResponse } } },
  },
});

registry.registerPath({
  method: "post",
  path: "/invitaciones/{id}/aceptar",
  tags: ["Invitaciones"],
  security: [{ bearerAuth: [] }],
  request: { params: idParam },
  responses: {
    200: { description: "Invitacion aceptada", content: { "application/json": { schema: invitacionPayload } } },
    403: { description: "No es tu invitacion", content: { "application/json": { schema: errorResponse } } },
    409: { description: "Ya respondida", content: { "application/json": { schema: errorResponse } } },
  },
});

registry.registerPath({
  method: "post",
  path: "/invitaciones/{id}/rechazar",
  tags: ["Invitaciones"],
  security: [{ bearerAuth: [] }],
  request: { params: idParam },
  responses: {
    200: { description: "Invitacion rechazada", content: { "application/json": { schema: invitacionPayload } } },
    403: { description: "No es tu invitacion", content: { "application/json": { schema: errorResponse } } },
    409: { description: "Ya respondida", content: { "application/json": { schema: errorResponse } } },
  },
});

registry.registerPath({
  method: "delete",
  path: "/invitaciones/{id}",
  tags: ["Invitaciones"],
  security: [{ bearerAuth: [] }],
  request: { params: idParam },
  responses: {
    200: { description: "Invitacion cancelada por el creador", content: { "application/json": { schema: invitacionPayload } } },
    403: { description: "Solo el creador puede cancelar", content: { "application/json": { schema: errorResponse } } },
  },
});

module.exports = router;
