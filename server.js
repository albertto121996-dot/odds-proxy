import express from "express";
import axios from "axios";

const app = express();
app.use(express.json());

// ✅ SPORTMONKS - Obtener fixtures
app.post("/api/sportmonks/getFixtures", async (req, res) => {
  try {
    const { "filter[leagueIds]": leagueId, "filter[states]": state } = req.body;

    const response = await axios.get("https://api.sportmonks.com/v3/football/fixtures", {
      params: {
        "filter[leagueIds]": leagueId,
        "filter[states]": state || "upcoming",
        "include": "participants;venue;statistics",
        "api_token": process.env.SPORTMONKS_TOKEN // <-- Se obtiene del entorno Render
      }
    });

    res.json(response.data);
  } catch (err) {
    console.error("❌ Error SportMonks:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✅ THEODDSAPI - Obtener cuotas
app.get("/api/odds", async (req, res) => {
  try {
    const { sport_key, regions, markets, oddsFormat } = req.query;

    const response = await axios.get(`https://api.the-odds-api.com/v4/sports/${sport_key}/odds/`, {
      params: {
        apiKey: process.env.ODDS_API_KEY, // <-- Se obtiene del entorno Render
        regions: regions || "eu",
        markets: markets || "h2h",
        oddsFormat: oddsFormat || "decimal"
      }
    });

    res.json(response.data);
  } catch (err) {
    console.error("❌ Error TheOddsAPI:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✅ ANALYSIS - Cálculo de Value Bets (ejemplo básico)
app.post("/analyze/value", async (req, res) => {
  try {
    const { fixture_id, sport_key, home_team, away_team } = req.body;

    // ⚙️ Ejemplo base de respuesta simulada
    res.json({
      home_value: 6.4,
      draw_value: 1.1,
      away_value: 3.2,
      recommendation: "VALUE MEDIO en equipo local (+6.4%)"
    });
  } catch (err) {
    console.error("❌ Error Analyze:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Mensaje de estado del proxy
app.get("/", (req, res) => {
  res.send("✅ Proxy activo: SportMonks + TheOddsAPI funcionando correctamente (Render Environment).");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Unified proxy running on port ${PORT}`));
