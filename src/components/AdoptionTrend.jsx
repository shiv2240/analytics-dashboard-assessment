import React, { memo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const AdoptionTrend = ({ data }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 overflow-x-auto">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">
        EV Adoption Trend
      </h3>
      <div style={{ width: "100%", height: 300 }}>
        <AreaChart
          width="100%"
          height={300}
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="year" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Area
            type="monotone"
            dataKey="Total"
            stackId="1"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.1}
          />
          <Area
            type="monotone"
            dataKey="BEV"
            stackId="2"
            stroke="#10b981"
            fill="#10b981"
            fillOpacity={0.1}
          />
          <Area
            type="monotone"
            dataKey="PHEV"
            stackId="3"
            stroke="#f59e0b"
            fill="#f59e0b"
            fillOpacity={0.1}
          />
        </AreaChart>
      </div>
    </div>
  );
};

export default memo(AdoptionTrend);
