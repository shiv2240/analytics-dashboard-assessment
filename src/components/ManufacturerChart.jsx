import React, { memo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

const ManufacturerChart = ({ data }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 overflow-x-auto">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">
        Top 10 Manufacturers
      </h3>
      <div style={{ width: 500, height: 300 }}>
        <BarChart
          width={500}
          height={300}
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" />
          <YAxis
            type="category"
            dataKey="name"
            width={100}
            tick={{ fontSize: 12 }}
          />
          <Tooltip />
          <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={index % 2 === 0 ? "#3b82f6" : "#60a5fa"}
              />
            ))}
          </Bar>
        </BarChart>
      </div>
    </div>
  );
};

export default memo(ManufacturerChart);
