import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json());

// ✅ SPORTMONKS - Obtener fixtures (partidos)
app.post("/api/sportmonks/getFixtures", async (req, res) => {
  try {
    const { "filter[leagueIds]": leagueId, "filter[states]": state } = req.body;

    const response = await axios.get("https://api.sportmonks.com/v3/football/fixtures", {
      params: {
        "filter[leagueIds]": leagueId,
        "filter[states]": state || "upcoming",
        "include": "participants;venue;statistics",
        "api_token": process.env.SPORTMONKS_TOKEN
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
        apiKey: process.env.ODDS_API_KEY,
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

// ✅ ANALYSIS - Cálculo de Value Bets (ejemplo base)
app.post("/analyze/value", async (req, res) => {
  try {
    const { fixture_id, sport_key, home_team, away_team } = req.body;

    // ⚙️ Aquí puedes combinar datos de ambas APIs en el futuro
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Unified proxy running on port ${PORT}`));
