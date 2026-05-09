const { Router } = require("express");
const { registry } = require("../openapi/registry");
const { asyncRoute } = require("../utils/asyncRoute");
const { validate } = require("../middlewares/validate.middleware");
const { requireAuth } = require("../middlewares/auth.middleware");
const { idParam, errorResponse } = require("../schemas/common.schema");
const { createPrediccionBody, prediccionPayload, updatePrediccionBody } =
  require("../schemas/predicciones.schema");
const controller = require("../controllers/predicciones.controller");

const router = Router();

router.post(
  "/",
  requireAuth,
  validate({ body: createPrediccionBody }),
  asyncRoute(controller.create),
);
router.put(
  "/:id",
  requireAuth,
  validate({ params: idParam, body: updatePrediccionBody }),
  asyncRoute(controller.update),
);

registry.registerPath({
  method: "post",
  path: "/predicciones",
  tags: ["Predicciones"],
  security: [{ bearerAuth: [] }],
  request: { body: { content: { "application/json": { schema: createPrediccionBody } } } },
  responses: {
    201: { description: "Prediccion creada o actualizada", content: { "application/json": { schema: prediccionPayload } } },
    409: { description: "Partido no editable", content: { "application/json": { schema: errorResponse } } },
  },
});

registry.registerPath({
  method: "put",
  path: "/predicciones/{id}",
  tags: ["Predicciones"],
  security: [{ bearerAuth: [] }],
  request: {
    params: idParam,
    body: { content: { "application/json": { schema: updatePrediccionBody } } },
  },
  responses: {
    200: { description: "Prediccion actualizada", content: { "application/json": { schema: prediccionPayload } } },
    403: { description: "No autorizado", content: { "application/json": { schema: errorResponse } } },
    404: { description: "No encontrada", content: { "application/json": { schema: errorResponse } } },
    409: { description: "Partido no editable", content: { "application/json": { schema: errorResponse } } },
  },
});

module.exports = router;
