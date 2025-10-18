import express from "express";
import axios from "axios";

const app = express();
app.use(express.json());

// 🔑 Coloca aquí tu token de TheOddsAPI
const ODDS_API_KEY = "5c348e9913d2e80f48fcd8d78a6d000e"; // ⬅️ Sustituye por tu token real

// ✅ Endpoint: cuotas puras (igual que antes)
app.get("/api/odds", async (req, res) => {
  try {
    const { sport_key, regions, markets, oddsFormat } = req.query;

    const response = await axios.get(`https://api.the-odds-api.com/v4/sports/${sport_key}/odds/`, {
      params: {
        apiKey: ODDS_API_KEY,
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

// ✅ Endpoint: análisis automático de value
app.post("/api/analyze/value", async (req, res) => {
  try {
    const { sport_key, home_team, away_team } = req.body;

    if (!sport_key || !home_team || !away_team) {
      return res.status(400).json({ error: "Faltan parámetros obligatorios (sport_key, home_team, away_team)." });
    }

    // Llamada a TheOddsAPI
    const oddsResponse = await axios.get(`https://api.the-odds-api.com/v4/sports/${sport_key}/odds/`, {
      params: {
        apiKey: ODDS_API_KEY,
        regions: "eu",
        markets: "h2h",
        oddsFormat: "decimal"
      }
    });

    const data = oddsResponse.data;

    // Buscar el partido correspondiente
    const match = data.find(
      (m) =>
        m.home_team.toLowerCase().includes(home_team.toLowerCase()) &&
        m.away_team.toLowerCase().includes(away_team.toLowerCase())
    );

    if (!match) {
      return res.status(404).json({ error: "No se encontraron cuotas para ese partido." });
    }

    const odds = match.bookmakers?.[0]?.markets?.[0]?.outcomes || [];
    if (odds.length < 3) {
      return res.status(404).json({ error: "No hay datos suficientes de cuotas." });
    }

    // Extraer cuotas
    const homeOdd = odds.find((o) => o.name === match.home_team)?.price;
    const drawOdd = odds.find((o) => o.name === "Draw")?.price;
    const awayOdd = odds.find((o) => o.name === match.away_team)?.price;

    // Calcular probabilidades implícitas
    const pHome = 100 / homeOdd;
    const pDraw = 100 / drawOdd;
    const pAway = 100 / awayOdd;
    const totalP = pHome + pDraw + pAway;

    // Normalizar (quitando margen)
    const homeReal = (pHome / totalP) * 100;
    const drawReal = (pDraw / totalP) * 100;
    const awayReal = (pAway / totalP) * 100;

    // Modelo simple para "probabilidad real"
    const homeStat = homeReal * 1.05;
    const drawStat = drawReal * 0.95;
    const awayStat = awayReal * 0.9;

    // Calcular value %
    const valueHome = ((homeStat - homeReal) / homeReal) * 100;
    const valueDraw = ((drawStat - drawReal) / drawReal) * 100;
    const valueAway = ((awayStat - awayReal) / awayReal) * 100;

    // Clasificación del value
    const classify = (v) => {
      if (v > 10) return "VALUE ALTO";
      if (v > 5) return "VALUE MEDIO";
      if (v > 0) return "VALUE LEVE";
      return "Sin value";
    };

    res.json({
      match: `${match.home_team} vs ${match.away_team}`,
      odds: {
        home: homeOdd,
        draw: drawOdd,
        away: awayOdd
      },
      probabilities: {
        home: homeReal.toFixed(1) + "%",
        draw: drawReal.toFixed(1) + "%",
        away: awayReal.toFixed(1) + "%"
      },
      value: {
        home: `${valueHome.toFixed(1)}% (${classify(valueHome)})`,
        draw: `${valueDraw.toFixed(1)}% (${classify(valueDraw)})`,
        away: `${valueAway.toFixed(1)}% (${classify(valueAway)})`
      },
      recommendation: `💡 Recomendación: ${classify(valueHome)} en ${match.home_team}.`
    });
  } catch (err) {
    console.error("❌ Error en análisis de value:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Página de estado
app.get("/", (req, res) => {
  res.send("✅ Proxy activo: TheOddsAPI con análisis de Value Bets (token fijo, OpenAPI 3.1.0).");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ TheOddsAPI proxy corriendo en puerto ${PORT}`));
