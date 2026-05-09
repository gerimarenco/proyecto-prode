const { OpenApiGeneratorV3 } = require("@asteasolutions/zod-to-openapi");
const { registry } = require("./registry");

let cachedSpec = null;

function buildSpec() {
  if (cachedSpec) return cachedSpec;
  const generator = new OpenApiGeneratorV3(registry.definitions);
  cachedSpec = generator.generateDocument({
    openapi: "3.0.3",
    info: {
      title: "Once Metros API",
      version: "1.0.0",
      description: "Backend de Prode Once Metros",
    },
    servers: [{ url: "/api" }],
  });
  return cachedSpec;
}

module.exports = { buildSpec };
