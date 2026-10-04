import React from "react";
import { AlertTriangle } from "lucide-react";

function Metric({ label, value }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

export function RiskPanel({ risk, level, latest }) {
  const hasData = latest && (latest.temp !== null && latest.temp !== undefined);

  return (
    <div className="panel">
      <h2>Risk Assessment</h2>
      <p className="sub">Edge AI decision-support layer</p>
      <div className={`risk ${(level || "low").toLowerCase()} ${!hasData ? "risk-standby" : ""}`}>
        <div>
          <small>Mastitis Risk Score</small>
          <strong>{hasData && risk !== null ? `${risk}%` : "--"}</strong>
        </div>
        <span>{hasData ? level : "STANDBY"}</span>
      </div>
      <div className="metrics">
        <Metric
          label="DHT22 Temperature"
          value={hasData && latest.temp ? (latest.temp >= 38.8 ? `↑ ${latest.temp.toFixed(1)}°C (Elevated)` : `→ ${latest.temp.toFixed(1)}°C (Normal)`) : "-- (Awaiting ESP32)"}
        />
        <Metric
          label="DHT22 Humidity"
          value={hasData && latest.humidity !== null && latest.humidity !== undefined ? `${Number(latest.humidity).toFixed(1)}%` : "-- (Awaiting ESP32)"}
        />
        <Metric
          label="MPU6050 Activity"
          value={hasData && latest.activity !== null && latest.activity !== undefined ? (latest.activity < 65 ? `↓ ${latest.activity}% (Reduced)` : `→ ${latest.activity}% (Active)`) : "-- (Awaiting ESP32)"}
        />
        <Metric label="ESP32 Telemetry" value={hasData ? "Live Stream (Active)" : "Waiting for Collar..."} />
      </div>
      <div className="notice">
        <AlertTriangle size={17} />
        <div>
          <b>Monitoring recommendation</b>
          <p>
            {hasData
              ? "Elevated DHT22 collar temperature and reduced MPU6050 rumination activity trigger early mastitis alerts before clinical symptoms appear."
              : "Power on the ESP32 collar to transmit real-time telemetry and start automated early mastitis risk evaluation."}
          </p>
        </div>
      </div>
    </div>
  );
}

