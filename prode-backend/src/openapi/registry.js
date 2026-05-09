const { extendZodWithOpenApi, OpenAPIRegistry } = require("@asteasolutions/zod-to-openapi");
const { z } = require("zod");

extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();

registry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
});

module.exports = { registry, z };
