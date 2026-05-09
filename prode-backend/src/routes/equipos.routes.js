const { Router } = require("express");
const { registry, z } = require("../openapi/registry");
const { asyncRoute } = require("../utils/asyncRoute");
const { validate } = require("../middlewares/validate.middleware");
const { idParam, errorResponse } = require("../schemas/common.schema");
const { equipoPayload, listEquiposQuery } = require("../schemas/equipos.schema");
const controller = require("../controllers/equipos.controller");

const router = Router();

router.get("/", validate({ query: listEquiposQuery }), asyncRoute(controller.list));
router.get("/:id", validate({ params: idParam }), asyncRoute(controller.getById));

registry.registerPath({
  method: "get",
  path: "/equipos",
  tags: ["Equipos"],
  request: { query: listEquiposQuery },
  responses: {
    200: { description: "Lista de equipos", content: { "application/json": { schema: z.array(equipoPayload) } } },
  },
});

registry.registerPath({
  method: "get",
  path: "/equipos/{id}",
  tags: ["Equipos"],
  request: { params: idParam },
  responses: {
    200: { description: "Equipo", content: { "application/json": { schema: equipoPayload } } },
    404: { description: "No encontrado", content: { "application/json": { schema: errorResponse } } },
  },
});

module.exports = router;
