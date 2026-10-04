import React from "react";
import { RefreshCw, Wifi } from "lucide-react";

export function Header({ live, setLive, reset }) {
  return (
    <header>
      <div>
        <h1>Herd Health Overview</h1>
        <p>Real-time collar monitoring and prototype mastitis risk assessment</p>
      </div>
      <div className="actions">
        <span className="online">
          <i /> {live ? "System online" : "Paused"}
        </span>
        <button onClick={() => setLive((v) => !v)}>
          <Wifi size={15} />
          {live ? "Live" : "Resume"}
        </button>
        <button onClick={reset}>
          <RefreshCw size={15} />
          Reset
        </button>
      </div>
    </header>
  );
}
