import React from "react";
import { ChevronRight, Radio, Thermometer, Droplets } from "lucide-react";

export function AnimalList({ devices = [] }) {
  const hasDevices = devices && devices.length > 0;
  const displayAnimals = hasDevices
    ? devices.map((d) => {
        const riskScore = Math.min(
          95,
          Math.max(
            5,
            Math.round(
              ((d.lastTemperature || 38.5) - 37.8) * 28 +
                (100 - (d.lastActivity || 70)) * 0.35
            )
          )
        );
        const level = riskScore >= 70 ? "HIGH" : riskScore >= 45 ? "MODERATE" : "LOW";
        return {
          id: d.animalId || "COW-014",
          desc: `ESP32 Collar • DHT22 & MPU6050`,
          temp: d.lastTemperature !== null && d.lastTemperature !== undefined ? `${Number(d.lastTemperature).toFixed(1)} °C` : "-- °C",
          hum: d.lastHumidity !== null && d.lastHumidity !== undefined ? `${Number(d.lastHumidity).toFixed(1)} %` : "-- %",
          act: d.lastActivity !== null && d.lastActivity !== undefined ? `${d.lastActivity}%` : "--%",
          risk: level,
          status: d.status || "ONLINE"
        };
      })
    : [];

  return (
    <div className="panel">
      <div className="panelhead">
        <div>
          <h2>Animal & Collar Registry</h2>
          <p>{hasDevices ? `${displayAnimals.length} ESP32 Collar(s) Connected` : "Waiting for ESP32 collar connection..."}</p>
        </div>
        <span className={`tag ${hasDevices ? "" : "tag-standby"}`}>
          <Radio size={12} /> {hasDevices ? `${displayAnimals.length} Active` : "0 Active"}
        </span>
      </div>
      {hasDevices ? (
        displayAnimals.map((x) => (
          <div className="animal" key={x.id}>
            <div className="avatar">🐄</div>
            <div className="ainfo">
              <b>{x.id}</b>
              <span>{x.desc}</span>
            </div>
            <div className="animal-metrics">
              <div className="aval-badge temp">
                <Thermometer size={12} />
                <span>{x.temp}</span>
              </div>
              <div className="aval-badge hum">
                <Droplets size={12} />
                <span>{x.hum}</span>
              </div>
            </div>
            <span className={`pill ${x.risk.toLowerCase()}`}>{x.risk}</span>
          </div>
        ))
      ) : (
        <div className="animal-empty">
          <span>📡</span>
          <div>
            <b>No ESP32 Collars Connected</b>
            <p>Power on your ESP32 device to register and stream cattle telemetry in real time.</p>
          </div>
        </div>
      )}
    </div>
  );
}
