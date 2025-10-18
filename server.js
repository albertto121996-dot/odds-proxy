import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// 🔑 Clave directa de TheOddsAPI (puedes dejarla fija aquí)
const ODDS_API_KEY = "5c348e9913d2e80f48fcd8d78a6d000e"; // <--- Sustituye por tu token real

// 🌍 Regiones con prioridad (fallback automático)
const REGIONS = ["eu", "uk", "us"];

// ✅ Endpoint principal para obtener cuotas
app.get("/api/odds", async (req, res) => {
  const sport_key = req.query.sport_key || "soccer_epl";
  const markets = req.query.markets || "h2h";
  const oddsFormat = req.query.oddsFormat || "decimal";

  for (const region of REGIONS) {
    try {
      const url = `https://api.the-odds-api.com/v4/sports/${sport_key}/odds/?apiKey=${ODDS_API_KEY}&regions=${region}&markets=${markets}&oddsFormat=${oddsFormat}`;
      const response = await fetch(url);

      if (!response.ok) continue; // si da error, pasa a la siguiente región

      const data = await response.json();
      if (data && data.length > 0) {
        return res.json({
          source_region: region,
          results: data
        });
      }
    } catch (err) {
      console.warn(`⚠️ Error en región ${region}: ${err.message}`);
    }
  }

  res.status(404).json({
    message: "No hay cuotas disponibles en ninguna región."
  });
});

// ✅ Endpoint de estado
app.get("/", (req, res) => {
  res.send("✅ Proxy activo: TheOddsAPI funcionando correctamente (fallback eu→uk→us).");
});

// 🔥 Arrancar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor en marcha en puerto ${PORT}`));
