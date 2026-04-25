const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const partidos = [
  { id: 1, equipo1: "Argentina", equipo2: "Brasil" },
  { id: 2, equipo1: "Francia", equipo2: "España" }
];

app.get("/partidos", (req, res) => {
  res.json(partidos);
});

app.listen(3000, () => {
  console.log("Servidor en puerto 3000");
});