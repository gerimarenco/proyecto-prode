const { Router } = require("express");
const { registry, z } = require("../openapi/registry");
const { asyncRoute } = require("../utils/asyncRoute");
const { validate } = require("../middlewares/validate.middleware");
const { requireAuth } = require("../middlewares/auth.middleware");
const { errorResponse } = require("../schemas/common.schema");
const { inviteTokenParam } = require("../schemas/invitaciones.schema");
const { torneoPayload } = require("../schemas/torneos.schema");
const controller = require("../controllers/torneos.controller");

const router = Router();

router.get(
  "/:token",
  validate({ params: inviteTokenParam }),
  asyncRoute(controller.getByInviteToken),
);
router.post(
  "/:token/aceptar",
  requireAuth,
  validate({ params: inviteTokenParam }),
  asyncRoute(controller.joinByInviteToken),
);

registry.registerPath({
  method: "get",
  path: "/invites/{token}",
  tags: ["Invitaciones"],
  request: { params: inviteTokenParam },
  responses: {
    200: { description: "Preview del torneo del invite link", content: { "application/json": { schema: torneoPayload } } },
    404: { description: "Invite invalido o revocado", content: { "application/json": { schema: errorResponse } } },
  },
});

registry.registerPath({
  method: "post",
  path: "/invites/{token}/aceptar",
  tags: ["Invitaciones"],
  security: [{ bearerAuth: [] }],
  request: { params: inviteTokenParam },
  responses: {
    200: { description: "Ya era miembro", content: { "application/json": { schema: torneoPayload.extend({ yaEraMiembro: z.boolean() }) } } },
    201: { description: "Se unio al torneo", content: { "application/json": { schema: torneoPayload.extend({ yaEraMiembro: z.boolean() }) } } },
    404: { description: "Invite invalido", content: { "application/json": { schema: errorResponse } } },
  },
});

module.exports = router;
