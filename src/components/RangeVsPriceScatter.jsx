import React, { memo } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const RangeVsPriceScatter = ({ data }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 overflow-x-auto">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">
        Electric Range vs Base MSRP
      </h3>
      <div style={{ width: "100%", height: 300 }}>
        <ScatterChart
          width="100%"
          height={300}
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        >
          <CartesianGrid />
          <XAxis type="number" dataKey="range" name="Range" unit=" mi" />
          <YAxis type="number" dataKey="price" name="Price" unit="$" />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} />
          <Legend />
          <Scatter name="EVs" data={data} fill="#8884d8" />
        </ScatterChart>
      </div>
    </div>
  );
};

export default memo(RangeVsPriceScatter);
