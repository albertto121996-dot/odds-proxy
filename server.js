import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();
app.use(cors());

// Tokens (añade tus API keys)
const SPORTMONKS_TOKEN = "VdBxgQbZAKTX0azKu8noJRsE1ipb3z3vT4ivcIBXkJ3lmKu5G0YDlr2vkgWX";
const ODDS_API_KEY = "5c348e9913d2e80f48fcd8d78a6d000e"; // <-- reemplázalo por el tuyo

// Base URLs
const SPORTMONKS_BASE = "https://api.sportmonks.com/v3/football";
const ODDS_BASE = "https://api.the-odds-api.com/v4";

// Ruta principal
app.get("/", (req, res) => {
  res.send("✅ Proxy activo: SportMonks + TheOddsAPI funcionando correctamente.");
});

// SPORTMONKS ENDPOINT
app.get("/sportmonks/:endpoint(*)", async (req, res) => {
  try {
    const { endpoint } = req.params;
    const query = new URLSearchParams(req.query);
    query.append("api_token", SPORTMONKS_TOKEN);

    const url = `${SPORTMONKS_BASE}/${endpoint}?${query.toString()}`;
    console.log("➡️ SportMonks:", url);

    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    console.error("❌ Error en SportMonks:", error.message);
    res.status(500).json({ error: "Error con SportMonks", details: error.message });
  }
});

// THEODDSAPI ENDPOINT
app.get("/theoddsapi/:endpoint(*)", async (req, res) => {
  try {
    const { endpoint } = req.params;
    const query = new URLSearchParams(req.query);
    query.append("apiKey", ODDS_API_KEY);

    const url = `${ODDS_BASE}/${endpoint}?${query.toString()}`;
    console.log("➡️ TheOddsAPI:", url);

    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    console.error("❌ Error en TheOddsAPI:", error.message);
    res.status(500).json({ error: "Error con TheOddsAPI", details: error.message });
  }
});

// Puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Proxy ejecutándose en el puerto ${PORT}`));
