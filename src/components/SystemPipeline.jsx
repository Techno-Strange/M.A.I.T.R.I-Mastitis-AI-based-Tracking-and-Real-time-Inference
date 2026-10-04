import React from "react";
import { ChevronRight } from "lucide-react";

export function SystemPipeline() {
  const steps = [
    ["01", "Collar Sensors", "DHT22 + MPU6050 + OLED"],
    ["02", "ESP32", "Data acquisition"],
    ["03", "Backend API", "Storage + processing"],
    ["04", "AI/ML", "Risk assessment"],
    ["05", "Dashboard", "Alert + visualization"]
  ];

  return (
    <div className="panel">
      <h2>System Pipeline</h2>
      <p className="sub">Hardware-ready architecture</p>
      <div className="pipeline">
        {steps.map((x, i) => (
          <div className="step" key={x[0]}>
            <span>{x[0]}</span>
            <div>
              <b>{x[1]}</b>
              <small>{x[2]}</small>
            </div>
            {i < 4 && <ChevronRight size={15} />}
          </div>
        ))}
      </div>
    </div>
  );
}
