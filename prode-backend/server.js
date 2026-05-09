const env = require("./src/config/env");
const { createApp } = require("./src/app");

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`Servidor en puerto ${env.PORT}`);
  console.log(`Docs: http://localhost:${env.PORT}/api/docs`);
});
