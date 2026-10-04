import React from "react";
import { Thermometer, Droplets, Sun, Wind, Activity, Info } from "lucide-react";

export function EnvironmentPanel({ latest, data = [] }) {
  const hasData = latest && latest.temp !== null && latest.temp !== undefined;
  const temp = hasData ? Number(latest.temp) : null;
  const hum = hasData && latest.humidity !== null && latest.humidity !== undefined ? Number(latest.humidity) : null;

  // Compute min & max from session telemetry
  const validTemps = data.map((d) => d.temp).filter((t) => t !== null && !isNaN(t));
  const validHums = data.map((d) => d.humidity).filter((h) => h !== null && !isNaN(h));

  const minTemp = validTemps.length > 0 ? Math.min(...validTemps) : temp;
  const maxTemp = validTemps.length > 0 ? Math.max(...validTemps) : temp;
  const minHum = validHums.length > 0 ? Math.min(...validHums) : hum;
  const maxHum = validHums.length > 0 ? Math.max(...validHums) : hum;

  // Temperature-Humidity Index (THI) for Dairy Cattle (NRC formula)
  // THI = 0.8 * T + (RH/100) * (T - 14.4) + 46.4
  let thi = null;
  let thiLevel = "UNKNOWN";
  let thiColor = "low";
  let thiDesc = "Awaiting DHT22 data";

  if (temp !== null && hum !== null) {
    thi = Math.round((0.8 * temp) + ((hum / 100) * (temp - 14.4)) + 46.4);
    if (thi < 68) {
      thiLevel = "COMFORT";
      thiColor = "low";
      thiDesc = "Normal thermal comfort. Minimum mastitis susceptibility.";
    } else if (thi < 72) {
      thiLevel = "MILD STRESS";
      thiColor = "moderate";
      thiDesc = "Slight heat stress. Monitor water intake & ventilation.";
    } else if (thi < 80) {
      thiLevel = "MODERATE STRESS";
      thiColor = "moderate";
      thiDesc = "Heat stress present. Elevated bacterial infection & mastitis risk.";
    } else {
      thiLevel = "SEVERE STRESS";
      thiColor = "high";
      thiDesc = "Critical heat stress. Immediate barn cooling & misting advised.";
    }
  }

  // Determine Temp Status
  let tempStatus = "Normal";
  let tempClass = "low";
  if (temp !== null) {
    if (temp >= 39.5) {
      tempStatus = "High Fever / Heat Load";
      tempClass = "high";
    } else if (temp >= 38.8) {
      tempStatus = "Elevated";
      tempClass = "moderate";
    } else if (temp < 37.5) {
      tempStatus = "Subnormal / Cool";
      tempClass = "moderate";
    } else {
      tempStatus = "Optimal";
      tempClass = "low";
    }
  }

  // Determine Humidity Status
  let humStatus = "Comfort";
  let humClass = "low";
  if (hum !== null) {
    if (hum > 75) {
      humStatus = "High Moisture (Bacterial Risk)";
      humClass = "moderate";
    } else if (hum < 35) {
      humStatus = "Dry Air";
      humClass = "moderate";
    } else {
      humStatus = "Optimal Comfort (40-70%)";
      humClass = "low";
    }
  }

  // Progress bar percentages (safe bounded 0-100%)
  const tempPercent = temp !== null ? Math.min(100, Math.max(0, ((temp - 30) / 15) * 100)) : 0;
  const humPercent = hum !== null ? Math.min(100, Math.max(0, hum)) : 0;

  return (
    <div className="panel env-panel">
      <div className="panelhead">
        <div>
          <h2>Environment & Microclimate (DHT22)</h2>
          <p>{hasData ? "Real-time barn & collar ambient telemetry" : "Awaiting ESP32 DHT22 sensor readings..."}</p>
        </div>
        <span className={`tag ${hasData ? "" : "tag-standby"}`}>
          <Sun size={13} /> {hasData ? "DHT22 ONLINE" : "STANDBY"}
        </span>
      </div>

      <div className="env-grid">
        {/* Temperature Card */}
        <div className="env-card">
          <div className="env-card-header">
            <div className="env-card-icon temp-icon">
              <Thermometer size={20} />
            </div>
            <div>
              <span className="env-card-title">Environment Temp</span>
              <span className={`env-status-badge ${tempClass}`}>
                {hasData ? tempStatus : "STANDBY"}
              </span>
            </div>
          </div>

          <div className="env-value-display">
            <div className="env-main-val">
              {temp !== null ? `${temp.toFixed(1)}` : "--"}
              <span className="env-unit">°C</span>
            </div>
            {temp !== null && (
              <div className="env-secondary-val">
                {((temp * 9) / 5 + 32).toFixed(1)} °F
              </div>
            )}
          </div>

          {/* Temp Meter Bar */}
          <div className="env-meter">
            <div className="env-meter-bar">
              <div
                className={`env-meter-fill ${tempClass}`}
                style={{ width: `${hasData ? tempPercent : 0}%` }}
              />
            </div>
            <div className="env-meter-labels">
              <span>30°C</span>
              <span>38.5°C Normal</span>
              <span>45°C</span>
            </div>
          </div>

          <div className="env-stat-row">
            <div className="env-stat-item">
              <span>Min Session</span>
              <b>{minTemp !== null ? `${minTemp.toFixed(1)} °C` : "--"}</b>
            </div>
            <div className="env-stat-item">
              <span>Max Session</span>
              <b>{maxTemp !== null ? `${maxTemp.toFixed(1)} °C` : "--"}</b>
            </div>
          </div>
        </div>

        {/* Humidity Card */}
        <div className="env-card">
          <div className="env-card-header">
            <div className="env-card-icon hum-icon">
              <Droplets size={20} />
            </div>
            <div>
              <span className="env-card-title">Ambient Humidity</span>
              <span className={`env-status-badge ${humClass}`}>
                {hasData ? humStatus : "STANDBY"}
              </span>
            </div>
          </div>

          <div className="env-value-display">
            <div className="env-main-val">
              {hum !== null ? `${hum.toFixed(1)}` : "--"}
              <span className="env-unit">%</span>
            </div>
            {hum !== null && (
              <div className="env-secondary-val">
                Relative RH
              </div>
            )}
          </div>

          {/* Humidity Meter Bar */}
          <div className="env-meter">
            <div className="env-meter-bar">
              <div
                className="env-meter-fill hum-fill"
                style={{ width: `${hasData ? humPercent : 0}%` }}
              />
            </div>
            <div className="env-meter-labels">
              <span>0% Dry</span>
              <span>40-70% Ideal</span>
              <span>100% Sat</span>
            </div>
          </div>

          <div className="env-stat-row">
            <div className="env-stat-item">
              <span>Min Session</span>
              <b>{minHum !== null ? `${minHum.toFixed(1)} %` : "--"}</b>
            </div>
            <div className="env-stat-item">
              <span>Max Session</span>
              <b>{maxHum !== null ? `${maxHum.toFixed(1)} %` : "--"}</b>
            </div>
          </div>
        </div>
      </div>

      {/* Cattle Temperature-Humidity Index (THI) Section */}
      <div className="thi-box">
        <div className="thi-header">
          <div className="thi-title">
            <Wind size={16} />
            <b>Dairy Cattle Heat Stress Index (THI)</b>
          </div>
          <span className={`pill ${thiColor}`}>
            {hasData && thi !== null ? `THI ${thi} • ${thiLevel}` : "STANDBY"}
          </span>
        </div>
        <p className="thi-desc">
          {hasData && thi !== null
            ? thiDesc
            : "Connect your ESP32 with DHT22 to compute live Temperature-Humidity Index (THI) and detect microclimate stress early."}
        </p>
      </div>
    </div>
  );
}
