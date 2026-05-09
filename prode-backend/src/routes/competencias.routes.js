const { Router } = require("express");
const { registry, z } = require("../openapi/registry");
const { asyncRoute } = require("../utils/asyncRoute");
const { validate } = require("../middlewares/validate.middleware");
const { idParam, errorResponse } = require("../schemas/common.schema");
const { competenciaPayload } = require("../schemas/competencias.schema");
const controller = require("../controllers/competencias.controller");

const router = Router();

router.get("/", asyncRoute(controller.list));
router.get("/:id", validate({ params: idParam }), asyncRoute(controller.getById));

registry.registerPath({
  method: "get",
  path: "/competencias",
  tags: ["Competencias"],
  responses: {
    200: { description: "Lista de competencias", content: { "application/json": { schema: z.array(competenciaPayload) } } },
  },
});

registry.registerPath({
  method: "get",
  path: "/competencias/{id}",
  tags: ["Competencias"],
  request: { params: idParam },
  responses: {
    200: { description: "Competencia", content: { "application/json": { schema: competenciaPayload } } },
    404: { description: "No encontrada", content: { "application/json": { schema: errorResponse } } },
  },
});

module.exports = router;
