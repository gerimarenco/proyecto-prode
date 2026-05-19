const express = require("express");
const cors = require("cors");

const env = require("./config/env");
const { buildCorsOptions } = require("./config/cors");
const apiRouter = require("./routes");
const { errorHandler, notFound } = require("./middlewares/errorHandler.middleware");

function createApp() {
  const app = express();

  app.use(cors(buildCorsOptions(env.CORS_ORIGINS)));
  app.use(express.json());

  app.use("/api", apiRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
