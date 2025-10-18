import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 10000;

// === TOKENS ===
const SPORTMONKS_TOKEN = "zrlNicn21i4azcgPphWrdBjghdL8HVXoi5iFU7X3fwSJs1oOyxtbdjedHXBx";
const THEODDSAPI_KEY = "5c348e9913d2e80f48fcd8d78a6d000e";

// === 1️⃣ Endpoint base de test ===
app.get("/", (req, res) => {
  res.send("✅ Proxy activo: SportMonks + TheOddsAPI funcionando correctamente.");
});

// === 2️⃣ Rutas SPORTMONKS ===
app.use("/sportmonks", async (req, res) => {
  const targetUrl = `https://api.sportmonks.com/v3/football${req.url}${
    req.url.includes("?") ? "&" : "?"
  }api_token=${SPORTMONKS_TOKEN}`;

  try {
    const response = await fetch(targetUrl);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: "Error al conectar con SportMonks",
      details: error.message,
    });
  }
});

// === 3️⃣ Rutas THEODDSAPI ===
app.use("/theoddsapi", async (req, res) => {
  // Elimina la parte '/theoddsapi' y redirige a la API oficial
  const cleanPath = req.url.replace(/^\/theoddsapi/, "");
  const targetUrl = `https://api.the-odds-api.com/v4${cleanPath}${
    req.url.includes("?") ? "&" : "?"
  }apiKey=${THEODDSAPI_KEY}`;

  try {
    const response = await fetch(targetUrl);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: "Error al conectar con TheOddsAPI",
      details: error.message,
    });
  }
});

// === 4️⃣ Inicio del servidor ===
app.listen(PORT, () => {
  console.log(`🚀 Servidor proxy corriendo en el puerto ${PORT}`);
});
