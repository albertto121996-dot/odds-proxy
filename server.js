import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());

const API_KEY = "5c348e9913d2e80f48fcd8d78a6d000e"; // Tu clave de TheOddsAPI

// 🧠 Mapa inteligente de ligas
const sportMap = {
  "premier league": "soccer_epl",
  "la liga": "soccer_spain_la_liga",
  "bundesliga": "soccer_germany_bundesliga",
  "serie a": "soccer_italy_serie_a",
  "ligue 1": "soccer_france_ligue_one",
  "champions league": "soccer_uefa_champs_league",
  "europa league": "soccer_uefa_europa_league",
  "nba": "basketball_nba",
  "nfl": "americanfootball_nfl",
  "mlb": "baseball_mlb",
  "nhl": "icehockey_nhl",
  "brasileirao": "soccer_brazil_campeonato",
  "argentina": "soccer_argentina_primera_division"
};

app.get("/odds", async (req, res) => {
  let sport = req.query.sport?.toLowerCase() || "soccer_epl";
  const region = req.query.region || "uk";
  const markets = req.query.markets || "h2h";
  const match = req.query.match?.toLowerCase();
  const bookmakerFilter = req.query.bookmaker?.toLowerCase(); // 🆕 filtro por casa

  if (sportMap[sport]) sport = sportMap[sport];

  try {
    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${API_KEY}&regions=${region}&markets=${markets}`
    );
    const data = await response.json();

    // Filtrar por partido
    let filteredData = data;
    if (match) {
      filteredData = data.filter((game) =>
        `${game.home_team} vs ${game.away_team}`.toLowerCase().includes(match)
      );
    }

    // Limitar respuesta + filtro por bookmaker si se pide
    const limitedData = filteredData.map((game) => ({
      sport: game.sport_title,
      home_team: game.home_team,
      away_team: game.away_team,
      bookmakers: game.bookmakers
        ?.filter((b) =>
          bookmakerFilter ? b.title.toLowerCase().includes(bookmakerFilter) : true
        )
        .slice(0, 3)
        .map((b) => ({
          title: b.title,
          markets: b.markets?.map((m) => ({
            key: m.key,
            outcomes: m.outcomes
          }))
        }))
    }));

    res.json(limitedData.slice(0, 3));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al conectar con TheOddsAPI" });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () =>
  console.log(`✅ Servidor proxy activo en el puerto ${PORT}`)
);
