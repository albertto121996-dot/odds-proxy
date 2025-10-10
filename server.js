import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());

const API_KEY = process.env.API_KEY; // tu clave de TheOddsAPI

app.get("/odds", async (req, res) => {
  const { sport = "soccer_epl", region = "uk", markets = "h2h" } = req.query;

  try {
    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${API_KEY}&regions=${region}&markets=${markets}`
    );
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error al conectar con TheOddsAPI:", error);
    res.status(500).json({ error: "Error al conectar con TheOddsAPI" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`✅ Servidor proxy activo en el puerto ${PORT}`)
);
