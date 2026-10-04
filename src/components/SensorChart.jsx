import React, { useState } from "react";
import { Radio, Thermometer, Droplets, Activity, Layers } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

export function SensorChart({ data = [] }) {
  const [viewMode, setViewMode] = useState("all"); // "all", "env", "motion"
  const hasData = data && data.length > 0;

  return (
    <div className="panel">
      <div className="panelhead">
        <div>
          <h2>Sensor Telemetry Streams</h2>
          <p>{hasData ? "Real-time time-series • DHT22 & MPU6050" : "Awaiting ESP32 connection..."}</p>
        </div>
        <div className="chart-head-right">
          <div className="chart-tabs">
            <button
              className={`chart-tab ${viewMode === "all" ? "active" : ""}`}
              onClick={() => setViewMode("all")}
            >
              <Layers size={12} /> All
            </button>
            <button
              className={`chart-tab ${viewMode === "env" ? "active" : ""}`}
              onClick={() => setViewMode("env")}
            >
              <Thermometer size={12} /> Environment
            </button>
            <button
              className={`chart-tab ${viewMode === "motion" ? "active" : ""}`}
              onClick={() => setViewMode("motion")}
            >
              <Activity size={12} /> Activity
            </button>
          </div>
          <span className={`tag ${hasData ? "" : "tag-standby"}`}>
            <Radio size={13} /> {hasData ? "LIVE STREAM" : "STANDBY"}
          </span>
        </div>
      </div>

      <div className="chart">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            {viewMode === "all" && (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#64748b" }} />
                <YAxis yAxisId="t" domain={[20, 45]} tick={{ fontSize: 10, fill: "#3b82f6" }} unit="°C" />
                <YAxis yAxisId="a" orientation="right" domain={[0, 100]} tick={{ fontSize: 10, fill: "#10b981" }} unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    fontSize: "12px"
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                <Line
                  yAxisId="t"
                  type="monotone"
                  dataKey="temp"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#3b82f6" }}
                  activeDot={{ r: 5 }}
                  name="DHT22 Temp (°C)"
                />
                <Line
                  yAxisId="a"
                  type="monotone"
                  dataKey="humidity"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 2, fill: "#06b6d4" }}
                  name="DHT22 Humidity (%)"
                />
                <Line
                  yAxisId="a"
                  type="monotone"
                  dataKey="activity"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#10b981" }}
                  activeDot={{ r: 5 }}
                  name="MPU6050 Activity (%)"
                />
              </LineChart>
            )}

            {viewMode === "env" && (
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="humGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#64748b" }} />
                <YAxis yAxisId="t" domain={[15, 45]} tick={{ fontSize: 10, fill: "#3b82f6" }} unit="°C" />
                <YAxis yAxisId="h" orientation="right" domain={[0, 100]} tick={{ fontSize: 10, fill: "#06b6d4" }} unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    fontSize: "12px"
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                <Area
                  yAxisId="t"
                  type="monotone"
                  dataKey="temp"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#tempGradient)"
                  name="DHT22 Environment Temp (°C)"
                />
                <Area
                  yAxisId="h"
                  type="monotone"
                  dataKey="humidity"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#humGradient)"
                  name="DHT22 Ambient Humidity (%)"
                />
              </AreaChart>
            )}

            {viewMode === "motion" && (
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="actGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#64748b" }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#10b981" }} unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    fontSize: "12px"
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                <Area
                  type="monotone"
                  dataKey="activity"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#actGradient)"
                  name="MPU6050 Rumination & Motion (%)"
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        ) : (
          <div className="chart-empty">
            <Radio size={32} className="empty-icon" />
            <b>No Live Telemetry Stream</b>
            <p>Connect and power on your ESP32 collar to begin graphing real-time DHT22 temperature, humidity, and MPU6050 activity.</p>
          </div>
        )}
      </div>
    </div>
  );
}
