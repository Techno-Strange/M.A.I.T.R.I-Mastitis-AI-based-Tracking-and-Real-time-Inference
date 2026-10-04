import React from "react";
import { Activity, Bell, Database, HeartPulse, LayoutDashboard, Radio, ShieldCheck } from "lucide-react";

export function Sidebar({ backend }) {
  const navItems = [
    [LayoutDashboard, "Overview"],
    [HeartPulse, "Animal Monitoring"],
    [Activity, "Sensor Data"],
    [ShieldCheck, "Risk Assessment"],
    [Bell, "Alerts"],
    [Database, "Reports"]
  ];

  return (
    <aside>
      <div className="brand">
        <div className="logo">M</div>
        <div>
          <b>M.A.I.T.R.I</b>
          <small>AIoT LIVESTOCK MONITORING</small>
        </div>
      </div>
      <nav>
        {navItems.map(([Icon, name], index) => (
          <a className={index === 0 ? "active" : ""} key={name}>
            <Icon size={17} />
            {name}
          </a>
        ))}
      </nav>
      <div className="sidefoot">
        <Radio size={15} /> Collar prototype<br />
        <span>{backend}</span>
      </div>
    </aside>
  );
}
