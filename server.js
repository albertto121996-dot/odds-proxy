import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors()); // 🔹 Esto permite recibir peticiones desde cualquier origen

const API_KEY = "5c348e9913d2e80f48fcd8d78a6d000e";

app.get("/odds", async (req, res) => {
  const sport = req.query.sport || "soccer_epl";
  const region = req.query.region || "uk";
  const markets = req.query.markets || "h2h";

  try {
    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${API_KEY}&regions=${region}&markets=${markets}`
    );
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al conectar con TheOddsAPI" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
