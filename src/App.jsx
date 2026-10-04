import React, { useEffect, useState } from "react";
import { Activity, Droplets, HeartPulse, ShieldCheck, Thermometer, Radio } from "lucide-react";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { Card } from "./components/Card";
import { SensorChart } from "./components/SensorChart";
import { RiskPanel } from "./components/RiskPanel";
import { EnvironmentPanel } from "./components/EnvironmentPanel";
import { AnimalList } from "./components/AnimalList";
import { SystemPipeline } from "./components/SystemPipeline";

const API = "http://localhost:5000/api";

export function App() {
  const [data, setData] = useState([]);
  const [devices, setDevices] = useState([]);
  const [live, setLive] = useState(true);
  const [backend, setBackend] = useState("Checking...");

  const hasData = data && data.length > 0;
  const latest = hasData ? data[data.length - 1] : null;

  // Mastitis Risk Calculation
  const risk = hasData && latest?.temp !== null && latest?.activity !== null && latest?.activity !== undefined
    ? Math.min(
        95,
        Math.max(
          8,
          Math.round(
            ((latest.temp || 38.5) - 37.8) * 28 + (100 - (latest.activity || 70)) * 0.35
          )
        )
      )
    : null;

  const level = risk !== null ? (risk >= 70 ? "HIGH" : risk >= 45 ? "MODERATE" : "LOW") : "STANDBY";

  useEffect(() => {
    fetch(API + "/health")
      .then(() => setBackend("Connected"))
      .catch(() => setBackend("Demo mode"));
  }, []);

  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => {
      if (backend === "Connected") {
        // Fetch real-time telemetry from ESP32
        fetch(API + "/readings")
          .then((res) => res.json())
          .then((readings) => {
            if (readings && Array.isArray(readings)) {
              if (readings.length > 0) {
                const formatted = readings.slice(-20).map((r) => ({
                  time: new Date(r.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit"
                  }),
                  temp: r.temperature !== null && r.temperature !== undefined ? Number(r.temperature) : null,
                  humidity: r.humidity !== null && r.humidity !== undefined ? Number(r.humidity) : null,
                  activity: r.activity !== null && r.activity !== undefined ? Number(r.activity) : null
                }));
                setData(formatted);
              } else {
                setData([]);
              }
            }
          })
          .catch(() => {});

        // Fetch dynamic active ESP32 collar count
        fetch(API + "/devices")
          .then((res) => res.json())
          .then((d) => {
            if (d && Array.isArray(d.devices)) {
              setDevices(d.devices);
            }
          })
          .catch(() => {});
      }
    }, 2500);
    return () => clearInterval(id);
  }, [live, backend]);

  const reset = () => {
    setData([]);
    setDevices([]);
    fetch(API + "/reset", { method: "POST" }).catch(() => {});
  };

  const activeCollarCount = devices.length;

  return (
    <div className="app">
      <Sidebar backend={backend} />
      <main>
        <Header live={live} setLive={setLive} reset={reset} />

        {/* Top Metric Cards */}
        <section className="cards">
          <Card
            title="Monitored Animals"
            value={activeCollarCount.toString()}
            note={activeCollarCount === 0 ? "0 active ESP collars" : activeCollarCount === 1 ? "1 active ESP collar" : `${activeCollarCount} active ESP collars`}
            icon={<HeartPulse />}
            tone="blue"
          />
          <Card
            title="Environment Temp"
            value={hasData && latest?.temp !== null ? `${latest.temp.toFixed(1)} °C` : "-- °C"}
            note={hasData && latest?.temp !== null ? (latest.temp >= 38.8 ? "Elevated • DHT22" : "Normal • DHT22") : "DHT22 (Awaiting ESP32)"}
            icon={<Thermometer />}
            tone={hasData && latest?.temp >= 38.8 ? "high" : "blue"}
          />
          <Card
            title="Ambient Humidity"
            value={hasData && latest?.humidity !== null && latest?.humidity !== undefined ? `${Number(latest.humidity).toFixed(1)} %` : "-- %"}
            note={hasData && latest?.humidity !== null ? "Relative RH • DHT22" : "DHT22 (Awaiting ESP32)"}
            icon={<Droplets />}
            tone="cyan"
          />
          <Card
            title="Activity Level"
            value={hasData && latest?.activity !== null && latest?.activity !== undefined ? `${latest.activity}%` : "--%"}
            note={hasData ? (latest.activity < 70 ? "Reduced • MPU6050" : "Active • MPU6050") : "MPU6050 (Awaiting ESP32)"}
            icon={<Activity />}
            tone={hasData && latest?.activity < 70 ? "moderate" : "low"}
          />
          <Card
            title="Mastitis Risk"
            value={hasData && risk !== null ? `${risk}%` : "--"}
            note={hasData ? `${level} priority` : "Awaiting telemetry"}
            icon={<ShieldCheck />}
            tone={hasData ? level.toLowerCase() : "low"}
          />
        </section>

        {/* Dedicated Environment Section */}
        <section className="env-section-wrap">
          <EnvironmentPanel latest={latest} data={data} />
        </section>

        {/* Telemetry Charts & Risk Assessment Grid */}
        <section className="grid2">
          <SensorChart data={data} />
          <RiskPanel risk={risk} level={level} latest={latest} />
        </section>

        {/* Connected Animals & Pipeline Grid */}
        <section className="grid2">
          <AnimalList devices={devices} />
          <SystemPipeline />
        </section>

        <footer>
          MastiSense AIoT Dashboard • Real-time telemetry powered by ESP32 (DHT22, MPU6050, SSD1306 OLED).
        </footer>
      </main>
    </div>
  );
}

export default App;
