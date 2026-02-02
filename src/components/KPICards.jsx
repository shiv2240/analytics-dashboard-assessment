import React from "react";

const Card = ({ title, value, subtext }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
    <h2 className="text-slate-800 text-sm font-bold uppercase tracking-wider">
      {title}
    </h2>
    <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
    {subtext && <p className="mt-1 text-sm text-slate-600">{subtext}</p>}
  </div>
);

const KPICards = ({ kpi }) => {
  if (!kpi) return null;

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      aria-label="Key Performance Indicators"
    >
      <Card
        title="Total EVs"
        value={kpi.totalEVs.toLocaleString()}
        subtext="Registered Vehicles"
      />
      <Card
        title="BEV vs PHEV"
        value={`${kpi.bevPercentage}%`}
        subtext={`BEV (${kpi.phevPercentage}% PHEV)`}
      />
      <Card
        title="Avg Range"
        value={`${kpi.avgRange} mi`}
        subtext="For known ranges"
      />
      <Card
        title="Top Maker"
        value={kpi.topManufacturer}
        subtext={`${kpi.topManufacturerCount.toLocaleString()} vehicles`}
      />
    </div>
  );
};

export default KPICards;
