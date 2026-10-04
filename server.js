import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// In-memory telemetry storage - starts EMPTY (no dummy data)
let readings = [];

// Connected ESP32 Devices Registry - starts EMPTY (no dummy devices)
const activeDevices = new Map();

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "MastiSense AIoT API",
    activeCollars: activeDevices.size,
    sensors: ["DHT22", "MPU6050", "OLED-SSD1306"]
  });
});

app.get("/api/devices", (req, res) => {
  const devicesList = Array.from(activeDevices.values());
  res.json({
    totalConnected: devicesList.length,
    devices: devicesList
  });
});

app.get("/api/readings", (req, res) => {
  res.json(readings.slice(-50));
});

// Endpoint to reset data on demand
app.post("/api/reset", (req, res) => {
  readings = [];
  activeDevices.clear();
  console.log("[API] Telemetry data reset. Waiting for new ESP32 connection...");
  res.json({ status: "cleared", totalConnected: 0 });
});

app.post("/api/readings", (req, res) => {
  const animalId = req.body.animalId || "COW-014";
  const temp = req.body.temperature !== undefined ? Number(req.body.temperature) : null;
  const hum = req.body.humidity !== undefined ? Number(req.body.humidity) : null;
  const act = req.body.activity !== undefined ? Number(req.body.activity) : null;

  const r = {
    animalId,
    temperature: temp,
    humidity: hum,
    activity: act,
    timestamp: new Date().toISOString()
  };

  readings.push(r);
  if (readings.length > 100) readings.shift();

  // Update or register active collar
  activeDevices.set(animalId, {
    animalId,
    name: `ESP Collar (${animalId})`,
    breed: "Dairy Cattle Collar",
    lastTemperature: temp,
    lastHumidity: hum,
    lastActivity: act,
    lastSeen: new Date().toISOString(),
    status: "ONLINE"
  });

  console.log(`[API] Telemetry from ${animalId}: DHT22 Temp=${temp}°C, DHT22 Hum=${hum}%, MPU6050 Act=${act}%`);
  res.status(201).json(r);
});

app.get("/api/risk/:animalId", (req, res) => {
  if (readings.length === 0) {
    return res.json({ animalId: req.params.animalId, riskScore: null, level: "AWAITING DATA", prototype: true });
  }
  const r = [...readings].reverse().find(x => x.animalId === req.params.animalId) || readings.at(-1);
  const score = Math.min(95, Math.max(5, Math.round(((r.temperature || 38.5) - 37.8) * 28 + (100 - (r.activity || 70)) * 0.35)));
  res.json({
    animalId: r.animalId,
    riskScore: score,
    level: score >= 70 ? "HIGH" : score >= 45 ? "MODERATE" : "LOW",
    prototype: true
  });
});

app.listen(5000, () => console.log("MastiSense API running on http://localhost:5000"));