import React from "react";

export function Card({ title, value, note, icon, tone = "" }) {
  return (
    <div className="card">
      <div className="ctop">
        <span>{title}</span>
        <div className={`cicon ${tone}`}>{icon}</div>
      </div>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}
