// server.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// 🌍 URLs base
const SPORTMONKS_URL = "https://api.sportmonks.com/v3/football";
const THEODDS_URL = "https://api.the-odds-api.com/v4";

// 🔐 Variables de entorno (Render → Environment)
const SPORTMONKS_KEY = process.env.SPORTMONKS_KEY;
const THEODDS_KEY = process.env.THEODDS_KEY;

// 🧠 --- CACHÉ en memoria (TTL de 60 segundos)
const cache = new Map();
const CACHE_TTL = 60000; // 1 minuto

function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}
function getCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

// 🧩 --- NORMALIZADOR de filtros para SportMonks
function normalizeSportMonksFilters(params) {
  const fixed = {};
  if (params["filter[leagueIds]"]) fixed.filter = `leagueIds:${params["filter[leagueIds]"]}`;
  if (params["filter[seasonIds]"]) fixed.filter = `seasonIds:${params["filter[seasonIds]"]}`;
  if (params["filter[countryIds]"]) fixed.filter = `countryIds:${params["filter[countryIds]"]}`;
  if (params.filter) fixed.filter = params.filter;
  for (const key in params) if (!key.startsWith("filter")) fixed[key] = params[key];
  return fixed;
}

// 🧮 --- LOG de llamadas
function logRequest(source, endpoint, params) {
  const time = new Date().toISOString();
  console.log(`[${time}] 📡 ${source.toUpperCase()} → ${endpoint}`, JSON.stringify(params));
}

// ⚙️ --- Limitar tasa (Rate Limiter)
let lastRequestTime = 0;
const RATE_LIMIT_MS = 250; // 4 requests por segundo

async function rateLimit() {
  const now = Date.now();
  const wait = Math.max(0, RATE_LIMIT_MS - (now - lastRequestTime));
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastRequestTime = Date.now();
}

// 🧩 --- SPORTMONKS proxy
app.post("/api/sportmonks/:endpoint", async (req, res) => {
  try {
    const { endpoint } = req.params;
    const params = normalizeSportMonksFilters(req.body);
    const cacheKey = `sportmonks:${endpoint}:${JSON.stringify(params)}`;

    const cached = getCache(cacheKey);
    if (cached) return res.json({ source: "cache", data: cached });

    await rateLimit();
    logRequest("SportMonks", endpoint, params);

    const url = `${SPORTMONKS_URL}/${endpoint}?api_token=${SPORTMONKS_KEY}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params)
    });

    const data = await response.json();
    setCache(cacheKey, data);
    res.json({ source: "api", data });
  } catch (error) {
    console.error("❌ Error SportMonks:", error);
    res.status(500).json({ error: error.message });
  }
});

// ⚽ --- THEODDSAPI proxy
app.get("/api/odds", async (req, res) => {
  try {
    const {
      sport_key = "soccer_epl",
      regions = "eu",
      markets = "h2h",
      oddsFormat = "decimal"
    } = req.query;

    const cacheKey = `odds:${sport_key}:${regions}:${markets}`;
    const cached = getCache(cacheKey);
    if (cached) return res.json({ source: "cache", data: cached });

    await rateLimit();
    logRequest("TheOddsAPI", sport_key, { markets });

    const url = `${THEODDS_URL}/sports/${sport_key}/odds?apiKey=${THEODDS_KEY}&regions=${regions}&markets=${markets}&oddsFormat=${oddsFormat}`;
    const response = await fetch(url);
    const data = await response.json();

    setCache(cacheKey, data);
    res.json({ source: "api", data });
  } catch (error) {
    console.error("❌ Error TheOddsAPI:", error);
    res.status(500).json({ error: error.message });
  }
});

// 🩺 Estado
app.get("/", (req, res) => {
  res.send("✅ Proxy Render activo: TheOddsAPI + SportMonks conectados con GPT");
});

// 🚀 Arranque
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`✅ Servidor activo en puerto ${PORT}`));
